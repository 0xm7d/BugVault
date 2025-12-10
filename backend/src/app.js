import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import vulnerabilityRoutes from "./routes/vulnerabilityRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "bugvault-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/vulnerabilities", vulnerabilityRoutes);
app.use("/api/v1/stats", statsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

export default app;


