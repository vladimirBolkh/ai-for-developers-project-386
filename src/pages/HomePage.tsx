import { eventTypesList } from '@/api'
import { Button, Container, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const steps = [
  {
    step: '1',
    title: 'Владелец публикует время',
    description: 'Он отмечает, когда ему удобно провести встречи.',
  },
  {
    step: '2',
    title: 'Ты выбираешь слот',
    description: 'Смотришь свободное время и выбираешь удобный слот.',
  },
  {
    step: '3',
    title: 'Ты записан на встречу',
    description: 'Слот закрепляется за тобой, встреча добавляется в календарь владельца.',
  },
]

export default function HomePage() {
  const [eventTypesCount, setEventTypesCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    eventTypesList()
      .then((result) => {
        if (!cancelled && result.data) setEventTypesCount(result.data.length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container size="md" py="xl">
      <Stack gap="xl" align="center" ta="center">
        <Stack gap="sm">
          <Title order={1}>
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
              inherit
            >
              Calls Calendar
            </Text>
          </Title>
          <Text c="dimmed" maw={520}>
            Бронируй время для встреч без переписки: владелец публикует свободное время, ты
            выбираешь слот и записываешься.
          </Text>
          {eventTypesCount !== null && (
            <Text c="dimmed" size="sm">
              Доступно типов встреч: {eventTypesCount}
            </Text>
          )}
          <Group justify="center" mt="sm">
            <Button component={Link} to="/book" size="md">
              Записаться на встречу
            </Button>
          </Group>
        </Stack>

        <Stack gap="md" w="100%">
          <Title order={2}>Как это работает</Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            {steps.map((item) => (
              <Paper key={item.step} withBorder p="md" radius="md">
                <Text fw={500}>{item.title}</Text>
                <Text c="dimmed" size="sm" mt="xs">
                  {item.description}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="sm" align="center">
          <Title order={2}>Готов выбрать время?</Title>
          <Button component={Link} to="/book" size="md">
            Записаться на встречу
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}
