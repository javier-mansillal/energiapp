// Utilidades estadísticas compartidas por los modelos de predicción.

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

// Valor crítico t de Student para un intervalo de confianza del 95% (dos colas).
// Se tabula para 1..30 grados de libertad; sobre 30 se aproxima con la normal.
const T95 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201,
  2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074,
  2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

export function t95(gradosLibertad: number): number {
  // Sin grados de libertad no hay intervalo finito posible.
  if (gradosLibertad <= 0) return Number.POSITIVE_INFINITY;
  if (gradosLibertad <= 30) return T95[gradosLibertad - 1];
  return 1.96;
}
