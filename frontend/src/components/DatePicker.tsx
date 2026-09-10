import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

// Convierte una fecha ISO (yyyy-mm-dd) a Date (mediodía local para evitar
// problemas de zona horaria).
function parseISO(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtFecha(iso: string): string {
  return parseISO(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Selector de fecha con el Calendar de shadcn dentro de un Popover.
// Respeta el tema claro/oscuro (a diferencia del input type="date" nativo).
export default function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className,
}: {
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const date = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant="outline"
            className={cn(
              'w-full justify-start gap-2 font-normal text-left',
              className
            )}
          >
            <CalendarDays className="size-4 text-amber-400" />
            {value ? fmtFecha(value) : placeholder}
          </Button>
        )}
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          locale={es}
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(toISO(d))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}