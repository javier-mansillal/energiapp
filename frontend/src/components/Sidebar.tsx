import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Receipt,
  Refrigerator,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/boletas', label: 'Boletas', icon: Receipt },
  { to: '/electrodomesticos', label: 'Electrodomésticos', icon: Refrigerator },
  { to: '/hogares', label: 'Hogares', icon: Home },
]

// Barra lateral. En desktop (lg+) queda fija a la izquierda; en móvil se
// convierte en un drawer que se desliza desde la izquierda con un backdrop.
export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop (solo móvil, cuando el drawer está abierto) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 w-64 z-40 border-r border-border/50 bg-background overflow-y-auto transition-transform duration-300',
          // Móvil: drawer abierto/cerrado
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: siempre visible
          'lg:translate-x-0'
        )}
      >
        <nav className="flex flex-col gap-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}