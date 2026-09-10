import type { BoletaExtraida, ResultadoAnalisis } from "../types";
import { parseEnel } from "./enel";
import { parseChilquinta } from "./chilquinta";
import { parseGenerico } from "./generico";

// Detecta la distribuidora por palabras clave en el texto.
export function detectarDistribuidora(texto: string): string | null {
  const t = texto.toLowerCase();
  if (t.includes("enel")) return "Enel";
  if (t.includes("chilquinta")) return "Chilquinta";
  // Otras distribuidoras chilenas (para futuros parsers).
  if (t.includes("cge")) return "CGE";
  if (t.includes("frontel")) return "Frontel";
  if (t.includes("saesa")) return "Saesa";
  return null;
}

// Despacha al parser adecuado según la distribuidora detectada.
export function parseBoleta(texto: string): ResultadoAnalisis {
  const distribuidora = detectarDistribuidora(texto);
  let datos: BoletaExtraida;

  switch (distribuidora) {
    case "Enel":
      datos = parseEnel(texto);
      break;
    case "Chilquinta":
      datos = parseChilquinta(texto);
      break;
    default:
      datos = parseGenerico(texto);
      break;
  }

  return {
    datos,
    texto,
    distribuidoraDetectada: distribuidora,
  };
}