import type { BoletaExtraida } from "../types";

// Utilidades de parseo compartidas.
const MONTO_RE = /(\d{1,3}(?:\.\d{3})*)\s*(?:CLP|\$|pesos)/i;
const KWH_RE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*kWh/i;
const FECHA_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/g;

function parseFecha(texto: string): string | undefined {
  const m = texto.match(FECHA_RE);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Parser genérico: busca patrones universales de boletas eléctricas.
// Se usa como fallback cuando no se detecta una distribuidora conocida.
export function parseGenerico(texto: string): BoletaExtraida {
  const camposFaltantes: string[] = [];
  const datos: BoletaExtraida = { confianza: "baja", camposFaltantes };

  // Número de cliente (patrón genérico).
  const cliente = texto.match(/(?:N[º°]?\s*Cliente|C[oó]digo\s*Cliente|Cliente\s*N[º°]?)\s*:?\s*([\d\s-]{6,20})/i);
  if (cliente) datos.numeroCliente = cliente[1].trim();
  else camposFaltantes.push("numeroCliente");

  // Consumo en kWh.
  const kwh = texto.match(KWH_RE);
  if (kwh) datos.consumoKwh = parseFloat(kwh[1].replace(".", "").replace(",", "."));
  else camposFaltantes.push("consumoKwh");

  // Monto total.
  const monto = texto.match(MONTO_RE);
  if (monto) datos.montoTotal = parseInt(monto[1].replace(/\./g, ""), 10);
  else camposFaltantes.push("montoTotal");

  // Fechas: buscar "Desde/Hasta" o "Período".
  const desde = texto.match(/Desde\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const hasta = texto.match(/Hasta\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (desde) datos.fechaInicioLectura = parseFecha(desde[1]);
  else camposFaltantes.push("fechaInicioLectura");
  if (hasta) datos.fechaFinLectura = parseFecha(hasta[1]);
  else camposFaltantes.push("fechaFinLectura");

  // Fecha de emisión.
  const emision = texto.match(/Emisi[oó]n\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (emision) datos.fechaEmision = parseFecha(emision[1]);

  // El genérico siempre es de confianza baja (no sabemos el layout).
  return datos;
}