import { Container, Text, Title } from '@mantine/core'

export default function App() {
  return (
    <Container size="sm" py="xl">
      <Title order={1}>Calls Calendar</Title>
      <Text c="dimmed" mt="sm">
        Mantine + React + Vite
      </Text>
    </Container>
  )
}
