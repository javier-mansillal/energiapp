import type { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";
import { getJwks } from "../lib/jwks";

// Request enriquecido con el id del usuario autenticado (id de auth.users)
// y el session token crudo (necesario para operar el Storage como el usuario).
export interface AuthedRequest extends Request {
  userId?: string;
  token?: string;
}

// Verifica el session token de Supabase que llega en `Authorization: Bearer <token>`.
// Prioridad: verificación local del JWT (firma + exp + iss) con la clave pública
// de Supabase (JWKS). Solo si la clave pública NO está disponible (red caída,
// Supabase caído) cae al método remoto (round-trip a /auth/v1/user).
//
// Un token mal firmado, expirado o con issuer incorrecto SIEMPRE es 401 —
// nunca se hace fallback en esos casos.
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const token = header.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res
      .status(500)
      .json({ error: "Faltan SUPABASE_URL / SUPABASE_ANON_KEY en el backend" });
  }

  // 1) Intentar verificación local del JWT.
  const jwks = await getJwks();
  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${url}/auth/v1`,
        audience: "authenticated",
      });
      req.userId = payload.sub;
      req.token = token;
      return next();
    } catch {
      // Firma inválida, expirado o issuer incorrecto: 401 directo, sin fallback.
      return res.status(401).json({ error: "Token inválido o expirado" });
    }
  }

  // 2) Fallback SOLO de infraestructura: no pudimos obtener la clave pública,
  //    así que validamos contra Supabase (round-trip HTTP).
  try {
    const start = Date.now();
    const resp = await fetch(`${url}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`[auth] fallback validación contra Supabase: ${Date.now() - start}ms`);

    if (!resp.ok) {
      return res.status(401).json({ error: "Token inválido o expirado" });
    }

    const data = await resp.json();
    req.userId = data.id;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ error: "No se pudo verificar la sesión" });
  }
}