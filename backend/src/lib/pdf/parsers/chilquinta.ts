import type { BoletaExtraida } from "../types";
import { aIso, aNumero, sumarCargos } from "../utilidades";

// Expresión de mes en formato texto chileno: "nov" (también acepta el nombre
// completo, ej. "diciembre", y se recorta en aIso).
const MES_RE = "(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*";

// Parser específico para boletas de Chilquinta (layout de Chilquinta Energía).
export function parseChilquinta(texto: string): BoletaExtraida {
  const camposFaltantes: string[] = [];
  const datos: BoletaExtraida = { confianza: "media", camposFaltantes };

  // Empresa: si el texto menciona Chilquinta, lo fijamos.
  if (/chilquinta/i.test(texto)) datos.empresaDistribuidora = "Chilquinta";

  // Número de cliente: formato "737025-3". Suele ir junto a la fecha de emisión
  // ("737025-3\n10 dic 2024"). Primero se intenta con etiqueta y, si no, con el
  // patrón suelto (el guion lo hace distintivo).
  const cliente =
    texto.match(
      /(?:N[º°]?\s*Cliente|C[oó]digo\s*Cliente|Cliente)\s*:?\s*(\d{4,7}-\d{1,2})/i
    ) ?? texto.match(/\b(\d{4,7}-\d{1,2})\b/);
  if (cliente) datos.numeroCliente = cliente[1].trim();
  else camposFaltantes.push("numeroCliente");

  // Fecha de emisión: la primera fecha en formato "dd mmm aaaa" justo después
  // del número de cliente (limitar la ventana evita agarrar el período).
  if (cliente) {
    const despues = texto.slice(cliente.index! + cliente[0].length, cliente.index! + cliente[0].length + 150);
    const emision = despues.match(new RegExp(`(\\d{1,2}\\s+${MES_RE}\\s+\\d{4})`, "i"));
    if (emision) datos.fechaEmision = aIso(emision[1]);
  }

  // Período de lectura: "Monto del período: 05 nov 2024 - 04 dic 2024" (o con
  // fechas numéricas dd/mm/aaaa).
  const periodo = texto.match(
    new RegExp(
      `[Pp]er[íi]odo\\s*:?\\s*(\\d{1,2}\\s+${MES_RE}\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})\\s*-\\s*(\\d{1,2}\\s+${MES_RE}\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})`
    )
  );
  if (periodo) {
    datos.fechaInicioLectura = aIso(periodo[1]);
    datos.fechaFinLectura = aIso(periodo[2]);
    if (!datos.fechaInicioLectura) camposFaltantes.push("fechaInicioLectura");
    if (!datos.fechaFinLectura) camposFaltantes.push("fechaFinLectura");
  } else {
    camposFaltantes.push("fechaInicioLectura", "fechaFinLectura");
  }

  // Consumo: línea "Electricidad consumida 666 kWh $ 156.656".
  const consumo = texto.match(/Electricidad\s+consumida\s+([\d.,]+)\s*kWh/i);
  if (consumo) datos.consumoKwh = aNumero(consumo[1]);
  else camposFaltantes.push("consumoKwh");

  // Monto total: suma de los cargos del período actual. Se excluyen mora,
  // compensaciones y saldo anterior (meses previos) para no contaminar los KPIs
  // ni las predicciones.
  const total = sumarCargos(texto);
  if (total > 0) datos.montoTotal = total;
  else camposFaltantes.push("montoTotal");

  // Confianza: si faltan campos clave, baja.
  if (camposFaltantes.length > 2) datos.confianza = "baja";
  else if (camposFaltantes.length === 0) datos.confianza = "alta";

  return datos;
}
