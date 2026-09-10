import { Router } from "express";
import { decodeJwt } from "jose";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Todas las rutas de usuario requieren sesión válida.
router.use(requireAuth);

// GET /api/usuario → perfil del usuario autenticado.
// Si la fila no existe (p.ej. el trigger de Supabase no la creó), se crea
// con los datos del JWT ya verificado por el middleware.
router.get("/", async (req: AuthedRequest, res) => {
  try {
    let usuario = await prisma.usuario.findUnique({
      where: { id: req.userId! },
    });

    if (!usuario) {
      const payload = decodeJwt(req.token!);
      const email = payload.email as string | undefined;
      const provider = (payload.app_metadata as { provider?: string } | undefined)?.provider;
      if (!email) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      usuario = await prisma.usuario.create({
        data: {
          id: req.userId!,
          email,
          oauthProvider: provider === "azure" ? "azure" : "google",
          oauthId: req.userId!,
        },
      });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al consultar el usuario" });
  }
});

// PATCH /api/usuario → actualiza el nombre del usuario autenticado.
// Solo puede modificar su propio perfil: el id sale del token verificado.
router.patch("/", async (req: AuthedRequest, res) => {
  const { nombre } = req.body ?? {};
  const nombreTrim = typeof nombre === "string" ? nombre.trim() : "";
  if (!nombreTrim) {
    return res.status(400).json({ error: "El nombre no puede estar vacío" });
  }
  if (nombreTrim.length > 80) {
    return res
      .status(400)
      .json({ error: "El nombre es demasiado largo (máx. 80 caracteres)" });
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.userId! },
      data: { nombre: nombreTrim },
    });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

export default router;