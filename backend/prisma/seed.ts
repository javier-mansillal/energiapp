import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { electrodomesticos } from "./seed-data/catalogo-electrodomesticos";
import { recomendaciones } from "./seed-data/catalogo-recomendaciones";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Seeder del catálogo de electrodomésticos (idempotente por `nombre`).
async function sembrarElectrodomesticos() {
  let creados = 0;
  let actualizados = 0;

  for (const item of electrodomesticos) {
    const existente = await prisma.catalogoElectrodomestico.findFirst({
      where: { nombre: item.nombre },
    });

    if (existente) {
      await prisma.catalogoElectrodomestico.update({
        where: { id: existente.id },
        data: item,
      });
      actualizados++;
    } else {
      await prisma.catalogoElectrodomestico.create({ data: item });
      creados++;
    }
  }

  const total = await prisma.catalogoElectrodomestico.count();
  console.log(
    `[seed] Catálogo electrodomésticos: ${creados} creados, ${actualizados} actualizados, ${total} en total.`
  );
}

// Seeder del catálogo de recomendaciones (idempotente por `codigoRegla`).
async function sembrarRecomendaciones() {
  let creados = 0;
  let actualizados = 0;

  for (const item of recomendaciones) {
    const existente = await prisma.catalogoRecomendacion.findFirst({
      where: { codigoRegla: item.codigoRegla },
    });

    if (existente) {
      await prisma.catalogoRecomendacion.update({
        where: { id: existente.id },
        data: item,
      });
      actualizados++;
    } else {
      await prisma.catalogoRecomendacion.create({ data: item });
      creados++;
    }
  }

  const total = await prisma.catalogoRecomendacion.count();
  console.log(
    `[seed] Catálogo recomendaciones: ${creados} creados, ${actualizados} actualizados, ${total} en total.`
  );
}

async function main() {
  await sembrarElectrodomesticos();
  await sembrarRecomendaciones();
}

main()
  .catch((err) => {
    console.error("[seed] Error al sembrar el catálogo:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
