import { getDocument } from "pdfjs-dist";

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