import type { ReactNode } from 'react'
import CatalogoPicker from './CatalogoPicker'
import {
  inputCls,
  type CatalogoItem,
  type ElectroForm,
} from '@/lib/electrodomesticos'

// Envoltura de un campo con su etiqueta.
function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

// Campos compartidos entre "agregar" y "editar" un electrodoméstico.
// `mostrarCatalogo` habilita el selector del catálogo (solo al agregar).
export default function ElectroFormFields({
  form,
  setForm,
  catalogo,
  mostrarCatalogo = false,
}: {
  form: ElectroForm
  setForm: (f: ElectroForm) => void
  catalogo: CatalogoItem[]
  mostrarCatalogo?: boolean
}) {
  function elegirDelCatalogo(item: CatalogoItem) {
    // El catálogo solo prellena valores: todo queda editable después.
    setForm({
      ...form,
      catalogoId: item.id,
      nombre: item.nombre,
      potenciaW: String(item.potenciaPromedioWatts),
      consumoVampiroW: String(item.consumoVampiroW),
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {mostrarCatalogo && (
        <div className="md:col-span-2">
          <Campo label="Elegir del catálogo (opcional)">
            <CatalogoPicker
              catalogo={catalogo}
              value={form.catalogoId}
              onSelect={elegirDelCatalogo}
            />
          </Campo>
        </div>
      )}

      <Campo label="Nombre">
        <input
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Ej: Refrigerador cocina"
          className={inputCls}
        />
      </Campo>

      <Campo label="Potencia (W)">
        <input
          type="number"
          min={0}
          step="1"
          value={form.potenciaW}
          onChange={(e) => setForm({ ...form, potenciaW: e.target.value })}
          placeholder="Ej: 100"
          className={inputCls}
        />
      </Campo>

      <Campo label="Consumo en espera / vampiro (W)">
        <input
          type="number"
          min={0}
          step="0.1"
          value={form.consumoVampiroW}
          onChange={(e) => setForm({ ...form, consumoVampiroW: e.target.value })}
          placeholder="Ej: 0.5"
          className={inputCls}
        />
      </Campo>

      <Campo label="Horas de uso al día">
        <input
          type="number"
          min={0}
          max={24}
          step="0.5"
          value={form.horasUsoDiario}
          onChange={(e) => setForm({ ...form, horasUsoDiario: e.target.value })}
          placeholder="Ej: 4"
          className={inputCls}
        />
      </Campo>

      <Campo label="Cantidad">
        <input
          type="number"
          min={1}
          step="1"
          value={form.cantidad}
          onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
          placeholder="Ej: 1"
          className={inputCls}
        />
      </Campo>
    </div>
  )
}
