import { Box } from '@mantine/core'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BookPage from '@/pages/BookPage'
import HomePage from '@/pages/HomePage'
import MeetingsPage from '@/pages/MeetingsPage'
import OwnerPage from '@/pages/OwnerPage'
import WorkingHoursPage from '@/pages/WorkingHoursPage'

export default function App() {
  useEffect(() => {
    document.title = 'Calls Calendar'
  }, [])

  return (
    <Box
      style={{
        minHeight: '100dvh',
        background:
          'linear-gradient(180deg, var(--mantine-color-indigo-0) 0%, var(--mantine-color-white) 45%, var(--mantine-color-violet-0) 100%)',
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/owner" element={<OwnerPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/hours" element={<WorkingHoursPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Box>
  )
}
