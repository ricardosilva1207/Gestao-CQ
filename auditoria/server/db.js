// ── Banco de dados SQLite ──
// Tudo fica em server/data/toyinps.db (um único arquivo no PC).
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'toyinps.db'));
db.pragma('journal_mode = WAL');

// ── Schema ──
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  user      TEXT PRIMARY KEY,
  name      TEXT,
  pass      TEXT,            -- hash bcrypt
  role      TEXT DEFAULT 'inspetor',
  approved  INTEGER DEFAULT 0,
  photo     TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS pending_users (
  user      TEXT PRIMARY KEY,
  name      TEXT,
  pass      TEXT,            -- hash bcrypt
  role      TEXT DEFAULT 'inspetor',
  photo     TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS audits (
  id        TEXT PRIMARY KEY,
  data      TEXT,            -- registro completo da auditoria em JSON
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS config (
  key       TEXT PRIMARY KEY,
  value     TEXT             -- JSON: projects, btns, turnos...
);

CREATE TABLE IF NOT EXISTS defects (
  id        TEXT PRIMARY KEY,
  data      TEXT,            -- defeito manual em JSON
  createdAt TEXT
);
`);

module.exports = { db, DATA_DIR, UPLOADS_DIR };
