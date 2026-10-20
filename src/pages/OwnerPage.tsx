import { eventTypesCreate, eventTypesList, eventTypesRemove, eventTypesUpdate } from '@/api'
import type { EventType, EventTypeCreate, MeetingFormat } from '@/api'
import { formatLabel } from '@/lib/format'
import {
  Button,
  Container,
  Group,
  Loader,
  NativeSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// Длительность ограничена 15–120 минутами с шагом 15 (решение по времени).
const durationOptions = [15, 30, 45, 60, 75, 90, 105, 120].map((min) => ({
  value: String(min),
  label: `${min} мин`,
}))

const formatOptions = Object.entries(formatLabel).map(([value, label]) => ({ value, label }))

export default function OwnerPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [format, setFormat] = useState<MeetingFormat>('online')
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      if (!cancelled) setTypes(result.data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  function refresh() {
    eventTypesList().then((result) => setTypes(result.data ?? []))
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setDuration('30')
    setFormat('online')
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(type: EventType) {
    setEditing(type)
    setName(type.name)
    setDescription(type.description)
    setDuration(String(type.durationMinutes))
    setFormat(type.format)
    setNameError(null)
    setFormError(null)
    setFormOpen(true)
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('Введите название')
      return
    }
    setNameError(null)
    setFormError(null)
    const body: EventTypeCreate = {
      name: trimmed,
      description: description.trim(),
      durationMinutes: Number(duration),
      format,
    }
    const request = editing
      ? eventTypesUpdate({ path: { id: editing.id }, body })
      : eventTypesCreate({ body })
    request.then((result) => {
      if (result.data) {
        setFormOpen(false)
        refresh()
      } else {
        setFormError('Не удалось сохранить тип. Проверьте данные.')
      }
    })
  }

  function remove(id: string) {
    setDeleteError(null)
    eventTypesRemove({ path: { id } }).then((result) => {
      if (!result.error) refresh()
      else setDeleteError('Не удалось удалить тип.')
    })
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Мои типы встреч</Title>
        <Text c="dimmed">Создавайте типы встреч, по которым записываются гости.</Text>

        <Group>
          <Button onClick={openCreate}>Создать тип</Button>
        </Group>

        {types === null ? (
          <Loader size="sm" />
        ) : types.length === 0 ? (
          <Text c="dimmed">Пока нет типов встреч.</Text>
        ) : (
          types.map((type) => (
            <Paper key={type.id} withBorder p="md" radius="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600}>{type.name}</Text>
                  <Text c="dimmed" size="sm">
                    {type.description}
                  </Text>
                  <Text size="sm" c="dimmed" mt={4}>
                    {type.durationMinutes} мин · {formatLabel[type.format]}
                  </Text>
                </div>
                <Group gap="xs">
                  <Button variant="light" size="xs" onClick={() => openEdit(type)}>
                    Изменить
                  </Button>
                  <Button variant="light" color="red" size="xs" onClick={() => remove(type.id)}>
                    Удалить
                  </Button>
                </Group>
              </Group>
            </Paper>
          ))
        )}

        {deleteError && <Text c="red">{deleteError}</Text>}

        {formOpen && (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Title order={2}>{editing ? 'Изменить тип' : 'Новый тип'}</Title>
              <TextInput
                label="Название"
                required
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                error={nameError ?? undefined}
              />
              <Textarea
                label="Описание"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
              />
              <NativeSelect
                label="Длительность"
                data={durationOptions}
                value={duration}
                onChange={(event) => setDuration(event.currentTarget.value)}
              />
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Формат
                </Text>
                <SegmentedControl
                  data={formatOptions}
                  value={format}
                  onChange={(value) => setFormat(value as MeetingFormat)}
                />
              </div>
              {formError && <Text c="red">{formError}</Text>}
              <Group>
                <Button onClick={submit}>{editing ? 'Сохранить' : 'Создать'}</Button>
                <Button variant="subtle" onClick={() => setFormOpen(false)}>
                  Отмена
                </Button>
              </Group>
            </Stack>
          </Paper>
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
