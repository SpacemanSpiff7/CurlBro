import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import { PrivacyPolicyStandalone } from '@/pages/PrivacyPolicyStandalone.tsx'

const path = window.location.pathname.replace(/\/$/, '')
const isPrivacy = path === '/privacy'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="curlbro_theme">
      {isPrivacy ? <PrivacyPolicyStandalone /> : <App />}
    </ThemeProvider>
  </StrictMode>,
)
