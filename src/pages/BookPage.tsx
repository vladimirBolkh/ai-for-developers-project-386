import { availabilityGet, eventTypesList } from '@/api'
import type { EventType } from '@/api'
import {
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const formatLabel: Record<EventType['format'], string> = {
  online: 'онлайн',
  offline: 'оффлайн',
}

// Детерминированный вывод «дата · время» из ISO-момента (без конвертации таймзоны).
function formatSlot(iso: string) {
  return `${iso.slice(0, 10)} · ${iso.slice(11, 16)}`
}

export default function BookPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[] | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      // Ошибка и пустой список одинаково дают пустое состояние, а не вечный спиннер.
      if (!cancelled) setTypes(result.data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setSlots(null)
      setSelectedSlot(null)
      return
    }
    let cancelled = false
    setSlots(null)
    setSelectedSlot(null)
    availabilityGet({ query: { eventTypeId: selectedId } }).then((result) => {
      if (!cancelled) setSlots(result.data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selected = types?.find((type) => type.id === selectedId)

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Запись на встречу</Title>
        <Text c="dimmed">Выберите тип встречи, затем время.</Text>

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
            <Title order={2}>Выберите время</Title>
            {slots === null ? (
              <Loader size="sm" />
            ) : slots.length === 0 ? (
              <Text c="dimmed">Нет свободных слотов в ближайшие 14 дней.</Text>
            ) : (
              slots.map((slot) => (
                <UnstyledButton
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
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
            )}
          </>
        )}

        {selectedSlot && (
          <Text size="sm" c="dimmed">
            Выбран слот: {formatSlot(selectedSlot)}
          </Text>
        )}

        <div>
          <Button component={Link} to="/" variant="subtle" px={0}>
            ← На главную
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
