// Tipos del módulo de predicción de consumo.
// El módulo es puro: recibe boletas y devuelve una predicción. No conoce Prisma.

// Modelo estadístico usado. Hoy solo hay regresión lineal; el campo se guarda
// en la tabla `predicciones` por si se agregan modelos a futuro.
export const ALGORITMO_REGRESION = "REGRESION";
export type AlgoritmoPrediccion = typeof ALGORITMO_REGRESION;

// Entrada mínima por cada boleta histórica. Los Decimal de Prisma se
// normalizan a number antes de entrar acá.
export interface BoletaParaPrediccion {
  consumoKwh: number;
  montoTotal: number;
  fechaInicioLectura: Date;
  fechaFinLectura: Date;
}

// Salida cruda del modelo: valor puntual + intervalo del 95% + diagnóstico
// del ajuste. Todo en "kWh por 30 días" (base de normalización).
export interface Pronostico {
  valor: number;
  inferior: number;
  superior: number;
  parametros: Record<string, number>;
}

// Predicción final, ya escalada al período proyectado real y con el monto
// derivado de la tarifa proyectada. Mapea 1:1 con la tabla `predicciones`.
export interface Prediccion {
  algoritmo: AlgoritmoPrediccion;
  consumoEstimadoKwh: number;
  consumoEstimadoKwhInferior: number;
  consumoEstimadoKwhSuperior: number;
  montoEstimado: number;
  montoEstimadoInferior: number;
  montoEstimadoSuperior: number;
  periodoProyectadoInicio: Date;
  periodoProyectadoFin: Date;
}

// Resultado del cálculo: o hay predicción, o no alcanzan las boletas.
export type ResultadoPrediccion =
  | { estado: "ok"; nBoletas: number; prediccion: Prediccion }
  | { estado: "insuficiente"; minimoBoletas: number; nBoletas: number };
