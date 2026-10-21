import { availabilityGet, bookingsCreate, eventTypesList } from '@/api'
import type { EventType, Meeting } from '@/api'
import { asArray } from '@/lib/data'
import { formatLabel, formatSlot } from '@/lib/format'
import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

// Каноничная метка дня — префикс ISO-строки слота. formatSlot показывает ту же
// часть строки, поэтому календарь и список слотов всегда согласованы между собой.
function dayKey(iso: string) {
  return iso.slice(0, 10)
}

export default function BookPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<'conflict' | 'validation' | 'unknown' | null>(
    null,
  )
  const [confirmed, setConfirmed] = useState<Meeting | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      // Ошибка, пустой список и не-массив (недоступный бэкенд) дают пустое
      // состояние, а не вечный спиннер или белый экран.
      if (!cancelled) setTypes(asArray<EventType>(result.data))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSlots(null)
      setSelectedDay(null)
      setSelectedSlot(null)
      setConfirmed(null)
      setBookingError(null)
      return
    }
    let cancelled = false
    setSlots(null)
    setSelectedDay(null)
    setSelectedSlot(null)
    setConfirmed(null)
    setBookingError(null)
    setGuestName('')
    setGuestEmail('')
    setNameError(null)
    availabilityGet({ query: { eventTypeId: selectedId } }).then((result) => {
      if (cancelled) return
      const list = asArray<string>(result.data)
      setSlots(list)
      // Авто-выбор первой доступной даты: сразу показываем слоты, а не пустой
      // календарь, и заодно сокращаем длинный общий список до одного дня.
      if (list.length > 0) setSelectedDay(dayKey(list[0]))
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  // Метки дней, на которые есть хотя бы один слот (в календаре остальные — disabled).
  const availableDays = useMemo(() => {
    const set = new Set<string>()
    for (const slot of slots ?? []) set.add(dayKey(slot))
    return set
  }, [slots])

  // Слоты только выбранного дня.
  const daySlots = useMemo(() => {
    if (!slots || !selectedDay) return []
    return slots.filter((slot) => dayKey(slot) === selectedDay)
  }, [slots, selectedDay])

  const todayLabel = useMemo(() => dayjs().format('YYYY-MM-DD'), [])

  const selected = types?.find((type) => type.id === selectedId)

  function pickSlot(slot: string) {
    setSelectedSlot(slot)
    setBookingError(null)
  }

  function submitBooking() {
    if (!selectedId || !selectedSlot) return
    const trimmed = guestName.trim()
    if (!trimmed) {
      setNameError('Введите имя')
      return
    }
    setNameError(null)
    setBookingError(null)
    bookingsCreate({
      body: {
        eventTypeId: selectedId,
        startDateTime: selectedSlot,
        guestName: trimmed,
        guestEmail: guestEmail.trim() || undefined,
      },
    }).then((result) => {
      if (result.data) {
        setConfirmed(result.data)
        setSelectedSlot(null)
        setGuestName('')
        setGuestEmail('')
      } else if (result.response?.status === 409) {
        setBookingError('conflict')
        setSelectedSlot(null)
      } else if (result.response?.status === 400) {
        setBookingError('validation')
      } else {
        setBookingError('unknown')
      }
    })
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Запись на встречу</Title>
        <Text c="dimmed">Выберите тип встречи, затем дату и время.</Text>

        {types === null ? (
          <Loader size="sm" />
        ) : types.length === 0 ? (
          <Text c="dimmed">Пока нет доступных типов встреч.</Text>
        ) : (
          types.map((type) => {
            const isSelected = type.id === selectedId
            return (
              <UnstyledButton
                key={type.id}
                onClick={() => setSelectedId(type.id)}
                aria-pressed={isSelected}
              >
                <Paper
                  withBorder
                  p="md"
                  radius="md"
                  bg={isSelected ? 'var(--mantine-color-indigo-0)' : undefined}
                >
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{type.name}</Text>
                      <Text c="dimmed" size="sm">
                        {type.description}
                      </Text>
                    </div>
                    <Badge variant="light">{formatLabel[type.format]}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>
                    {type.durationMinutes} мин
                  </Text>
                </Paper>
              </UnstyledButton>
            )
          })
        )}

        {selected && (
          <>
            <Text size="sm" c="dimmed">
              Выбран: {selected.name}
            </Text>
            <Title order={2}>Выберите дату и время</Title>
            {slots === null ? (
              <Loader size="sm" />
            ) : slots.length === 0 ? (
              <Text c="dimmed">Нет свободных слотов в ближайшие 14 дней.</Text>
            ) : (
              <>
                <DatePickerInput
                  label="Дата"
                  value={selectedDay}
                  onChange={(date) => setSelectedDay(date ?? null)}
                  minDate={todayLabel}
                  getDayProps={(date) => ({
                    // Дата недоступна, если она в прошлом или на неё не осталось
                    // слотов. `date` — строка YYYY-MM-DD (DateStringValue в Mantine v9).
                    disabled: date < todayLabel || !availableDays.has(date),
                  })}
                />
                {daySlots.length > 0 ? (
                  daySlots.map((slot) => (
                    <UnstyledButton
                      key={slot}
                      onClick={() => pickSlot(slot)}
                      aria-pressed={slot === selectedSlot}
                    >
                      <Paper
                        withBorder
                        p="sm"
                        radius="md"
                        bg={slot === selectedSlot ? 'var(--mantine-color-indigo-0)' : undefined}
                      >
                        <Text>{formatSlot(slot)}</Text>
                      </Paper>
                    </UnstyledButton>
                  ))
                ) : (
                  <Text c="dimmed">Нет свободных слотов в выбранный день.</Text>
                )}
              </>
            )}
            {bookingError === 'conflict' && (
              <Text c="red">Этот слот уже занят. Выберите другой.</Text>
            )}
          </>
        )}

        {confirmed ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Title order={2}>Вы записаны</Title>
              <Text>{confirmed.eventTypeName}</Text>
              <Text>{formatSlot(confirmed.startDateTime)}</Text>
              <Text c="dimmed">Гость: {confirmed.guestName}</Text>
            </Stack>
          </Paper>
        ) : selectedSlot ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Title order={2}>Ваши данные</Title>
              <TextInput
                label="Имя"
                required
                value={guestName}
                onChange={(event) => setGuestName(event.currentTarget.value)}
                error={nameError ?? undefined}
              />
              <TextInput
                label="Email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.currentTarget.value)}
              />
              {bookingError === 'validation' && (
                <Text c="red">Не удалось создать запись. Проверьте введённые данные.</Text>
              )}
              {bookingError === 'unknown' && (
                <Text c="red">Что-то пошло не так. Попробуйте позже.</Text>
              )}
              <Button onClick={submitBooking}>Подтвердить запись</Button>
            </Stack>
          </Paper>
        ) : null}

        <div>
          <Button component={Link} to="/" variant="subtle" px={0}>
            ← На главную
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
