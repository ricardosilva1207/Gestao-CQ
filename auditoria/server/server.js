// ── TOYINPS AUDITORIA — Servidor local ──
// Express + SQLite + WebSocket. Substitui o Firebase, rodando no PC da empresa.
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { db, UPLOADS_DIR } = require('./db');
const { hash, verify, seedDefaults } = require('./auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ── Mídia em disco ──
// Converte as fotos/vídeos (base64) recebidos em arquivos dentro de uploads/
// e troca o base64 por uma URL (/uploads/...), deixando o banco leve.
function persistMedia(auditId, mediaDataStr) {
  let media;
  try { media = JSON.parse(mediaDataStr || '{}'); } catch (e) { return mediaDataStr; }
  if (!media || typeof media !== 'object') return mediaDataStr;
  Object.keys(media).forEach((itemId) => {
    const arr = Array.isArray(media[itemId]) ? media[itemId] : [];
    arr.forEach((m, idx) => {
      if (m && typeof m.data === 'string' && m.data.indexOf('data:') === 0) {
        const match = m.data.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          const mime = match[1];
          const ext = (mime.split('/')[1] || 'bin').split('+')[0];
          const buf = Buffer.from(match[2], 'base64');
          const fname = (auditId + '_' + itemId + '_' + idx + '.' + ext).replace(/[^a-zA-Z0-9._-]/g, '_');
          try { fs.writeFileSync(path.join(UPLOADS_DIR, fname), buf); m.data = '/uploads/' + fname; }
          catch (e) { console.warn('[media] erro ao salvar', fname, e.message); }
        }
      }
    });
  });
  return JSON.stringify(media);
}

// Remove os arquivos de mídia de uma auditoria (ao excluí-la)
function removeMediaFiles(auditId) {
  try {
    const prefix = String(auditId) + '_';
    fs.readdirSync(UPLOADS_DIR).forEach((f) => {
      if (f.indexOf(prefix) === 0) { try { fs.unlinkSync(path.join(UPLOADS_DIR, f)); } catch (e) {} }
    });
  } catch (e) {}
}

seedDefaults();

const app = express();
app.use(express.json({ limit: '25mb' })); // fotos em base64 podem ser grandes
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ── WebSocket: avisa todos os dispositivos quando algo muda ──
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
function broadcast(col) {
  const msg = JSON.stringify({ type: 'change', col });
  wss.clients.forEach((c) => { if (c.readyState === 1) c.send(msg); });
}

// Coleções permitidas → tabela do SQLite
const COLLECTIONS = {
  audits: 'audits',
  users: 'users',
  pendingUsers: 'pending_users',
  defects: 'defects',
};

// ── LOGIN (bcrypt) ──
app.post('/api/login', (req, res) => {
  const user = String(req.body.user || '').trim().toLowerCase();
  const pass = String(req.body.pass || '');
  if (!user || !pass) return res.json({ ok: false, msg: 'Preencha usuário e senha.' });
  const row = db.prepare('SELECT * FROM users WHERE user = ?').get(user);
  if (!row || !verify(pass, row.pass)) return res.json({ ok: false, msg: 'Usuário ou senha incorretos!' });
  if (!row.approved) return res.json({ ok: false, msg: 'Aguardando aprovação do administrador.' });
  const { pass: _omit, ...safe } = row;
  safe.approved = !!safe.approved;
  res.json({ ok: true, user: safe });
});

// ── TROCA DE SENHA ──
app.post('/api/change-password', (req, res) => {
  const user = String(req.body.user || '').trim().toLowerCase();
  const oldPass = String(req.body.oldPass || '');
  const newPass = String(req.body.newPass || '');
  const row = db.prepare('SELECT * FROM users WHERE user = ?').get(user);
  if (!row || !verify(oldPass, row.pass)) return res.json({ ok: false, msg: 'Senha atual incorreta!' });
  db.prepare('UPDATE users SET pass = ? WHERE user = ?').run(hash(newPass), user);
  broadcast('users');
  res.json({ ok: true });
});

