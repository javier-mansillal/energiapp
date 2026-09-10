import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Todas las rutas de electrodomésticos requieren sesión válida.
router.use(requireAuth);

// Prisma entrega los Decimal como objeto; se normalizan a number para el front.
function numeroOpcional(valor: unknown): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

interface ElectroCrudo {
  id: string;
  hogarId: string;
  catalogoId: string | null;
  nombrePersonalizado: string | null;
  potenciaW: unknown;
  consumoVampiroW: unknown;
  horasUsoDiario: unknown;
  cantidad: number;
  esActivo: boolean;
  fechaAlta: Date;
  catalogo: { id: string; nombre: string; categoria: string } | null;
}

// Respuesta normalizada: el nombre es el personalizado o el del catálogo.
function aRespuesta(e: ElectroCrudo) {
  return {
    id: e.id,
    hogarId: e.hogarId,
    catalogoId: e.catalogoId,
    catalogoNombre: e.catalogo?.nombre ?? null,
    categoria: e.catalogo?.categoria ?? null,
    nombre: e.nombrePersonalizado ?? e.catalogo?.nombre ?? "Electrodoméstico",
    potenciaW: Number(e.potenciaW),
    consumoVampiroW: Number(e.consumoVampiroW),
    horasUsoDiario: Number(e.horasUsoDiario),
    cantidad: e.cantidad,
    esActivo: e.esActivo,
    fechaAlta: e.fechaAlta,
  };
}

// GET /api/electrodomesticos/catalogo → catálogo de referencia (potencias y
// consumos vampiro estimados). Se define antes de las rutas con :id.
router.get("/catalogo", async (_req: AuthedRequest, res) => {
  try {
    const items = await prisma.catalogoElectrodomestico.findMany({
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    });
    res.json(
      items.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
        potenciaPromedioWatts: Number(c.potenciaPromedioWatts),
        consumoVampiroW: Number(c.consumoVampiroW),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Error al listar el catálogo" });
  }
});

// GET /api/electrodomesticos?hogarId= → electrodomésticos activos del hogar.
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

    const electrodomesticos = await prisma.electrodomesticoHogar.findMany({
      where: { hogarId, esActivo: true },
      include: { catalogo: true },
      orderBy: { fechaAlta: "asc" },
    });

    res.json(electrodomesticos.map(aRespuesta));
  } catch (err) {
    res.status(500).json({ error: "Error al listar los electrodomésticos" });
  }
});

// POST /api/electrodomesticos → agrega un electrodoméstico al hogar.
// body: hogarId, potenciaW, horasUsoDiario (obligatorios) + catalogoId o
// nombrePersonalizado (al menos uno) + consumoVampiroW, cantidad (opcionales).
router.post("/", async (req: AuthedRequest, res) => {
  const body = req.body ?? {};
  const { hogarId, catalogoId, nombrePersonalizado } = body;

  if (!hogarId) {
    return res.status(400).json({ error: "Falta el hogar" });
  }

  const potenciaW = numeroOpcional(body.potenciaW);
  if (potenciaW === null || potenciaW < 0) {
    return res.status(400).json({ error: "La potencia debe ser un número válido" });
  }

  const horasUsoDiario = numeroOpcional(body.horasUsoDiario);
  if (horasUsoDiario === null || horasUsoDiario < 0 || horasUsoDiario > 24) {
    return res
      .status(400)
      .json({ error: "Las horas de uso diario deben estar entre 0 y 24" });
  }

  const consumoVampiroW = numeroOpcional(body.consumoVampiroW) ?? 0;
  if (consumoVampiroW < 0) {
    return res.status(400).json({ error: "El consumo vampiro no puede ser negativo" });
  }

  const cantidad = numeroOpcional(body.cantidad) ?? 1;
  if (cantidad < 1 || !Number.isInteger(cantidad)) {
    return res.status(400).json({ error: "La cantidad debe ser un entero mayor o igual a 1" });
  }

  const nombre =
    typeof nombrePersonalizado === "string" ? nombrePersonalizado.trim() : "";
  const catId = typeof catalogoId === "string" && catalogoId ? catalogoId : null;
  if (!catId && !nombre) {
    return res
      .status(400)
      .json({ error: "Indica un nombre o elige un electrodoméstico del catálogo" });
  }

  try {
    const hogar = await prisma.hogar.findFirst({
      where: { id: hogarId, usuarioId: req.userId! },
    });
    if (!hogar) {
      return res.status(404).json({ error: "Hogar no encontrado" });
    }

    if (catId) {
      const catalogo = await prisma.catalogoElectrodomestico.findUnique({
        where: { id: catId },
      });
      if (!catalogo) {
        return res.status(400).json({ error: "Electrodoméstico de catálogo no encontrado" });
      }
    }

    const creado = await prisma.electrodomesticoHogar.create({
      data: {
        hogarId,
        catalogoId: catId,
        nombrePersonalizado: nombre || null,
        potenciaW: String(potenciaW),
        consumoVampiroW: String(consumoVampiroW),
        horasUsoDiario: String(horasUsoDiario),
        cantidad,
      },
      include: { catalogo: true },
    });

    res.status(201).json(aRespuesta(creado));
  } catch (err) {
    res.status(500).json({ error: "Error al crear el electrodoméstico" });
  }
});

