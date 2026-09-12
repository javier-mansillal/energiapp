import type {
  CatalogoRegla,
  ContextoRecomendacion,
  ElectrodomesticoCtx,
  RecomendacionGenerada,
} from "./types";

// Días por mes usado para estimar consumos mensuales (mismo criterio que el
// resto de la app).
const DIAS_MES = 30;

// Tarifa promedio nacional de referencia ($/kWh) para la regla "tarifa-alta".
// Valor estimado para el prototipo; ajustar con datos reales del mercado.
const TARIFA_PROMEDIO_NACIONAL = 180;

// Umbrales de las reglas.
const VAMPIRO_MIN_W = 10; // W en espera para considerar "vampiro alto"
const VAMPIRO_TOTAL_MIN_KWH = 20; // kWh/mes para la regla de vampiros totales
const HORAS_ALTAS_MIN = 8; // h/día
const CONSUMO_POR_PERSONA_MAX = 120; // kWh/persona/mes
const VARIACION_ALZA_MIN_PCT = 10; // % de alza para "tendencia-alza"
const REGION_EXCESO_MIN_PCT = 20; // % sobre el promedio regional para disparar

// Rellena los placeholders {clave} de una plantilla con valores reales.
function rellenar(plantilla: string, vars: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

function redondear(n: number): number {
  return Math.round(n * 10) / 10;
}

// Consumo mensual estimado de un aparato (kWh/mes), mismo criterio que la app:
// (potencia·horas + vampiro·(24−horas)) · cantidad · 30 / 1000.
function consumoMensualKwh(e: ElectrodomesticoCtx): number {
  return (
    ((e.potenciaW * e.horasUsoDiario + e.consumoVampiroW * (24 - e.horasUsoDiario)) *
      e.cantidad *
      DIAS_MES) /
    1000
  );
}

// Consumo mensual del modo espera de un aparato (kWh/mes).
function vampiroMensualKwh(e: ElectrodomesticoCtx): number {
  return ((e.consumoVampiroW * 24 * DIAS_MES) / 1000) * e.cantidad;
}

// Registro de evaluadores por codigoRegla. Cada evaluador recibe el contexto y
// la regla del catálogo (con su texto), y devuelve la recomendación concreta o
// null si la condición no aplica.
export type Evaluador = (
  ctx: ContextoRecomendacion,
  regla: CatalogoRegla
) => RecomendacionGenerada | null;

function base(regla: CatalogoRegla, vars: Record<string, string | number>, ahorro: number) {
  return {
    catalogoId: regla.id,
    codigoRegla: regla.codigoRegla,
    titulo: rellenar(regla.titulo, vars),
    descripcion: rellenar(regla.descripcionPlantilla, vars),
    ahorroEstimadoKwh: redondear(ahorro),
  };
}

export const REGLAS: Record<string, Evaluador> = {
  // ── VAMPIRO ──────────────────────────────────────────────────────────────
  "vampiro-mayor": (ctx, regla) => {
    const peor = [...ctx.electrodomesticos].sort(
      (a, b) => vampiroMensualKwh(b) - vampiroMensualKwh(a)
    )[0];
    if (!peor || peor.consumoVampiroW < VAMPIRO_MIN_W) return null;
    const kwh = vampiroMensualKwh(peor);
    return base(regla, { nombre: peor.nombre, kwh }, kwh);
  },

  "vampiro-total": (ctx, regla) => {
    const conVampiro = ctx.electrodomesticos.filter((e) => e.consumoVampiroW > 0);
    if (conVampiro.length < 2) return null;
    const total = conVampiro.reduce((s, e) => s + vampiroMensualKwh(e), 0);
    if (total < VAMPIRO_TOTAL_MIN_KWH) return null;
    return base(regla, { kwh: redondear(total) }, total);
  },

  // ── USO_EFICIENTE ────────────────────────────────────────────────────────
  "uso-horas-altas": (ctx, regla) => {
    // Equipos de refrigeración están siempre encendidos: no aplica "reduce 1 h".
    const esSiempreEncendido = (e: ElectrodomesticoCtx) => {
      const nombre = (e.catalogoNombre ?? e.nombre).toLowerCase();
      return (
        nombre.includes("refrigerador") ||
        nombre.includes("frigobar") ||
        nombre.includes("freezer") ||
        nombre.includes("congelador")
      );
    };
    const aparato = ctx.electrodomesticos
      .filter((e) => !esSiempreEncendido(e))
      .sort((a, b) => b.horasUsoDiario - a.horasUsoDiario)[0];
    if (!aparato || aparato.horasUsoDiario < HORAS_ALTAS_MIN) return null;
    // Ahorro por reducir 1 h/día de uso.
    const kwh = ((aparato.potenciaW * 1 * DIAS_MES) / 1000) * aparato.cantidad;
    return base(
      regla,
      { nombre: aparato.nombre, horas: aparato.horasUsoDiario, kwh: redondear(kwh) },
      kwh
    );
  },

  "refrigerador-mantenimiento": (ctx, regla) => {
    const refri = ctx.electrodomesticos.find((e) => {
      const nombre = (e.catalogoNombre ?? e.nombre).toLowerCase();
      return (
        nombre.includes("refrigerador") ||
        nombre.includes("frigobar") ||
        nombre.includes("freezer") ||
        nombre.includes("congelador")
      );
    });
    if (!refri) return null;
    // Mantenimiento puede recuperar ~10% del consumo del equipo.
    const kwh = consumoMensualKwh(refri) * 0.1;
    return base(regla, { kwh: redondear(kwh) }, kwh);
  },

  "consumo-por-persona": (ctx, regla) => {
    if (ctx.cantidadPersonas <= 0 || ctx.consumoPorPersonaKwh <= CONSUMO_POR_PERSONA_MAX) {
      return null;
    }
    const ahorro = ctx.consumoUltimoMesKwh * 0.05;
    return base(
      regla,
      { kwh: redondear(ctx.consumoPorPersonaKwh), ahorro: redondear(ahorro) },
      ahorro
    );
  },

  // ── COMPARATIVA ──────────────────────────────────────────────────────────
  "tendencia-alza": (ctx, regla) => {
    if (ctx.variacionPct === null || ctx.variacionPct < VARIACION_ALZA_MIN_PCT) return null;
    const ahorro = ctx.consumoUltimoMesKwh * 0.05;
    return base(
      regla,
      { pct: Math.round(ctx.variacionPct), ahorro: redondear(ahorro) },
      ahorro
    );
  },

  "tarifa-alta": (ctx, regla) => {
    if (ctx.tarifaEfectiva <= TARIFA_PROMEDIO_NACIONAL) return null;
    // Cambiar de plan/tarifa puede ahorrar ~8% del consumo.
    const ahorro = ctx.consumoUltimoMesKwh * 0.08;
    return base(
      regla,
      { tarifa: `$${Math.round(ctx.tarifaEfectiva).toLocaleString("es-CL")}` },
      ahorro
    );
  },

  "region-alta": (ctx, regla) => {
    // Requiere consentimiento del usuario Y datos comparables de otros usuarios
    // de la app en la misma región. Sin eso, la regla no se dispara.
    if (!ctx.permiteComparaciones || ctx.promedioRegionalKwh === null) return null;
    const excesoMin = ctx.promedioRegionalKwh * (1 + REGION_EXCESO_MIN_PCT / 100);
    if (ctx.consumoUltimoMesKwh <= excesoMin) return null;
    const ahorro = Math.max(0, ctx.consumoUltimoMesKwh - ctx.promedioRegionalKwh);
    return base(
      regla,
      {
        region: ctx.region,
        promedio: redondear(ctx.promedioRegionalKwh),
        kwh: redondear(ctx.consumoUltimoMesKwh),
        ahorro: redondear(ahorro),
      },
      ahorro
    );
  },
};