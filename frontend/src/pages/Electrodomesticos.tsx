import { useEffect, useState } from 'react'
import { Archive, Gauge, Loader2, Plus, Refrigerator, X } from 'lucide-react'
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
import ElectrodomesticoFormCard from '@/components/electrodomesticos/ElectrodomesticoFormCard'
import ElectrodomesticoCard from '@/components/electrodomesticos/ElectrodomesticoCard'
import { getActiveHogarId } from '@/lib/activeHogar'
import {
  consumoMensualKwh,
  listarCatalogo,
  listarElectrodomesticos,
  type CatalogoItem,
  type Electrodomestico,
} from '@/lib/electrodomesticos'
import { cn } from '@/lib/utils'

function fmtKwh(n: number): string {
  return `${n.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kWh`
}

export default function Electrodomesticos() {
  const hogarIdInicial = getActiveHogarId()
  const [hogarId] = useState<string | null>(hogarIdInicial)
  const [electrodomesticos, setElectrodomesticos] = useState<Electrodomestico[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  // Sin hogar activo no hay nada que cargar.
  const [loading, setLoading] = useState(Boolean(hogarIdInicial))
  const [error, setError] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [verInactivos, setVerInactivos] = useState(false)

  async function refresh() {
    if (!hogarId) return
    try {
      setElectrodomesticos(await listarElectrodomesticos(hogarId, verInactivos))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar los electrodomésticos'
      )
    }
  }

  useEffect(() => {
    if (!hogarId) return
    let mounted = true
    Promise.all([
      listarElectrodomesticos(hogarId, verInactivos),
      // El catálogo es accesorio: si falla, el formulario cae a modo manual.
      listarCatalogo().catch(() => [] as CatalogoItem[]),
    ])
      .then(([electros, cat]) => {
        if (!mounted) return
        setElectrodomesticos(electros)
        setCatalogo(cat)
      })
      .catch((err) => {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar los electrodomésticos'
          )
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [hogarId, verInactivos])

  const activos = electrodomesticos.filter((e) => e.esActivo)
  const inactivos = electrodomesticos.filter((e) => !e.esActivo)
  const totalMensual = activos.reduce((acc, e) => acc + consumoMensualKwh(e), 0)

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Refrigerator className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Electrodomésticos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los aparatos de tu hogar y estima cuánto consumen.
          </p>
        </div>
        {hogarId && (
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant={verInactivos ? 'default' : 'outline'}
              onClick={() => setVerInactivos((v) => !v)}
              className={cn(
                'cursor-pointer gap-1.5',
                verInactivos &&
                  'bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold'
              )}
            >
              <Archive className="size-4" />
              Ver inactivos
            </Button>
            <Button
              onClick={() => {
                setAgregando((v) => !v)
                setError(null)
              }}
              className="cursor-pointer gap-1.5 bg-amber-500 font-semibold text-amber-950 hover:bg-amber-400"
            >
              {agregando ? <X className="size-4" /> : <Plus className="size-4" />}
              {agregando ? 'Cerrar' : 'Agregar'}
            </Button>
          </div>
        )}
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
              Elige o crea un hogar para gestionar sus electrodomésticos.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {hogarId && (
        <>
          {/* Resumen */}
          {activos.length > 0 && (
            <Card className="mb-6 bg-card/50 border-border/60">
              <CardContent className="flex flex-wrap items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Gauge className="size-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Consumo estimado de tus aparatos
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {fmtKwh(totalMensual)} al mes
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {activos.length}{' '}
                  {activos.length === 1 ? 'aparato' : 'aparatos'}
                </Badge>
              </CardContent>
            </Card>
          )}

          {agregando && (
            <ElectrodomesticoFormCard
              hogarId={hogarId}
              catalogo={catalogo}
              onCreated={refresh}
              onClose={() => setAgregando(false)}
            />
          )}

          {/* Listado */}
          {electrodomesticos.length === 0 ? (
            <Card className="bg-card/50 border-border/60">
              <CardHeader>
                <CardTitle>Mis electrodomésticos</CardTitle>
                <CardDescription>
                  Aún no has registrado aparatos en este hogar. Usa el botón
                  «Agregar» de arriba para sumar el primero.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              {activos.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No tienes aparatos activos en este hogar.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activos.map((e) => (
                    <ElectrodomesticoCard
                      key={e.id}
                      electrodomestico={e}
                      catalogo={catalogo}
                      onChanged={refresh}
                    />
                  ))}
                </div>
              )}

              {verInactivos && (
                <>
                  <h2 className="mt-8 text-lg font-semibold">Inactivos</h2>
                  {inactivos.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay aparatos dados de baja.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {inactivos.map((e) => (
                        <ElectrodomesticoCard
                          key={e.id}
                          electrodomestico={e}
                          catalogo={catalogo}
                          onChanged={refresh}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </AppLayout>
  )
}