// ── CONFIG GLOBAL (projetos, botões, turnos) ──
// Usuários NÃO vão na config (ficam na tabela users, com senha em hash).
app.get('/api/config', (req, res) => {
  const get = (k) => {
    const r = db.prepare('SELECT value FROM config WHERE key = ?').get(k);
    return r ? r.value : null;
  };
  const users = db.prepare('SELECT user,name,role,approved,photo FROM users').all()
    .map((u) => ({ ...u, approved: !!u.approved }));
  res.json({
    projects: get('projects'),
    btns: get('btns'),
    turnos: get('turnos'),
    users: JSON.stringify(users), // sem senha
    updatedAt: get('updatedAt'),
    updatedBy: get('updatedBy'),
  });
});

app.post('/api/config', (req, res) => {
  const cfg = req.body || {};
  const set = db.prepare('INSERT INTO config (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  ['projects', 'btns', 'turnos', 'updatedAt', 'updatedBy'].forEach((k) => {
    if (cfg[k] !== undefined && cfg[k] !== null) {
      set.run(k, typeof cfg[k] === 'string' ? cfg[k] : JSON.stringify(cfg[k]));
    }
  });
  broadcast('config');
  res.json({ ok: true });
});

// ── SYNC DE USUÁRIOS ──
// Recebe a lista completa de usuários (do app) e reconcilia a tabela:
// cria/atualiza os enviados, remove os ausentes. Senha só é re-hasheada
// quando vem em texto puro; caso contrário mantém o hash atual.
app.post('/api/users/sync', (req, res) => {
  const incoming = Array.isArray(req.body.users) ? req.body.users : [];
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const keep = new Set();
    const upsert = db.prepare(`INSERT INTO users (user,name,pass,role,approved,photo,createdAt)
      VALUES (@user,@name,@pass,@role,@approved,@photo,@createdAt)
      ON CONFLICT(user) DO UPDATE SET
        name=excluded.name, role=excluded.role, approved=excluded.approved,
        photo=COALESCE(excluded.photo, users.photo),
        pass=COALESCE(excluded.pass, users.pass)`);
    for (const u of incoming) {
      const id = String(u.user || '').trim().toLowerCase();
      if (!id) continue;
      keep.add(id);
      const existing = db.prepare('SELECT pass FROM users WHERE user = ?').get(id);
      upsert.run({
        user: id,
        name: u.name || id,
        pass: u.pass ? hash(u.pass) : null, // null => COALESCE mantém hash atual
        role: u.role || 'inspetor',
        approved: u.approved ? 1 : 0,
        photo: u.photo || null,
        createdAt: existing ? now : now,
      });
    }
    // remove os que não vieram na lista
    for (const row of db.prepare('SELECT user FROM users').all()) {
      if (!keep.has(row.user)) db.prepare('DELETE FROM users WHERE user = ?').run(row.user);
    }
  });
  try { tx(); broadcast('users'); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, msg: String(e) }); }
});

// ── COLEÇÕES GENÉRICAS (audits, users, pendingUsers, defects) ──
app.get('/api/col/:col', (req, res) => {
  const table = COLLECTIONS[req.params.col];
  if (!table) return res.status(404).json({ ok: false, msg: 'Coleção inválida' });
  if (req.params.col === 'users') {
    const rows = db.prepare('SELECT user,name,role,approved,photo,createdAt FROM users').all()
      .map((u) => ({ ...u, approved: !!u.approved }));
    return res.json(rows);
  }
  if (req.params.col === 'pendingUsers') {
    const rows = db.prepare('SELECT user,name,role,photo,createdAt FROM pending_users').all();
    return res.json(rows);
  }
  // audits / defects: o registro completo está na coluna `data` (JSON)
  const rows = db.prepare(`SELECT data FROM ${table} ORDER BY createdAt DESC`).all()
    .map((r) => { try { return JSON.parse(r.data); } catch (e) { return null; } })
    .filter(Boolean);
  res.json(rows);
});

