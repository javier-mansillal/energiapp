import { useCallback, useEffect, useState } from 'react'
import { ThemeCtx, type Theme } from './theme-context'

const KEY = 'energiapp-theme'

/** Define la función para obtener el tema inicial, dejando oscuro por defecto */
function getInitial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitial)

  useEffect(() => apply(theme), [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(KEY, next)
      return next
    })
  }, [])

  return <ThemeCtx value={{ theme, toggle }}>{children}</ThemeCtx>
}
