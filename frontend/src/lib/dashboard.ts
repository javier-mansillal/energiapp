import type { Boleta } from './boletas'
import { MESES } from './boletas'
import type { Prediccion } from './prediccion'

// ── Tipos ──
// Un punto mensual agrega todas las boletas cuyo período de lectura termina
// en el mismo mes (fechaFinLectura).
export type PuntoMensual = {
  key: string // '2026-01' — para ordenar
  mes: string // 'Ene 26' — para el eje X
  mesLargo: string // 'Enero 2026' — para tooltips/lectura
  consumoKwh: number
  montoTotal: number
  tarifa: number // $/kWh efectivo del mes (monto / consumo)
  variacion: number | null // % vs mes anterior (null en el primer mes)
}

// Agrupa las boletas por mes (según fechaFinLectura), suma consumo y monto,
// y calcula la tarifa efectiva y la variación vs el mes anterior.
// Devuelve los meses ordenados de más antiguo a más reciente.
export function procesarBoletas(boletas: Boleta[]): PuntoMensual[] {
  const mapa = new Map<
    string,
    { mes: string; mesLargo: string; consumo: number; monto: number }
  >()

  for (const b of boletas) {
    const d = new Date(b.fechaFinLectura)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const e = mapa.get(key) ?? {
      mes: `${MESES[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`,
      mesLargo: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
      consumo: 0,
      monto: 0,
    }
    e.consumo += Number(b.consumoKwh)
    e.monto += Number(b.montoTotal)
    mapa.set(key, e)
  }

  const ordenado = [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  let anterior: number | null = null
  return ordenado.map(([key, e]) => {
    const variacion =
      anterior !== null && anterior > 0
        ? ((e.consumo - anterior) / anterior) * 100
        : null
    anterior = e.consumo
    return {
      key,
      mes: e.mes,
      mesLargo: e.mesLargo,
      consumoKwh: e.consumo,
      montoTotal: e.monto,
      tarifa: e.consumo > 0 ? e.monto / e.consumo : 0,
      variacion,
    }
  })
}

// KPIs del mes más reciente. Si no hay boletas, devuelve 0s.
export function kpis(puntos: PuntoMensual[]) {
  const ultimo = puntos[puntos.length - 1]
  return { consumo: ultimo?.consumoKwh ?? 0, costo: ultimo?.montoTotal ?? 0 }
}

// ── Formatos ──
export function fmtKwh(n: number | string): string {
  return `${Number(n).toLocaleString('es-CL')} kWh`
}

export function fmtTarifa(n: number | string): string {
  return `$ ${Number(n).toLocaleString('es-CL', { maximumFractionDigits: 1 })}/kWh`
}

// 'Junio 2026' a partir de una fecha ISO.
export function mesDe(iso: string): string {
  const d = new Date(iso)
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// '171–280 kWh' para mostrar un intervalo de consumo compacto.
export function fmtRangoKwh(inf: number, sup: number): string {
  return `${Number(inf).toLocaleString('es-CL')}–${Number(sup).toLocaleString('es-CL')} kWh`
}

// ── Datos de gráfico con proyección ──
// Series separadas para histórico y predicción: así Recharts dibuja la barra
// punteada solo en el período proyectado y no se mezcla con las barras llenas.
// Los valores nulos se omiten al dibujar.
export type PuntoGrafico = {
  key: string
  mes: string
  mesLargo: string
  consumoHistorico: number | null
  montoHistorico: number | null
  consumoProyectado: number | null
  consumoIntervalo: [number, number] | null
  montoProyectado: number | null
  montoIntervalo: [number, number] | null
  proyectado: boolean
}

// Convierte los puntos mensuales históricos en puntos de gráfico y agrega, si
// hay predicción, un punto proyectado con su intervalo de confianza.
export function conProyeccion(
  puntos: PuntoMensual[],
  prediccion: Prediccion | null
): PuntoGrafico[] {
  const historicos: PuntoGrafico[] = puntos.map((p) => ({
    key: p.key,
    mes: p.mes,
    mesLargo: p.mesLargo,
    consumoHistorico: p.consumoKwh,
    montoHistorico: p.montoTotal,
    consumoProyectado: null,
    consumoIntervalo: null,
    montoProyectado: null,
    montoIntervalo: null,
    proyectado: false,
  }))

  if (!prediccion) return historicos

  // Se etiqueta por el fin del período (igual que procesarBoletas agrupa las
  // boletas por fechaFinLectura), así el punto proyectado no repite el mes del
  // último histórico.
  const d = new Date(prediccion.periodoProyectadoFin)
  const mes = `${MESES[d.getMonth()].slice(0, 3)} ${String(d.getFullYear()).slice(2)}`
  const mesLargo = `${MESES[d.getMonth()]} ${d.getFullYear()}`

  return [
    ...historicos,
    {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      mes,
      mesLargo,
      consumoHistorico: null,
      montoHistorico: null,
      consumoProyectado: prediccion.consumoEstimadoKwh,
      consumoIntervalo: [
        prediccion.consumoEstimadoKwhInferior,
        prediccion.consumoEstimadoKwhSuperior,
      ],
      montoProyectado: prediccion.montoEstimado,
      montoIntervalo: [
        prediccion.montoEstimadoInferior,
        prediccion.montoEstimadoSuperior,
      ],
      proyectado: true,
    },
  ]
}