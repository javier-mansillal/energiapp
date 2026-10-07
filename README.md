# Energiapp ⚡

Plataforma web para que hogares en Chile registren y visualicen su consumo eléctrico, administren boletas y electrodomésticos, y consulten predicciones y recomendaciones de ahorro.

## Tecnologías y funcionalidades

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS, componentes shadcn y gráficos con Recharts. Incluye inicio de sesión, onboarding, dashboard, boletas, hogares, electrodomésticos, recomendaciones y configuración.
- **Backend:** Node.js 22+, Express 5 y TypeScript. Expone una API para hogares, usuarios, boletas, electrodomésticos, predicciones y recomendaciones; procesa boletas PDF y protege las rutas con sesiones de Supabase.
- **Datos y servicios:** PostgreSQL con Prisma; Supabase para autenticación y almacenamiento de archivos PDF.

## Estructura

```text
ergiapp/
├── frontend/   # Aplicación web
└── backend/    # API y esquema Prisma
```

## Requisitos y configuración

Se necesita **Node.js 22 o superior**, una base de datos PostgreSQL y un proyecto Supabase configurado.

Crea archivos `.env` en `frontend/` y `backend/` con las variables correspondientes:

```env
# frontend/.env
VITE_SUPABASE_URL=<URL de Supabase>
VITE_SUPABASE_ANON_KEY=<clave pública de Supabase>
VITE_API_URL=http://localhost:4000
```

```env
# backend/.env
DATABASE_URL=<URL de conexión a PostgreSQL>
SUPABASE_URL=<URL de Supabase>
SUPABASE_ANON_KEY=<clave pública de Supabase>
# PORT=4000 (opcional)
```

## Ejecución local

En una terminal, inicia el backend:

```bash
cd energiapp/backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

En otra terminal, inicia el frontend:

```bash
cd energiapp/frontend
npm install
npm run dev
```

La web estará disponible en <http://localhost:5173> y la API en <http://localhost:4000> (comprobación: `/health`). Para compilar, usa `npm run build` dentro de cada proyecto.
