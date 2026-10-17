import { screen } from '@testing-library/react'

describe('App (smoke)', () => {
  beforeAll(async () => {
    // Точку монтирования создаёт test/setup.ts — до всех хуков тестов
    await import('@/main')
  })

  it('поднимается и отвечает: рендерит содержимое приложения', async () => {
    expect(
      await screen.findByRole('heading', { level: 1, name: /calls calendar/i }),
    ).toBeInTheDocument()

    expect(screen.getByText(/mantine \+ react \+ vite/i)).toBeInTheDocument()
  })
})
