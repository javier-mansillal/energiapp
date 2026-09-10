import { useEffect, useState } from 'react'
import { Gauge, Loader2, Plus, Refrigerator, X } from 'lucide-react'
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

  async function refresh() {
    if (!hogarId) return
    try {
      setElectrodomesticos(await listarElectrodomesticos(hogarId))
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
      listarElectrodomesticos(hogarId),
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
  }, [hogarId])

  const totalMensual = electrodomesticos.reduce(
    (acc, e) => acc + consumoMensualKwh(e),
    0
  )

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
      <div className="mb-6 flex items-center gap-3">
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
          <Button
            onClick={() => {
              setAgregando((v) => !v)
              setError(null)
            }}
            className="ml-auto cursor-pointer gap-1.5 bg-amber-500 font-semibold text-amber-950 hover:bg-amber-400"
          >
            {agregando ? <X className="size-4" /> : <Plus className="size-4" />}
            {agregando ? 'Cerrar' : 'Agregar'}
          </Button>
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
          {electrodomesticos.length > 0 && (
            <Card className="mb-6 bg-card/50 border-border/60">
              <CardContent className="flex items-center gap-4">
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
                  {electrodomesticos.length}{' '}
                  {electrodomesticos.length === 1 ? 'aparato' : 'aparatos'}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {electrodomesticos.map((e) => (
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
    </AppLayout>
  )
}
