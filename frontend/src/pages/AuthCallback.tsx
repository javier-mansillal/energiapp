import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

// Ruta de retorno del OAuth (NO protegida).
// Al volver de Google/Microsoft, supabase-js intercambia el código de la URL
// por una sesión. Aquí esperamos a que eso ocurra y luego redirigimos.
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        navigate(data.session ? '/dashboard' : '/login', { replace: true })
      })
      .catch(() => {
        navigate('/login', { replace: true })
      })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Loader2 className="size-6 animate-spin text-amber-400" />
    </div>
  )
}