import { useEffect, useState } from 'react'
import {
  Settings,
  Mail,
  BadgeCheck,
  CalendarDays,
  Pencil,
  Check,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

type UsuarioPerfil = {
  id: string
  email: string
  nombre: string | null
  oauthProvider: 'google' | 'azure'
  permiteComparaciones: boolean
  createdAt: string
}

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  azure: 'Microsoft',
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function iniciales(nombre: string | null, email: string): string {
  if (nombre && nombre.trim()) {
    const parts = nombre.trim().split(/\s+/)
    const first = parts[0][0]
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:border-amber-500/30">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5 text-amber-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-all">{value}</p>
    </div>
  )
}

export default function Configuracion() {
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edición del nombre
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Consentimiento para comparaciones anónimas
  const [permiteComparaciones, setPermiteComparaciones] = useState(true)
  const [savingPref, setSavingPref] = useState(false)

  useEffect(() => {
    let mounted = true
    api
      .get<UsuarioPerfil>('/usuario')
      .then((data) => {
        if (!mounted) return
        setPerfil(data)
        setNombre(data.nombre ?? '')
        setPermiteComparaciones(data.permiteComparaciones)
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar tu perfil')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  async function guardarNombre() {
    const nombreTrim = nombre.trim()
    if (!nombreTrim || saving) return
    setSaving(true)
    setError(null)
    try {
      const updated = await api.patch<UsuarioPerfil>('/usuario', { nombre: nombreTrim })
      setPerfil(updated)
      setNombre(updated.nombre ?? '')
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el nombre')
    } finally {
      setSaving(false)
    }
  }

  // Cambia el consentimiento de comparaciones (optimista: revierte si falla).
  async function toggleComparaciones() {
    if (savingPref) return
    const siguiente = !permiteComparaciones
    setPermiteComparaciones(siguiente)
    setSavingPref(true)
    setError(null)
    try {
      const updated = await api.patch<UsuarioPerfil>('/usuario', {
        permiteComparaciones: siguiente,
      })
      setPerfil(updated)
    } catch (err) {
      setPermiteComparaciones(!siguiente)
      setError(err instanceof Error ? err.message : 'Error al guardar la preferencia')
    } finally {
      setSavingPref(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      </AppLayout>
    )
  }

  if (!perfil) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error ?? 'No se pudo cargar tu perfil'}
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Settings className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground">
            Administra tu cuenta y preferencias.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Perfil ── */}
      <Card className="bg-card/50 border-border/60 hover:border-amber-500/40 transition-colors overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-5 group">
            {/* Avatar con iniciales */}
            <div className="size-16 shrink-0 rounded-full bg-linear-to-br from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center text-xl font-bold ring-2 ring-amber-500/40 shadow-lg transition-transform duration-300 group-hover:scale-105">
              {iniciales(perfil.nombre, perfil.email)}
            </div>

            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    maxLength={80}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void guardarNombre()
                      if (e.key === 'Escape') setEditing(false)
                    }}
                    className="w-full max-w-64 rounded-lg border-border bg-background px-3 py-1.5 text-base font-semibold outline-none focus:border-amber-500/50"
                    aria-label="Nombre"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void guardarNombre()}
                    disabled={saving || !nombre.trim()}
                    className="cursor-pointer"
                    aria-label="Guardar nombre"
                  >
                    <Check className="size-4 text-emerald-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false)
                      setNombre(perfil.nombre ?? '')
                    }}
                    className="cursor-pointer"
                    aria-label="Cancelar edición"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl truncate">
                    {perfil.nombre ?? 'Sin nombre'}
                  </CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(true)}
                    className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Editar nombre"
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              )}
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <Mail className="size-3.5" />
                {perfil.email}
              </CardDescription>
            </div>

            {saved && (
              <Badge variant="secondary" className="shrink-0 gap-1 text-xs animate-pulse">
                <Check className="size-3" />
                Guardado
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InfoItem icon={Mail} label="Correo" value={perfil.email} />
            <InfoItem
              icon={BadgeCheck}
              label="Origen de la cuenta"
              value={PROVIDER_LABEL[perfil.oauthProvider] ?? perfil.oauthProvider}
            />
            <InfoItem
              icon={CalendarDays}
              label="Miembro desde"
              value={fmtFecha(perfil.createdAt)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Preferencias ── */}
      <Card className="mt-6 bg-card/50 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            Preferencias
          </CardTitle>
          <CardDescription>
            Personaliza cómo Energiapp usa tus datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">Usar mis datos para comparaciones</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permite que Energiapp compare tu consumo con hogares similares de forma anónima.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savingPref && (
                <Loader2 className="size-4 animate-spin text-amber-400" />
              )}
              <button
                type="button"
                role="switch"
                aria-checked={permiteComparaciones}
                aria-label="Usar mis datos para comparaciones"
                onClick={() => void toggleComparaciones()}
                disabled={savingPref}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60',
                  permiteComparaciones ? 'bg-amber-500' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'size-4.5 rounded-full bg-background shadow-sm transition-transform',
                    permiteComparaciones ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  )
}
