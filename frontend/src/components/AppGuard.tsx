import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Loader2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useOnboarding } from '@/hooks/useOnboarding'

// Guard de las páginas de la app: exige sesión activa Y onboarding completado.
// Si no hay sesión → /login. Si no tiene hogar → /onboarding.
// Si no se puede confirmar el estado (backend caído) → pantalla de error con reintentar.
export default function AppGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const onboarding = useOnboarding(user)

  if (loading || onboarding.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin text-amber-400" />
      </div>
    )
  }

  // No pudimos confirmar el estado del onboarding (backend caído, red, etc.):
  // mostramos un error con opción de reintentar en vez de mandar al onboarding.
  if (onboarding.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground">
        <WifiOff className="size-8 text-amber-400" />
        <p className="text-lg font-medium">No pudimos conectar con el servidor</p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Verifica que el backend esté activo y vuelve a intentarlo.
        </p>
        <Button variant="outline" onClick={onboarding.retry} className="cursor-pointer">
          Reintentar
        </Button>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!onboarding.completed) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}