import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { armarContexto, generarRecomendaciones } from "../lib/recomendaciones";
import type { BoletaCtx, ElectrodomesticoCtx } from "../lib/recomendaciones";

const router = Router();

// Todas las rutas de recomendaciones requieren sesión válida.
router.use(requireAuth);

const ESTADOS_VALIDOS = ["PENDIENTE", "APLICADA", "IGNORADA"] as const;
type EstadoRecomendacion = (typeof ESTADOS_VALIDOS)[number];

interface RecomendacionCruda {
  id: string;
  hogarId: string;
  catalogoId: string | null;
  titulo: string;
  descripcion: string;
  ahorroEstimadoKwh: unknown;
  estado: EstadoRecomendacion;
  fechaGeneracion: Date;
  fechaRespuesta: Date | null;
  catalogo: {
    codigoRegla: string;
    categoria: string;
    impactoEstimado: string;
  } | null;
}

// Normaliza la respuesta: Decimal → number y agrega datos del catálogo.
function aRespuesta(r: RecomendacionCruda) {
  return {
    id: r.id,
    hogarId: r.hogarId,
    catalogoId: r.catalogoId,
    codigoRegla: r.catalogo?.codigoRegla ?? null,
    categoria: r.catalogo?.categoria ?? null,
    impactoEstimado: r.catalogo?.impactoEstimado ?? null,
    titulo: r.titulo,
    descripcion: r.descripcion,
    ahorroEstimadoKwh: Number(r.ahorroEstimadoKwh),
    estado: r.estado,
    fechaGeneracion: r.fechaGeneracion,
    fechaRespuesta: r.fechaRespuesta,
  };
}

// Promedio del consumo del último mes de los hogares de OTROS usuarios de la
// app en la misma región que hayan optado por compartir datos. Devuelve null
// si no hay hogares comparables (en ese caso la regla "region-alta" no aplica).
async function promedioRegional(
  region: string,
  usuarioId: string
): Promise<{ promedio: number | null; nHogares: number }> {
  const filas = await prisma.$queryRaw<{ promedio: number | null; total: number }[]>`
    SELECT AVG(t."consumoKwh")::float8 AS promedio, COUNT(*)::int AS total
    FROM (
      SELECT DISTINCT ON (h.id)
        h.id,
        b."consumoKwh"::float8 AS "consumoKwh"
      FROM hogares h
      JOIN usuarios u ON u.id = h."usuarioId"
      JOIN boletas b ON b."hogarId" = h.id
      WHERE h.region = ${region}
        AND u."permiteComparaciones" = true
        AND u.id <> ${usuarioId}
      ORDER BY h.id, b."fechaFinLectura" DESC
    ) t
  `;
  const fila = filas[0];
  return { promedio: fila?.promedio ?? null, nHogares: fila?.total ?? 0 };
}

