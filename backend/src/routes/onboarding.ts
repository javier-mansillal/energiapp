import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/onboarding → indica si el usuario ya completó el onboarding
// (es decir, si ya tiene al menos un hogar).
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const count = await prisma.hogar.count({ where: { usuarioId: req.userId! } });
    res.json({ completed: count > 0, hogarCount: count });
  } catch (err) {
    res.status(500).json({ error: "Error al consultar el onboarding" });
  }
});

// POST /api/onboarding → crea el primer hogar (completa el onboarding).
router.post("/", async (req: AuthedRequest, res) => {
  const { nombre, region, comuna, direccion, cantidadPersonas } = req.body ?? {};
  if (!nombre || !region || !comuna || !direccion) {
    return res
      .status(400)
      .json({ error: "Faltan datos: nombre, region, comuna y direccion son obligatorios" });
  }

  try {
    const count = await prisma.hogar.count({ where: { usuarioId: req.userId! } });
    if (count > 0) {
      return res.status(400).json({ error: "Ya tienes un hogar creado" });
    }

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
    res.status(201).json({ completed: true, hogar });
  } catch (err) {
    res.status(500).json({ error: "Error al crear el hogar" });
  }
});

export default router;