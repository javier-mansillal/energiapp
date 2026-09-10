import { supabase } from './supabase'

// URL base del backend Express. Se puede sobreescribir con VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

// Prefijo de la API en el backend Express.
const API_PREFIX = '/api'

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  // Si el body es FormData, fetch setea el Content-Type (multipart/form-data
  // con boundary) automáticamente. Forzar application/json rompería el multipart.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const res = await fetch(`${API_URL}${API_PREFIX}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  // POST con FormData (para subir PDFs). No setea Content-Type: lo pone fetch.
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}