// Utilidades estadísticas compartidas por el modelo de predicción.

export function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, v) => acc + v, 0) / valores.length;
}

// Varianza residual = suma de cuadrados de residuos / grados de libertad.
export function varianzaResidual(
  residuos: number[],
  gradosLibertad: number
): number {
  if (gradosLibertad <= 0) return 0;
  const sse = residuos.reduce((acc, r) => acc + r * r, 0);
  return sse / gradosLibertad;
}
