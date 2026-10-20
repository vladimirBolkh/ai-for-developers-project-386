import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EventType } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import OwnerPage from '@/pages/OwnerPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

const consultation: EventType = {
  id: '1',
  name: 'Консультация',
  description: 'Разбор вопроса',
  durationMinutes: 30,
  format: 'online',
}

function renderOwnerPage() {
  render(
    <MemoryRouter>
      <OwnerPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
})

describe('Поверхность владельца', () => {
  it('показывает список типов событий из API', async () => {
    sdkMocks.eventTypesList.mockResolvedValue({ data: [consultation], error: undefined })

    renderOwnerPage()

    expect(await screen.findByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText(/30 мин · онлайн/)).toBeInTheDocument()
  })

  it('требует название перед созданием', async () => {
    renderOwnerPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Создать тип' }))
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Введите название')).toBeInTheDocument()
    expect(sdkMocks.eventTypesCreate).not.toHaveBeenCalled()
  })

  it('создаёт новый тип события', async () => {
    const created: EventType = {
      id: '2',
      name: 'Созвон',
      description: 'Короткий звонок',
      durationMinutes: 45,
      format: 'offline',
    }
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [], error: undefined })
      .mockResolvedValueOnce({ data: [created], error: undefined })
    sdkMocks.eventTypesCreate.mockResolvedValue({ data: created, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Создать тип' }))
    await userEvent.type(screen.getByLabelText(/Название/), 'Созвон')
    await userEvent.type(screen.getByLabelText(/Описание/), 'Короткий звонок')
    await userEvent.selectOptions(screen.getByLabelText(/Длительность/), '45')
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText('Созвон')).toBeInTheDocument()
    expect(sdkMocks.eventTypesCreate).toHaveBeenCalledWith({
      body: {
        name: 'Созвон',
        description: 'Короткий звонок',
        durationMinutes: 45,
        format: 'online',
      },
    })
  })

  it('редактирует тип события', async () => {
    const updated: EventType = { ...consultation, name: 'Консультация v2' }
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [consultation], error: undefined })
      .mockResolvedValueOnce({ data: [updated], error: undefined })
    sdkMocks.eventTypesUpdate.mockResolvedValue({ data: updated, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Изменить' }))
    await userEvent.clear(screen.getByLabelText(/Название/))
    await userEvent.type(screen.getByLabelText(/Название/), 'Консультация v2')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Консультация v2')).toBeInTheDocument()
    expect(sdkMocks.eventTypesUpdate).toHaveBeenCalledWith({
      path: { id: consultation.id },
      body: {
        name: 'Консультация v2',
        description: 'Разбор вопроса',
        durationMinutes: 30,
        format: 'online',
      },
    })
  })

  it('удаляет тип события', async () => {
    sdkMocks.eventTypesList
      .mockResolvedValueOnce({ data: [consultation], error: undefined })
      .mockResolvedValueOnce({ data: [], error: undefined })
    sdkMocks.eventTypesRemove.mockResolvedValue({ data: undefined, error: undefined })

    renderOwnerPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Удалить' }))

    expect(await screen.findByText('Пока нет типов встреч.')).toBeInTheDocument()
    expect(sdkMocks.eventTypesRemove).toHaveBeenCalledWith({ path: { id: consultation.id } })
  })
})