app.get('/api/col/:col/:id', (req, res) => {
  const table = COLLECTIONS[req.params.col];
  if (!table) return res.status(404).json({ ok: false });
  if (req.params.col === 'users') {
    const r = db.prepare('SELECT user,name,role,approved,photo,createdAt FROM users WHERE user = ?').get(req.params.id);
    return res.json(r ? { ...r, approved: !!r.approved } : null);
  }
  const r = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(req.params.id);
  res.json(r ? JSON.parse(r.data) : null);
});

app.put('/api/col/:col/:id', (req, res) => {
  const col = req.params.col;
  const table = COLLECTIONS[col];
  if (!table) return res.status(404).json({ ok: false });
  const id = req.params.id;
  const body = req.body || {};
  const now = new Date().toISOString();

  if (col === 'users') {
    const existing = db.prepare('SELECT pass FROM users WHERE user = ?').get(id);
    // Só re-hasheia se veio uma senha em texto puro (campo pass não-vazio)
    let passHash = existing ? existing.pass : null;
    if (body.pass) passHash = hash(body.pass);
    db.prepare(`INSERT INTO users (user,name,pass,role,approved,photo,createdAt)
      VALUES (@user,@name,@pass,@role,@approved,@photo,@createdAt)
      ON CONFLICT(user) DO UPDATE SET
        name=excluded.name, role=excluded.role, approved=excluded.approved,
        photo=COALESCE(excluded.photo, users.photo),
        pass=COALESCE(excluded.pass, users.pass)`).run({
      user: id,
      name: body.name || id,
      pass: passHash,
      role: body.role || 'inspetor',
      approved: body.approved ? 1 : 0,
      photo: body.photo || null,
      createdAt: existing ? (body.createdAt || now) : now,
    });
    broadcast('users');
    return res.json({ ok: true });
  }

  if (col === 'pendingUsers') {
    let passHash = body.pass ? hash(body.pass) : null;
    db.prepare(`INSERT INTO pending_users (user,name,pass,role,photo,createdAt)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(user) DO UPDATE SET name=excluded.name, role=excluded.role`).run(
      id, body.name || id, passHash, body.role || 'inspetor', body.photo || null, now);
    broadcast('pendingUsers');
    return res.json({ ok: true });
  }

  // audits: salva as fotos em disco e troca base64 por URL antes de guardar
  if (col === 'audits' && body.mediaData) {
    body.mediaData = persistMedia(id, body.mediaData);
  }

  // audits / defects: guarda o objeto inteiro como JSON
  db.prepare(`INSERT INTO ${table} (id,data,createdAt) VALUES (?,?,?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(id, JSON.stringify(body), now);
  broadcast(col);
  res.json({ ok: true });
});

app.delete('/api/col/:col/:id', (req, res) => {
  const col = req.params.col;
  const table = COLLECTIONS[col];
  if (!table) return res.status(404).json({ ok: false });
  const idCol = (col === 'users' || col === 'pendingUsers') ? 'user' : 'id';
  db.prepare(`DELETE FROM ${table} WHERE ${idCol} = ?`).run(req.params.id);
  if (col === 'audits') removeMediaFiles(req.params.id); // limpa as fotos do disco
  broadcast(col);
  res.json({ ok: true });
});

// ── App estático ──
app.use('/uploads', express.static(UPLOADS_DIR)); // fotos guardadas em disco
app.use(express.static(PUBLIC_DIR));
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

// ── Inicia ──
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  TOYINPS AUDITORIA — servidor no ar!');
  console.log('  Local:   http://localhost:' + PORT);
  const nets = require('os').networkInterfaces();
  Object.values(nets).flat().forEach((n) => {
    if (n && n.family === 'IPv4' && !n.internal) {
      console.log('  Rede:    http://' + n.address + ':' + PORT + '   (use este no celular/tablet)');
    }
  });
  console.log('══════════════════════════════════════════\n');
});
