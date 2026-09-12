import { Check, Loader2, Undo2, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CATEGORIA_INFO,
  IMPACTO_INFO,
  type CategoriaRecomendacion,
  type EstadoRecomendacion,
  type Recomendacion,
} from '@/lib/recomendaciones'
import { fmtKwh } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

// Colores por categoría (adaptados a tema claro/oscuro con clases Tailwind).
const CATEGORIA_CLS: Record<CategoriaRecomendacion, string> = {
  VAMPIRO: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  COMPARATIVA: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  USO_EFICIENTE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
}

const IMPACTO_CLS: Record<string, string> = {
  ALTO: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  MEDIO: 'border-border/60 text-muted-foreground',
  BAJO: 'border-border/60 text-muted-foreground',
}

// Tarjeta de una recomendación: categoría, impacto, texto y acciones según el
// estado (PENDIENTE → Aplicar/Ignorar; respondida → Reactivar).
export default function RecomendacionCard({
  recomendacion,
  updating,
  onCambiarEstado,
}: {
  recomendacion: Recomendacion
  updating: boolean
  onCambiarEstado: (id: string, estado: EstadoRecomendacion) => void
}) {
  const categoria = recomendacion.categoria
  const impacto = recomendacion.impactoEstimado
  const pendiente = recomendacion.estado === 'PENDIENTE'

  return (
    <Card className="bg-card/50 border-border/60">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {categoria && (
            <Badge variant="outline" className={cn('text-xs', CATEGORIA_CLS[categoria])}>
              {CATEGORIA_INFO[categoria].label}
            </Badge>
          )}
          {impacto && (
            <Badge variant="outline" className={cn('text-xs', IMPACTO_CLS[impacto])}>
              {IMPACTO_INFO[impacto].label}
            </Badge>
          )}
          {!pendiente && (
            <Badge
              variant={recomendacion.estado === 'APLICADA' ? 'secondary' : 'outline'}
              className="ml-auto text-xs"
            >
              {recomendacion.estado === 'APLICADA' ? 'Aplicada' : 'Ignorada'}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm leading-snug">{recomendacion.titulo}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">{recomendacion.descripcion}</p>
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-amber-400">
          <Check className="size-3.5" />
          Ahorro estimado: {fmtKwh(recomendacion.ahorroEstimadoKwh)} al mes
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
          {pendiente ? (
            <>
              <Button
                size="sm"
                onClick={() => onCambiarEstado(recomendacion.id, 'APLICADA')}
                disabled={updating}
                className="cursor-pointer gap-1.5"
              >
                {updating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Aplicar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCambiarEstado(recomendacion.id, 'IGNORADA')}
                disabled={updating}
                className="cursor-pointer gap-1.5 text-muted-foreground"
              >
                <X className="size-3.5" />
                Ignorar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCambiarEstado(recomendacion.id, 'PENDIENTE')}
              disabled={updating}
              className="cursor-pointer gap-1.5"
            >
              {updating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Undo2 className="size-3.5" />
              )}
              Reactivar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}