// Tipos del módulo de recomendaciones.
// El motor es puro: recibe un contexto armado con datos reales del hogar y el
// catálogo de reglas, y devuelve las recomendaciones que aplican. No conoce Prisma.

export type CategoriaRecomendacion = "VAMPIRO" | "COMPARATIVA" | "USO_EFICIENTE";
export type ImpactoRecomendacion = "ALTO" | "MEDIO" | "BAJO";

// Regla del catálogo (fila de catalogo_recomendaciones).
export interface CatalogoRegla {
  id: string;
  codigoRegla: string;
  titulo: string;
  descripcionPlantilla: string;
  categoria: CategoriaRecomendacion;
  impactoEstimado: ImpactoRecomendacion;
}

// Aparato del hogar normalizado para el motor.
export interface ElectrodomesticoCtx {
  nombre: string;
  catalogoNombre: string | null;
  potenciaW: number;
  consumoVampiroW: number;
  horasUsoDiario: number;
  cantidad: number;
}

// Boleta normalizada (los Decimal de Prisma ya vienen como number).
export interface BoletaCtx {
  consumoKwh: number;
  montoTotal: number;
  fechaInicioLectura: Date;
  fechaFinLectura: Date;
}

// Contexto completo con el que se evalúan las reglas.
export interface ContextoRecomendacion {
  region: string;
  cantidadPersonas: number;
  // Consentimiento del usuario para comparaciones anónimas. Si es false, la
  // regla "region-alta" no se dispara.
  permiteComparaciones: boolean;
  // Promedio de consumo del último mes de otros usuarios de la app en la misma
  // región (que hayan optado por compartir). null si no hay datos comparables.
  promedioRegionalKwh: number | null;
  // Último mes con boleta.
  consumoUltimoMesKwh: number;
  montoUltimoMes: number;
  tarifaEfectiva: number; // $/kWh
  // Variación porcentual del consumo entre el penúltimo y el último mes.
  variacionPct: number | null;
  consumoPorPersonaKwh: number;
  electrodomesticos: ElectrodomesticoCtx[];
}

// Recomendación concreta, lista para persistir en recomendaciones_hogar.
export interface RecomendacionGenerada {
  catalogoId: string;
  codigoRegla: string;
  titulo: string;
  descripcion: string;
  ahorroEstimadoKwh: number;
}