import "dotenv/config";
import express from "express";
import cors from "cors";
import hogaresRouter from "./routes/hogares";
import onboardingRouter from "./routes/onboarding";
import boletasRouter from "./routes/boletas";
import usuarioRouter from "./routes/usuario";
import prediccionRouter from "./routes/prediccion";
import electrodomesticosRouter from "./routes/electrodomesticos";
import recomendacionesRouter from "./routes/recomendaciones";

const app = express();

app.use(cors());
app.use(express.json());

// Log de timing: mide el tiempo total de cada request (para diagnosticar lentitud).
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `[http] ${req.method} ${req.originalUrl} → ${res.statusCode} en ${Date.now() - start}ms`
    );
  });
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Bienvenido a la API de Energiapp" });
});

// API de hogares, onboarding y boletas (requieren session token de Supabase).
app.use("/api/hogares", hogaresRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/boletas", boletasRouter);
app.use("/api/usuario", usuarioRouter);
app.use("/api/prediccion", prediccionRouter);
app.use("/api/electrodomesticos", electrodomesticosRouter);
app.use("/api/recomendaciones", recomendacionesRouter);

export default app;