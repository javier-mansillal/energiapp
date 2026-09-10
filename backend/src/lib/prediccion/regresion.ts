import type { PuntoSerie } from "./serie";
import type { Pronostico } from "./types";
import { media, t95, varianzaResidual } from "./estadistica";

// Coeficiente de determinación (bondad de ajuste de la recta), solo informativo.
function coeficienteR2(
  xs: number[],
  ys: number[],
  pendiente: number,
  intercepto: number
): number {
  const mediaY = media(ys);
  let sst = 0;
  let sse = 0;
  for (let i = 0; i < ys.length; i++) {
    const predicho = intercepto + pendiente * xs[i];
    sst += (ys[i] - mediaY) ** 2;
    sse += (ys[i] - predicho) ** 2;
  }
  return sst === 0 ? 0 : 1 - sse / sst;
}

// Regresión lineal simple con intervalo de predicción analítico (95%).
// x = días desde el inicio de la serie, y = kWh normalizado a 30 días.
// Usar tiempo real en vez del índice evita que un hueco entre boletas se
// interprete como un período más.
export function predecirRegresion(
  puntos: PuntoSerie[],
  xObjetivo: number
): Pronostico {
  const n = puntos.length;
  const xs = puntos.map((p) => p.diasDesdeInicio);
  const ys = puntos.map((p) => p.kwhNormalizado);

  const mediaX = media(xs);
  const mediaY = media(ys);

  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mediaX) ** 2;
    sxy += (xs[i] - mediaX) * (ys[i] - mediaY);
  }

  // Si todos los puntos caen el mismo día no hay pendiente: se usa el promedio.
  const pendiente = sxx === 0 ? 0 : sxy / sxx;
  const intercepto = mediaY - pendiente * mediaX;
  const valor = intercepto + pendiente * xObjetivo;

  const residuos = xs.map((x, i) => ys[i] - (intercepto + pendiente * x));
  const gradosLibertad = residuos.length - 2;
  const sigma = Math.sqrt(varianzaResidual(residuos, gradosLibertad));

  // Intervalo de predicción: cubre la incertidumbre del valor esperado y la
  // variabilidad propia de una observación nueva. Se ensancha al extrapolar.
  const terminoExtrapolacion =
    sxx === 0 ? 0 : (xObjetivo - mediaX) ** 2 / sxx;
  const margen =
    t95(gradosLibertad) *
    sigma *
    Math.sqrt(1 + 1 / n + terminoExtrapolacion);

  return {
    valor,
    inferior: valor - margen,
    superior: valor + margen,
    parametros: {
      pendiente,
      intercepto,
      r2: coeficienteR2(xs, ys, pendiente, intercepto),
    },
  };
}
