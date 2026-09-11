import type { BoletaExtraida } from "../types";
import { aIso, aNumero, sumarCargos } from "../utilidades";

// Parser específico para boletas de Enel (layout de Enel Distribución Chile).
export function parseEnel(texto: string): BoletaExtraida {
  const camposFaltantes: string[] = [];
  const datos: BoletaExtraida = { confianza: "media", camposFaltantes };

  // Número de cliente: suele aparecer como "Nº Cliente" o "Número de cliente".
  const cliente = texto.match(/N[º°]?\s*Cliente\s*:?\s*([\d\s-]{6,20})/i);
  if (cliente) datos.numeroCliente = cliente[1].trim();
  else camposFaltantes.push("numeroCliente");

  // Empresa: si el texto menciona Enel, lo fijamos.
  if (/enel/i.test(texto)) datos.empresaDistribuidora = "Enel";

  // Consumo en kWh: primer "N kWh".
  const kwh = texto.match(/(\d{1,4}(?:[.,]\d{1,2})?)\s*kWh/i);
  if (kwh) datos.consumoKwh = aNumero(kwh[1]);
  else camposFaltantes.push("consumoKwh");

  // Monto total: suma de los cargos del período actual (excluye mora,
  // compensaciones y saldo anterior para no contaminar KPIs ni predicciones).
  const total = sumarCargos(texto);
  if (total > 0) datos.montoTotal = total;
  else camposFaltantes.push("montoTotal");

  // Fechas de lectura: buscar "Desde" y "Hasta" (o "Período").
  const desde = texto.match(/Desde\s*:?\s*(\d{1,2}\s+[a-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  const hasta = texto.match(/Hasta\s*:?\s*(\d{1,2}\s+[a-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (desde) datos.fechaInicioLectura = aIso(desde[1]);
  else camposFaltantes.push("fechaInicioLectura");
  if (hasta) datos.fechaFinLectura = aIso(hasta[1]);
  else camposFaltantes.push("fechaFinLectura");

  // Fecha de emisión.
  const emision = texto.match(/Emisi[oó]n\s*:?\s*(\d{1,2}\s+[a-z]{3,9}\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (emision) datos.fechaEmision = aIso(emision[1]);

  // Confianza: si faltan campos clave, baja.
  if (camposFaltantes.length > 2) datos.confianza = "baja";
  else if (camposFaltantes.length === 0) datos.confianza = "alta";

  return datos;
}