// PATCH /api/electrodomesticos/:id → actualiza un electrodoméstico (solo si es
// del usuario). Acepta cualquier subconjunto de los campos editables.
router.patch("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };

  try {
    const existente = await prisma.electrodomesticoHogar.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
    });
    if (!existente) {
      return res.status(404).json({ error: "Electrodoméstico no encontrado" });
    }

    const body = req.body ?? {};
    const data: Record<string, unknown> = {};

    if (body.potenciaW !== undefined) {
      const v = numeroOpcional(body.potenciaW);
      if (v === null || v < 0) {
        return res.status(400).json({ error: "La potencia debe ser un número válido" });
      }
      data.potenciaW = String(v);
    }

    if (body.horasUsoDiario !== undefined) {
      const v = numeroOpcional(body.horasUsoDiario);
      if (v === null || v < 0 || v > 24) {
        return res
          .status(400)
          .json({ error: "Las horas de uso diario deben estar entre 0 y 24" });
      }
      data.horasUsoDiario = String(v);
    }

    if (body.consumoVampiroW !== undefined) {
      const v = numeroOpcional(body.consumoVampiroW);
      if (v === null || v < 0) {
        return res.status(400).json({ error: "El consumo vampiro no puede ser negativo" });
      }
      data.consumoVampiroW = String(v);
    }

    if (body.cantidad !== undefined) {
      const v = numeroOpcional(body.cantidad);
      if (v === null || v < 1 || !Number.isInteger(v)) {
        return res
          .status(400)
          .json({ error: "La cantidad debe ser un entero mayor o igual a 1" });
      }
      data.cantidad = v;
    }

    if (body.nombrePersonalizado !== undefined) {
      const nombre =
        typeof body.nombrePersonalizado === "string"
          ? body.nombrePersonalizado.trim()
          : "";
      // Sin catálogo asociado el nombre es obligatorio.
      if (!nombre && !existente.catalogoId) {
        return res.status(400).json({ error: "El nombre no puede estar vacío" });
      }
      data.nombrePersonalizado = nombre || null;
    }

    const actualizado = await prisma.electrodomesticoHogar.update({
      where: { id },
      data,
      include: { catalogo: true },
    });

    res.json(aRespuesta(actualizado));
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el electrodoméstico" });
  }
});

// DELETE /api/electrodomesticos/:id → da de baja el electrodoméstico.
// Es una baja lógica (esActivo = false, fechaBaja): conserva el historial.
router.delete("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };

  try {
    const existente = await prisma.electrodomesticoHogar.findFirst({
      where: { id, hogar: { is: { usuarioId: req.userId! } } },
    });
    if (!existente) {
      return res.status(404).json({ error: "Electrodoméstico no encontrado" });
    }

    await prisma.electrodomesticoHogar.update({
      where: { id },
      data: { esActivo: false, fechaBaja: new Date() },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el electrodoméstico" });
  }
});

export default router;
