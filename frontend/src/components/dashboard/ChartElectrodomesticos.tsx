import { Pie, PieChart, Cell } from 'recharts'
import type { TooltipPayloadEntry } from 'recharts'
import { Refrigerator } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { consumoMensualKwh, type Electrodomestico } from '@/lib/electrodomesticos'
import { fmtKwh } from '@/lib/dashboard'

type Color = { light: string; dark: string }

// Paleta categórica, legible tanto en tema claro como oscuro.
const PALETA: Color[] = [
  { light: '#d97706', dark: '#fbbf24' },
  { light: '#0d9488', dark: '#2dd4bf' },
  { light: '#2563eb', dark: '#60a5fa' },
  { light: '#7c3aed', dark: '#a78bfa' },
  { light: '#db2777', dark: '#f472b6' },
  { light: '#65a30d', dark: '#a3e635' },
  { light: '#c2410c', dark: '#fb923c' },
  { light: '#64748b', dark: '#94a3b8' },
]

// Máximo de aparatos con rebanada propia; el resto se agrupa en "Otros aparatos".
const MAX_REBANADAS = 6

// Donut con la participación estimada de cada electrodoméstico dentro del
// consumo total del mes. La rebanada "Otros consumos" es lo que no alcanza a
// explicar el consumo registrado en las boletas.
export default function ChartElectrodomesticos({
  electrodomesticos,
  consumoTotalKwh,
}: {
  electrodomesticos: Electrodomestico[]
  consumoTotalKwh: number
}) {
  const items = electrodomesticos
    .map((e) => ({ nombre: e.nombre, kwh: consumoMensualKwh(e) }))
    .filter((x) => x.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh)

  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="p-4 rounded-full bg-amber-500/10">
          <Refrigerator className="size-8 text-amber-400" />
        </div>
        <p className="text-sm font-medium">Sin electrodomésticos</p>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Cuando registres tus electrodomésticos, verás aquí su participación en
          el consumo total.
        </p>
      </div>
    )
  }

  const top = items.slice(0, MAX_REBANADAS)
  const resto = items.slice(MAX_REBANADAS)
  const otrosAparatos = resto.reduce((s, x) => s + x.kwh, 0)
  const sumaAparatos = items.reduce((s, x) => s + x.kwh, 0)
  const otrosConsumos = Math.max(0, consumoTotalKwh - sumaAparatos)

  const slices: { key: string; nombre: string; kwh: number; color: Color }[] =
    top.map((x, i) => ({
      key: `s${i}`,
      nombre: x.nombre,
      kwh: x.kwh,
      color: PALETA[i % PALETA.length],
    }))

  if (otrosAparatos > 0) {
    slices.push({
      key: 'otrosAparatos',
      nombre: `Otros aparatos (${resto.length})`,
      kwh: otrosAparatos,
      color: PALETA[6],
    })
  }
  if (otrosConsumos > 0) {
    slices.push({
      key: 'otrosConsumos',
      nombre: 'Otros consumos',
      kwh: otrosConsumos,
      color: PALETA[7],
    })
  }

  const total = slices.reduce((s, x) => s + x.kwh, 0)

  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [
      s.key,
      { label: s.nombre, theme: { light: s.color.light, dark: s.color.dark } },
    ])
  )

  const formatter = (
    value: unknown,
    _name: unknown,
    item: TooltipPayloadEntry
  ) => {
    const punto = item.payload as { nombre?: string } | undefined
    const kwh = Number(value)
    const pct = total > 0 ? (kwh / total) * 100 : 0
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground">{punto?.nombre}</span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {fmtKwh(kwh)}
        </span>
        <span className="text-xs text-muted-foreground">
          {pct.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% del total
        </span>
      </div>
    )
  }

  const excede = consumoTotalKwh > 0 && sumaAparatos > consumoTotalKwh

  return (
    <div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="relative w-40 shrink-0">
          <ChartContainer config={config} className="aspect-square w-40">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent hideLabel formatter={formatter} />
                }
              />
              <Pie
                data={slices}
                dataKey="kwh"
                nameKey="key"
                innerRadius={46}
                strokeWidth={3}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={`var(--color-${s.key})`} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[0.65rem] text-muted-foreground">Estimado</span>
            <span className="text-sm font-bold tabular-nums">
              {fmtKwh(total)}
            </span>
          </div>
        </div>

        {/* Leyenda */}
        <ul className="flex w-full flex-col gap-1 text-sm sm:w-auto sm:min-w-40">
          {slices.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: `var(--color-${s.key})` }}
              />
              <span className="truncate">{s.nombre}</span>
              <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                {fmtKwh(s.kwh)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {excede && (
        <p className="mt-3 text-xs text-muted-foreground">
          La suma de tus aparatos supera el consumo registrado en tus boletas.
          Revisa los valores de potencia u horas de uso.
        </p>
      )}

      {consumoTotalKwh <= 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Sube boletas para comparar estos consumos con el total de tu hogar.
        </p>
      )}
    </div>
  )
}
