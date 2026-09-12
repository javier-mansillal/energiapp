import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  LayoutDashboard,
  Receipt,
  ArrowRight,
  Zap,
  Wallet,
  TrendingUp,
  BarChart3,
  RotateCcw,
} from 'lucide-react'
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts'
import type { TooltipPayloadEntry } from 'recharts'
import AppLayout from '../components/AppLayout'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { getActiveHogarId } from '@/lib/activeHogar'
import { listarBoletas, fmtCLP } from '@/lib/boletas'
import {
  procesarBoletas,
  conProyeccion,
  kpis,
  fmtKwh,
  fmtTarifa,
  fmtRangoKwh,
  mesDe,
  type PuntoMensual,
} from '@/lib/dashboard'
import {
  obtenerPrediccion,
  type ResultadoPrediccion,
} from '@/lib/prediccion'
import {
  listarElectrodomesticos,
  type Electrodomestico,
} from '@/lib/electrodomesticos'
import KpiCard from '../components/dashboard/KpiCard'
import ChartCard from '../components/dashboard/ChartCard'
import ChartProyectado from '../components/dashboard/ChartProyectado'
import ChartElectrodomesticos from '../components/dashboard/ChartElectrodomesticos'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton'
import { cn } from '@/lib/utils'

type Estado = 'loading' | 'error' | 'ok'

// Colores por serie: se exponen como variables --color-{key} por el ChartContainer
// y se adaptan al tema claro/oscuro.
const chartConfig: ChartConfig = {
  consumo: { label: 'Consumo', theme: { light: '#f59e0b', dark: '#fbbf24' } },
  costo: { label: 'Costo', theme: { light: '#f59e0b', dark: '#fbbf24' } },
  variacion: { label: 'Variación', theme: { light: '#10b981', dark: '#34d399' } },
  variacionNegativa: {
    label: 'Variación',
    theme: { light: '#ef4444', dark: '#f87171' },
  },
  tarifa: { label: 'Tarifa efectiva', theme: { light: '#f59e0b', dark: '#fbbf24' } },
}

// Fila de tooltip con indicador de color, label y valor formateado.
function tooltipRow(label: string, fmt: (v: number) => string) {
  return (value: unknown, _name: unknown, item: TooltipPayloadEntry) => (
    <div className="flex w-full flex-wrap gap-2 items-center">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-xs"
        style={{ backgroundColor: item.color }}
      />
      <div className="flex flex-1 items-center gap-1.5">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-mono font-medium text-foreground tabular-nums">
          {fmt(Number(value))}
        </span>
      </div>
    </div>
  )
}

// Tooltip de variación: muestra el % con signo y color según dirección.
function fmtVariacion(value: unknown, _name: unknown, item: TooltipPayloadEntry) {
  const v = Number(value)
  const signo = v > 0 ? '+' : ''
  return (
    <div className="flex w-full flex-wrap gap-2 items-center">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-xs"
        style={{ backgroundColor: item.color }}
      />
      <div className="flex flex-1 items-center gap-1.5">
        <span className="text-muted-foreground">Variación:</span>
        <span
          className={cn(
            'font-mono font-medium tabular-nums',
            v >= 0 ? 'text-emerald-500' : 'text-destructive'
          )}
        >
          {signo}
          {v.toLocaleString('es-CL')}%
        </span>
      </div>
    </div>
  )
}

// Estado vacío de un gráfico (sin datos o error).
function chartVacio(msg: string) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
      <BarChart3 className="size-8 text-amber-400/40" />
      <p className="text-sm">{msg}</p>
    </div>
  )
}

