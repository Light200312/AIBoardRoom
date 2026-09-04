// Backend entry point: sets up the API, connects MongoDB, and starts the server.
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./shared/db.js";
import { seedDatabase } from "./data/seed.js";
import authRoutes from "./features/auth/auth.routes.js";
import agentRoutes from "./features/agent/agent.routes.js";
import messageRoutes from "./features/message/message.routes.js";
import orchestratorRoutes from "./features/orchestrator/orchestrator.routes.js";
import combatRoutes from "./features/combat/combat.routes.js";
import featuresRoutes from "./features/panels/panels.routes.js";

dotenv.config();

// Express app configuration + environment defaults.
const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

// CORS + JSON body parsing for API requests.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Basic health endpoints for quick checks.
app.get("/", (_req, res) => {
  res.send("AI Council backend is running.");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API route groups.
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/orchestrator", orchestratorRoutes);
app.use("/api/combat", combatRoutes);
app.use("/api/features", featuresRoutes);

// Connect DB, seed default data, then start listening.
connectDB()
  .then(seedDatabase)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
