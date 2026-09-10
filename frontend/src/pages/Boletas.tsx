import { useEffect, useState } from 'react'
import { Receipt, Loader2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import BoletaFormCard from '../components/boletas/BoletaFormCard'
import BoletaCard from '../components/boletas/BoletaCard'
import { getActiveHogarId } from '@/lib/activeHogar'
import { listarBoletas, agruparPorMes, type Boleta } from '@/lib/boletas'

export default function Boletas() {
  const [hogarId] = useState<string | null>(getActiveHogarId())
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!hogarId) return
    try {
      const data = await listarBoletas(hogarId)
      setBoletas(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar boletas')
    }
  }

  useEffect(() => {
    if (!hogarId) {
      // Sin hogar activo no hay nada que cargar.
      return
    }
    let mounted = true
    listarBoletas(hogarId)
      .then((data) => {
        if (mounted) setBoletas(data)
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Error al cargar boletas')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [hogarId])

  const grupos = agruparPorMes(boletas)

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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Receipt className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boletas</h1>
          <p className="text-sm text-muted-foreground">
            Sube y consulta tus boletas eléctricas.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Subir boleta ── */}
      {hogarId && <BoletaFormCard hogarId={hogarId} onCreated={refresh} />}

      {/* ── Historial ── */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Historial</h2>
        {boletas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aún no has subido boletas para este hogar.
          </p>
        ) : (
          grupos.map((g) => (
            <div key={g.key} className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {g.label}
              </h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.items.map((b) => (
                  <BoletaCard key={b.id} boleta={b} onChanged={refresh} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  )
}