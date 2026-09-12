import { api } from '@/lib/api'

// Clase compartida para los inputs de formularios (mismo estilo que el resto).
export const inputCls =
  'w-full rounded-lg border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500/50'

// ── Tipos ──
export type CatalogoItem = {
  id: string
  nombre: string
  categoria: string
  potenciaPromedioWatts: number
  consumoVampiroW: number
}

export type Electrodomestico = {
  id: string
  hogarId: string
  catalogoId: string | null
  catalogoNombre: string | null
  categoria: string | null
  nombre: string
  potenciaW: number
  consumoVampiroW: number
  horasUsoDiario: number
  cantidad: number
  esActivo: boolean
  fechaAlta: string
  fechaBaja: string | null
}

// Formulario: los números van como string para poder editarlos cómodo.
// catalogoId null = agregado manualmente.
export type ElectroForm = {
  catalogoId: string | null
  nombre: string
  potenciaW: string
  consumoVampiroW: string
  horasUsoDiario: string
  cantidad: string
}

export const emptyElectroForm: ElectroForm = {
  catalogoId: null,
  nombre: '',
  potenciaW: '',
  consumoVampiroW: '0',
  horasUsoDiario: '',
  cantidad: '1',
}

export function toElectroForm(e: Electrodomestico): ElectroForm {
  return {
    catalogoId: e.catalogoId,
    nombre: e.nombre,
    potenciaW: String(e.potenciaW),
    consumoVampiroW: String(e.consumoVampiroW),
    horasUsoDiario: String(e.horasUsoDiario),
    cantidad: String(e.cantidad),
  }
}

// Consumo estimado del electrodoméstico, en kWh, para `dias` días (30 = mes).
// Suma el consumo en uso más el consumo vampiro de las horas en que está
// apagado pero enchufado.
export function consumoMensualKwh(
  e: Pick<
    Electrodomestico,
    'potenciaW' | 'consumoVampiroW' | 'horasUsoDiario' | 'cantidad'
  >,
  dias = 30
): number {
  const horasUso = Math.min(24, Math.max(0, Number(e.horasUsoDiario)))
  const horasEspera = Math.max(0, 24 - horasUso)
  const whDia =
    Number(e.potenciaW) * horasUso + Number(e.consumoVampiroW) * horasEspera
  return (whDia * Number(e.cantidad) * dias) / 1000
}

// ── API ──
export async function listarCatalogo(): Promise<CatalogoItem[]> {
  return api.get<CatalogoItem[]>('/electrodomesticos/catalogo')
}

export async function listarElectrodomesticos(
  hogarId: string,
  incluirInactivos = false
): Promise<Electrodomestico[]> {
  const extra = incluirInactivos ? '&incluirInactivos=true' : ''
  return api.get<Electrodomestico[]>(
    `/electrodomesticos?hogarId=${hogarId}${extra}`
  )
}

export async function crearElectrodomestico(
  hogarId: string,
  form: ElectroForm
): Promise<Electrodomestico> {
  return api.post<Electrodomestico>('/electrodomesticos', {
    hogarId,
    catalogoId: form.catalogoId,
    nombrePersonalizado: form.nombre,
    potenciaW: Number(form.potenciaW),
    consumoVampiroW: Number(form.consumoVampiroW),
    horasUsoDiario: Number(form.horasUsoDiario),
    cantidad: Number(form.cantidad),
  })
}

export async function editarElectrodomestico(
  id: string,
  form: ElectroForm
): Promise<Electrodomestico> {
  return api.patch<Electrodomestico>(`/electrodomesticos/${id}`, {
    nombrePersonalizado: form.nombre,
    potenciaW: Number(form.potenciaW),
    consumoVampiroW: Number(form.consumoVampiroW),
    horasUsoDiario: Number(form.horasUsoDiario),
    cantidad: Number(form.cantidad),
  })
}

export async function eliminarElectrodomestico(id: string): Promise<void> {
  await api.del(`/electrodomesticos/${id}`)
}

// Reactiva un electrodoméstico dado de baja: esActivo = true y limpia fechaBaja.
export async function reactivarElectrodomestico(
  id: string
): Promise<Electrodomestico> {
  return api.patch<Electrodomestico>(`/electrodomesticos/${id}`, {
    esActivo: true,
  })
}
