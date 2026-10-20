import { screen } from '@testing-library/react'
import type { Meeting } from '@/api'
import { MemoryRouter } from 'react-router-dom'
import MeetingsPage from '@/pages/MeetingsPage'
import { resetSdkMocks, sdkMocks } from './sdk-mock'
import { render } from './test-utils'

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

function renderMeetingsPage() {
  render(
    <MemoryRouter>
      <MeetingsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  resetSdkMocks()
})

describe('Список предстоящих Встреч', () => {
  it('показывает пустое состояние, когда встреч нет', async () => {
    sdkMocks.bookingsList.mockResolvedValue({ data: [], error: undefined })

    renderMeetingsPage()

    expect(await screen.findByText('Пока нет встреч.')).toBeInTheDocument()
  })

  it('показывает имя гостя, тип события и время', async () => {
    sdkMocks.bookingsList.mockResolvedValue({ data: [meeting], error: undefined })

    renderMeetingsPage()

    expect(await screen.findByText('Анна')).toBeInTheDocument()
    expect(screen.getByText('Консультация')).toBeInTheDocument()
    expect(screen.getByText('2026-10-21 · 09:00')).toBeInTheDocument()
  })
})
