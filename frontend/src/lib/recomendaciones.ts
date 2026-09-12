import { api } from './api'

export type CategoriaRecomendacion = 'VAMPIRO' | 'COMPARATIVA' | 'USO_EFICIENTE'
export type ImpactoRecomendacion = 'ALTO' | 'MEDIO' | 'BAJO'
export type EstadoRecomendacion = 'PENDIENTE' | 'APLICADA' | 'IGNORADA'

export interface Recomendacion {
  id: string
  hogarId: string
  catalogoId: string | null
  codigoRegla: string | null
  categoria: CategoriaRecomendacion | null
  impactoEstimado: ImpactoRecomendacion | null
  titulo: string
  descripcion: string
  ahorroEstimadoKwh: number
  estado: EstadoRecomendacion
  fechaGeneracion: string
  fechaRespuesta: string | null
}

export interface RespuestaRecomendaciones {
  recomendaciones: Recomendacion[]
  ahorroPotencialKwh: number
  nPendientes: number
  nHistorial: number
}

export const CATEGORIA_INFO: Record<
  CategoriaRecomendacion,
  { label: string; descripcion: string }
> = {
  VAMPIRO: { label: 'Vampiro', descripcion: 'Consumo en espera de tus aparatos' },
  COMPARATIVA: { label: 'Comparativa', descripcion: 'Tu consumo frente a referencias' },
  USO_EFICIENTE: { label: 'Uso eficiente', descripcion: 'Hábitos y mantenimiento' },
}

export const IMPACTO_INFO: Record<ImpactoRecomendacion, { label: string }> = {
  ALTO: { label: 'Alto impacto' },
  MEDIO: { label: 'Impacto medio' },
  BAJO: { label: 'Impacto bajo' },
}

export async function listarRecomendaciones(
  hogarId: string
): Promise<RespuestaRecomendaciones> {
  return api.get(`/recomendaciones?hogarId=${encodeURIComponent(hogarId)}`)
}

export async function cambiarEstadoRecomendacion(
  id: string,
  estado: EstadoRecomendacion
): Promise<Recomendacion> {
  return api.patch(`/recomendaciones/${id}`, { estado })
}