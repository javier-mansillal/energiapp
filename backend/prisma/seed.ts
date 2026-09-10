import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { electrodomesticos } from "./seed-data/catalogo-electrodomesticos";

// Seeder del catálogo de electrodomésticos.
//
// Es idempotente: iguala por `nombre`, así que se puede correr las veces que
// sea sin duplicar filas. Los datos están en
// `prisma/seed-data/catalogo-electrodomesticos.ts`.
//
// Uso: `npm run seed` (o `npx prisma db seed`).

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
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
    `[seed] Catálogo: ${creados} creados, ${actualizados} actualizados, ${total} en total.`
  );
}

main()
  .catch((err) => {
    console.error("[seed] Error al sembrar el catálogo:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
