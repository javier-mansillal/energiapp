import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Hook que expone el usuario autenticado actual y se mantiene sincronizado
// con los cambios de sesión de Supabase (login/logout).
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener?.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}