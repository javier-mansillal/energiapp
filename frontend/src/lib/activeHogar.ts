// Hogar activo/seleccionado. Se guarda en localStorage para que la selección
// persista entre páginas (dashboard, boletas, electrodomésticos, hogares).
const KEY = 'energiapp-active-hogar'

export function getActiveHogarId(): string | null {
  return localStorage.getItem(KEY)
}

export function setActiveHogarId(id: string | null) {
  if (id) localStorage.setItem(KEY, id)
  else localStorage.removeItem(KEY)
}