import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventType } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import BookPage from '@/pages/BookPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

const consultation: EventType = {
  id: '1',
  name: 'Консультация',
  description: 'Разбор вопроса',
  durationMinutes: 30,
  format: 'online',
}

const call: EventType = {
  id: '2',
  name: 'Созвон',
  description: 'Короткий звонок',
  durationMinutes: 15,
  format: 'offline',
}

function renderBookPage() {
  render(
    <MemoryRouter>
      <BookPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
})

describe('Страница записи', () => {
  it('показывает список типов событий из API', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })

    renderBookPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('Созвон')).toBeInTheDocument()
    expect(screen.getByText('онлайн')).toBeInTheDocument()
    expect(screen.getByText('оффлайн')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })

  it('фиксирует выбор типа события', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })

    renderBookPage()

    await screen.findByText('Консультация')
    await userEvent.click(screen.getByRole('button', { name: /Консультация/ }))

    expect(await screen.findByText('Выбран: Консультация')).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда типов нет', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет доступных типов/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /на главную/i })).toHaveAttribute('href', '/')
  })
})
