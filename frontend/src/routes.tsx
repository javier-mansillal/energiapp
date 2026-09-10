// Define the application routes
import { Routes, Route } from 'react-router'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Boletas from './pages/Boletas'
import Electrodomesticos from './pages/Electrodomesticos'
import Hogares from './pages/Hogares'
import Configuracion from './pages/Configuracion'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import AppGuard from './components/AppGuard'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Onboarding: solo requiere sesión, no onboarding completado */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      {/* Rutas de la app: requieren sesión + onboarding completado */}
      <Route path="/dashboard" element={<AppGuard><Dashboard /></AppGuard>} />
      <Route path="/boletas" element={<AppGuard><Boletas /></AppGuard>} />
      <Route path="/electrodomesticos" element={<AppGuard><Electrodomesticos /></AppGuard>} />
      <Route path="/hogares" element={<AppGuard><Hogares /></AppGuard>} />
      <Route path="/configuracion" element={<AppGuard><Configuracion /></AppGuard>} />
    </Routes>
  )
}