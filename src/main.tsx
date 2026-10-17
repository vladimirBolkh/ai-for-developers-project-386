import '@mantine/core/styles.css'

import { MantineProvider } from '@mantine/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Root element #app not found')
}

createRoot(root).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
)
