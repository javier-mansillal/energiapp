import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Todas las rutas de hogares requieren sesión válida.
router.use(requireAuth);

// GET /api/hogares → lista los hogares del usuario autenticado.
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const hogares = await prisma.hogar.findMany({
      where: { usuarioId: req.userId! },
      orderBy: { createdAt: "asc" },
    });
    res.json(hogares);
  } catch (err) {
    res.status(500).json({ error: "Error al listar hogares" });
  }
});

// POST /api/hogares → crea un hogar para el usuario.
router.post("/", async (req: AuthedRequest, res) => {
  const { nombre, region, comuna, direccion, cantidadPersonas } = req.body ?? {};
  if (!nombre || !region || !comuna || !direccion) {
    return res
      .status(400)
      .json({ error: "Faltan datos: nombre, region, comuna y direccion son obligatorios" });
  }

  try {
    const hogar = await prisma.hogar.create({
      data: {
        usuarioId: req.userId!,
        nombre,
        region,
        comuna,
        direccion,
        cantidadPersonas: Math.max(1, Number(cantidadPersonas) || 1),
      },
    });
    res.status(201).json(hogar);
  } catch (err) {
    res.status(500).json({ error: "Error al crear el hogar" });
  }
});

// PATCH /api/hogares/:id → actualiza un hogar (solo si es del usuario).
router.patch("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };
  try {
    const existing = await prisma.hogar.findFirst({
      where: { id, usuarioId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: "Hogar no encontrado" });
    }

    const { nombre, region, comuna, direccion, cantidadPersonas } = req.body ?? {};
    const hogar = await prisma.hogar.update({
      where: { id },
      data: {
        nombre: nombre ?? existing.nombre,
        region: region ?? existing.region,
        comuna: comuna ?? existing.comuna,
        direccion: direccion ?? existing.direccion,
        cantidadPersonas:
          cantidadPersonas !== undefined
            ? Math.max(1, Number(cantidadPersonas) || 1)
            : existing.cantidadPersonas,
      },
    });
    res.json(hogar);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el hogar" });
  }
});

// DELETE /api/hogares/:id → elimina un hogar (no permite borrar el único).
router.delete("/:id", async (req: AuthedRequest, res) => {
  const { id } = req.params as { id: string };
  try {
    const existing = await prisma.hogar.findFirst({
      where: { id, usuarioId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: "Hogar no encontrado" });
    }

    const count = await prisma.hogar.count({ where: { usuarioId: req.userId! } });
    if (count <= 1) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu único hogar" });
    }

    await prisma.hogar.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el hogar" });
  }
});

export default router;