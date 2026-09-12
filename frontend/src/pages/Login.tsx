import { useState } from 'react'
import { Link } from 'react-router'
import { Zap, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// ── Íconos SVG inline de Google y Microsoft ──
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  )
}

type Provider = 'google' | 'azure'

export default function Login() {
  const [loading, setLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(() => {
    // Error devuelto por Supabase tras un OAuth fallido (ver AuthCallback).
    return new URLSearchParams(window.location.search).get('error')
  })

  async function signIn(provider: Provider) {
    setError(null)
    setLoading(provider)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Fuerza a Google a mostrar el selector de cuentas siempre,
            // en vez de entrar directo con la última cuenta usada.
            prompt: 'select_account',
            // Microsoft no devuelve el email por defecto: hay que pedir el
            // scope explícitamente. Google no acepta estos scopes extra.
            ...(provider === 'azure'
              ? { scopes: 'openid profile email offline_access' }
              : {}),
          },
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setLoading(null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError(msg)
      setLoading(null)
    }
  }

  const providers: { provider: Provider; label: string; Icon: typeof GoogleIcon }[] = [
    { provider: 'google', label: 'Google', Icon: GoogleIcon },
    { provider: 'azure', label: 'Microsoft', Icon: MicrosoftIcon },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center p-6 pt-24">
        <Card className="w-full max-w-md shadow-xl border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-amber-500/10 w-fit">
            <Zap className="size-6 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Accede con tu cuenta para gestionar tu consumo eléctrico
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* ── Botones OAuth ── */}
          {providers.map(({ provider, label, Icon }) => (
            <Button
              key={provider}
              variant="outline"
              size="lg"
              disabled={loading !== null}
              onClick={() => signIn(provider)}
              className="w-full cursor-pointer gap-3 text-base font-medium"
            >
              {loading === provider ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Icon className="size-5" />
              )}
              Continuar con {label}
            </Button>
          ))}

          {/* ── Error ── */}
          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* ── Separador visual ── */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <hr className="flex-1 border-border" />
            <span>OAUTH SEGURO</span>
            <hr className="flex-1 border-border" />
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Al ingresar aceptas nuestros términos y política de privacidad.
          </p>
        </CardContent>
      </Card>

      {/* ── Volver ── */}
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-400 transition"
      >
        <ArrowLeft className="size-4" />
        Volver a la Landing
      </Link>
      </div>

      <Footer />
    </div>
  )
}
