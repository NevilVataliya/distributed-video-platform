import { Routes, Route } from 'react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'

import { HomePage } from '@/pages/HomePage'
import { WatchPage } from '@/pages/WatchPage'
import { UploadPage } from '@/pages/UploadPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ChannelPage } from '@/pages/ChannelPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <Toaster 
        theme="dark" 
        position="bottom-right" 
        toastOptions={{ 
          className: 'bg-bg-elevated border-border text-text-primary' 
        }} 
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          
          <Route path="/watch/:id" element={<WatchPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/channel/:username" element={<ChannelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
