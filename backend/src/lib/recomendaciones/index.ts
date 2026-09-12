import { REGLAS } from "./reglas";
import type { CatalogoRegla, ContextoRecomendacion, RecomendacionGenerada } from "./types";

export * from "./types";
export { armarContexto } from "./contexto";
export { REGLAS } from "./reglas";

// Evalúa todas las reglas del catálogo contra el contexto y devuelve las
// recomendaciones que aplican. Función pura: no toca base de datos ni red.
//
// Las reglas del catálogo sin evaluador en REGLAS se ignoran (el texto puede
// existir en la BD pero la lógica aún no está implementada).
export function generarRecomendaciones(
  ctx: ContextoRecomendacion,
  catalogo: CatalogoRegla[]
): RecomendacionGenerada[] {
  const resultado: RecomendacionGenerada[] = [];
  for (const regla of catalogo) {
    const evaluar = REGLAS[regla.codigoRegla];
    if (!evaluar) continue;
    const generada = evaluar(ctx, regla);
    if (generada) resultado.push(generada);
  }
  return resultado;
}