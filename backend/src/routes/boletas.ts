import { Router } from "express";
import multer from "multer";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { uploadPdf, deleteObject, createSignedUrl } from "../lib/storage";
import { extractTextFromPdf } from "../lib/pdf/extractText";
import { parseBoleta } from "../lib/pdf/parsers";

const router = Router();

// Todas las rutas de boletas requieren sesión válida.
router.use(requireAuth);

// Límite de archivo: 5 MB (igual que el bucket en Supabase).
const MAX_PDF_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES },
});

// Valida que el buffer empiece con la firma de un PDF (%PDF-).
function isPdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString() === "%PDF-";
}

// POST /api/boletas → crea una boleta (manual o con PDF adjunto).
// multipart/form-data: hogarId, consumoKwh, montoTotal, fechaInicioLectura,
// fechaFinLectura (obligatorios) + empresaDistribuidora, numeroCliente,
// fechaEmision, pdf (opcionales).
router.post(
  "/",
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "El PDF supera el límite de 5 MB"
            : "Error al procesar el archivo";
        return res.status(400).json({ error: message });
      }
      next();
    });
  },
  async (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    const {
      hogarId,
      consumoKwh,
      montoTotal,
      fechaInicioLectura,
      fechaFinLectura,
      empresaDistribuidora,
      numeroCliente,
      fechaEmision,
    } = body;

    if (
      !hogarId ||
      !consumoKwh ||
      !montoTotal ||
      !fechaInicioLectura ||
      !fechaFinLectura
    ) {
      return res.status(400).json({
        error:
          "Faltan datos: hogarId, consumoKwh, montoTotal, fechaInicioLectura y fechaFinLectura son obligatorios",
      });
    }

    let pdfUrl: string | null = null;
    try {
      // El hogar debe pertenecer al usuario autenticado.
      const hogar = await prisma.hogar.findFirst({
        where: { id: hogarId, usuarioId: req.userId! },
      });
      if (!hogar) {
        return res.status(404).json({ error: "Hogar no encontrado" });
      }

      // Si viene PDF, validar firma y subirlo al storage.
      const file = req.file;
      if (file) {
        if (!isPdf(file.buffer)) {
          return res.status(400).json({ error: "El archivo debe ser un PDF" });
        }
        pdfUrl = await uploadPdf(req.token!, req.userId!, hogarId, file.buffer);
      }

      const boleta = await prisma.boleta.create({
        data: {
          hogarId,
          consumoKwh: String(consumoKwh),
          montoTotal: String(montoTotal),
          fechaInicioLectura: new Date(fechaInicioLectura),
          fechaFinLectura: new Date(fechaFinLectura),
          empresaDistribuidora: empresaDistribuidora || null,
          numeroCliente: numeroCliente || null,
          fechaEmision: fechaEmision ? new Date(fechaEmision) : null,
          tipoOrigen: file ? "PDF_AUTOMATICO" : "MANUAL",
          pdfUrl,
        },
      });

      res.status(201).json(boleta);
    } catch (err) {
      // Si falló la creación en BD, no dejar el PDF huérfano en el storage.
      if (pdfUrl) {
        try {
          await deleteObject(req.token!, pdfUrl);
        } catch {
          // Si el borrado falla, el archivo queda huérfano; se puede limpiar luego.
        }
      }
      res.status(500).json({ error: "Error al crear la boleta" });
    }
  }
);

// POST /api/boletas/analizar-texto → analiza texto pegado (para iterar los regex
// sin tener que subir un PDF cada vez). Recibe { texto }.
router.post("/analizar-texto", async (req: AuthedRequest, res) => {
  const { texto } = req.body ?? {};
  if (!texto || typeof texto !== "string" || texto.trim().length < 10) {
    return res.status(400).json({ error: "El texto es muy corto o vacío" });
  }

  try {
    const resultado = parseBoleta(texto);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: "Error al analizar el texto" });
  }
});

