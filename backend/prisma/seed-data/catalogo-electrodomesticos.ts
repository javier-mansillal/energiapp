// Catálogo de electrodomésticos para el seeder.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ EDITAR ACÁ: para poner datos reales, basta con cambiar los valores de     │
// │ abajo. El seeder (`prisma/seed.ts`) iguala por `nombre`, así que:         │
// │  - si agregas un ítem, se crea;                                           │
// │  - si cambias un valor, se actualiza;                                     │
// │  - si renombras un ítem, se crea uno nuevo y el viejo queda como estaba.  │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Significado de los campos:
//  - potenciaPromedioWatts: potencia media que consume mientras está EN USO (W).
//    Para equipos de ciclo (p. ej. un refrigerador) es el promedio a lo largo
//    del día, no el peak del compresor.
//  - consumoVampiroW: consumo en espera/apagado pero enchufado (W). Es el
//    "consumo vampiro"; para equipos que no tienen modo espera es 0.
//  - categoria: agrupación libre para mostrar/filtrar en la interfaz.
//
// Los valores son ESTIMADOS de referencia para el prototipo. Reemplazar por
// datos reales (etiqueta del fabricante, fichas SEC, mediciones propias).

export type ElectrodomesticoSeed = {
  nombre: string;
  categoria: string;
  potenciaPromedioWatts: number;
  consumoVampiroW: number;
};