// GET /api/recomendaciones?hogarId= → recomendaciones del hogar (cálculo lazy).
//
// Se regeneran solo las PENDIENTE cuando los datos cambiaron (boletas,
// electrodomésticos, hogar o el consentimiento del usuario). Las APLICADA /
// IGNORADA quedan como historial y no se tocan.
router.get("/", async (req: AuthedRequest, res) => {
  const { hogarId } = req.query as { hogarId?: string };
  if (!hogarId) {
    return res.status(400).json({ error: "Falta el parámetro hogarId" });
  }

  try {
    const hogar = await prisma.hogar.findFirst({
      where: { id: hogarId, usuarioId: req.userId! },
    });
    if (!hogar) {
      return res.status(404).json({ error: "Hogar no encontrado" });
    }

    const [usuario, boletas, electrodomesticos, catalogo] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: req.userId! } }),
      prisma.boleta.findMany({
        where: { hogarId },
        orderBy: { fechaFinLectura: "asc" },
      }),
      prisma.electrodomesticoHogar.findMany({
        where: { hogarId, esActivo: true },
        include: { catalogo: true },
      }),
      prisma.catalogoRecomendacion.findMany({
        orderBy: { codigoRegla: "asc" },
      }),
    ]);

    const regional = await promedioRegional(hogar.region, req.userId!);

    const ctx = armarContexto({
      region: hogar.region,
      cantidadPersonas: hogar.cantidadPersonas,
      permiteComparaciones: usuario?.permiteComparaciones ?? false,
      promedioRegionalKwh: regional.promedio,
      boletas: boletas.map<BoletaCtx>((b) => ({
        consumoKwh: Number(b.consumoKwh),
        montoTotal: Number(b.montoTotal),
        fechaInicioLectura: b.fechaInicioLectura,
        fechaFinLectura: b.fechaFinLectura,
      })),
      electrodomesticos: electrodomesticos.map<ElectrodomesticoCtx>((e) => ({
        nombre: e.nombrePersonalizado ?? e.catalogo?.nombre ?? "Electrodoméstico",
        catalogoNombre: e.catalogo?.nombre ?? null,
        potenciaW: Number(e.potenciaW),
        consumoVampiroW: Number(e.consumoVampiroW),
        horasUsoDiario: Number(e.horasUsoDiario),
        cantidad: e.cantidad,
      })),
    });

    const generadas = generarRecomendaciones(ctx, catalogo);

    // Frescura: si la última generación de PENDIENTE es posterior a la última
    // modificación de los datos, se sirve lo que hay sin recalcular.
    const maxActualizacion = [
      hogar.updatedAt,
      usuario?.updatedAt ?? new Date(0),
      ...boletas.map((b) => b.updatedAt),
      ...electrodomesticos.map((e) => e.updatedAt),
    ].reduce((max, d) => (d > max ? d : max), new Date(0));

    const vigente = await prisma.recomendacionHogar.findFirst({
      where: { hogarId, estado: "PENDIENTE" },
      orderBy: { fechaGeneracion: "desc" },
    });

    if (!vigente || vigente.fechaGeneracion < maxActualizacion) {
      // Regenera: se reemplazan solo las PENDIENTE; el historial se conserva.
      await prisma.$transaction([
        prisma.recomendacionHogar.deleteMany({
          where: { hogarId, estado: "PENDIENTE" },
        }),
        ...generadas.map((g) =>
          prisma.recomendacionHogar.create({
            data: {
              hogarId,
              catalogoId: g.catalogoId,
              titulo: g.titulo,
              descripcion: g.descripcion,
              ahorroEstimadoKwh: g.ahorroEstimadoKwh,
            },
          })
        ),
      ]);
    }

    const todas = await prisma.recomendacionHogar.findMany({
      where: { hogarId },
      include: { catalogo: true },
      orderBy: [{ estado: "asc" }, { fechaGeneracion: "desc" }],
    });

    const pendientes = todas.filter((r) => r.estado === "PENDIENTE");
    const ahorroPotencialKwh = pendientes.reduce(
      (s, r) => s + Number(r.ahorroEstimadoKwh),
      0
    );

    res.json({
      recomendaciones: todas.map(aRespuesta),
      ahorroPotencialKwh,
      nPendientes: pendientes.length,
      nHistorial: todas.length - pendientes.length,
    });
  } catch (err) {
    console.error("[recomendaciones] Error al listar:", err);
    res.status(500).json({ error: "Error al cargar las recomendaciones" });
  }
});

// PATCH /api/recomendaciones/:id → cambia el estado (Aplicar / Ignorar /
// Reactivar) y registra la fecha de respuesta. Solo si es del usuario.
router.patch("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };
  const { estado } = req.body ?? {};

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  try {
    const existente = await prisma.recomendacionHogar.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
      include: { catalogo: true },
    });
    if (!existente) {
      return res.status(404).json({ error: "Recomendación no encontrada" });
    }

    const actualizada = await prisma.recomendacionHogar.update({
      where: { id },
      data: { estado, fechaRespuesta: new Date() },
      include: { catalogo: true },
    });

    res.json(aRespuesta(actualizada));
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la recomendación" });
  }
});

export default router;