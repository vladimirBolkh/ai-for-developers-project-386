import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { render } from './test-utils'

describe('Навигация', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('кнопка «Записаться на встречу» с главной ведёт на страницу записи', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('link', { name: 'Записаться на встречу' })[0])

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
  })

  it('неизвестный маршрут редиректит на главную', async () => {
    window.history.pushState({}, '', '/definitely-not-a-route')
    render(<App />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Calls Calendar' }),
    ).toBeInTheDocument()
  })
})
