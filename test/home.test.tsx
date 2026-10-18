import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { render } from './test-utils'

describe('Главная страница', () => {
  it('рассказывает о сервисе и ведёт на страницу записи', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Calls Calendar' })).toBeInTheDocument()
    expect(screen.getByText(/бронируй время для встреч/i)).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: 'Как это работает' })).toBeInTheDocument()
    expect(screen.getByText('Владелец публикует время')).toBeInTheDocument()
    expect(screen.getByText('Ты выбираешь слот')).toBeInTheDocument()
    expect(screen.getByText('Ты записан на встречу')).toBeInTheDocument()

    const ctaLinks = screen.getAllByRole('link', { name: 'Записаться на встречу' })
    expect(ctaLinks).toHaveLength(2)
    for (const link of ctaLinks) {
      expect(link).toHaveAttribute('href', '/book')
    }
  })
})
