// Utilidades de parseo compartidas entre los parsers de distribuidoras.

export const MESES: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

// Convierte un número con separador de miles (punto) y decimal (coma o punto)
// a número: "1.234" → 1234, "666,5" → 666.5.
export function aNumero(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// Convierte una fecha en formato texto chileno "05 nov 2024" o numérico
// "05/11/2024" a ISO yyyy-mm-dd. Devuelve undefined si no la reconoce.
export function aIso(fecha: string): string | undefined {
  const txt = fecha.match(
    /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\s+(\d{4})/i
  );
  if (txt) {
    const [, d, mes, y] = txt;
    return `${y}-${String(MESES[mes.toLowerCase()]).padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const num = fecha.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (num) {
    const [, d, mo, y] = num;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return undefined;
}

// Etiquetas de montos que NO representan el consumo del período actual: mora,
// compensaciones de la empresa y consumo/impago de meses anteriores. Incluirlos
// contaminaría los KPIs y las predicciones (que derivan la tarifa de
// monto/consumo), así que se excluyen de la suma. También se excluyen las
// líneas de "total" para no duplicar el resto de los cargos cuando existen.
const EXCLUIDOS_RE =
  /mora|inter[eé]s|compensaci[oó]n|impago|saldo\s*anterior|consumo\s*anterior|\btotal\b/i;

// Suma los montos en pesos ($) de las líneas "Label $ 12.345" o "Label $ -123",
// saltando las etiquetas excluidas. Es la base del montoTotal de cada parser.
export function sumarCargos(texto: string): number {
  let total = 0;
  for (const linea of texto.split("\n")) {
    const m = linea.match(/^\s*(.+?)\s+\$\s*(-?[\d.]+)\s*$/);
    if (!m) continue;
    if (EXCLUIDOS_RE.test(m[1].trim())) continue;
    total += parseInt(m[2].replace(/\./g, ""), 10);
  }
  return total;
}
