import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventType, Meeting, Slot } from '@/api'
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

// «09:00 локально 21.10.2026» — момент, созданный в поясе самой машины. Так
// фикстура и вывод formatSlot (тоже локальный) совпадают везде, включая UTC в CI.
const at = (year: number, month: number, day: number, hour: number, minute: number) =>
  new Date(year, month, day, hour, minute).toISOString()

const meeting: Meeting = {
  id: 'm1',
  eventTypeId: '1',
  eventTypeName: 'Консультация',
  eventTypeDescription: 'Разбор вопроса',
  eventTypeDurationMinutes: 30,
  eventTypeFormat: 'online',
  startDateTime: at(2026, 9, 21, 9, 0),
  guestName: 'Анна',
}

function free(iso: string): Slot {
  return { startDateTime: iso, status: 'free' }
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
  it('показывает доступные типы в выпадающем списке и детали выбранного', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })

    renderBookPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()

    // Оба типа доступны в выпадающем списке.
    const select = await screen.findByLabelText('Тип встречи')
    expect(within(select).getByRole('option', { name: /Консультация/ })).toBeInTheDocument()
    expect(within(select).getByRole('option', { name: /Созвон/ })).toBeInTheDocument()

    // Первый тип выбран авто-матически, его детали видны в блоке информации.
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('онлайн')).toBeInTheDocument()
    expect(screen.getByText('Разбор вопроса')).toBeInTheDocument()
  })

  it('переключает тип через выпадающий список', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })

    renderBookPage()
    const select = await screen.findByLabelText('Тип встречи')
    await userEvent.selectOptions(select, call.id)

    expect(await screen.findByText('Созвон')).toBeInTheDocument()
    expect(screen.getByText('оффлайн')).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда типов нет', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет доступных типов/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /на главную/i })).toHaveAttribute('href', '/')
  })

  it('не падает, когда бэкенд вернул не-массив (недоступен/вне контракта)', async () => {
    // SPA-fallback Vite при отсутствии прокси отдаёт HTML строку вместо массива.
    // Раньше это роняло рендер (`types.find is not a function` → белый экран).
    sdkMocks.eventTypesList.mockResolvedValue({
      data: '<!doctype html><html><body></body></html>' as unknown as EventType[],
      error: undefined,
    })

    renderBookPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запись на встречу' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/нет доступных типов/i)).toBeInTheDocument()
  })
})

describe('Календарь и слоты', () => {
  it('запрашивает доступность и показывает свободные слоты выбранного дня', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0)), free(at(2026, 9, 21, 9, 15))],
      error: undefined,
    })

    renderBookPage()

    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.getByText(/2026-10-21 · 09:15/)).toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenCalledWith({
      query: { eventTypeId: consultation.id },
    })
  })

  it('фильтрует слоты по выбранной дате — календарь сокращает список', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0)), free(at(2026, 9, 22, 10, 0))],
      error: undefined,
    })

    renderBookPage()

    // Авто-выбрана первая свободная дата (21.10): её слот виден, слот 22.10 скрыт.
    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.queryByText(/2026-10-22 · 10:00/)).not.toBeInTheDocument()
    // Блок календаря отрисован.
    expect(screen.getByRole('heading', { name: 'Календарь' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Доступные слоты' })).toBeInTheDocument()
  })

  it('помечает занятые и недоступные слоты, блокируя их', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [
        free(at(2026, 9, 21, 9, 0)),
        { startDateTime: at(2026, 9, 21, 9, 15), status: 'busy' },
        { startDateTime: at(2026, 9, 21, 9, 30), status: 'unavailable' },
      ],
      error: undefined,
    })

    renderBookPage()

    expect(await screen.findByText(/2026-10-21 · 09:00/)).toBeInTheDocument()
    expect(screen.getByText('занято')).toBeInTheDocument()
    expect(screen.getByText('недоступен')).toBeInTheDocument()
    // Занятый и недоступный слоты нельзя выбрать.
    expect(screen.getByText('занято').closest('button')).toBeDisabled()
    expect(screen.getByText('недоступен').closest('button')).toBeDisabled()
  })

  it('пересчитывает слоты при смене типа', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation, call], error: undefined })
    sdkMocks.availabilityGet
      .mockResolvedValueOnce({ data: [free(at(2026, 9, 21, 9, 0))], error: undefined })
      .mockResolvedValueOnce({ data: [free(at(2026, 9, 22, 10, 0))], error: undefined })

    renderBookPage()
    await screen.findByText(/2026-10-21 · 09:00/)

    await userEvent.selectOptions(screen.getByLabelText('Тип встречи'), call.id)

    expect(await screen.findByText(/2026-10-22 · 10:00/)).toBeInTheDocument()
    expect(screen.queryByText(/2026-10-21 · 09:00/)).not.toBeInTheDocument()
    expect(sdkMocks.availabilityGet).toHaveBeenLastCalledWith({ query: { eventTypeId: call.id } })
  })

  it('фиксирует выбранный слот и открывает форму', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0))],
      error: undefined,
    })

    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))

    // После выбора слота календарь и слоты заменяются формой данных гостя.
    expect(await screen.findByText('Ваши данные')).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии свободных слотов', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({ data: [], error: undefined })

    renderBookPage()

    expect(await screen.findByText(/нет свободных слотов/i)).toBeInTheDocument()
  })
})

describe('Подтверждение записи', () => {
  async function pickSlotAndOpenForm() {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })
    sdkMocks.availabilityGet.mockResolvedValue({
      data: [free(at(2026, 9, 21, 9, 0))],
      error: undefined,
    })
    renderBookPage()
    await userEvent.click(await screen.findByRole('button', { name: /2026-10-21 · 09:00/ }))
    await screen.findByText('Ваши данные')
  }

  it('требует имя перед отправкой', async () => {
    await pickSlotAndOpenForm()

    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByText('Введите имя')).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).not.toHaveBeenCalled()
  })

  it('создаёт запись и показывает подтверждение', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({ data: meeting, error: undefined })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))

    expect(await screen.findByRole('heading', { name: 'Вы записаны' })).toBeInTheDocument()
    expect(screen.getByText('Гость: Анна')).toBeInTheDocument()
    // Вместо календаря и слотов — кнопка «Забронировать ещё».
    expect(screen.getByRole('button', { name: /Забронировать ещё/ })).toBeInTheDocument()
    expect(sdkMocks.bookingsCreate).toHaveBeenCalledWith({
      body: {
        eventTypeId: '1',
        startDateTime: at(2026, 9, 21, 9, 0),
        guestName: 'Анна',
      },
    })
  })

  it('возвращается к записи по кнопке «Забронировать ещё»', async () => {
    sdkMocks.bookingsCreate.mockResolvedValue({ data: meeting, error: undefined })

    await pickSlotAndOpenForm()
    await userEvent.type(screen.getByLabelText(/Имя/), 'Анна')
    await userEvent.click(screen.getByRole('button', { name: /Подтвердить запись/ }))
    await screen.findByRole('heading', { name: 'Вы записаны' })

    await userEvent.click(screen.getByRole('button', { name: /Забронировать ещё/ }))

    expect(await screen.findByRole('heading', { name: 'Календарь' })).toBeInTheDocument()
    expect(screen.queryByText('Вы записаны')).not.toBeInTheDocument()
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

  it('при ошибке валидации (400) показывает сообщение и остаётся в форме', async () => {
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
