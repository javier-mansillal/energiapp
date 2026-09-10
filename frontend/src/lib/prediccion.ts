import { api } from '@/lib/api'

// Predicción del próximo período devuelta por el backend. Los campos Decimal
// ya llegan normalizados a number desde el servidor.
export type Prediccion = {
  id: string
  hogarId: string
  algoritmo: string
  consumoEstimadoKwh: number
  montoEstimado: number
  consumoEstimadoKwhInferior: number
  consumoEstimadoKwhSuperior: number
  montoEstimadoInferior: number
  montoEstimadoSuperior: number
  periodoProyectadoInicio: string
  periodoProyectadoFin: string
  fechaCalculo: string
}

// El backend distingue entre "hay predicción" e "insuficientes boletas".
export type ResultadoPrediccion =
  | { estado: 'ok'; nBoletas: number; prediccion: Prediccion }
  | { estado: 'insuficiente'; minimoBoletas: number; nBoletas: number }

export async function obtenerPrediccion(
  hogarId: string
): Promise<ResultadoPrediccion> {
  return api.get<ResultadoPrediccion>(`/prediccion?hogarId=${hogarId}`)
}
