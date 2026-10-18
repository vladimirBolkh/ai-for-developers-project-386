import { Button, Container, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

export default function BookPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>Запись на встречу</Title>
        <Text c="dimmed">Выбор слота появится здесь — это следующий шаг.</Text>
        <div>
          <Button component={Link} to="/" variant="subtle" px={0}>
            ← На главную
          </Button>
        </div>
      </Stack>
    </Container>
  )
}
