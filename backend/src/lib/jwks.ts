import { createRemoteJWKSet } from "jose";

// JWKS (JSON Web Key Set) de Supabase: contiene la clave pública con la que
// se verifican los JWT de sesión. Se descarga una vez y se cachea en memoria.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let lastFetch = 0;

// Tiempo de vida del caché de la clave pública (1 hora).
const CACHE_TTL_MS = 60 * 60 * 1000;

// Obtiene el JWKS de Supabase, con caché en memoria. Devuelve null si no se
// puede obtener (red caída, Supabase caído, etc.) — en ese caso el caller
// decide el fallback.
export async function getJwks() {
  const url = process.env.SUPABASE_URL;
  if (!url) return null;

  // Caché válido.
  if (jwks && Date.now() - lastFetch < CACHE_TTL_MS) {
    return jwks;
  }

  try {
    jwks = createRemoteJWKSet(
      new URL(`${url}/auth/v1/.well-known/jwks.json`)
    );
    lastFetch = Date.now();
    return jwks;
  } catch {
    // No se pudo obtener la clave: limpiar para reintentar la próxima vez.
    jwks = null;
    return null;
  }
}