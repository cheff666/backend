// server.js — Express API w/ SQLite persistence
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const sqlite3 = require("better-sqlite3");

// ────────────────────────────────────────────────────────────
// DATABASE INIT (sqlite file lives in /data for Render)
// ────────────────────────────────────────────────────────────
const fs = require("fs");
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "scores.db");
const db = sqlite3(DB_PATH);

db.exec(`CREATE TABLE IF NOT EXISTS scores (
  id     TEXT PRIMARY KEY,
  wins   INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws  INTEGER DEFAULT 0
)`);

const stmtUpsert = db.prepare(`INSERT INTO scores (id, wins, losses, draws)
                               VALUES (@id, @wins, @losses, @draws)
                               ON CONFLICT(id) DO UPDATE SET
                                 wins   = wins   + excluded.wins,
                                 losses = losses + excluded.losses,
                                 draws  = draws  + excluded.draws`);
const stmtAll    = db.prepare(`SELECT * FROM scores ORDER BY wins DESC`);

// ────────────────────────────────────────────────────────────
// EXPRESS  SET‑UP
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));  // Starfall table bodies
app.use(express.json());                          // raw JSON bodies

// POST /report — id & result (win|loss|draw)
app.post("/report", (req, res) => {
  const { id, result } = req.body;
  if (!id || !result) {
    return res.status(400).json({ error: "id & result required" });
  }

  const row = { id, wins: 0, losses: 0, draws: 0 };
  if      (result === "win")  row.wins   = 1;
  else if (result === "loss") row.losses = 1;
  else                         row.draws  = 1;

  stmtUpsert.run(row);
  res.sendStatus(204);
});

// GET /scores — return all rows
app.get("/scores", (_, res) => {
  const all = stmtAll.all();
  res.json(all.reduce((obj, r) => {
    obj[r.id] = { wins: r.wins, losses: r.losses, draws: r.draws };
    return obj;
  }, {}));
});

// Health check
app.get("/", (_, res) => res.send("Chess scoreboard API with SQLite."));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Chess API listening on :${PORT}`));