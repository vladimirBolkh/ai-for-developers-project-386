import { eventTypesList } from '@/api'
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

export default function BookPage() {
  const [types, setTypes] = useState<EventType[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList().then((result) => {
      if (!cancelled && result.data) setTypes(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selected = types?.find((type) => type.id === selectedId)

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Запись на встречу</Title>
        <Text c="dimmed">Выберите тип встречи, чтобы перейти к выбору времени.</Text>

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
          <Text size="sm" c="dimmed">
            Выбран: {selected.name}
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
