import { configureApi } from '@cl/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App'
import './index.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { API_BASE_URL } from './utils/config'

// `include` sends the IAP session cookie when the backend is on another origin.
configureApi({ baseUrl: API_BASE_URL, credentials: 'include' })

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
