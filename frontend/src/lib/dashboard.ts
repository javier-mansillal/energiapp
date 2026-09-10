import type { Boleta } from './boletas'
import { MESES } from './boletas'

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