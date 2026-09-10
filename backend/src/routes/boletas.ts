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

// Convierte un mes "YYYY-MM" en el período completo: primer y último día.
// Se usa mediodía UTC para que la fecha no se corra de mes en zonas horarias
// como la de Chile (UTC-4).
function periodoDesdeMes(mes: string): { inicio: Date; fin: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return null;
  const anio = Number(m[1]);
  const mesNum = Number(m[2]);
  if (mesNum < 1 || mesNum > 12) return null;
  return {
    inicio: new Date(Date.UTC(anio, mesNum - 1, 1, 12, 0, 0)),
    fin: new Date(Date.UTC(anio, mesNum, 0, 12, 0, 0)),
  };
}

// Resuelve el período de la boleta. Prioriza el mes; si no viene, acepta fechas
// explícitas (períodos que no calzan con un mes calendario, p. ej. de un PDF).
function resolverPeriodo(input: {
  mes?: unknown;
  fechaInicioLectura?: unknown;
  fechaFinLectura?: unknown;
}): { inicio: Date; fin: Date } | null {
  if (typeof input.mes === "string" && input.mes) {
    return periodoDesdeMes(input.mes);
  }
  if (input.fechaInicioLectura && input.fechaFinLectura) {
    const inicio = new Date(input.fechaInicioLectura as string);
    const fin = new Date(input.fechaFinLectura as string);
    if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fin.getTime())) {
      return { inicio, fin };
    }
  }
  return null;
}

// POST /api/boletas → crea una boleta (manual o con PDF adjunto).
// multipart/form-data: hogarId, consumoKwh, montoTotal y mes (obligatorios) +
// empresaDistribuidora, numeroCliente, fechaEmision, pdf (opcionales).
// El mes ("YYYY-MM") se expande al primer y último día del mes.
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
      mes,
      fechaInicioLectura,
      fechaFinLectura,
      empresaDistribuidora,
      numeroCliente,
      fechaEmision,
    } = body;

    if (!hogarId || !consumoKwh || !montoTotal) {
      return res.status(400).json({
        error: "Faltan datos: hogarId, consumoKwh y montoTotal son obligatorios",
      });
    }

    const periodo = resolverPeriodo({ mes, fechaInicioLectura, fechaFinLectura });
    if (!periodo) {
      return res.status(400).json({
        error: "Falta el mes de la boleta (formato YYYY-MM)",
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
          fechaInicioLectura: periodo.inicio,
          fechaFinLectura: periodo.fin,
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
      console.error("[analizar] Error al analizar el PDF:", err);
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
    // El mes se expande al período completo; si no viene, se aceptan fechas
    // explícitas (períodos que no calzan con un mes calendario).
    if (body.mes !== undefined) {
      const periodo = resolverPeriodo({ mes: body.mes });
      if (!periodo) {
        return res.status(400).json({ error: "El mes debe tener formato YYYY-MM" });
      }
      data.fechaInicioLectura = periodo.inicio;
      data.fechaFinLectura = periodo.fin;
    } else {
      if (body.fechaInicioLectura !== undefined)
        data.fechaInicioLectura = new Date(body.fechaInicioLectura);
      if (body.fechaFinLectura !== undefined)
        data.fechaFinLectura = new Date(body.fechaFinLectura);
    }
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