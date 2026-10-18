import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BookPage from '@/pages/BookPage'
import { render } from './test-utils'

describe('Страница записи (заглушка)', () => {
  it('показывает заглушку и ссылку на главную', () => {
    render(
      <MemoryRouter>
        <BookPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Запись на встречу' })).toBeInTheDocument()
    expect(screen.getByText(/выбор слота появится здесь/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /на главную/i })).toHaveAttribute('href', '/')
  })
})
