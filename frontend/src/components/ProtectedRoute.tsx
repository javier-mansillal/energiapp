import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Guard de rutas: solo permite acceder al contenido si hay sesión activa.
// Mientras se resuelve la sesión muestra un spinner para evitar parpadeos.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin text-amber-400" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}