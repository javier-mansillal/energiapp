import { useEffect, useState } from 'react'
import {
  Home,
  Plus,
  Pencil,
  Trash2,
  Check,
  MapPin,
  Users,
  X,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { getActiveHogarId, setActiveHogarId } from '@/lib/activeHogar'
import { cn } from '@/lib/utils'

const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
]

type Hogar = {
  id: string
  nombre: string
  region: string
  comuna: string
  direccion: string
  cantidadPersonas: number
}

type HogarForm = {
  nombre: string
  region: string
  comuna: string
  direccion: string
  cantidadPersonas: string
}

const emptyForm: HogarForm = {
  nombre: '',
  region: '',
  comuna: '',
  direccion: '',
  cantidadPersonas: '1',
}

function toForm(h: Hogar): HogarForm {
  return {
    nombre: h.nombre,
    region: h.region,
    comuna: h.comuna,
    direccion: h.direccion,
    cantidadPersonas: String(h.cantidadPersonas),
  }
}

const inputCls =
  'w-full rounded-lg border-border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500/50'

export default function Hogares() {
  const [hogares, setHogares] = useState<Hogar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeId, setActiveId] = useState<string | null>(getActiveHogarId())

  // Edición
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<HogarForm>(emptyForm)
  const [savingEdit, setSavingEdit] = useState(false)

  // Agregar
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState<HogarForm>(emptyForm)
  const [savingAdd, setSavingAdd] = useState(false)

  // Eliminar
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function refresh() {
    try {
      const data = await api.get<Hogar[]>('/hogares')
      setHogares(data)
      // Si el hogar activo ya no existe, seleccionar el primero.
      if (!data.some((h) => h.id === activeId)) {
        const next = data[0]?.id ?? null
        setActiveId(next)
        setActiveHogarId(next)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar hogares')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    api
      .get<Hogar[]>('/hogares')
      .then((data) => {
        if (!mounted) return
        setHogares(data)
        // Si el hogar activo ya no existe, seleccionar el primero.
        if (!data.some((h) => h.id === activeId)) {
          const next = data[0]?.id ?? null
          setActiveId(next)
          setActiveHogarId(next)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar hogares')
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectHogar(id: string) {
    setActiveId(id)
    setActiveHogarId(id)
  }

  function startEdit(h: Hogar) {
    setEditingId(h.id)
    setEditForm(toForm(h))
    setConfirmDeleteId(null)
  }

  async function saveEdit(h: Hogar) {
    setSavingEdit(true)
    setError(null)
    try {
      await api.patch(`/hogares/${h.id}`, {
        nombre: editForm.nombre.trim(),
        region: editForm.region,
        comuna: editForm.comuna.trim(),
        direccion: editForm.direccion.trim(),
        cantidadPersonas: Number(editForm.cantidadPersonas),
      })
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingEdit(false)
    }
  }

  async function saveAdd() {
    setSavingAdd(true)
    setError(null)
    try {
      const created = await api.post<Hogar>('/hogares', {
        nombre: addForm.nombre.trim(),
        region: addForm.region,
        comuna: addForm.comuna.trim(),
        direccion: addForm.direccion.trim(),
        cantidadPersonas: Number(addForm.cantidadPersonas),
      })
      setAdding(false)
      setAddForm(emptyForm)
      await refresh()
      selectHogar(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSavingAdd(false)
    }
  }

  async function confirmDelete(h: Hogar) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.del(`/hogares/${h.id}`)
      setConfirmDeleteId(null)
      await refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  function renderForm(form: HogarForm, set: (f: HogarForm) => void) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <input
          value={form.nombre}
          onChange={(e) => set({ ...form, nombre: e.target.value })}
          placeholder="Nombre del hogar"
          className={inputCls}
        />
        <select
          value={form.region}
          onChange={(e) => set({ ...form, region: e.target.value })}
          className={inputCls}
        >
          <option value="" disabled>
            Región
          </option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          value={form.comuna}
          onChange={(e) => set({ ...form, comuna: e.target.value })}
          placeholder="Comuna"
          className={inputCls}
        />
        <input
          value={form.direccion}
          onChange={(e) => set({ ...form, direccion: e.target.value })}
          placeholder="Dirección"
          className={inputCls}
        />
        <input
          type="number"
          min={1}
          value={form.cantidadPersonas}
          onChange={(e) => set({ ...form, cantidadPersonas: e.target.value })}
          placeholder="Cantidad de personas"
          className={inputCls}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-amber-400" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Home className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hogares</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus hogares. El hogar elegido se usa en el resto de la app.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Tarjetas de hogares ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hogares.map((h) => {
          const isActive = h.id === activeId
          const isEditing = editingId === h.id
          const isConfirming = confirmDeleteId === h.id
          return (
            <Card
              key={h.id}
              className={cn(
                'bg-card/50 border-border/60 transition-colors',
                isActive ? 'border-amber-500/50 ring-1 ring-amber-500/30' : ''
              )}
            >
              <CardHeader>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Home className="size-4 text-amber-400" />
                  </div>
                  <CardTitle className="min-w-0 text-lg">{h.nombre}</CardTitle>
                  {isActive && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Activo
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-3.5" />
                    {h.region} · {h.comuna}
                  </span>
                  <span className="flex items-center gap-2">
                    <Home className="size-3.5" />
                    {h.direccion}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="size-3.5" />
                    {h.cantidadPersonas} {h.cantidadPersonas === 1 ? 'persona' : 'personas'}
                  </span>
                </div>

                {/* Edición expandible */}
                <div
                  className={cn(
                    'grid transition-all duration-300 mt-3',
                    isEditing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="min-h-0 p-3 rounded-lg border-border/60 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Editar hogar
                      </p>
                      {renderForm(editForm, (f) => setEditForm(f))}
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="cursor-pointer"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(h)}
                          disabled={savingEdit}
                          className="cursor-pointer gap-1.5"
                        >
                          <Check className="size-3.5" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmación de borrado */}
                {isConfirming && (
                  <div className="mt-3 p-3 rounded-lg border-destructive/40 bg-destructive/10">
                    <p className="text-xs text-destructive font-medium">
                      ¿Eliminar este hogar? Esta acción no se puede deshacer.
                    </p>
                    {deleteError && (
                      <p className="mt-1 text-xs text-destructive">{deleteError}</p>
                    )}
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setConfirmDeleteId(null)
                          setDeleteError(null)
                        }}
                        className="cursor-pointer"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(h)}
                        disabled={deleting}
                        className="cursor-pointer"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Acciones */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border/40">
                <Button
                  size="sm"
                  variant={isActive ? 'secondary' : 'outline'}
                  onClick={() => selectHogar(h.id)}
                  className="cursor-pointer gap-1.5"
                >
                  {isActive ? <Check className="size-3.5" /> : <Home className="size-3.5" />}
                  {isActive ? 'Seleccionado' : 'Elegir'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(h)}
                  className="cursor-pointer gap-1.5"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDeleteError(null)
                    setConfirmDeleteId(hogares.length > 1 ? h.id : null)
                    if (hogares.length <= 1) {
                      setDeleteError('No puedes eliminar tu único hogar.')
                    }
                  }}
                  className="cursor-pointer gap-1.5 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Eliminar
                </Button>
              </div>
            </Card>
          )
        })}

        {/* Botón agregar */}
        <button
          onClick={() => {
            setAdding(!adding)
            setError(null)
          }}
          className="min-h-40 rounded-xl border-2 border-dashed border-border/60 hover:border-amber-500/50 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors cursor-pointer"
        >
          <Plus className="size-8 text-amber-400" />
          <span className="text-sm font-medium">Agregar hogar</span>
        </button>
      </div>

      {/* Formulario agregar */}
      {adding && (
        <Card className="mt-6 bg-card/50 border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nuevo hogar</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAdding(false)}
                className="cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </Button>
            </div>
            <CardDescription>Completa los datos del nuevo hogar.</CardDescription>
          </CardHeader>
          <CardContent>
            {renderForm(addForm, (f) => setAddForm(f))}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={saveAdd}
                disabled={savingAdd}
                className="cursor-pointer gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold"
              >
                <Plus className="size-4" />
                Crear hogar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deleteError && !confirmDeleteId && (
        <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <ShieldAlert className="size-4" />
          {deleteError}
        </div>
      )}
    </AppLayout>
  )
}