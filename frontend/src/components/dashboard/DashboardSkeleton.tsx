import { cn } from '@/lib/utils'

// Bloque de esqueleto con pulso de carga.
function Block({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted/40', className)} />
}

// Esqueleto del dashboard: se muestra mientras cargan los datos.
// Reproduce la forma de los KPIs (3) y de los gráficos (3 + 2).
export default function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/50">
            <div className="px-4 py-3">
              <Block className="h-4 w-1/2" />
            </div>
            <div className="px-4 py-3">
              <Block className="h-7 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/50">
            <div className="px-4 py-3">
              <Block className="h-4 w-1/3" />
            </div>
            <div className="px-4 py-3">
              <Block className="h-40 w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}