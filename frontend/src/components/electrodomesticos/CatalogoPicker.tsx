import { useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { CatalogoItem } from '@/lib/electrodomesticos'
import { cn } from '@/lib/utils'

// Selector del catálogo de electrodomésticos: buscador + lista agrupada por
// categoría. Al elegir uno, el formulario se rellena con sus valores estimados.
export default function CatalogoPicker({
  catalogo,
  value,
  onSelect,
}: {
  catalogo: CatalogoItem[]
  value: string | null
  onSelect: (item: CatalogoItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const seleccionado = catalogo.find((c) => c.id === value) ?? null

  const termino = busqueda.trim().toLowerCase()
  const filtrado = termino
    ? catalogo.filter(
        (c) =>
          c.nombre.toLowerCase().includes(termino) ||
          c.categoria.toLowerCase().includes(termino)
      )
    : catalogo

  // Agrupa por categoría manteniendo el orden del catálogo.
  const grupos: { categoria: string; items: CatalogoItem[] }[] = []
  for (const item of filtrado) {
    let g = grupos.find((x) => x.categoria === item.categoria)
    if (!g) {
      g = { categoria: item.categoria, items: [] }
      grupos.push(g)
    }
    g.items.push(item)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setBusqueda('')
      }}
    >
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant="outline"
            className="w-full justify-between gap-2 font-normal text-left"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-4 text-amber-400" />
              <span className={cn('truncate', !seleccionado && 'text-muted-foreground')}>
                {seleccionado ? seleccionado.nombre : 'Elegir del catálogo'}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        )}
      />
      <PopoverContent className="w-80 p-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar electrodoméstico..."
          className="mb-2 w-full rounded-lg border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500/50"
        />
        <div className="max-h-64 overflow-y-auto pr-1">
          {grupos.length === 0 && (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Sin resultados
            </p>
          )}
          {grupos.map((g) => (
            <div key={g.categoria} className="mb-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {g.categoria}
              </p>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    item.id === value
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'hover:bg-muted/60'
                  )}
                >
                  <span className="truncate">{item.nombre}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {item.potenciaPromedioWatts} W
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
