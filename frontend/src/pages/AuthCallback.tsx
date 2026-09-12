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
    // Si el intercambio del código falló del lado de Supabase (p.ej. "Error
    // getting user email from external provider"), GoTrue redirige de vuelta
    // aquí con los parámetros error / error_description en la URL.
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error_description') ?? params.get('error')

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          navigate('/dashboard', { replace: true })
        } else if (oauthError) {
          navigate(`/login?error=${encodeURIComponent(oauthError)}`, { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      })
      .catch(() => {
        navigate(
          `/login?error=${encodeURIComponent(oauthError ?? 'Error inesperado al iniciar sesión')}`,
          { replace: true }
        )
      })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Loader2 className="size-6 animate-spin text-amber-400" />
    </div>
  )
}