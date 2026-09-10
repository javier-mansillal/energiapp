import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.DEV) {
      console.warn(
        '⚠️  Faltan SUPABASE_URL / SUPABASE_ANON_KEY. ' +
          'Auth no funcionará hasta que configures las variables en .env'
      )
    }
    // Cliente dummy – no lanza error, falla después en runtime si se usa
    return createClient(
      supabaseUrl ?? 'http://placeholder',
      supabaseAnonKey ?? 'placeholder'
    )
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()
