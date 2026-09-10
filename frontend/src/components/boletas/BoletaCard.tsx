import { useState } from 'react'
import {
  Receipt,
  FileText,
  Pencil,
  Trash2,
  Check,
  Loader2,
  ShieldAlert,
  Eye,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DatePicker from '../DatePicker'
import { cn } from '@/lib/utils'
import {
  emptyForm,
  inputCls,
  toForm,
  fmtCLP,
  fmtFecha,
  editarBoleta,
  eliminarBoleta,
  obtenerPdfUrl,
  type Boleta,
  type BoletaForm,
} from '@/lib/boletas'

// Tarjeta de una boleta del historial: muestra datos, permite editar (expandible),
// eliminar (con confirmación) y ver el PDF adjunto.
export default function BoletaCard({
  boleta,
  onChanged,
}: {
  boleta: Boleta
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<BoletaForm>(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardarEdicion() {
    setSavingEdit(true)
    setError(null)
    try {
      await editarBoleta(boleta.id, editForm)
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
      await eliminarBoleta(boleta.id)
      setConfirmingDelete(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  async function verPdf() {
    setError(null)
    try {
      const url = await obtenerPdfUrl(boleta.id)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el PDF')
    }
  }

  return (
    <Card className="bg-card/50 border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Receipt className="size-4 text-amber-400" />
          </div>
          <CardTitle className="text-sm">
            {boleta.empresaDistribuidora ?? 'Boleta'}
          </CardTitle>
          <Badge
            variant={boleta.tipoOrigen === 'PDF_AUTOMATICO' ? 'secondary' : 'outline'}
            className="ml-auto text-xs"
          >
            {boleta.tipoOrigen === 'PDF_AUTOMATICO' ? 'PDF' : 'Manual'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="mb-2 text-xs text-destructive bg-destructive/10 rounded-lg px-2 py-1">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <FileText className="size-3.5" />
            {fmtFecha(boleta.fechaInicioLectura)} → {fmtFecha(boleta.fechaFinLectura)}
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="size-3.5" />
            {boleta.consumoKwh} kWh
          </span>
          <span className="flex items-center gap-2">
            <Receipt className="size-3.5" />
            {fmtCLP(Number(boleta.montoTotal))}
          </span>
          {boleta.numeroCliente && (
            <span className="flex items-center gap-2">
              <ShieldAlert className="size-3.5" />
              Cliente {boleta.numeroCliente}
            </span>
          )}
        </div>

        {/* Edición expandible */}
        <div
          className={cn(
            'grid transition-all duration-300 mt-3',
            editing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="min-h-0 p-3 rounded-lg border-border/60 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Editar boleta
              </p>
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editForm.consumoKwh}
                  onChange={(e) => setEditForm({ ...editForm, consumoKwh: e.target.value })}
                  placeholder="Consumo (kWh)"
                  className={inputCls}
                />
                <input
                  type="number"
                  step="0.01"
                  value={editForm.montoTotal}
                  onChange={(e) => setEditForm({ ...editForm, montoTotal: e.target.value })}
                  placeholder="Monto total (CLP)"
                  className={inputCls}
                />
                <DatePicker
                  value={editForm.fechaInicioLectura}
                  onChange={(iso) => setEditForm({ ...editForm, fechaInicioLectura: iso })}
                  placeholder="Inicio de lectura"
                />
                <DatePicker
                  value={editForm.fechaFinLectura}
                  onChange={(iso) => setEditForm({ ...editForm, fechaFinLectura: iso })}
                  placeholder="Fin de lectura"
                />
                <input
                  value={editForm.empresaDistribuidora}
                  onChange={(e) => setEditForm({ ...editForm, empresaDistribuidora: e.target.value })}
                  placeholder="Empresa distribuidora"
                  className={inputCls}
                />
                <input
                  value={editForm.numeroCliente}
                  onChange={(e) => setEditForm({ ...editForm, numeroCliente: e.target.value })}
                  placeholder="Número de cliente"
                  className={inputCls}
                />
                <DatePicker
                  value={editForm.fechaEmision}
                  onChange={(iso) => setEditForm({ ...editForm, fechaEmision: iso })}
                  placeholder="Fecha de emisión"
                />
              </div>
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

        {/* Confirmación de borrado */}
        {confirmingDelete && (
          <div className="mt-3 p-3 rounded-lg border-destructive/40 bg-destructive/10">
            <p className="text-xs text-destructive font-medium">
              ¿Eliminar esta boleta? Esta acción no se puede deshacer.
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
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : 'Eliminar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Acciones */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/40">
        {boleta.pdfUrl && (
          <Button
            size="sm"
            variant="ghost"
            onClick={verPdf}
            className="cursor-pointer gap-1.5"
          >
            <Eye className="size-3.5" />
            Ver PDF
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(true)
            setEditForm(toForm(boleta))
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
      </div>
    </Card>
  )
}