import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Zap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { setActiveHogarId } from '@/lib/activeHogar'
import { cn } from '@/lib/utils'

const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
]

// Borrador del onboarding guardado en localStorage para no perder el avance
// si el usuario se desconecta o recarga la página.
const DRAFT_KEY = 'energiapp-onboarding-draft'

type Draft = {
  nombre: string
  region: string
  comuna: string
  direccion: string
  cantidadPersonas: string
}

const emptyDraft: Draft = {
  nombre: '',
  region: '',
  comuna: '',
  direccion: '',
  cantidadPersonas: '1',
}

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return emptyDraft
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<Draft>) }
  } catch {
    return emptyDraft
  }
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(loadDraft)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya tiene hogar, saltar el onboarding.
  useEffect(() => {
    api
      .get<{ completed: boolean }>('/onboarding')
      .then((d) => {
        if (d.completed) setCompleted(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function update(field: keyof Draft, value: string) {
    const next = { ...draft, [field]: value }
    setDraft(next)
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
  }

  const steps: { title: string; description: string; render: () => React.ReactNode }[] = [
    {
      title: 'Nombre del hogar',
      description: '¿Cómo quieres llamar a tu hogar?',
      render: () => (
        <input
          autoFocus
          value={draft.nombre}
          onChange={(e) => update('nombre', e.target.value)}
          placeholder="Ej: Casa, Departamento, Mi hogar"
          className="w-full rounded-lg border-border bg-background px-3 py-2 text-base outline-none focus:border-amber-500/50"
        />
      ),
    },
    {
      title: 'Región',
      description: '¿En qué región de Chile se encuentra?',
      render: () => (
        <select
          value={draft.region}
          onChange={(e) => update('region', e.target.value)}
          className="w-full rounded-lg border-border bg-background px-3 py-2 text-base outline-none focus:border-amber-500/50"
        >
          <option value="" disabled>
            Selecciona una región
          </option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      title: 'Comuna',
      description: '¿En qué comuna vives?',
      render: () => (
        <input
          autoFocus
          value={draft.comuna}
          onChange={(e) => update('comuna', e.target.value)}
          placeholder="Ej: Providencia, Concepción, Viña del Mar"
          className="w-full rounded-lg border-border bg-background px-3 py-2 text-base outline-none focus:border-amber-500/50"
        />
      ),
    },
    {
      title: 'Dirección',
      description: '¿Cuál es la dirección del hogar?',
      render: () => (
        <input
          autoFocus
          value={draft.direccion}
          onChange={(e) => update('direccion', e.target.value)}
          placeholder="Ej: Av. Siempre Viva 123, Depto 4"
          className="w-full rounded-lg border-border bg-background px-3 py-2 text-base outline-none focus:border-amber-500/50"
        />
      ),
    },
    {
      title: 'Cantidad de personas',
      description: '¿Cuántas personas viven en el hogar?',
      render: () => (
        <input
          autoFocus
          type="number"
          min={1}
          value={draft.cantidadPersonas}
          onChange={(e) => update('cantidadPersonas', e.target.value)}
          className="w-full rounded-lg border-border bg-background px-3 py-2 text-base outline-none focus:border-amber-500/50"
        />
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="size-6 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-400" />
      </div>
    )
  }

  if (completed) return <Navigate to="/dashboard" replace />

  const canContinue = step === 0
    ? draft.nombre.trim().length > 0
    : step === 1
      ? draft.region.length > 0
      : step === 2
        ? draft.comuna.trim().length > 0
        : step === 3
          ? draft.direccion.trim().length > 0
          : Number(draft.cantidadPersonas) >= 1

  async function finish() {
    setSubmitting(true)
    setError(null)
    try {
      const { hogar } = await api.post<{ completed: boolean; hogar: { id: string } }>(
        '/onboarding',
        {
          nombre: draft.nombre.trim(),
          region: draft.region,
          comuna: draft.comuna.trim(),
          direccion: draft.direccion.trim(),
          cantidadPersonas: Number(draft.cantidadPersonas),
        }
      )
      localStorage.removeItem(DRAFT_KEY)
      // Marcar el hogar recién creado como activo para que el dashboard cargue
      // sus datos apenas termine el onboarding.
      setActiveHogarId(hogar.id)
      setCompleted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <Zap className="size-6 text-amber-400" />
          <span className="text-xl font-bold tracking-tight">
            Energi<span className="text-amber-400">app</span>
          </span>
        </div>

        <Badge variant="outline" className="mb-6 mx-auto block">
          Bienvenido · Configura tu hogar
        </Badge>

        <div className="rounded-2xl border-border/60 bg-card p-6 shadow-xl">
          <h1 className="text-xl font-bold">{steps[step].title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{steps[step].description}</p>

          <div className="mt-6">{steps[step].render()}</div>

          {error && (
            <p className="mt-3 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="cursor-pointer gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Atrás
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canContinue}
                className="cursor-pointer gap-1.5"
              >
                Siguiente
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={finish}
                disabled={!canContinue || submitting}
                className="cursor-pointer gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold"
              >
                {submitting ? 'Guardando…' : 'Finalizar'}
                <Check className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Puntos de progreso */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-2.5 rounded-full transition-all',
                i === step
                  ? 'bg-amber-400 scale-125'
                  : i < step
                    ? 'bg-amber-500/40'
                    : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}