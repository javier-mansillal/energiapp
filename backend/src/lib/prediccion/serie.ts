import type { BoletaParaPrediccion } from "./types";

const MS_DIA = 86_400_000;

// Base de normalización: todo consumo se lleva a "kWh por 30 días" para que
// períodos de distinta duración (típicamente 28–35 días) sean comparables.
// Sin esto, un ciclo corto parecería un ahorro y uno largo un aumento.
export const DIAS_MES = 30;

export interface PuntoSerie {
  kwhNormalizado: number;
  diasDesdeInicio: number;
  duracionDias: number;
  fechaInicioLectura: Date;
  fechaFinLectura: Date;
}

export interface SeriePreparada {
  puntos: PuntoSerie[];
  inicioSerie: Date;
  ultimaFechaFin: Date;
  duracionPromedioDias: number;
}

// Ordena cronológicamente, normaliza cada consumo a 30 días y construye el
// eje temporal real (días transcurridos desde el inicio del primer período).
// Como la regresión usa ese eje en vez del índice, las boletas irregulares o
// con huecos no distorsionan el ajuste.
export function prepararSerie(boletas: BoletaParaPrediccion[]): SeriePreparada {
  const ordenadas = [...boletas].sort(
    (a, b) => a.fechaInicioLectura.getTime() - b.fechaInicioLectura.getTime()
  );

  const inicioSerie = ordenadas[0].fechaInicioLectura;

  const puntos: PuntoSerie[] = ordenadas.map((b) => {
    const duracionDias = Math.max(
      1,
      Math.round(
        (b.fechaFinLectura.getTime() - b.fechaInicioLectura.getTime()) / MS_DIA
      )
    );
    return {
      kwhNormalizado: (b.consumoKwh * DIAS_MES) / duracionDias,
      diasDesdeInicio:
        (b.fechaInicioLectura.getTime() - inicioSerie.getTime()) / MS_DIA,
      duracionDias,
      fechaInicioLectura: b.fechaInicioLectura,
      fechaFinLectura: b.fechaFinLectura,
    };
  });

  const duracionPromedioDias =
    puntos.reduce((acc, p) => acc + p.duracionDias, 0) / puntos.length;

  const ultimaFechaFin = puntos.reduce(
    (max, p) => (p.fechaFinLectura > max ? p.fechaFinLectura : max),
    puntos[0].fechaFinLectura
  );

  return { puntos, inicioSerie, ultimaFechaFin, duracionPromedioDias };
}
