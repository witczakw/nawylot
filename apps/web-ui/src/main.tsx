import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Shell } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { AlertPreview } from './screens/AlertPreview'
import { Components } from './screens/Components'
import { ConfirmWatch } from './screens/ConfirmWatch'
import { Deal } from './screens/Deal'
import { Landing } from './screens/Landing'
import { Login } from './screens/Login'
import { Plans } from './screens/Plans'
import { Settings } from './screens/Settings'
import { Watches } from './screens/Watches'
import { AppProvider } from './state/app'
import './index.css'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <ToastProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Landing />} />
              <Route path="logowanie" element={<Login />} />
              <Route path="nowy" element={<ConfirmWatch />} />
              <Route path="wyjazdy" element={<Watches />} />
              <Route path="okazja/:id" element={<Deal />} />
              <Route path="podglad-alertu" element={<AlertPreview />} />
              <Route path="plany" element={<Plans />} />
              <Route path="ustawienia" element={<Settings />} />
              <Route path="komponenty" element={<Components />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  </StrictMode>,
)
