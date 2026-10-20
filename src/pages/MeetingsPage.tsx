import { bookingsList } from '@/api'
import type { Meeting } from '@/api'
import { asArray } from '@/lib/data'
import { formatSlot } from '@/lib/format'
import { Button, Container, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)

  useEffect(() => {
    let cancelled = false
    bookingsList().then((result) => {
      // Как и в остальных списках: ошибка, пустой ответ и не-массив (недоступный
      // бэкенд) дают пустое состояние, а не вечный спиннер или белый экран.
      if (!cancelled) setMeetings(asArray<Meeting>(result.data))
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Предстоящие встречи</Title>
        <Text c="dimmed">Единый список по всем типам событий.</Text>

        {meetings === null ? (
          <Loader size="sm" />
        ) : meetings.length === 0 ? (
          <Text c="dimmed">Пока нет встреч.</Text>
        ) : (
          meetings.map((meeting) => (
            <Paper key={meeting.id} withBorder p="md" radius="md">
              <Text fw={600}>{meeting.guestName}</Text>
              <Text c="dimmed" size="sm">
                {meeting.eventTypeName}
              </Text>
              <Text size="sm" mt={4}>
                {formatSlot(meeting.startDateTime)}
              </Text>
            </Paper>
          ))
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
