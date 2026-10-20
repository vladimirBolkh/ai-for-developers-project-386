import { vi } from 'vitest'
import type { EventType, Meeting, WorkingHours } from '@/api'

// Стабы типизированного API-клиента. Типизированы от моделей `@/api`,
// поэтому дрейф контракта (переименование/удаление поля) ломает тесты.
// Регистрируются на весь прогон через vi.mock (см. test/setup.ts).
type ApiResult<T> = { data: T; error: undefined } | { data: undefined; error: unknown }

type SdkFn<T> = () => Promise<ApiResult<T>>

export const sdkMocks = {
  availabilityGet: vi.fn<SdkFn<string[]>>().mockResolvedValue({ data: [], error: undefined }),
  bookingsCreate: vi.fn<SdkFn<Meeting>>().mockResolvedValue({ data: undefined, error: undefined }),
  bookingsList: vi.fn<SdkFn<Meeting[]>>().mockResolvedValue({ data: [], error: undefined }),
  eventTypesCreate: vi
    .fn<SdkFn<EventType>>()
    .mockResolvedValue({ data: undefined, error: undefined }),
  eventTypesList: vi.fn<SdkFn<EventType[]>>().mockResolvedValue({ data: [], error: undefined }),
  eventTypesRead: vi
    .fn<SdkFn<EventType>>()
    .mockResolvedValue({ data: undefined, error: undefined }),
  eventTypesRemove: vi.fn<SdkFn<void>>().mockResolvedValue({ data: undefined, error: undefined }),
  eventTypesUpdate: vi
    .fn<SdkFn<EventType>>()
    .mockResolvedValue({ data: undefined, error: undefined }),
  workingHoursOperationsGet: vi
    .fn<SdkFn<WorkingHours>>()
    .mockResolvedValue({ data: undefined, error: undefined }),
  workingHoursOperationsSet: vi
    .fn<SdkFn<WorkingHours>>()
    .mockResolvedValue({ data: undefined, error: undefined }),
}

// Списковые функции по умолчанию возвращают пустой список, остальные — пустой результат.
const listMocks = [
  sdkMocks.availabilityGet,
  sdkMocks.bookingsList,
  sdkMocks.eventTypesList,
] as const

export function resetSdkMocks() {
  for (const fn of Object.values(sdkMocks)) {
    fn.mockReset()
    fn.mockResolvedValue({ data: undefined, error: undefined })
  }
  for (const fn of listMocks) {
    fn.mockResolvedValue({ data: [], error: undefined })
  }
}
