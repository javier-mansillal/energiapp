# EnergiApp 🔌
Plataforma web para la gestión, visualización y predicción del consumo eléctrico residencial, desarrollada como proyecto de título. La aplicación permite registrar información de boletas eléctricas, visualizar el consumo histórico y estimar el consumo/pago futuro a partir de los datos previos.

---

## 🎯 Objetivo general

Desarrollar un sistema que permita a los usuarios residenciales en Chile gestionar, analizar, predecir y optimizar su consumo eléctrico, integrando procesamiento de boletas de electricidad, registro de electrodomésticos, modelos de inteligencia artificial para estimaciones de consumo y reportes personalizados que incluyan comparaciones con hogares de características similares, con el fin de mejorar la comprensión de sus gastos y fomentar un uso más eficiente de la energía eléctrica. 

---

## 🚀 Tecnologías

**Frontend**
- [React](https://react.dev/) con [Vite](https://vitejs.dev/)
- Javascript
- React Router
- Herramientas adicionales por definir (MUI / Tailwind)

**Backend**
- Node.js + Express
- Base de datos (por definir: MongoDB / PostgreSQL)
- Módulo de predicción (modelo simple inicial)

## 🏗️ Estructura del proyecto

```bash
energiapp/
├─ frontend/        # Aplicación React (Vite)
│  ├─ src/
│  └─ ...
└─ backend/         # API (por crear)
```
## 🛠️ Instalación y ejecución del frontend
**Requisitos**
- Node.js (v22, recomendado usar nvm)

**Pasos**
```bash
git clone https://github.com/javier-mansillal/energiapp.git
cd energiapp/frotend
npm install
npm run dev
```
La aplicación quedará disponible en: http://localhost:5173.