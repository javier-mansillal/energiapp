import { useState } from 'react'
import { Check, Loader2, Pencil, Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ElectroFormFields from './ElectroFormFields'
import { cn } from '@/lib/utils'
import {
  crearElectrodomestico,
  emptyElectroForm,
  type CatalogoItem,
  type ElectroForm,
} from '@/lib/electrodomesticos'

type Modo = 'catalogo' | 'manual'

// Card "Agregar electrodoméstico": permite cargarlo desde el catálogo o
// manualmente. En ambos casos los valores quedan editables antes de guardar.
export default function ElectrodomesticoFormCard({
  hogarId,
  catalogo,
  onCreated,
  onClose,
}: {
  hogarId: string
  catalogo: CatalogoItem[]
  onCreated: () => void
  onClose: () => void
}) {
  const [modo, setModo] = useState<Modo>('catalogo')
  const [form, setForm] = useState<ElectroForm>(emptyElectroForm)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    // Al pasar a manual se desvincula del catálogo (pero se conservan los valores).
    if (nuevo === 'manual') setForm({ ...form, catalogoId: null })
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      const catalogoId = modo === 'catalogo' ? form.catalogoId : null
      await crearElectrodomestico(hogarId, { ...form, catalogoId })
      setForm(emptyElectroForm)
      setModo('catalogo')
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const puedeGuardar =
    !guardando &&
    form.potenciaW.trim() !== '' &&
    form.horasUsoDiario.trim() !== '' &&
    (modo === 'manual' ? form.nombre.trim() !== '' : form.catalogoId !== null)

  return (
    <Card className="mb-6 bg-card/50 border-border/60">
      <CardHeader>
        <CardTitle>Agregar electrodoméstico</CardTitle>
        <CardDescription>
          Elígelo del catálogo para prellenar sus valores, o ingrésalo manualmente.
          Puedes ajustar cualquier dato antes de guardar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Selector de modo */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={modo === 'catalogo' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => cambiarModo('catalogo')}
            className={cn(
              'cursor-pointer gap-1.5',
              modo === 'catalogo' ? 'border-amber-500/40 bg-amber-500/15 text-amber-400' : ''
            )}
          >
            <Sparkles className="size-3.5" />
            Del catálogo
          </Button>
          <Button
            variant={modo === 'manual' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => cambiarModo('manual')}
            className={cn(
              'cursor-pointer gap-1.5',
              modo === 'manual' ? 'border-amber-500/40 bg-amber-500/15 text-amber-400' : ''
            )}
          >
            <Pencil className="size-3.5" />
            Manual
          </Button>
        </div>

        <ElectroFormFields
          form={form}
          setForm={setForm}
          catalogo={catalogo}
          mostrarCatalogo={modo === 'catalogo'}
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={guardando}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={guardar}
            disabled={!puedeGuardar}
            className="cursor-pointer gap-1.5 bg-amber-500 font-semibold text-amber-950 hover:bg-amber-400"
          >
            {guardando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
