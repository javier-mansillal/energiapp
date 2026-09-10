import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MESES } from '@/lib/boletas'
import { cn } from '@/lib/utils'

// value / onChange en formato 'YYYY-MM'.
function parseMes(mes: string): { anio: number; indice: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(mes)
  if (!m) return null
  const indice = Number(m[2]) - 1
  if (indice < 0 || indice > 11) return null
  return { anio: Number(m[1]), indice }
}

function toMes(anio: number, indice: number): string {
  return `${anio}-${String(indice + 1).padStart(2, '0')}`
}

// Selector de mes. Las lecturas de las distribuidoras se cargan por mes; el
// backend se encarga de expandirlo al primer y último día.
export default function MonthPicker({
  value,
  onChange,
  placeholder = 'Seleccionar mes',
  className,
}: {
  value: string
  onChange: (mes: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const seleccion = parseMes(value)
  const [anio, setAnio] = useState(seleccion?.anio ?? new Date().getFullYear())

  const etiqueta = seleccion
    ? `${MESES[seleccion.indice]} ${seleccion.anio}`
    : placeholder

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        // Al abrir, posicionarse en el año del mes elegido (o el actual).
        if (o) setAnio(seleccion?.anio ?? new Date().getFullYear())
      }}
    >
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant="outline"
            className={cn(
              'w-full justify-start gap-2 font-normal text-left',
              !seleccion && 'text-muted-foreground',
              className
            )}
          >
            <CalendarDays className="size-4 text-amber-400" />
            {etiqueta}
          </Button>
        )}
      />
      <PopoverContent className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={() => setAnio((a) => a - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">{anio}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={() => setAnio((a) => a + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MESES.map((nombre, i) => {
            const activo = seleccion?.anio === anio && seleccion?.indice === i
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => {
                  onChange(toMes(anio, i))
                  setOpen(false)
                }}
                className={cn(
                  'cursor-pointer rounded-md border px-2 py-1.5 text-xs transition-colors',
                  activo
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                    : 'border-transparent hover:bg-muted/60'
                )}
              >
                {nombre.slice(0, 3)}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