export const electrodomesticos: ElectrodomesticoSeed[] = [
  // ── Refrigeración ──
  { nombre: 'Refrigerador no frost', categoria: 'Refrigeración', potenciaPromedioWatts: 100, consumoVampiroW: 0 },
  { nombre: 'Refrigerador con freezer', categoria: 'Refrigeración', potenciaPromedioWatts: 120, consumoVampiroW: 0 },
  { nombre: 'Frigobar', categoria: 'Refrigeración', potenciaPromedioWatts: 70, consumoVampiroW: 0 },
  { nombre: 'Freezer horizontal', categoria: 'Refrigeración', potenciaPromedioWatts: 90, consumoVampiroW: 0 },

  // ── Climatización ──
  { nombre: 'Aire acondicionado split 9000 BTU', categoria: 'Climatización', potenciaPromedioWatts: 850, consumoVampiroW: 1 },
  { nombre: 'Aire acondicionado split 12000 BTU', categoria: 'Climatización', potenciaPromedioWatts: 1100, consumoVampiroW: 1 },
  { nombre: 'Aire acondicionado inverter', categoria: 'Climatización', potenciaPromedioWatts: 900, consumoVampiroW: 1 },
  { nombre: 'Estufa eléctrica', categoria: 'Climatización', potenciaPromedioWatts: 1500, consumoVampiroW: 0 },
  { nombre: 'Calefactor de aceite', categoria: 'Climatización', potenciaPromedioWatts: 1200, consumoVampiroW: 0 },
  { nombre: 'Ventilador de pie', categoria: 'Climatización', potenciaPromedioWatts: 60, consumoVampiroW: 0.5 },
  { nombre: 'Deshumidificador', categoria: 'Climatización', potenciaPromedioWatts: 300, consumoVampiroW: 0.5 },

  // ── Cocina ──
  { nombre: 'Hervidor eléctrico', categoria: 'Cocina', potenciaPromedioWatts: 1500, consumoVampiroW: 0.5 },
  { nombre: 'Microondas', categoria: 'Cocina', potenciaPromedioWatts: 1200, consumoVampiroW: 1 },
  { nombre: 'Horno eléctrico', categoria: 'Cocina', potenciaPromedioWatts: 2000, consumoVampiroW: 0 },
  { nombre: 'Encimera eléctrica', categoria: 'Cocina', potenciaPromedioWatts: 2000, consumoVampiroW: 0 },
  { nombre: 'Tostadora', categoria: 'Cocina', potenciaPromedioWatts: 800, consumoVampiroW: 0 },
  { nombre: 'Cafetera', categoria: 'Cocina', potenciaPromedioWatts: 800, consumoVampiroW: 1 },
  { nombre: 'Freidora de aire', categoria: 'Cocina', potenciaPromedioWatts: 1500, consumoVampiroW: 0.5 },
  { nombre: 'Lavavajillas', categoria: 'Cocina', potenciaPromedioWatts: 1200, consumoVampiroW: 0.5 },

  // ── Lavado ──
  { nombre: 'Lavadora', categoria: 'Lavado', potenciaPromedioWatts: 500, consumoVampiroW: 1 },
  { nombre: 'Secadora', categoria: 'Lavado', potenciaPromedioWatts: 2500, consumoVampiroW: 1 },
  { nombre: 'Lavadora-secadora', categoria: 'Lavado', potenciaPromedioWatts: 2000, consumoVampiroW: 1 },
  { nombre: 'Plancha', categoria: 'Lavado', potenciaPromedioWatts: 1200, consumoVampiroW: 0 },

  // ── Entretenimiento ──
  { nombre: 'Televisor LED 43"', categoria: 'Entretenimiento', potenciaPromedioWatts: 80, consumoVampiroW: 0.5 },
  { nombre: 'Televisor LED 55"', categoria: 'Entretenimiento', potenciaPromedioWatts: 110, consumoVampiroW: 0.5 },
  { nombre: 'Decodificador de TV', categoria: 'Entretenimiento', potenciaPromedioWatts: 15, consumoVampiroW: 8 },
  { nombre: 'Consola de videojuegos', categoria: 'Entretenimiento', potenciaPromedioWatts: 150, consumoVampiroW: 1 },
  { nombre: 'Equipo de sonido', categoria: 'Entretenimiento', potenciaPromedioWatts: 60, consumoVampiroW: 2 },

  // ── Iluminación ──
  { nombre: 'Ampolleta LED 9 W', categoria: 'Iluminación', potenciaPromedioWatts: 9, consumoVampiroW: 0 },
  { nombre: 'Ampolleta LED 12 W', categoria: 'Iluminación', potenciaPromedioWatts: 12, consumoVampiroW: 0 },
  { nombre: 'Ampolleta incandescente 60 W', categoria: 'Iluminación', potenciaPromedioWatts: 60, consumoVampiroW: 0 },
  { nombre: 'Tubo fluorescente 36 W', categoria: 'Iluminación', potenciaPromedioWatts: 36, consumoVampiroW: 0 },
  { nombre: 'Reflector LED exterior', categoria: 'Iluminación', potenciaPromedioWatts: 20, consumoVampiroW: 0 },

  // ── Computación y oficina ──
  { nombre: 'Notebook', categoria: 'Computación', potenciaPromedioWatts: 45, consumoVampiroW: 1 },
  { nombre: 'Computador de escritorio', categoria: 'Computación', potenciaPromedioWatts: 150, consumoVampiroW: 2 },
  { nombre: 'Monitor', categoria: 'Computación', potenciaPromedioWatts: 30, consumoVampiroW: 0.5 },
  { nombre: 'Impresora', categoria: 'Computación', potenciaPromedioWatts: 100, consumoVampiroW: 3 },
  { nombre: 'Router WiFi', categoria: 'Computación', potenciaPromedioWatts: 10, consumoVampiroW: 0 },

  // ── Otros ──
  { nombre: 'Aspiradora', categoria: 'Otros', potenciaPromedioWatts: 1000, consumoVampiroW: 0 },
  { nombre: 'Secador de pelo', categoria: 'Otros', potenciaPromedioWatts: 1800, consumoVampiroW: 0 },
  { nombre: 'Extractor de aire', categoria: 'Otros', potenciaPromedioWatts: 30, consumoVampiroW: 0 },
  { nombre: 'Bomba de agua', categoria: 'Otros', potenciaPromedioWatts: 750, consumoVampiroW: 0 },
  { nombre: 'Cerco eléctrico', categoria: 'Otros', potenciaPromedioWatts: 10, consumoVampiroW: 0 },
];
