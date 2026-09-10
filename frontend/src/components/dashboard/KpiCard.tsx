import type { ComponentType } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type IconType = ComponentType<{ className?: string }>

// Tarjeta KPI: ícono, título y valor grande con formato tabular.
export default function KpiCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: IconType
  title: string
  value: string
  sub?: string
}) {
  return (
    <Card className="bg-card/50 border-border/60 hover:border-amber-500/40 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Icon className="size-4 text-amber-400" />
          </div>
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}