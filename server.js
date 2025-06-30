// server.js — minimal Express API for chess results
const express = require("express");
const cors    = require("cors");
const app     = express();

// ────────────────────────────────────────────────────────────
// MIDDLEWARE
// ────────────────────────────────────────────────────────────
app.use(cors());                            // allow calls from anywhere
app.use(express.urlencoded({ extended: true })); // parse x‑www‑form‑urlencoded (Starfall table)
app.use(express.json());                    // parse raw JSON bodies

// in‑memory scoreboard → swap for DB later if you like
const scores = {};   // { id: { wins, losses, draws } }

// ────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────
app.post("/report", (req, res) => {
  const { id, result } = req.body;        // id = "white"/"black" or SteamID64
  if (!id || !result) return res.status(400).json({ error: "id & result required" });

  scores[id] ??= { wins: 0, losses: 0, draws: 0 };
  if      (result === "win")  scores[id].wins++;
  else if (result === "loss") scores[id].losses++;
  else                        scores[id].draws++;

  return res.sendStatus(204);             // no content
});

app.get("/scores", (req, res) => {
  res.json(scores);
});

// health check for Render
app.get("/", (_, res) => res.send("Chess scoreboard API running."));

// start the server — Render exposes PORT env var
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chess API listening on :${PORT}`);
});