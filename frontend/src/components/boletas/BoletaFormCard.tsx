import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Pencil,
  FileUp,
  FileText,
  Loader2,
  Sparkles,
  Check,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DatePicker from '../DatePicker'
import MonthPicker from '../MonthPicker'
import { cn } from '@/lib/utils'
import {
  emptyForm,
  inputCls,
  analizarPdf,
  crearBoleta,
  type BoletaForm,
  type ResultadoAnalisis,
} from '@/lib/boletas'

// Envoltura de un campo con su etiqueta (mismo patrón que el formulario de
// electrodomésticos): label arriba, control abajo.
function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

// Card "Subir boleta": formulario manual o análisis de PDF.
// Maneja su propio estado y avisa con onCreated cuando se guarda una boleta.
export default function BoletaFormCard({
  hogarId,
  onCreated,
}: {
  hogarId: string
  onCreated: () => void
}) {
  const [modo, setModo] = useState<'manual' | 'pdf'>('manual')
  const [form, setForm] = useState<BoletaForm>(emptyForm)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [analisis, setAnalisis] = useState<ResultadoAnalisis | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Input de archivo oculto: el botón "Elegir PDF" lo abre.
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function analizar() {
    if (!pdfFile) return
    setAnalizando(true)
    setError(null)
    try {
      const res = await analizarPdf(pdfFile)
      setAnalisis(res)
      // Rellenar el formulario con los datos extraídos
      const d = res.datos
      setForm({
        consumoKwh: d.consumoKwh !== undefined ? String(d.consumoKwh) : '',
        montoTotal: d.montoTotal !== undefined ? String(d.montoTotal) : '',
        // El período se reduce a su mes; el backend arma el rango de días.
        mes: (d.fechaFinLectura ?? d.fechaInicioLectura ?? '').slice(0, 7),
        empresaDistribuidora: d.empresaDistribuidora ?? '',
        numeroCliente: d.numeroCliente ?? '',
        fechaEmision: d.fechaEmision ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar el PDF')
    } finally {
      setAnalizando(false)
    }
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await crearBoleta(hogarId, form, pdfFile)
      setForm(emptyForm)
      setPdfFile(null)
      setAnalisis(null)
      setModo('manual')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la boleta')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="bg-card/50 border-border/60">
      <CardHeader>
        <CardTitle>Subir boleta</CardTitle>
        <CardDescription>
          Ingresa los datos manualmente o sube un PDF para que los rellenemos por ti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Selector de modo */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={modo === 'manual' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setModo('manual')}
            className={cn(
              'cursor-pointer gap-1.5',
              modo === 'manual'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : ''
            )}
          >
            <Pencil className="size-3.5" />
            Manual
          </Button>
          <Button
            variant={modo === 'pdf' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setModo('pdf')}
            className={cn(
              'cursor-pointer gap-1.5',
              modo === 'pdf'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                : ''
            )}
          >
            <FileUp className="size-3.5" />
            Subir PDF
          </Button>
        </div>

        {/* Modo PDF: elegir archivo + analizar */}
        {modo === 'pdf' && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setPdfFile(f)
                setAnalisis(null)
                // Permite volver a elegir el mismo archivo.
                e.target.value = ''
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer gap-1.5"
            >
              <FileUp className="size-3.5" />
              {pdfFile ? 'Cambiar PDF' : 'Elegir PDF'}
            </Button>
            {pdfFile && (
              <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="size-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{pdfFile.name}</span>
              </span>
            )}
            <Button
              size="sm"
              onClick={analizar}
              disabled={!pdfFile || analizando}
              className="cursor-pointer gap-1.5"
            >
              {analizando ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Analizar PDF
            </Button>
          </div>
        )}

        {/* Resultado del análisis */}
        {analisis && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <Sparkles className="size-4 text-amber-400 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {analisis.distribuidoraDetectada
                  ? `Detectamos ${analisis.distribuidoraDetectada}`
                  : 'No pudimos detectar la distribuidora'}
              </p>
              <p className="mt-1 text-muted-foreground">
                Rellenamos los datos abajo. Revisa y corrige lo que necesites antes de guardar.
              </p>
              {analisis.datos.confianza === 'baja' && (
                <p className="mt-1 text-xs text-amber-400">
                  Confianza baja: verifica los datos con cuidado.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Campo label="Consumo (kWh)">
            <input
              type="number"
              step="0.01"
              value={form.consumoKwh}
              onChange={(e) => setForm({ ...form, consumoKwh: e.target.value })}
              placeholder="Ej: 245.5"
              className={inputCls}
            />
          </Campo>
          <Campo label="Monto total (CLP)">
            <input
              type="number"
              step="0.01"
              value={form.montoTotal}
              onChange={(e) => setForm({ ...form, montoTotal: e.target.value })}
              placeholder="Ej: 123500"
              className={inputCls}
            />
          </Campo>
          <Campo label="Mes de la boleta">
            <MonthPicker
              value={form.mes}
              onChange={(mes) => setForm({ ...form, mes })}
            />
          </Campo>
          <Campo label="Fecha de emisión (opcional)">
            <DatePicker
              value={form.fechaEmision}
              onChange={(iso) => setForm({ ...form, fechaEmision: iso })}
            />
          </Campo>
          <Campo label="Empresa distribuidora (opcional)">
            <input
              value={form.empresaDistribuidora}
              onChange={(e) =>
                setForm({ ...form, empresaDistribuidora: e.target.value })
              }
              placeholder="Ej: Chilquinta Energía"
              className={inputCls}
            />
          </Campo>
          <Campo label="Número de cliente (opcional)">
            <input
              value={form.numeroCliente}
              onChange={(e) =>
                setForm({ ...form, numeroCliente: e.target.value })
              }
              placeholder="Ej: 123456789"
              className={inputCls}
            />
          </Campo>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={guardar}
            disabled={guardando || !form.consumoKwh || !form.montoTotal || !form.mes}
            className="cursor-pointer gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold"
          >
            {guardando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Guardar boleta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}