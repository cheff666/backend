// server.js — Express API w/ SQLite persistence + player names
const express  = require("express");
const cors     = require("cors");
const path     = require("path");
const fs       = require("fs");
const sqlite3  = require("better-sqlite3");

// ensure data folder exists
fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "scores.db");
const db      = sqlite3(DB_PATH);

// ─── DB schema ───────────────────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS scores (
  id     TEXT  PRIMARY KEY,
  name   TEXT,
  wins   INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws  INTEGER DEFAULT 0
)`);

const upsert = db.prepare(`INSERT INTO scores (id, name, wins, losses, draws)
                           VALUES (@id, @name, @wins, @losses, @draws)
                           ON CONFLICT(id) DO UPDATE SET
                             name   = excluded.name,
                             wins   = wins   + excluded.wins,
                             losses = losses + excluded.losses,
                             draws  = draws  + excluded.draws`);
const allQ   = db.prepare(`SELECT * FROM scores ORDER BY wins DESC`);

// ─── Express set‑up ───────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// POST /report  { id, name, result }
app.post("/report", (req, res) => {
  const { id, name = "?", result } = req.body;
  if (!id || !result) return res.status(400).json({ error: "id & result" });

  const row = { id, name, wins: 0, losses: 0, draws: 0 };
  if      (result === "win")  row.wins   = 1;
  else if (result === "loss") row.losses = 1;
  else                         row.draws  = 1;

  upsert.run(row);
  res.sendStatus(204);
});

// GET /scores  → { id: { name, wins, losses, draws } }
app.get("/scores", (_, res) => {
  const list = allQ.all();
  res.json(Object.fromEntries(list.map(r => [r.id, { name: r.name, wins: r.wins, losses: r.losses, draws: r.draws }] )));
});

app.get("/", (_, res) => res.send("Chess scoreboard API with names."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Chess API listening on :${PORT}`));