import type { MeetingFormat } from '@/api'

export const formatLabel: Record<MeetingFormat, string> = {
  online: 'онлайн',
  offline: 'оффлайн',
}

// Детерминированный вывод «дата · время» из ISO-момента (без конвертации таймзоны).
export function formatSlot(iso: string) {
  return `${iso.slice(0, 10)} · ${iso.slice(11, 16)}`
}