export default function Dashboard() {
  // Sin hogar activo no hay nada que cargar: se muestra el estado vacío directo.
  const hogarIdInicial = getActiveHogarId()
  const [estado, setEstado] = useState<Estado>(hogarIdInicial ? 'loading' : 'ok')
  const [puntos, setPuntos] = useState<PuntoMensual[]>([])
  const [sinBoletas, setSinBoletas] = useState(!hogarIdInicial)
  const [prediccion, setPrediccion] = useState<ResultadoPrediccion | null>(null)
  const [electrodomesticos, setElectrodomesticos] = useState<Electrodomestico[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const hogarId = getActiveHogarId()
    if (!hogarId) {
      // Sin hogar activo no hay nada que cargar.
      return
    }

    let mounted = true
    Promise.all([
      listarBoletas(hogarId),
      // La predicción y los electrodomésticos son accesorios: si fallan, el
      // dashboard igual carga.
      obtenerPrediccion(hogarId).catch(() => null),
      listarElectrodomesticos(hogarId).catch(() => [] as Electrodomestico[]),
    ])
      .then(([data, pred, electros]) => {
        if (!mounted) return
        setPuntos(procesarBoletas(data))
        setSinBoletas(data.length === 0)
        setPrediccion(pred)
        setElectrodomesticos(electros)
        setEstado('ok')
      })
      .catch(() => {
        if (mounted) setEstado('error')
      })
    return () => {
      mounted = false
    }
  }, [attempt])

  const k = kpis(puntos)
  const hayDatos = puntos.length > 0
  const ultimoMes = hayDatos ? puntos[puntos.length - 1].mesLargo : null
  const pred = prediccion?.estado === 'ok' ? prediccion.prediccion : null
  const faltan = prediccion?.estado === 'insuficiente' ? prediccion : null
  const datosGrafico = conProyeccion(puntos, pred)

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <LayoutDashboard className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tu consumo y predicciones.
          </p>
        </div>
      </div>

      {estado === 'loading' && <DashboardSkeleton />}

      {estado === 'error' && (
        <>
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <RotateCcw className="size-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                No se pudieron cargar los datos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa que el servidor esté corriendo e inténtalo de nuevo.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEstado('loading')
                setAttempt((n) => n + 1)
              }}
              className="cursor-pointer gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Reintentar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard icon={Zap} title="Consumo del mes" value="0 kWh" />
            <KpiCard icon={Wallet} title="Costo del mes" value="$ 0" />
            <KpiCard
              icon={TrendingUp}
              title="Predicción"
              value="Sin datos"
              sub="No se pudo calcular"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChartCard title="Consumo por mes">
              {chartVacio('Sin datos para mostrar')}
            </ChartCard>
            <ChartCard title="Costo por mes">
              {chartVacio('Sin datos para mostrar')}
            </ChartCard>
            <ChartCard title="Variación vs mes anterior">
              {chartVacio('Sin datos para mostrar')}
            </ChartCard>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title="Tarifa efectiva">
              {chartVacio('Sin datos para mostrar')}
            </ChartCard>
            <ChartCard title="Electrodomésticos vs consumo">
              {chartVacio('Sin datos para mostrar')}
            </ChartCard>
          </div>
        </>
      )}

      {estado === 'ok' && (
        <>
          {/* Aviso si no hay boletas subidas */}
          {sinBoletas && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <Receipt className="size-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Aún no has subido boletas
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sube tu primera boleta eléctrica para empezar a ver tu consumo y
                  predicciones en el dashboard.
                </p>
              </div>
              <Link to="/boletas">
                <Button
                  size="sm"
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold cursor-pointer gap-1.5"
                >
                  Ir a Boletas
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              icon={Zap}
              title="Consumo del mes"
              value={fmtKwh(k.consumo)}
              sub={
                ultimoMes
                  ? `Último mes con boleta (${ultimoMes})`
                  : 'Sin boletas este mes'
              }
            />
            <KpiCard
              icon={Wallet}
              title="Costo del mes"
              value={fmtCLP(k.costo)}
              sub={
                ultimoMes
                  ? `Último mes con boleta (${ultimoMes})`
                  : 'Sin boletas este mes'
              }
            />
            <KpiCard
              icon={TrendingUp}
              title="Predicción"
              value={pred ? fmtKwh(pred.consumoEstimadoKwh) : 'Sin datos'}
              sub={
                pred
                  ? `${mesDe(pred.periodoProyectadoFin)} · ${fmtRangoKwh(
                      pred.consumoEstimadoKwhInferior,
                      pred.consumoEstimadoKwhSuperior
                    )}`
                  : faltan
                    ? `Necesitas ${faltan.minimoBoletas} boletas o más (tienes ${faltan.nBoletas})`
                    : 'No se pudo calcular la predicción'
              }
            />
          </div>

          {/* ── Gráficos: 3 arriba ── */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChartCard
              title="Consumo por mes"
              description="kWh por período · la barra punteada es la predicción"
            >
              {hayDatos ? (
                <ChartProyectado
                  data={datosGrafico}
                  config={chartConfig}
                  colorVar="var(--color-consumo)"
                  label="Consumo"
                  fmt={fmtKwh}
                  dataKeyHistorico="consumoHistorico"
                  dataKeyProyectado="consumoProyectado"
                  dataKeyIntervalo="consumoIntervalo"
                />
              ) : (
                chartVacio('Sin datos para mostrar')
              )}
            </ChartCard>

            <ChartCard
              title="Costo por mes"
              description="Monto facturado · la barra punteada es la predicción"
            >
              {hayDatos ? (
                <ChartProyectado
                  data={datosGrafico}
                  config={chartConfig}
                  colorVar="var(--color-costo)"
                  label="Costo"
                  fmt={fmtCLP}
                  dataKeyHistorico="montoHistorico"
                  dataKeyProyectado="montoProyectado"
                  dataKeyIntervalo="montoIntervalo"
                />
              ) : (
                chartVacio('Sin datos para mostrar')
              )}
            </ChartCard>

            <ChartCard
              title="Variación vs mes anterior"
              description="Cambio porcentual del consumo"
            >
              {hayDatos ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <BarChart
                    data={puntos}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis width={40} />
                    <Bar dataKey="variacion" radius={[4, 4, 0, 0]}>
                      {puntos.map((p, i) => (
                        <Cell
                          key={i}
                          fill={
                            p.variacion !== null && p.variacion >= 0
                              ? 'var(--color-variacion)'
                              : 'var(--color-variacionNegativa)'
                          }
                        />
                      ))}
                    </Bar>
                    <ChartTooltip
                      cursor={{ stroke: 'var(--color-border)' }}
                      content={
                        <ChartTooltipContent hideLabel formatter={fmtVariacion} />
                      }
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                chartVacio('Sin datos para mostrar')
              )}
            </ChartCard>
          </div>

          {/* ── Gráficos: 2 abajo ── */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard
              title="Tarifa efectiva"
              description="Costo por kWh ($/kWh) de cada mes"
            >
              {hayDatos ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                  <LineChart
                    data={puntos}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="mes" />
                    <YAxis width={40} />
                    <Line
                      type="monotone"
                      dataKey="tarifa"
                      stroke="var(--color-tarifa)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <ChartTooltip
                      cursor={{ stroke: 'var(--color-border)' }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={tooltipRow('Tarifa', fmtTarifa)}
                        />
                      }
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                chartVacio('Sin datos para mostrar')
              )}
            </ChartCard>

            <ChartCard
              title="Electrodomésticos vs consumo"
              description="Participación estimada de cada electrodoméstico en tu consumo total"
            >
              <ChartElectrodomesticos
                electrodomesticos={electrodomesticos}
                consumoTotalKwh={k.consumo}
              />
            </ChartCard>
          </div>
        </>
      )}
    </AppLayout>
  )
}