// POST /api/boletas/analizar → sube un PDF, extrae el texto y lo analiza.
// multipart/form-data: pdf (obligatorio).
router.post(
  "/analizar",
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? "El PDF supera el límite de 5 MB"
            : "Error al procesar el archivo";
        return res.status(400).json({ error: message });
      }
      next();
    });
  },
  async (req: AuthedRequest, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Falta el archivo pdf" });
    }
    if (!isPdf(file.buffer)) {
      return res.status(400).json({ error: "El archivo debe ser un PDF" });
    }

    try {
      const texto = await extractTextFromPdf(file.buffer);
      if (!texto.trim()) {
        return res.status(422).json({
          error: "No se pudo extraer texto del PDF (¿está escaneado?)",
        });
      }
      const resultado = parseBoleta(texto);
      res.json(resultado);
    } catch (err) {
      res.status(500).json({ error: "Error al analizar el PDF" });
    }
  }
);

// GET /api/boletas?hogarId= → lista las boletas del hogar (solo si es del usuario).
router.get("/", async (req: AuthedRequest, res) => {
  const { hogarId } = req.query as { hogarId?: string };
  if (!hogarId) {
    return res.status(400).json({ error: "Falta el parámetro hogarId" });
  }

  try {
    const start = Date.now();
    const hogar = await prisma.hogar.findFirst({
      where: { id: hogarId, usuarioId: req.userId! },
    });
    if (!hogar) {
      return res.status(404).json({ error: "Hogar no encontrado" });
    }

    const boletas = await prisma.boleta.findMany({
      where: { hogarId },
      orderBy: { fechaFinLectura: "desc" },
    });
    console.log(`[db] listar boletas: ${Date.now() - start}ms`);
    res.json(boletas);
  } catch (err) {
    res.status(500).json({ error: "Error al listar boletas" });
  }
});

// GET /api/boletas/:id/pdf → genera una URL firmada temporal para ver/descargar el PDF.
router.get("/:id/pdf", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };

  try {
    const boleta = await prisma.boleta.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
    });
    if (!boleta) {
      return res.status(404).json({ error: "Boleta no encontrada" });
    }
    if (!boleta.pdfUrl) {
      return res.status(404).json({ error: "Esta boleta no tiene PDF adjunto" });
    }

    const signedURL = await createSignedUrl(req.token!, boleta.pdfUrl);
    res.json({ signedURL });
  } catch (err) {
    res.status(500).json({ error: "Error al generar el enlace del PDF" });
  }
});

// PATCH /api/boletas/:id → actualiza los datos de una boleta (solo si es del usuario).
router.patch("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };

  try {
    const boleta = await prisma.boleta.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
    });
    if (!boleta) {
      return res.status(404).json({ error: "Boleta no encontrada" });
    }

    const body = req.body ?? {};
    const data: Record<string, unknown> = {};

    if (body.consumoKwh !== undefined) data.consumoKwh = String(body.consumoKwh);
    if (body.montoTotal !== undefined) data.montoTotal = String(body.montoTotal);
    if (body.fechaInicioLectura !== undefined)
      data.fechaInicioLectura = new Date(body.fechaInicioLectura);
    if (body.fechaFinLectura !== undefined)
      data.fechaFinLectura = new Date(body.fechaFinLectura);
    if (body.empresaDistribuidora !== undefined)
      data.empresaDistribuidora = body.empresaDistribuidora || null;
    if (body.numeroCliente !== undefined)
      data.numeroCliente = body.numeroCliente || null;
    if (body.fechaEmision !== undefined)
      data.fechaEmision = body.fechaEmision ? new Date(body.fechaEmision) : null;

    const updated = await prisma.boleta.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la boleta" });
  }
});

// DELETE /api/boletas/:id → elimina la boleta y su PDF del storage.
router.delete("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };

  try {
    const boleta = await prisma.boleta.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
    });
    if (!boleta) {
      return res.status(404).json({ error: "Boleta no encontrada" });
    }

    await prisma.boleta.delete({ where: { id } });

    if (boleta.pdfUrl) {
      try {
        await deleteObject(req.token!, boleta.pdfUrl);
      } catch {
        // Si el borrado falla, el archivo queda huérfano; se puede limpiar luego.
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la boleta" });
  }
});

export default router;