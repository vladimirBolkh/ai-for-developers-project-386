import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventType, Meeting } from '@/api'
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

const meeting: Meeting = {
  id: 'm1',
  eventTypeId: '1',
  eventTypeName: 'Консультация',
  eventTypeDescription: 'Разбор вопроса',
  eventTypeDurationMinutes: 30,
  eventTypeFormat: 'online',
  startDateTime: '2026-10-21T09:00:00+03:00',
  guestName: 'Анна',
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

    // После выбора слота появляется форма ввода данных гостя.
    expect(await screen.findByText('Ваши данные')).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии свободных слотов', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))

    expect(await screen.findByText(/нет свободных слотов/i)).toBeInTheDocument()
  })
})

describe('Подтверждение записи', () => {
  async function pickSlotAndOpenForm() {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: ['2026-10-21T09:00:00+03:00'],
      error: undefined,
    })
    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /Консультация/ }))
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))
    await screen.findByText('Ваши данные')
  }

  it('требует имя перед отправкой', async () => {
    await pickSlotAndOpenForm()

    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).not.toHaveBeenCalled()
  })

  it('создаёт запись и показывает подтверждение Встречи', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({ data: meeting, error: undefined })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    const confirmation = await screen.findByRole('heading', { name: 'Вы записаны' })
    const card = confirmation.parentElement
    if (!card) throw new Error('card not found')
    expect(within(card).getByText('Консультация')).toBeInTheDocument()
    expect(within(card).getByText('2026-10-21 · 09:00')).toBeInTheDocument()
    expect(within(card).getByText('Гость: Анна')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).toHaveBeenCalledWith({
      body: {
        eventTypeId: '1',
        startDateTime: '2026-10-21T09:00:00+03:00',
        guestName: 'Анна',
      },
    })
  })

  it('при занятом слоте (409) возвращает к выбору слота', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'conflict' },
      response: { status: 409 },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/уже занят/i)).toBeInTheDocument()
    expect(screen.queryByText('Ваши данные')).not.toBeInTheDocument()
  })

  it('при ошибке валидации (400) показывает сообщение об ошибке', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'bad request' },
      response: { status: 400 },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/Не удалось создать запись/i)).toBeInTheDocument()
    expect(screen.getByText('Ваши данные')).toBeInTheDocument()
  })

  it('при серверной/сетевой ошибке показывает общее сообщение', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({
      data: undefined,
      error: { message: 'boom' },
    })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText(/Что-то пошло не так/i)).toBeInTheDocument()
  })
})
