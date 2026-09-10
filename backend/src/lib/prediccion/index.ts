import { DIAS_MES, prepararSerie } from "./serie";
import { predecirRegresion } from "./regresion";
import {
  MODELO_PREDICCION,
  type BoletaParaPrediccion,
  type Prediccion,
  type ResultadoPrediccion,
} from "./types";

const MS_DIA = 86_400_000;

// Mínimo de boletas válidas para poder ajustar una recta con algo de sentido.
export const MIN_BOLETAS = 3;

export * from "./types";
export { prepararSerie } from "./serie";

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// Tarifa efectiva proyectada: promedio de las últimas 3 tarifas observadas
// ($/kWh). Separar precio de consumo evita que un alza tarifaria se lea como
// un cambio de comportamiento.
function tarifaProyectada(boletas: BoletaParaPrediccion[]): number {
  const tarifas = [...boletas]
    .sort((a, b) => a.fechaFinLectura.getTime() - b.fechaFinLectura.getTime())
    .filter((b) => b.consumoKwh > 0)
    .map((b) => b.montoTotal / b.consumoKwh);

  const ultimas = tarifas.slice(-3);
  if (ultimas.length === 0) return 0;
  return ultimas.reduce((acc, t) => acc + t, 0) / ultimas.length;
}

// Calcula la predicción del próximo período con regresión lineal sobre las
// boletas disponibles. Función pura: no toca base de datos ni red.
//
// El ajuste usa el tiempo real (días) en el eje X, así que tolera boletas
// irregulares o con huecos sin tratar el hueco como un período más.
export function predecir(boletas: BoletaParaPrediccion[]): ResultadoPrediccion {
  const validas = boletas.filter(
    (b) =>
      Number.isFinite(b.consumoKwh) &&
      b.consumoKwh > 0 &&
      Number.isFinite(b.montoTotal) &&
      b.fechaInicioLectura instanceof Date &&
      b.fechaFinLectura instanceof Date &&
      b.fechaFinLectura > b.fechaInicioLectura
  );

  if (validas.length < MIN_BOLETAS) {
    return {
      estado: "insuficiente",
      minimoBoletas: MIN_BOLETAS,
      nBoletas: validas.length,
    };
  }

  const serie = prepararSerie(validas);
  const duracionPeriodo = Math.max(1, Math.round(serie.duracionPromedioDias));

  // Período proyectado: el que sigue al último período facturado.
  const periodoProyectadoInicio = new Date(
    serie.ultimaFechaFin.getTime() + MS_DIA
  );
  const periodoProyectadoFin = new Date(
    periodoProyectadoInicio.getTime() + duracionPeriodo * MS_DIA
  );
  // Se predice en el centro del período: el valor modelado es un promedio
  // sobre la ventana, no el valor de un día puntual.
  const centroProyectado = new Date(
    periodoProyectadoInicio.getTime() + (duracionPeriodo / 2) * MS_DIA
  );

  const bruto = predecirRegresion(
    serie.puntos,
    (centroProyectado.getTime() - serie.inicioSerie.getTime()) / MS_DIA
  );

  // El modelo trabaja en "kWh por 30 días"; se reescala al largo real del
  // período proyectado para que el valor corresponda a esa ventana.
  const escala = duracionPeriodo / DIAS_MES;
  const consumo = Math.max(0, bruto.valor * escala);
  const consumoInferior = Math.max(0, bruto.inferior * escala);
  const consumoSuperior = Math.max(0, bruto.superior * escala);

  const tarifa = tarifaProyectada(validas);

  const prediccion: Prediccion = {
    algoritmo: MODELO_PREDICCION,
    consumoEstimadoKwh: redondear(consumo),
    consumoEstimadoKwhInferior: redondear(consumoInferior),
    consumoEstimadoKwhSuperior: redondear(consumoSuperior),
    montoEstimado: redondear(consumo * tarifa),
    montoEstimadoInferior: redondear(consumoInferior * tarifa),
    montoEstimadoSuperior: redondear(consumoSuperior * tarifa),
    periodoProyectadoInicio,
    periodoProyectadoFin,
  };

  return { estado: "ok", nBoletas: validas.length, prediccion };
}
