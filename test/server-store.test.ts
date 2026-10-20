import {
  computeAvailability,
  createBooking,
  createEventType,
  createStore,
  removeEventType,
  setWorkingHours,
  upcomingMeetings,
  updateEventType,
  type Store,
} from '../server/store'

// Понедельник 5 января 2026 (Date.getDay() === 1), локальная полночь.
const NOW = new Date(2026, 0, 5, 0, 0, 0)

function iso(hour: number, minute: number): string {
  return new Date(2026, 0, 5, hour, minute, 0).toISOString()
}

function seed(): { store: Store; eventTypeId: string } {
  const store = createStore()
  setWorkingHours(store, {
    monday: { start: '09:00', end: '17:00' },
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  })
  const created = createEventType(store, {
    name: 'Консультация',
    description: 'Разбор задач',
    durationMinutes: 30,
    format: 'online',
  })
  if (!created.ok) throw new Error('seed: event type creation failed')
  return { store, eventTypeId: created.eventType.id }
}

describe('Доменная логика бэкенда (in-memory store)', () => {
  describe('availability', () => {
    it('генерирует слоты сеткой 15 минут внутри рабочих часов', () => {
      const { store, eventTypeId } = seed()
      const slots = computeAvailability(store, eventTypeId, NOW)

      expect(slots[0]).toBe(iso(9, 0))
      for (const slot of slots) {
        const date = new Date(slot)
        expect(date.getMinutes() % 15).toBe(0)
        expect(date.getHours()).toBeGreaterThanOrEqual(9)
        expect(date.getHours()).toBeLessThan(17)
      }
    })

    it('исключает слоты, пересекающиеся с существующей записью, но допускает «впритык»', () => {
      const { store, eventTypeId } = seed()
      createBooking(store, { eventTypeId, startDateTime: iso(10, 0), guestName: 'Гость' }, NOW)

      const slots = computeAvailability(store, eventTypeId, NOW)

      expect(slots).not.toContain(iso(10, 0)) // занят
      expect(slots).not.toContain(iso(9, 45)) // пересекается (09:45–10:15)
      expect(slots).toContain(iso(9, 30)) // впритык слева (09:00–09:30 → 09:30)
      expect(slots).toContain(iso(10, 30)) // впритык справа
    })

    it('возвращает пусто для неизвестного типа', () => {
      const { store } = seed()
      expect(computeAvailability(store, 'missing', NOW)).toEqual([])
    })
  })

  describe('создание записи (booking)', () => {
    it('создаёт встречу со снапшотом типа', () => {
      const { store, eventTypeId } = seed()
      const result = createBooking(
        store,
        { eventTypeId, startDateTime: iso(9, 0), guestName: 'Аня', guestEmail: 'a@b.c' },
        NOW,
      )

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.meeting.eventTypeName).toBe('Консультация')
      expect(result.meeting.eventTypeDurationMinutes).toBe(30)
      expect(result.meeting.guestEmail).toBe('a@b.c')
    })

    it('возвращает 409 при пересечении с уже занятым слотом', () => {
      const { store, eventTypeId } = seed()
      createBooking(store, { eventTypeId, startDateTime: iso(9, 0), guestName: 'Аня' }, NOW)

      const conflict = createBooking(
        store,
        { eventTypeId, startDateTime: iso(9, 15), guestName: 'Борис' },
        NOW,
      )

      expect(conflict.ok).toBe(false)
      if (conflict.ok) return
      expect(conflict.status).toBe(409)
    })

    it('допускает запись «впритык» к существующей', () => {
      const { store, eventTypeId } = seed()
      createBooking(store, { eventTypeId, startDateTime: iso(9, 0), guestName: 'Аня' }, NOW)

      const backToBack = createBooking(
        store,
        { eventTypeId, startDateTime: iso(9, 30), guestName: 'Борис' },
        NOW,
      )

      expect(backToBack.ok).toBe(true)
    })

    it('отклоняет слот вне рабочих часов и не по сетке (400)', () => {
      const { store, eventTypeId } = seed()

      const outside = createBooking(
        store,
        { eventTypeId, startDateTime: iso(8, 0), guestName: 'Аня' },
        NOW,
      )
      const misaligned = createBooking(
        store,
        { eventTypeId, startDateTime: iso(9, 7), guestName: 'Аня' },
        NOW,
      )

      expect(outside.ok).toBe(false)
      if (!outside.ok) expect(outside.status).toBe(400)
      expect(misaligned.ok).toBe(false)
      if (!misaligned.ok) expect(misaligned.status).toBe(400)
    })
  })

  it('working hours: null (выходной) — ок, start >= end — 400', () => {
    const store = createStore()

    const ok = setWorkingHours(store, {
      monday: { start: '09:00', end: '17:00' },
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    })
    expect(ok.ok).toBe(true)

    const bad = setWorkingHours(store, {
      monday: { start: '17:00', end: '09:00' },
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    })
    expect(bad.ok).toBe(false)
  })

  it('event types: пустое имя → 400, удаление существующего → ok, неизвестного → 404', () => {
    const { store, eventTypeId } = seed()

    const emptyName = updateEventType(store, eventTypeId, { name: '   ' })
    expect(emptyName.ok).toBe(false)

    expect(removeEventType(store, eventTypeId)).toEqual({ ok: true })
    const missing = removeEventType(store, 'nope')
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.status).toBe(404)
  })

  it('upcomingMeetings возвращает только будущие встречи, отсортированные', () => {
    const { store, eventTypeId } = seed()
    createBooking(store, { eventTypeId, startDateTime: iso(10, 0), guestName: 'Аня' }, NOW)
    createBooking(store, { eventTypeId, startDateTime: iso(9, 0), guestName: 'Борис' }, NOW)

    const upcoming = upcomingMeetings(store, NOW)

    expect(upcoming).toHaveLength(2)
    expect(upcoming[0].guestName).toBe('Борис') // 09:00 раньше 10:00
  })
})
