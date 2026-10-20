import { workingHoursOperationsGet, workingHoursOperationsSet } from '@/api'
import type { DayHours, WorkingHours } from '@/api'
import { Badge, Button, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const days = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
] as const

type DayKey = (typeof days)[number]['key']

// Продуктовый дефолт: будни 09:00–18:00, выходные — выходной.
const defaultHours: WorkingHours = {
  monday: { start: '09:00', end: '18:00' },
  tuesday: { start: '09:00', end: '18:00' },
  wednesday: { start: '09:00', end: '18:00' },
  thursday: { start: '09:00', end: '18:00' },
  friday: { start: '09:00', end: '18:00' },
  saturday: null,
  sunday: null,
}

// Не настроено (все дни пустые) → показываем продуктовый дефолт.
function isUnconfigured(hours: WorkingHours) {
  return days.every(({ key }) => hours[key] === null)
}

function validate(hours: WorkingHours): string | null {
  for (const { key, label } of days) {
    const value = hours[key]
    if (!value) continue
    if (!value.start || !value.end) {
      return `${label}: заполните начало и конец либо оставьте день пустым (выходной).`
    }
    if (value.start >= value.end) {
      return `${label}: конец должен быть позже начала.`
    }
  }
  return null
}

export default function WorkingHoursPage() {
  const [hours, setHours] = useState<WorkingHours | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    workingHoursOperationsGet().then((result) => {
      if (cancelled) return
      const fetched = result.data
      setHours(!fetched || isUnconfigured(fetched) ? { ...defaultHours } : fetched)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function updateDay(key: DayKey, field: 'start' | 'end', value: string) {
    setSaved(false)
    setValidationError(null)
    setHours((prev) => {
      if (!prev) return prev
      const current = prev[key] ?? { start: '', end: '' }
      const next: DayHours =
        field === 'start' ? { ...current, start: value } : { ...current, end: value }
      const updated = { ...prev }
      updated[key] = next.start === '' && next.end === '' ? null : next
      return updated
    })
  }

  function submit() {
    if (!hours) return
    const error = validate(hours)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)
    setSaveError(null)
    workingHoursOperationsSet({ body: hours }).then((result) => {
      if (result.data) setSaved(true)
      else setSaveError('Не удалось сохранить часы. Проверьте введённое время.')
    })
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Рабочие часы</Title>
        <Text c="dimmed">Пустой день — выходной. Шаг — 15 минут.</Text>

        {hours === null ? (
          <Loader size="sm" />
        ) : (
          <>
            {days.map(({ key, label }) => {
              const value = hours[key]
              return (
                <Paper key={key} withBorder p="sm" radius="md">
                  <Group justify="space-between" mb={6}>
                    <Text fw={500}>{label}</Text>
                    {!value && (
                      <Badge variant="light" color="gray">
                        Выходной
                      </Badge>
                    )}
                  </Group>
                  <Group gap="xs">
                    <input
                      type="time"
                      step={900}
                      aria-label={`${label} начало`}
                      value={value?.start ?? ''}
                      onChange={(event) => updateDay(key, 'start', event.currentTarget.value)}
                    />
                    <Text c="dimmed">—</Text>
                    <input
                      type="time"
                      step={900}
                      aria-label={`${label} конец`}
                      value={value?.end ?? ''}
                      onChange={(event) => updateDay(key, 'end', event.currentTarget.value)}
                    />
                  </Group>
                </Paper>
              )
            })}

            {validationError && <Text c="red">{validationError}</Text>}
            {saveError && <Text c="red">{saveError}</Text>}
            {saved && <Text c="green">Сохранено.</Text>}

            <Group>
              <Button onClick={submit}>Сохранить</Button>
            </Group>
          </>
        )}

        <div>
          <Button component={Link} to="/owner" variant="subtle" px={0}>
            ← К типам встреч
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
