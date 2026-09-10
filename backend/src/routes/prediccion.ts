import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { predecir } from "../lib/prediccion";
import type { BoletaParaPrediccion } from "../lib/prediccion";

const router = Router();

// Todas las rutas de predicción requieren sesión válida.
router.use(requireAuth);

interface BoletaCruda {
  consumoKwh: unknown;
  montoTotal: unknown;
  fechaInicioLectura: Date;
  fechaFinLectura: Date;
  updatedAt: Date;
}

// Prisma entrega los Decimal como objeto; el módulo de predicción espera number.
function aBoletaParaPrediccion(b: BoletaCruda): BoletaParaPrediccion {
  return {
    consumoKwh: Number(b.consumoKwh),
    montoTotal: Number(b.montoTotal),
    fechaInicioLectura: b.fechaInicioLectura,
    fechaFinLectura: b.fechaFinLectura,
  };
}

interface PrediccionCruda {
  id: string;
  hogarId: string;
  algoritmoUsado: string;
  consumoEstimadoKwh: unknown;
  montoEstimado: unknown;
  consumoEstimadoKwhInferior: unknown;
  consumoEstimadoKwhSuperior: unknown;
  montoEstimadoInferior: unknown;
  montoEstimadoSuperior: unknown;
  periodoProyectadoInicio: Date;
  periodoProyectadoFin: Date;
  fechaCalculo: Date;
}

// Prisma serializa los Decimal como string en JSON; se normalizan a number para
// que el front no tenga que convertirlos campo por campo.
function aRespuesta(p: PrediccionCruda) {
  return {
    id: p.id,
    hogarId: p.hogarId,
    algoritmo: p.algoritmoUsado,
    consumoEstimadoKwh: Number(p.consumoEstimadoKwh),
    montoEstimado: Number(p.montoEstimado),
    consumoEstimadoKwhInferior: Number(p.consumoEstimadoKwhInferior),
    consumoEstimadoKwhSuperior: Number(p.consumoEstimadoKwhSuperior),
    montoEstimadoInferior: Number(p.montoEstimadoInferior),
    montoEstimadoSuperior: Number(p.montoEstimadoSuperior),
    periodoProyectadoInicio: p.periodoProyectadoInicio,
    periodoProyectadoFin: p.periodoProyectadoFin,
    fechaCalculo: p.fechaCalculo,
  };
}

// GET /api/prediccion?hogarId= → predicción del próximo período (cálculo lazy).
//
// Se calcula en el momento de la consulta y se cachea en `predicciones`. Si ya
// existe un cálculo fresco que apunta al mismo período proyectado, se devuelve
// sin recalcular. No hay triggers ni job: la predicción solo importa cuando
// alguien mira el dashboard.
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

    const boletas = await prisma.boleta.findMany({ where: { hogarId } });
    const resultado = predecir(boletas.map(aBoletaParaPrediccion));

    // Sin boletas suficientes: se limpia cualquier predicción vieja para que el
    // dashboard no muestre una estimación obsoleta.
    if (resultado.estado === "insuficiente") {
      await prisma.prediccion.deleteMany({ where: { hogarId } });
      return res.json({
        estado: "insuficiente",
        minimoBoletas: resultado.minimoBoletas,
        nBoletas: resultado.nBoletas,
      });
    }

    const { prediccion, nBoletas } = resultado;

    // Frescura: sirve la predicción guardada solo si apunta al mismo período
    // proyectado y se calculó después de la última modificación de las boletas.
    const ultimaActualizacion = boletas.reduce(
      (max, b) => (b.updatedAt > max ? b.updatedAt : max),
      new Date(0)
    );
    const guardada = await prisma.prediccion.findFirst({
      where: {
        hogarId,
        periodoProyectadoInicio: prediccion.periodoProyectadoInicio,
        fechaCalculo: { gte: ultimaActualizacion },
      },
    });
    if (guardada) {
      return res.json({ estado: "ok", nBoletas, prediccion: aRespuesta(guardada) });
    }

    // Recalcula: se reemplaza la predicción previa del hogar (una sola vigente).
    const [, creada] = await prisma.$transaction([
      prisma.prediccion.deleteMany({ where: { hogarId } }),
      prisma.prediccion.create({
        data: {
          hogarId,
          consumoEstimadoKwh: prediccion.consumoEstimadoKwh,
          montoEstimado: prediccion.montoEstimado,
          consumoEstimadoKwhInferior: prediccion.consumoEstimadoKwhInferior,
          consumoEstimadoKwhSuperior: prediccion.consumoEstimadoKwhSuperior,
          montoEstimadoInferior: prediccion.montoEstimadoInferior,
          montoEstimadoSuperior: prediccion.montoEstimadoSuperior,
          periodoProyectadoInicio: prediccion.periodoProyectadoInicio,
          periodoProyectadoFin: prediccion.periodoProyectadoFin,
          algoritmoUsado: prediccion.algoritmo,
        },
      }),
    ]);

    res.json({ estado: "ok", nBoletas, prediccion: aRespuesta(creada) });
  } catch (err) {
    console.error("[prediccion] Error al calcular la predicción:", err);
    res.status(500).json({ error: "Error al calcular la predicción" });
  }
});

export default router;
