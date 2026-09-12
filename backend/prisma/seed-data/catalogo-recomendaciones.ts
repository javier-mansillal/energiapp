// Catálogo de reglas de recomendaciones para el seeder.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ EDITAR ACÁ: el texto (título y plantilla) vive en este archivo. El motor  │
// │ de recomendaciones (src/lib/recomendaciones) tiene la LÓGICA de cada      │
// │ regla, keyed por `codigoRegla`. Si agregas una regla acá, agrega también  │
// │ su evaluador en reglas.ts, o nunca se disparará.                          │
// │                                                                           │
// │ El seeder iguala por `codigoRegla`:                                       │
// │  - si agregas una regla, se crea;                                         │
// │  - si cambias texto/impacto, se actualiza;                                │
// │  - si renombras un codigoRegla, se crea una nueva y la vieja queda.       │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Placeholders disponibles en las plantillas (los rellena el motor con datos
// reales del hogar): {nombre}, {kwh}, {horas}, {region}, {promedio}, {ahorro},
// {pct}, {tarifa}.

export type CategoriaRecomendacion = "VAMPIRO" | "COMPARATIVA" | "USO_EFICIENTE";
export type ImpactoRecomendacion = "ALTO" | "MEDIO" | "BAJO";

export type RecomendacionSeed = {
  codigoRegla: string;
  titulo: string;
  descripcionPlantilla: string;
  categoria: CategoriaRecomendacion;
  impactoEstimado: ImpactoRecomendacion;
};

export const recomendaciones: RecomendacionSeed[] = [
  // ── VAMPIRO: consumo en espera de aparatos ──
  {
    codigoRegla: "vampiro-mayor",
    titulo: "Desconecta {nombre} cuando no lo uses",
    descripcionPlantilla:
      "Tu {nombre} consume {kwh} kWh al mes en modo espera (consumo vampiro). " +
      "Desenchufarlo mientras no lo usas evita ese gasto sin perder funcionalidad.",
    categoria: "VAMPIRO",
    impactoEstimado: "ALTO",
  },
  {
    codigoRegla: "vampiro-total",
    titulo: "Varios aparatos en modo espera",
    descripcionPlantilla:
      "El modo espera de tus aparatos suma {kwh} kWh al mes. Un multicontacto " +
      "con interruptor te permite apagarlos todos de una vez al salir de casa.",
    categoria: "VAMPIRO",
    impactoEstimado: "MEDIO",
  },

  // ── USO_EFICIENTE: hábitos y mantenimiento ──
  {
    codigoRegla: "uso-horas-altas",
    titulo: "Reduce el uso de {nombre}",
    descripcionPlantilla:
      "Usas {nombre} {horas} h/día. Reducir 1 hora diaria equivale a unos " +
      "{kwh} kWh al mes: apágalo cuando no lo estés usando de verdad.",
    categoria: "USO_EFICIENTE",
    impactoEstimado: "MEDIO",
  },
  {
    codigoRegla: "refrigerador-mantenimiento",
    titulo: "Mantén tu refrigerador eficiente",
    descripcionPlantilla:
      "Un refrigerador mal mantenido puede consumir hasta un 30% más: revisa " +
      "la goma de la puerta, descongela cuando acumule hielo y evita meter " +
      "comida caliente. Ahorro estimado: {kwh} kWh al mes.",
    categoria: "USO_EFICIENTE",
    impactoEstimado: "MEDIO",
  },
  {
    codigoRegla: "consumo-por-persona",
    titulo: "Tu consumo por persona es alto",
    descripcionPlantilla:
      "Consumes {kwh} kWh por persona al mes. Revisa iluminación, standby y " +
      "climatización: pequeños cambios de hábito reducen la cuenta sin sacrificar " +
      "confort. Ahorro estimado: {ahorro} kWh al mes.",
    categoria: "USO_EFICIENTE",
    impactoEstimado: "BAJO",
  },

  // ── COMPARATIVA: tendencia, tarifa y región ──
  {
    codigoRegla: "tendencia-alza",
    titulo: "Tu consumo va en aumento",
    descripcionPlantilla:
      "Tu consumo subió un {pct}% respecto al mes anterior. Revisa qué aparato " +
      "nuevo o hábito explica el alza antes de que se vuelva permanente.",
    categoria: "COMPARATIVA",
    impactoEstimado: "MEDIO",
  },
  {
    codigoRegla: "tarifa-alta",
    titulo: "Tu tarifa está sobre el promedio",
    descripcionPlantilla:
      "Pagas {tarifa} por kWh, sobre el promedio nacional. Compara planes de " +
      "otras distribuidoras o revisa si un cambio de tarifa te conviene.",
    categoria: "COMPARATIVA",
    impactoEstimado: "MEDIO",
  },
  {
    codigoRegla: "region-alta",
    titulo: "Consumes más que hogares similares en {region}",
    descripcionPlantilla:
      "En {region}, hogares similares consumen en promedio {promedio} kWh al mes; " +
      "tú consumes {kwh}. Ajustando tus hábitos podrías ahorrar alrededor de " +
      "{ahorro} kWh al mes.",
    categoria: "COMPARATIVA",
    impactoEstimado: "ALTO",
  },
];