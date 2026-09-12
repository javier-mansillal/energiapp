import type { BoletaCtx, ContextoRecomendacion, ElectrodomesticoCtx } from "./types";

// Datos crudos que la ruta obtiene de la BD para armar el contexto.
export interface DatosRecomendacion {
  region: string;
  cantidadPersonas: number;
  permiteComparaciones: boolean;
  // Promedio del último mes de otros usuarios de la app en la misma región
  // (opt-in). null si no hay hogares comparables.
  promedioRegionalKwh: number | null;
  boletas: BoletaCtx[];
  electrodomesticos: ElectrodomesticoCtx[];
}

// Arma el contexto del motor a partir de los datos crudos. Función pura.
export function armarContexto(datos: DatosRecomendacion): ContextoRecomendacion {
  const ordenadas = [...datos.boletas].sort(
    (a, b) => a.fechaFinLectura.getTime() - b.fechaFinLectura.getTime()
  );
  const ultima = ordenadas[ordenadas.length - 1];
  const penultima = ordenadas[ordenadas.length - 2];

  const consumoUltimoMesKwh = ultima?.consumoKwh ?? 0;
  const montoUltimoMes = ultima?.montoTotal ?? 0;
  const tarifaEfectiva =
    consumoUltimoMesKwh > 0 ? montoUltimoMes / consumoUltimoMesKwh : 0;

  let variacionPct: number | null = null;
  if (ultima && penultima && penultima.consumoKwh > 0) {
    variacionPct =
      ((ultima.consumoKwh - penultima.consumoKwh) / penultima.consumoKwh) * 100;
  }

  const consumoPorPersonaKwh =
    datos.cantidadPersonas > 0 ? consumoUltimoMesKwh / datos.cantidadPersonas : 0;

  return {
    region: datos.region,
    cantidadPersonas: datos.cantidadPersonas,
    permiteComparaciones: datos.permiteComparaciones,
    promedioRegionalKwh: datos.promedioRegionalKwh,
    consumoUltimoMesKwh,
    montoUltimoMes,
    tarifaEfectiva,
    variacionPct,
    consumoPorPersonaKwh,
    electrodomesticos: datos.electrodomesticos,
  };
}