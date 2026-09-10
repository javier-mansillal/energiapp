// Tipos compartidos del sistema de parsing de boletas.

export type Confianza = "alta" | "media" | "baja";

// Datos extraídos de una boleta. Todos los campos son opcionales porque
// el parser puede no encontrar todo; el front decide qué mostrar.
export interface BoletaExtraida {
  empresaDistribuidora?: string;
  numeroCliente?: string;
  fechaEmision?: string; // ISO yyyy-mm-dd
  fechaInicioLectura?: string; // ISO yyyy-mm-dd
  fechaFinLectura?: string; // ISO yyyy-mm-dd
  consumoKwh?: number;
  montoTotal?: number;
  confianza: Confianza;
  camposFaltantes: string[];
}

// Resultado del análisis: datos + texto extraído (útil para depurar).
export interface ResultadoAnalisis {
  datos: BoletaExtraida;
  texto: string;
  distribuidoraDetectada: string | null;
}