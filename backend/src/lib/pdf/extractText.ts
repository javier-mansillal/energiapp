// Importamos el build LEGACY de pdfjs-dist: es el que está pensado para Node
// (trae los polyfills de core-js para APIs ES2025 como Promise.try o
// Uint8Array.prototype.toHex). El build moderno asume Node 23+ y revienta en
// Node 22 con "Promise.try is not a function" / "hashOriginal.toHex is not a function".
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Extrae todo el texto de un PDF digital (sin OCR). Los PDFs escaneados
// (imágenes) devolverán texto vacío o casi vacío.
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const task = getDocument({
    data: new Uint8Array(buffer),
  });

  const doc = await task.promise;

  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Reconstruir el texto: cada item tiene .str y .hasEOL indica salto de línea.
      // (Los TextMarkedContent no tienen .str, se filtran.)
      const text = content.items
        .filter((item) => typeof (item as { str?: string }).str === "string")
        .map((item) => {
          const t = item as { str: string; hasEOL: boolean }
          return t.str + (t.hasEOL ? "\n" : "")
        })
        .join("");
      pages.push(text);
    }
    return pages.join("\n");
  } finally {
    await task.destroy();
  }
}