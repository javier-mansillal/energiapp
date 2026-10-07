import { Link, useLocation } from 'react-router'
import { Zap, Sun, Moon, CircleUserRound, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import InstallAppButton from './InstallAppButton'

export default function Navbar({
  onMenuToggle,
}: {
  onMenuToggle?: () => void
}) {
  const { theme, toggle } = useTheme()
  const { user } = useAuth()
  const { pathname } = useLocation()

  const isLoginPage = pathname === '/login'
  // El botón "Ingresar" solo se muestra si no estamos en el login y no hay sesión activa
  const showLoginButton = !isLoginPage && !user
  // En las páginas autenticadas (AppLayout) el navbar tiene el drawer del sidebar
  const isApp = typeof onMenuToggle === 'function'

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/75 backdrop-blur-md border-b border-border/50 px-6 py-4">
      <div
        className={cn(
          'flex items-center justify-between',
          // En la app el logo va pegado a la izquierda; en landing/login centrado
          isApp ? '' : 'max-w-7xl mx-auto'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Botón menú (solo móvil, dentro de la app) */}
          {isApp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="rounded-full cursor-pointer lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </Button>
          )}

          {/* ── LOGO ── */}
          <Link to={isApp ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <Zap className="size-6 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Energi<span className="text-amber-400">app</span>
            </span>
          </Link>
        </div>

        {/* ── RIGHT SIDE ── */}
        <div className="flex items-center gap-3">
          {/* Toggle Dark / Light */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="rounded-full cursor-pointer"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <Sun className="size-5 text-amber-400" />
            ) : (
              <Moon className="size-5 text-slate-600" />
            )}
          </Button>

          <InstallAppButton />

          {/* CTA Login */}
          {showLoginButton && (
            <Link to="/login">
              <Button
                size="sm"
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow-[0_0_15px_rgba(251,191,36,0.15)] cursor-pointer"
              >
                Ingresar
              </Button>
            </Link>
          )}

          {/* Sesión activa: cuenta + cerrar sesión */}
          {user && (
            <>
              <Link
                to="/configuracion"
                aria-label="Configuración de cuenta"
                className={cn(
                  'p-1.5 rounded-full transition-colors',
                  // Mismo resaltado que el sidebar cuando estamos en la página de perfil
                  pathname === '/configuracion'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'hover:bg-muted'
                )}
              >
                <CircleUserRound className="size-6 text-amber-400" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-full cursor-pointer"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-5 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}