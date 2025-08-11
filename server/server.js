
import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync } from "fs";
import { nanoid } from "nanoid";
import { autoAssign } from "./assignment.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function loadDB() {
  return JSON.parse(readFileSync(new URL("./db.json", import.meta.url)));
}
function saveDB(db) {
  writeFileSync(new URL("./db.json", import.meta.url), JSON.stringify(db, null, 2));
}

// --- Auth (demo) ---
app.post("/api/login", (req, res) => {
  const { role, refereeId } = req.body; // role: "admin" | "referee"
  if (role === "admin") return res.json({ ok: true, role });
  if (role === "referee" && refereeId) return res.json({ ok: true, role, refereeId });
  return res.status(400).json({ ok: false, error: "Credenciales inválidas (demo)" });
});

// --- Clubs ---
app.get("/api/clubs", (req, res) => {
  const db = loadDB();
  res.json(db.clubs);
});
app.post("/api/clubs", (req, res) => {
  const db = loadDB();
  const club = { id: nanoid(6), ...req.body };
  db.clubs.push(club);
  saveDB(db);
  res.json(club);
});
app.put("/api/clubs/:id", (req, res) => {
  const db = loadDB();
  const idx = db.clubs.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).end();
  db.clubs[idx] = { ...db.clubs[idx], ...req.body };
  saveDB(db);
  res.json(db.clubs[idx]);
});
app.delete("/api/clubs/:id", (req, res) => {
  const db = loadDB();
  db.clubs = db.clubs.filter(c => c.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// --- Referees ---
app.get("/api/referees", (req, res) => {
  const db = loadDB();
  res.json(db.referees);
});
app.post("/api/referees", (req, res) => {
  const db = loadDB();
  const ref = { id: nanoid(6), ...req.body };
  db.referees.push(ref);
  saveDB(db);
  res.json(ref);
});

app.put("/api/referees/:id", (req, res) => {
  const db = loadDB();
  const idx = db.referees.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).end();
  db.referees[idx] = { ...db.referees[idx], ...req.body };
  saveDB(db);
  res.json(db.referees[idx]);
});

app.delete("/api/referees/:id", (req, res) => {
  const db = loadDB();
  db.referees = db.referees.filter(r => r.id !== req.params.id);
  db.availability = db.availability.filter(a => a.refereeId !== req.params.id);
  db.assignments = db.assignments.map(a => ({
    ...a,
    referee1Id: a.referee1Id === req.params.id ? null : a.referee1Id,
    referee2Id: a.referee2Id === req.params.id ? null : a.referee2Id,
  }));
  saveDB(db);
  res.json({ ok: true });
});

// --- Availability ---
app.get("/api/availability/:refereeId", (req, res) => {
  const db = loadDB();
  res.json(db.availability.filter(a => a.refereeId === req.params.refereeId));
});
app.post("/api/availability", (req, res) => {
  const db = loadDB();
  const item = { id: nanoid(6), ...req.body };
  db.availability.push(item);
  saveDB(db);
  res.json(item);
});
app.delete("/api/availability/:id", (req, res) => {
  const db = loadDB();
  db.availability = db.availability.filter(a => a.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// --- Matches ---
app.get("/api/matches", (req, res) => {
  const db = loadDB();
  res.json(db.matches);
});
app.post("/api/matches", (req, res) => {
  const db = loadDB();
  const m = { id: nanoid(6), ...req.body };
  db.matches.push(m);
  saveDB(db);
  res.json(m);
});
app.put("/api/matches/:id", (req, res) => {
  const db = loadDB();
  const idx = db.matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).end();
  db.matches[idx] = { ...db.matches[idx], ...req.body };
  saveDB(db);
  res.json(db.matches[idx]);
});
app.delete("/api/matches/:id", (req, res) => {
  const db = loadDB();
  db.matches = db.matches.filter(m => m.id !== req.params.id);
  saveDB(db);
  res.json({ ok: true });
});

// --- Assignments ---
app.get("/api/assignments", (req, res) => {
  const db = loadDB();
  res.json(db.assignments);
});
app.post("/api/assignments/auto", (req, res) => {
  const db = loadDB();
  const result = autoAssign(db);
  saveDB(db);
  res.json({ ok: true, result });
});
app.patch("/api/assignments/:matchId", (req, res) => {
  const db = loadDB();
  const a = db.assignments.find(x => x.matchId === req.params.matchId);
  if (!a) return res.status(404).end();
  const { referee1Id, referee2Id } = req.body;
  if (referee1Id !== undefined) a.referee1Id = referee1Id;
  if (referee2Id !== undefined) a.referee2Id = referee2Id;
  saveDB(db);
  res.json(a);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
