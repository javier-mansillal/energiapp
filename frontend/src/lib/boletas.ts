import { api } from '@/lib/api'

// ── Tipos ──
export type Boleta = {
  id: string
  hogarId: string
  consumoKwh: number
  montoTotal: number
  fechaInicioLectura: string
  fechaFinLectura: string
  empresaDistribuidora: string | null
  numeroCliente: string | null
  fechaEmision: string | null
  tipoOrigen: 'MANUAL' | 'PDF_AUTOMATICO'
  pdfUrl: string | null
}

export type BoletaExtraida = {
  empresaDistribuidora?: string
  numeroCliente?: string
  fechaEmision?: string
  fechaInicioLectura?: string
  fechaFinLectura?: string
  consumoKwh?: number
  montoTotal?: number
  confianza: 'alta' | 'media' | 'baja'
  camposFaltantes: string[]
}

export type ResultadoAnalisis = {
  datos: BoletaExtraida
  texto: string
  distribuidoraDetectada: string | null
}

export type BoletaForm = {
  consumoKwh: string
  montoTotal: string
  // Mes de la boleta en formato 'YYYY-MM'. El backend lo expande al primer y
  // último día del mes.
  mes: string
  empresaDistribuidora: string
  numeroCliente: string
  fechaEmision: string
}

export const emptyForm: BoletaForm = {
  consumoKwh: '',
  montoTotal: '',
  mes: '',
  empresaDistribuidora: '',
  numeroCliente: '',
  fechaEmision: '',
}

export function toForm(b: Boleta): BoletaForm {
  return {
    consumoKwh: String(b.consumoKwh),
    montoTotal: String(b.montoTotal),
    mes: b.fechaFinLectura.slice(0, 7),
    empresaDistribuidora: b.empresaDistribuidora ?? '',
    numeroCliente: b.numeroCliente ?? '',
    fechaEmision: b.fechaEmision ? b.fechaEmision.slice(0, 10) : '',
  }
}

// Clase compartida para los inputs de los formularios de boletas.
export const inputCls =
  'w-full rounded-lg border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500/50'

// ── Helpers de formato ──
export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function fmtCLP(n: number | string): string {
  return `$ ${Number(n).toLocaleString('es-CL')} CLP`
}

export function fmtFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Agrupa boletas por mes (según fechaFinLectura), ordenadas de más reciente a más antigua.
export function agruparPorMes(
  boletas: Boleta[]
): { key: string; label: string; items: Boleta[] }[] {
  const grupos: { key: string; label: string; items: Boleta[] }[] = []
  for (const b of boletas) {
    const d = new Date(b.fechaFinLectura)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = `${MESES[d.getMonth()]} ${d.getFullYear()}`
    let g = grupos.find((x) => x.key === key)
    if (!g) {
      g = { key, label, items: [] }
      grupos.push(g)
    }
    g.items.push(b)
  }
  return grupos
}

// ── API ──
export async function listarBoletas(hogarId: string): Promise<Boleta[]> {
  const data = await api.get<Boleta[]>(`/boletas?hogarId=${hogarId}`)
  // Prisma devuelve los campos Decimal (consumoKwh, montoTotal) como string;
  // los normalizamos a número para que las sumas y formatos funcionen bien.
  return data.map((b) => ({
    ...b,
    consumoKwh: Number(b.consumoKwh),
    montoTotal: Number(b.montoTotal),
  }))
}

export async function analizarPdf(pdf: File): Promise<ResultadoAnalisis> {
  const fd = new FormData()
  fd.append('pdf', pdf)
  return api.postForm<ResultadoAnalisis>('/boletas/analizar', fd)
}

export async function crearBoleta(
  hogarId: string,
  form: BoletaForm,
  pdf: File | null
): Promise<void> {
  const fd = new FormData()
  fd.append('hogarId', hogarId)
  fd.append('consumoKwh', form.consumoKwh)
  fd.append('montoTotal', form.montoTotal)
  fd.append('mes', form.mes)
  fd.append('empresaDistribuidora', form.empresaDistribuidora)
  fd.append('numeroCliente', form.numeroCliente)
  if (form.fechaEmision) fd.append('fechaEmision', form.fechaEmision)
  if (pdf) fd.append('pdf', pdf)
  await api.postForm('/boletas', fd)
}

export async function editarBoleta(id: string, form: BoletaForm): Promise<void> {
  await api.patch(`/boletas/${id}`, {
    consumoKwh: form.consumoKwh,
    montoTotal: form.montoTotal,
    mes: form.mes,
    empresaDistribuidora: form.empresaDistribuidora,
    numeroCliente: form.numeroCliente,
    fechaEmision: form.fechaEmision || null,
  })
}

export async function eliminarBoleta(id: string): Promise<void> {
  await api.del(`/boletas/${id}`)
}

export async function obtenerPdfUrl(id: string): Promise<string> {
  const { signedURL } = await api.get<{ signedURL: string }>(`/boletas/${id}/pdf`)
  return signedURL
}