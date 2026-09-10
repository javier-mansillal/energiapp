import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ErrorBar } from 'recharts'
import type { TooltipPayloadEntry } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { PuntoGrafico } from '@/lib/dashboard'

type ClaveHistorica = 'consumoHistorico' | 'montoHistorico'
type ClaveProyectada = 'consumoProyectado' | 'montoProyectado'
type ClaveIntervalo = 'consumoIntervalo' | 'montoIntervalo'

// Clave interna donde se dejan los offsets que espera el ErrorBar.
const RANGO_KEY = '__rango'

// Gráfico de barras mensual que suma la predicción del próximo período: una
// barra punteada y sin relleno, con su intervalo de confianza dibujado como
// bigotes. Comparte stackId con las barras históricas para quedar alineada en
// el mismo carril y no correrse al lado.
export default function ChartProyectado({
  data,
  config,
  colorVar,
  label,
  fmt,
  dataKeyHistorico,
  dataKeyProyectado,
  dataKeyIntervalo,
}: {
  data: PuntoGrafico[]
  config: ChartConfig
  colorVar: string
  label: string
  fmt: (v: number) => string
  dataKeyHistorico: ClaveHistorica
  dataKeyProyectado: ClaveProyectada
  dataKeyIntervalo: ClaveIntervalo
}) {
  // El tooltip agrega el rango estimado cuando el punto es la predicción.
  const formatter = (
    value: unknown,
    _name: unknown,
    item: TooltipPayloadEntry
  ) => {
    if (!Number.isFinite(Number(value))) return null

    const punto = item.payload as PuntoGrafico | undefined
    const esProyectado = String(item.dataKey) === dataKeyProyectado
    const rango = esProyectado ? punto?.[dataKeyIntervalo] ?? null : null

    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex w-full items-center gap-2">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-xs"
            style={{ backgroundColor: colorVar }}
          />
          <div className="flex flex-1 items-center gap-1.5">
            <span className="text-muted-foreground">
              {esProyectado ? `${label} (predicción)` : label}:
            </span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {fmt(Number(value))}
            </span>
          </div>
        </div>
        {rango && (
          <div className="flex w-full items-center gap-1.5 pl-4.5 text-xs text-muted-foreground">
            <span>Rango estimado:</span>
            <span className="font-mono tabular-nums">
              {fmt(rango[0])} – {fmt(rango[1])}
            </span>
          </div>
        )}
      </div>
    )
  }

  // recharts interpreta el array del ErrorBar como offsets RELATIVOS al valor
  // de la barra ([valor - offsetBajo, valor + offsetAlto]), no como límites
  // absolutos. Por eso acá se convierte el intervalo [inferior, superior] a
  // offsets; si se pasaran los límites tal cual, los bigotes quedarían
  // desplazados hacia abajo.
  const dataConRango = data.map((p) => {
    const valor = p[dataKeyProyectado]
    const intervalo = p[dataKeyIntervalo]
    return {
      ...p,
      [RANGO_KEY]:
        valor != null && intervalo != null
          ? [valor - intervalo[0], intervalo[1] - valor]
          : null,
    }
  })

  return (
    <ChartContainer config={config} className="h-64">
      <BarChart
        data={dataConRango}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" />
        <YAxis width={40} />
        <Bar
          dataKey={dataKeyHistorico}
          name={label}
          stackId="mes"
          fill={colorVar}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey={dataKeyProyectado}
          name={`${label} (predicción)`}
          stackId="mes"
          fill="none"
          stroke={colorVar}
          strokeDasharray="4 4"
          strokeWidth={2}
          radius={[4, 4, 0, 0]}
        >
          <ErrorBar
            dataKey={RANGO_KEY}
            stroke={colorVar}
            strokeWidth={1.5}
            width={6}
          />
        </Bar>
        <ChartTooltip
          cursor={{ stroke: 'var(--color-border)' }}
          content={<ChartTooltipContent hideLabel formatter={formatter} />}
        />
      </BarChart>
    </ChartContainer>
  )
}
