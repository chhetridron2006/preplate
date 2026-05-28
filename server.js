/*
  server.js — Main entry point for the PrePlate backend.

  Middleware order:
    1. CORS and body parsing
    2. Static frontend files
    3. API routes
    4. Global error handler (must be last)
*/

require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const path         = require("path");

const authRouter   = require("./routes/auth");
const menuRouter   = require("./routes/menu");
const ordersRouter = require("./routes/orders");
const errorHandler = require("./middleware/errorHandler");
const { initDB }   = require("./db");

const app = express();

/* ── Middleware ─────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ── API Routes ─────────────────────────────────────────────────────────── */
app.use("/api/auth",   authRouter);
app.use("/api/menu",   menuRouter);
app.use("/api/orders", ordersRouter);

/* Catch-all: return the frontend for any non-API path */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ── Global Error Handler (must be after all routes) ────────────────────── */
app.use(errorHandler);

/* ── Start Server ───────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initDB()
    .then(() => app.listen(PORT, () => console.log(`PrePlate running at http://localhost:${PORT}`)))
    .catch(err => { console.error("Failed to initialise database:", err.message); process.exit(1); });
}

module.exports = app;
