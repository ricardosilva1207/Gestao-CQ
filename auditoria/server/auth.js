// ── Autenticação ──
// Senhas guardadas como hash bcrypt (resolve o problema de texto puro).
const bcrypt = require('bcryptjs');
const { db } = require('./db');

function hash(plain) {
  return bcrypt.hashSync(String(plain), 10);
}
function verify(plain, hashed) {
  try { return bcrypt.compareSync(String(plain), String(hashed || '')); }
  catch (e) { return false; }
}

// Usuários padrão (mesmos do app original), agora com senha criptografada.
const DEFAULT_USERS = [
  { user: 'admin',     name: 'Administrador',  pass: 'Toyotacqpfz123', role: 'admin',    approved: 1 },
  { user: 'auditor',   name: 'Auditor Padrão', pass: '1234',           role: 'inspetor', approved: 1 },
  { user: 'qualidade', name: 'Qualidade',      pass: 'q1234',          role: 'inspetor', approved: 1 },
];

function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) {
    const ins = db.prepare(
      'INSERT INTO users (user,name,pass,role,approved,createdAt) VALUES (?,?,?,?,?,?)'
    );
    const now = new Date().toISOString();
    for (const u of DEFAULT_USERS) {
      ins.run(u.user, u.name, hash(u.pass), u.role, u.approved, now);
    }
    console.log('[auth] Usuários padrão criados (admin / auditor / qualidade).');
  }
}

module.exports = { hash, verify, seedDefaults };
