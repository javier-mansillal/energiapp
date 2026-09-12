import { useEffect, useState } from 'react'
import { Lightbulb, Loader2, Sparkles } from 'lucide-react'
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
import RecomendacionCard from '@/components/recomendaciones/RecomendacionCard'
import { getActiveHogarId } from '@/lib/activeHogar'
import { fmtKwh } from '@/lib/dashboard'
import {
  listarRecomendaciones,
  cambiarEstadoRecomendacion,
  CATEGORIA_INFO,
  type CategoriaRecomendacion,
  type EstadoRecomendacion,
  type RespuestaRecomendaciones,
} from '@/lib/recomendaciones'
import { cn } from '@/lib/utils'

type Filtro = 'TODAS' | CategoriaRecomendacion

const FILTROS: { valor: Filtro; label: string }[] = [
  { valor: 'TODAS', label: 'Todas' },
  { valor: 'VAMPIRO', label: CATEGORIA_INFO.VAMPIRO.label },
  { valor: 'COMPARATIVA', label: CATEGORIA_INFO.COMPARATIVA.label },
  { valor: 'USO_EFICIENTE', label: CATEGORIA_INFO.USO_EFICIENTE.label },
]

export default function Recomendaciones() {
  const hogarIdInicial = getActiveHogarId()
  const [hogarId] = useState<string | null>(hogarIdInicial)
  const [data, setData] = useState<RespuestaRecomendaciones | null>(null)
  const [loading, setLoading] = useState(Boolean(hogarIdInicial))
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('TODAS')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function refresh() {
    if (!hogarId) return
    try {
      setData(await listarRecomendaciones(hogarId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las recomendaciones')
    }
  }

  useEffect(() => {
    if (!hogarId) return
    let mounted = true
    listarRecomendaciones(hogarId)
      .then((d) => {
        if (mounted) setData(d)
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar las recomendaciones')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [hogarId])

  async function cambiarEstado(id: string, estado: EstadoRecomendacion) {
    setUpdatingId(id)
    setError(null)
    try {
      await cambiarEstadoRecomendacion(id, estado)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la recomendación')
    } finally {
      setUpdatingId(null)
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

  const recomendaciones = data?.recomendaciones ?? []
  const visibles = recomendaciones.filter(
    (r) => filtro === 'TODAS' || r.categoria === filtro
  )
  const pendientes = visibles.filter((r) => r.estado === 'PENDIENTE')
  const historial = visibles.filter((r) => r.estado !== 'PENDIENTE')

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Lightbulb className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recomendaciones</h1>
          <p className="text-sm text-muted-foreground">
            Consejos para ahorrar energía según tus datos.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {!hogarId && (
        <Card className="bg-card/50 border-border/60">
          <CardHeader>
            <CardTitle>Sin hogar activo</CardTitle>
            <CardDescription>
              Elige o crea un hogar para ver sus recomendaciones.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {hogarId && (
        <>
          {/* Resumen de ahorro potencial */}
          {data && data.nPendientes > 0 && (
            <Card className="mb-6 bg-card/50 border-border/60">
              <CardContent className="flex flex-wrap items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Sparkles className="size-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Ahorro potencial aplicando tus recomendaciones pendientes
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {fmtKwh(data.ahorroPotencialKwh)} al mes
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {data.nPendientes}{' '}
                  {data.nPendientes === 1 ? 'recomendación' : 'recomendaciones'}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Filtros por categoría */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {FILTROS.map((f) => (
              <Button
                key={f.valor}
                size="sm"
                variant={filtro === f.valor ? 'default' : 'outline'}
                onClick={() => setFiltro(f.valor)}
                className={cn(
                  'cursor-pointer',
                  filtro === f.valor &&
                    'bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold'
                )}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {recomendaciones.length === 0 ? (
            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle>Sin recomendaciones por ahora</CardTitle>
                <CardDescription>
                  Sube boletas y registra electrodomésticos para que Energiapp
                  pueda sugerirte formas de ahorrar.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {/* Pendientes */}
              <h2 className="text-lg font-semibold">Pendientes</h2>
              {pendientes.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay recomendaciones pendientes en esta categoría.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendientes.map((r) => (
                    <RecomendacionCard
                      key={r.id}
                      recomendacion={r}
                      updating={updatingId === r.id}
                      onCambiarEstado={cambiarEstado}
                    />
                  ))}
                </div>
              )}

              {/* Historial */}
              {historial.length > 0 && (
                <>
                  <h2 className="mt-8 text-lg font-semibold">Historial</h2>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {historial.map((r) => (
                      <RecomendacionCard
                        key={r.id}
                        recomendacion={r}
                        updating={updatingId === r.id}
                        onCambiarEstado={cambiarEstado}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}