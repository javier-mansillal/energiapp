import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { api } from '@/lib/api'

type OnboardingStatus = 'loading' | 'completed' | 'pending' | 'error'

// Tiempo mínimo que mostramos el spinner antes de resolver, para que el
// estado de carga no parpadee cuando el backend responde rápido o falla al instante.
const MIN_LOADING_MS = 1500

function afterMinDelay(minMs: number, startedAt: number, fn: () => void) {
  const wait = Math.max(0, minMs - (Date.now() - startedAt))
  setTimeout(fn, wait)
}

// Consulta si el usuario ya completó el onboarding (tiene al menos un hogar).
// Recibe el usuario autenticado: sin sesión no consulta (el guard redirige a /login).
export function useOnboarding(user: User | null) {
  const [status, setStatus] = useState<OnboardingStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Sin sesión no tiene sentido consultar: el guard decide redirigir a /login.
    if (!user) return

    let mounted = true
    const startedAt = Date.now()
    api
      .get<{ completed: boolean }>('/onboarding')
      .then((d) => {
        afterMinDelay(MIN_LOADING_MS, startedAt, () => {
          if (mounted) setStatus(d.completed ? 'completed' : 'pending')
        })
      })
      // Si la API falla (backend caído, red, etc.) no podemos confirmar el
      // estado del onboarding: lo marcamos como error para que la UI ofrezca
      // reintentar en vez de mandar al usuario al onboarding por error.
      .catch(() => {
        afterMinDelay(MIN_LOADING_MS, startedAt, () => {
          if (mounted) setStatus('error')
        })
      })
    return () => {
      mounted = false
    }
  }, [user, attempt])

  return {
    completed: status === 'completed',
    // Sin sesión no hay nada que cargar: el guard decide redirigir a /login.
    loading: status === 'loading' && user !== null,
    error: status === 'error' && user !== null,
    retry: () => {
      setStatus('loading')
      setAttempt((n) => n + 1)
    },
  }
}