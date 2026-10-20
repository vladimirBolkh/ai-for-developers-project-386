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

    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))

    expect(await screen.findByText('Выбран: Консультация')).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда типов нет', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет доступных типов/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /на главную/i })).toHaveAttribute('href', '/')
  })
})

describe('Выбор слота', () => {
  it('запрашивает доступность и показывает свободные слоты', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: ['2026-10-21T09:00:00+03:00', '2026-10-21T09:15:00+03:00'],
      error: undefined,
    })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))

    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.getByText(/2026-10-21 · 09:15/)).toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenCalledWith({
      query: { eventTypeId: consultation.id },
    })
  })

  it('пересчитывает слоты при смене типа', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })
    sdkMocks.availabilityGet
      .mockResolvedValueOnce({ data: ['2026-10-21T09:00:00+03:00'], error: undefined })
      .mockResolvedValueOnce({ data: ['2026-10-22T10:00:00+03:00'], error: undefined })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))
    await screen.findByText(/2026-10-21 · 09:00/)

    await userEvent.click(screen.getByRole('button', { name: /Созвон/ }))

    expect(await screen.findByText(/2026-10-22 · 10:00/)).toBeInTheDocument()
    expect(screen.queryByText(/2026-10-21 · 09:00/)).not.toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenLastCalledWith({ query: { eventTypeId: call.id } })
  })

  it('фиксирует выбранный слот', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: ['2026-10-21T09:00:00+03:00'],
      error: undefined,
    })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))

    expect(await screen.findByText('Выбран слот: 2026-10-21 · 09:00')).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии свободных слотов', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))

    expect(await screen.findByText(/нет свободных слотов/i)).toBeInTheDocument()
  })
})
