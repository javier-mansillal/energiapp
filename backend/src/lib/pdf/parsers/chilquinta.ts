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

// Parser específico para boletas de Chilquinta (layout de Chilquinta Energía).
export function parseChilquinta(texto: string): BoletaExtraida {
  const camposFaltantes: string[] = [];
  const datos: BoletaExtraida = { confianza: "media", camposFaltantes };

  // Número de cliente: suele aparecer como "Nº Cliente" o "Código cliente".
  const cliente = texto.match(/(?:N[º°]?\s*Cliente|C[oó]digo\s*Cliente)\s*:?\s*([\d\s-]{6,20})/i);
  if (cliente) datos.numeroCliente = cliente[1].trim();
  else camposFaltantes.push("numeroCliente");

  // Empresa: si el texto menciona Chilquinta, lo fijamos.
  if (/chilquinta/i.test(texto)) datos.empresaDistribuidora = "Chilquinta";

  // Consumo en kWh.
  const kwh = texto.match(KWH_RE);
  if (kwh) datos.consumoKwh = parseFloat(kwh[1].replace(".", "").replace(",", "."));
  else camposFaltantes.push("consumoKwh");

  // Monto total.
  const monto = texto.match(MONTO_RE);
  if (monto) datos.montoTotal = parseInt(monto[1].replace(/\./g, ""), 10);
  else camposFaltantes.push("montoTotal");

  // Fechas de lectura: Chilquinta suele usar "Período" o "Desde/Hasta".
  const desde = texto.match(/Desde\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const hasta = texto.match(/Hasta\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (desde) datos.fechaInicioLectura = parseFecha(desde[1]);
  else camposFaltantes.push("fechaInicioLectura");
  if (hasta) datos.fechaFinLectura = parseFecha(hasta[1]);
  else camposFaltantes.push("fechaFinLectura");

  // Fecha de emisión.
  const emision = texto.match(/Emisi[oó]n\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (emision) datos.fechaEmision = parseFecha(emision[1]);

  // Confianza.
  if (camposFaltantes.length > 2) datos.confianza = "baja";
  else if (camposFaltantes.length === 0) datos.confianza = "alta";

  return datos;
}