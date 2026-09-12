import { useState } from 'react'
import {
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  Gauge,
  Hash,
  Loader2,
  Pencil,
  Refrigerator,
  RefreshCw,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ElectroFormFields from './ElectroFormFields'
import { cn } from '@/lib/utils'
import { fmtFecha } from '@/lib/boletas'
import {
  consumoMensualKwh,
  editarElectrodomestico,
  eliminarElectrodomestico,
  reactivarElectrodomestico,
  toElectroForm,
  type CatalogoItem,
  type ElectroForm,
  type Electrodomestico,
} from '@/lib/electrodomesticos'

function fmtKwh(n: number): string {
  return `${n.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kWh`
}

// Tarjeta de un electrodoméstico: muestra sus datos y consumo estimado, y
// permite editar sus valores o darlo de baja.
export default function ElectrodomesticoCard({
  electrodomestico,
  catalogo,
  onChanged,
}: {
  electrodomestico: Electrodomestico
  catalogo: CatalogoItem[]
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<ElectroForm>(() =>
    toElectroForm(electrodomestico)
  )
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reactivando, setReactivando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const consumo = consumoMensualKwh(electrodomestico)

  async function guardarEdicion() {
    setSavingEdit(true)
    setError(null)
    try {
      await editarElectrodomestico(electrodomestico.id, editForm)
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingEdit(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    setError(null)
    try {
      await eliminarElectrodomestico(electrodomestico.id)
      setConfirmingDelete(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  async function reactivar() {
    setReactivando(true)
    setError(null)
    try {
      await reactivarElectrodomestico(electrodomestico.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reactivar')
    } finally {
      setReactivando(false)
    }
  }

  return (
    <Card className="bg-card/50 border-border/60">
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Refrigerator className="size-4 text-amber-400" />
          </div>
          <CardTitle className="min-w-0 text-sm">
            {electrodomestico.nombre}
          </CardTitle>
          {!electrodomestico.esActivo && (
            <Badge variant="destructive" className="shrink-0 text-xs">
              Inactivo
            </Badge>
          )}
          <Badge
            variant={electrodomestico.catalogoId ? 'secondary' : 'outline'}
            className="ml-auto shrink-0 text-xs"
          >
            {electrodomestico.catalogoId ? 'Catálogo' : 'Manual'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="mb-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          {electrodomestico.categoria && (
            <span className="flex items-center gap-2">
              <Tag className="size-3.5" />
              {electrodomestico.categoria}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Zap className="size-3.5" />
            {electrodomestico.potenciaW} W
            {electrodomestico.consumoVampiroW > 0 && (
              <span className="text-xs">
                (+{electrodomestico.consumoVampiroW} W en espera)
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="size-3.5" />
            {electrodomestico.horasUsoDiario} h/día
          </span>
          {electrodomestico.cantidad > 1 && (
            <span className="flex items-center gap-2">
              <Hash className="size-3.5" />
              {electrodomestico.cantidad} unidades
            </span>
          )}
          <span className="flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            Alta: {fmtFecha(electrodomestico.fechaAlta)}
          </span>
          {!electrodomestico.esActivo && electrodomestico.fechaBaja && (
            <span className="flex items-center gap-2">
              <CalendarOff className="size-3.5" />
              Baja: {fmtFecha(electrodomestico.fechaBaja)}
            </span>
          )}
          <span className="flex items-center gap-2 font-medium text-amber-400">
            <Gauge className="size-3.5" />
            {fmtKwh(consumo)} al mes (estimado)
          </span>
        </div>

        {/* Edición expandible */}
        <div
          className={cn(
            'grid transition-all duration-300 mt-3',
            editing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="min-h-0 rounded-lg border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Editar electrodoméstico
              </p>
              <ElectroFormFields
                form={editForm}
                setForm={setEditForm}
                catalogo={catalogo}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={guardarEdicion}
                  disabled={savingEdit}
                  className="cursor-pointer gap-1.5"
                >
                  <Check className="size-3.5" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmación de baja */}
        {confirmingDelete && (
          <div className="mt-3 rounded-lg border-destructive/40 bg-destructive/10 p-3">
            <p className="text-xs font-medium text-destructive">
              ¿Eliminar este electrodoméstico del hogar?
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={deleting}
                className="cursor-pointer"
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 px-4 py-2.5">
        {!electrodomestico.esActivo ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={reactivar}
            disabled={reactivando}
            className="cursor-pointer gap-1.5 text-emerald-500"
          >
            {reactivando ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Reactivar
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(true)
                setEditForm(toElectroForm(electrodomestico))
              }}
              className="cursor-pointer gap-1.5"
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="cursor-pointer gap-1.5 text-destructive"
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
