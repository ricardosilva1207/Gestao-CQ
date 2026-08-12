#!/usr/bin/env python3
"""TOYINPS AUDITORIA — servidor local (Python puro, sem dependencias externas)"""

import base64, hashlib, json, mimetypes, os, re, secrets, sqlite3, struct, threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, unquote

# ── Caminhos ──────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_DIR    = BASE_DIR / 'data'
UPLOADS_DIR = DATA_DIR / 'uploads'
REFIMGS_DIR = DATA_DIR / 'refimgs'
PHOTOS_DIR  = DATA_DIR / 'photos'
DB_PATH     = DATA_DIR / 'toyinps.db'
PUBLIC_DIR  = BASE_DIR.parent / 'public'
PORT        = int(os.environ.get('PORT', 3001))

DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)
REFIMGS_DIR.mkdir(exist_ok=True)
PHOTOS_DIR.mkdir(exist_ok=True)

# ── Banco SQLite (conexão única + lock) ───────────────────────────────────────
_db   = sqlite3.connect(str(DB_PATH), check_same_thread=False)
_db.row_factory = sqlite3.Row
_db.execute('PRAGMA journal_mode=WAL')
_lock = threading.Lock()

def qone(sql, p=()):
    with _lock: return _db.execute(sql, p).fetchone()

def qall(sql, p=()):
    with _lock: return _db.execute(sql, p).fetchall()

def run(sql, p=()):
    with _lock: _db.execute(sql, p); _db.commit()

def run_many(ops):
    with _lock:
        for sql, p in ops: _db.execute(sql, p)
        _db.commit()

# schema
with _lock:
    _db.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        user TEXT PRIMARY KEY, name TEXT, pass TEXT,
        role TEXT DEFAULT 'inspetor', approved INTEGER DEFAULT 0,
        photo TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS pending_users (
        user TEXT PRIMARY KEY, name TEXT, pass TEXT,
        role TEXT DEFAULT 'inspetor', photo TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS audits (
        id TEXT PRIMARY KEY, data TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE IF NOT EXISTS defects (
        id TEXT PRIMARY KEY, data TEXT, createdAt TEXT);
    """)

# ── Senhas (PBKDF2 — biblioteca padrão) ───────────────────────────────────────
def hash_pass(plain):
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', str(plain).encode(), salt.encode(), 260000)
    return f'pbkdf2:sha256:260000:{salt}:{h.hex()}'

def verify_pass(plain, stored):
    try:
        _, algo, iters, salt, expected = str(stored).split(':')
        h = hashlib.pbkdf2_hmac(algo, str(plain).encode(), salt.encode(), int(iters))
        return secrets.compare_digest(h.hex(), expected)
    except Exception:
        return False

# usuários padrão (na primeira vez)
if qone('SELECT COUNT(*) FROM users')[0] == 0:
    now = datetime.utcnow().isoformat()
    run_many([
        ('INSERT INTO users (user,name,pass,role,approved,createdAt) VALUES (?,?,?,?,?,?)',
         (u, n, hash_pass(pw), r, 1, now))
        for u, n, pw, r in [
            ('admin',     'Administrador',  'Toyotacqpfz123', 'admin'),
            ('auditor',   'Auditor Padrão', '1234',           'inspetor'),
            ('qualidade', 'Qualidade',      'q1234',          'inspetor'),
        ]
    ])
    print('[auth] Usuários padrão criados (admin / auditor / qualidade).')

# ── WebSocket ─────────────────────────────────────────────────────────────────
_ws_clients = set()
_ws_lock    = threading.Lock()
_WS_MAGIC   = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

def _ws_frame(text):
    data = text.encode()
    n = len(data)
    if n < 126:   return bytes([0x81, n]) + data
    if n < 65536: return struct.pack('!BBH', 0x81, 126, n) + data
    return struct.pack('!BBQ', 0x81, 127, n) + data

def broadcast(col):
    frame = _ws_frame(json.dumps({'type': 'change', 'col': col}))
    with _ws_lock:
        dead = set()
        for s in _ws_clients:
            try: s.sendall(frame)
            except Exception: dead.add(s)
        _ws_clients.difference_update(dead)

# ── Mídia em disco ────────────────────────────────────────────────────────────
def persist_media(audit_id, raw):
    try: media = json.loads(raw or '{}')
    except Exception: return raw
    if not isinstance(media, dict): return raw
    for item_id, arr in media.items():
        if not isinstance(arr, list): continue
        for idx, m in enumerate(arr):
            d = m.get('data', '') if isinstance(m, dict) else ''
            if not d.startswith('data:'): continue
            match = re.match(r'^data:([^;]+);base64,(.*)$', d, re.DOTALL)
            if not match: continue
            ext   = match.group(1).split('/')[1].split('+')[0]
            fname = re.sub(r'[^a-zA-Z0-9._-]', '_', f'{audit_id}_{item_id}_{idx}.{ext}')
            try:
                (UPLOADS_DIR / fname).write_bytes(base64.b64decode(match.group(2)))
                m['data'] = f'/uploads/{fname}'
            except Exception as e:
                print(f'[media] {e}')
    return json.dumps(media)

def remove_media(audit_id):
    pfx = str(audit_id) + '_'
    try:
        for f in UPLOADS_DIR.iterdir():
            if f.name.startswith(pfx):
                try: f.unlink()
                except Exception: pass
    except Exception: pass

# ── Handler HTTP + WebSocket ──────────────────────────────────────────────────
COLLECTIONS = {
    'audits': 'audits', 'users': 'users',
    'pendingUsers': 'pending_users', 'defects': 'defects',
}

class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args): pass  # silencia log de acesso

    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        n = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(n) or b'{}')

    # ── roteamento ────────────────────────────────────────────────────────────
    def route(self, method):
        path  = urlparse(self.path).path.rstrip('/') or '/'
        parts = path.split('/')   # ['', 'api', 'col', ...]

        # WebSocket (qualquer caminho com Upgrade: websocket)
        if method == 'GET' and self.headers.get('Upgrade', '').lower() == 'websocket':
            return self._ws_upgrade()

        if method == 'POST' and path == '/api/login':           return self._login()
        if method == 'POST' and path == '/api/change-password': return self._change_pass()
        if method == 'GET'  and path == '/api/config':          return self._config_get()
        if method == 'POST' and path == '/api/config':          return self._config_post()
        if method == 'POST' and path == '/api/users/sync':      return self._users_sync()
        if method == 'POST' and path == '/api/save-pdf':        return self._save_pdf()

        if len(parts) >= 4 and parts[1] == 'api' and parts[2] in ('item-img', 'user-photo'):
            kind   = parts[2]
            rec_id = unquote(parts[3])
            if method == 'POST':   return self._img_post(kind, rec_id)
            if method == 'DELETE': return self._img_delete(kind, rec_id)

        if len(parts) >= 4 and parts[1] == 'api' and parts[2] == 'col':
            col    = parts[3]
            rec_id = unquote(parts[4]) if len(parts) > 4 else None
            if method == 'GET'    and not rec_id: return self._col_list(col)
            if method == 'GET'    and rec_id:     return self._col_get(col, rec_id)
            if method == 'PUT'    and rec_id:     return self._col_put(col, rec_id)
            if method == 'DELETE' and rec_id:     return self._col_delete(col, rec_id)

        if method == 'GET' and path.startswith('/uploads/'):
            return self._send_file(UPLOADS_DIR / unquote(path[9:]))
        if method == 'GET' and path.startswith('/refimgs/'):
            return self._send_file(REFIMGS_DIR / unquote(path[9:]))
        if method == 'GET' and path.startswith('/user-photos/'):
            return self._send_file(PHOTOS_DIR / unquote(path[13:]))

        if method == 'GET':
            rel    = unquote(path.lstrip('/'))
            target = PUBLIC_DIR / rel if rel else PUBLIC_DIR / 'index.html'
            if not target.is_file(): target = PUBLIC_DIR / 'index.html'
            return self._send_file(target)

        self.send_response(404); self.end_headers()

    def do_GET(self):    self.route('GET')
    def do_POST(self):   self.route('POST')
    def do_PUT(self):    self.route('PUT')
    def do_DELETE(self): self.route('DELETE')

    # ── WebSocket ─────────────────────────────────────────────────────────────
    def _ws_upgrade(self):
        key    = self.headers.get('Sec-WebSocket-Key', '')
        accept = base64.b64encode(
            hashlib.sha1((key + _WS_MAGIC).encode()).digest()
        ).decode()
        self.send_response(101)
        self.send_header('Upgrade', 'websocket')
        self.send_header('Connection', 'Upgrade')
        self.send_header('Sec-WebSocket-Accept', accept)
        self.end_headers()
        sock = self.connection
        with _ws_lock: _ws_clients.add(sock)
        try:
            while True:
                hdr = self._recv(sock, 2)
                if not hdr: break
                b1, b2  = hdr
                opcode  = b1 & 0x0f
                masked  = bool(b2 & 0x80)
                length  = b2 & 0x7f
                if length == 126: length = struct.unpack('!H', self._recv(sock, 2))[0]
                elif length == 127: length = struct.unpack('!Q', self._recv(sock, 8))[0]
                mask    = self._recv(sock, 4) if masked else b'\x00\x00\x00\x00'
                payload = bytearray(self._recv(sock, length) or b'')
                if masked:
                    for i in range(len(payload)): payload[i] ^= mask[i % 4]
                if opcode == 0x8: break               # close
                if opcode == 0x9:                      # ping → pong
                    try: sock.sendall(bytes([0x8a, len(payload)]) + bytes(payload))
                    except Exception: break
        except Exception: pass
        finally:
            with _ws_lock: _ws_clients.discard(sock)

    @staticmethod
    def _recv(sock, n):
        buf = b''
        while len(buf) < n:
            chunk = sock.recv(n - len(buf))
            if not chunk: return None
            buf += chunk
        return buf

    # ── arquivo estático ──────────────────────────────────────────────────────
    def _send_file(self, fpath):
        fpath = Path(fpath)
        if not fpath.is_file():
            self.send_response(404); self.end_headers(); return
        mime, _ = mimetypes.guess_type(str(fpath))
        data = fpath.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', mime or 'application/octet-stream')
        self.send_header('Content-Length', len(data))
        self.end_headers()
        self.wfile.write(data)

    # ── rotas da API ──────────────────────────────────────────────────────────
    def _login(self):
        body   = self.read_json()
        user   = str(body.get('user', '')).strip().lower()
        passwd = str(body.get('pass', ''))
        if not user or not passwd:
            return self.send_json({'ok': False, 'msg': 'Preencha usuário e senha.'})
        row = qone('SELECT * FROM users WHERE user=?', (user,))
        if not row or not verify_pass(passwd, row['pass']):
            return self.send_json({'ok': False, 'msg': 'Usuário ou senha incorretos!'})
        if not row['approved']:
            return self.send_json({'ok': False, 'msg': 'Aguardando aprovação do administrador.'})
        safe = {k: row[k] for k in row.keys() if k != 'pass'}
        safe['approved'] = bool(safe['approved'])
        safe_id = re.sub(r'[^A-Za-z0-9_-]', '_', str(safe.get('user', '')))
        safe['hasPhoto'] = (PHOTOS_DIR / f'{safe_id}.jpg').is_file()
        self.send_json({'ok': True, 'user': safe})

    def _change_pass(self):
        body = self.read_json()
        user = str(body.get('user', '')).strip().lower()
        row  = qone('SELECT * FROM users WHERE user=?', (user,))
        if not row or not verify_pass(str(body.get('oldPass', '')), row['pass']):
            return self.send_json({'ok': False, 'msg': 'Senha atual incorreta!'})
        run('UPDATE users SET pass=? WHERE user=?', (hash_pass(body.get('newPass', '')), user))
        broadcast('users')
        self.send_json({'ok': True})

    def _config_get(self):
        def gv(k):
            r = qone('SELECT value FROM config WHERE key=?', (k,))
            return r['value'] if r else None
        users = [dict(u) for u in qall('SELECT user,name,role,approved,photo FROM users')]
        for u in users: u['approved'] = bool(u['approved'])
        self.send_json({
            'projects': gv('projects'), 'btns': gv('btns'), 'turnos': gv('turnos'),
            'users': json.dumps(users), 'updatedAt': gv('updatedAt'), 'updatedBy': gv('updatedBy'),
            'pdf_folder': gv('pdf_folder'),
        })

    def _config_post(self):
        cfg = self.read_json()
        ops = []
        for k in ['projects', 'btns', 'turnos', 'updatedAt', 'updatedBy', 'pdf_folder']:
            if cfg.get(k) is not None:
                v = cfg[k] if isinstance(cfg[k], str) else json.dumps(cfg[k])
                ops.append(('INSERT INTO config (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', (k, v)))
        if ops: run_many(ops)
        broadcast('config')
        self.send_json({'ok': True})

    def _users_sync(self):
        body     = self.read_json()
        incoming = body.get('users', [])
        if not isinstance(incoming, list): incoming = []
        now  = datetime.utcnow().isoformat()
        keep = set()
        ops  = []
        for u in incoming:
            uid = str(u.get('user', '')).strip().lower()
            if not uid: continue
            keep.add(uid)
            existing  = qone('SELECT pass FROM users WHERE user=?', (uid,))
            pass_hash = hash_pass(u['pass']) if u.get('pass') else (existing['pass'] if existing else None)
            ops.append((
                'INSERT INTO users (user,name,pass,role,approved,photo,createdAt) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user) DO UPDATE SET name=excluded.name,role=excluded.role,approved=excluded.approved,photo=COALESCE(excluded.photo,users.photo),pass=COALESCE(excluded.pass,users.pass)',
                (uid, u.get('name', uid), pass_hash, u.get('role', 'inspetor'), 1 if u.get('approved') else 0, u.get('photo'), now)
            ))
        for row in qall('SELECT user FROM users'):
            if row['user'] not in keep:
                ops.append(('DELETE FROM users WHERE user=?', (row['user'],)))
        try:
            run_many(ops); broadcast('users'); self.send_json({'ok': True})
        except Exception as e:
            self.send_json({'ok': False, 'msg': str(e)}, 500)

    def _save_pdf(self):
        body    = self.read_json()
        b64     = str(body.get('pdfBase64', ''))
        fname   = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', str(body.get('filename', 'auditoria.pdf'))).strip() or 'auditoria.pdf'
        projeto = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', str(body.get('projeto', 'Sem_Projeto'))).strip() or 'Sem_Projeto'
        if not b64:
            return self.send_json({'ok': False, 'msg': 'PDF vazio.'}, 400)

        row  = qone('SELECT value FROM config WHERE key=?', ('pdf_folder',))
        base = Path(row['value']).expanduser() if row and row['value'] else (DATA_DIR / 'pdfs')

        now       = datetime.now()
        subfolder = base / f'{now.year:04d}' / f'{now.month:02d}' / projeto
        try:
            subfolder.mkdir(parents=True, exist_ok=True)
            (subfolder / fname).write_bytes(base64.b64decode(b64))
        except Exception as e:
            return self.send_json({'ok': False, 'msg': f'Erro ao salvar: {e}'}, 500)

        self.send_json({'ok': True, 'path': str(subfolder / fname)})

    def _img_post(self, kind, rec_id):
        body = self.read_json()
        raw  = str(body.get('data', ''))
        m    = re.match(r'^data:image/[^;]+;base64,(.*)$', raw, re.DOTALL)
        b64  = m.group(1) if m else raw
        if not b64:
            return self.send_json({'ok': False, 'msg': 'sem imagem'}, 400)
        safe = re.sub(r'[^A-Za-z0-9_-]', '_', rec_id)
        if not safe:
            return self.send_json({'ok': False, 'msg': 'id invalido'}, 400)
        folder = REFIMGS_DIR if kind == 'item-img' else PHOTOS_DIR
        try:
            folder.mkdir(exist_ok=True)
            (folder / f'{safe}.jpg').write_bytes(base64.b64decode(b64))
        except Exception as e:
            return self.send_json({'ok': False, 'msg': str(e)}, 500)
        broadcast('config' if kind == 'item-img' else 'users')
        self.send_json({'ok': True})

    def _img_delete(self, kind, rec_id):
        safe   = re.sub(r'[^A-Za-z0-9_-]', '_', rec_id)
        folder = REFIMGS_DIR if kind == 'item-img' else PHOTOS_DIR
        try:
            (folder / f'{safe}.jpg').unlink()
        except FileNotFoundError:
            pass
        except Exception:
            pass
        broadcast('config' if kind == 'item-img' else 'users')
        self.send_json({'ok': True})

    def _col_list(self, col):
        table = COLLECTIONS.get(col)
        if not table: return self.send_json({'ok': False}, 404)
        if col == 'users':
            rows = [dict(r) for r in qall('SELECT user,name,role,approved,photo,createdAt FROM users')]
            for r in rows:
                r['approved'] = bool(r['approved'])
                safe = re.sub(r'[^A-Za-z0-9_-]', '_', str(r['user']))
                r['hasPhoto'] = (PHOTOS_DIR / f'{safe}.jpg').is_file()
            return self.send_json(rows)
        if col == 'pendingUsers':
            return self.send_json([dict(r) for r in qall('SELECT user,name,role,photo,createdAt FROM pending_users')])
        result = []
        for r in qall(f'SELECT data FROM {table} ORDER BY createdAt DESC'):
            try: result.append(json.loads(r['data']))
            except Exception: pass
        self.send_json(result)

    def _col_get(self, col, rec_id):
        table = COLLECTIONS.get(col)
        if not table: return self.send_json({'ok': False}, 404)
        if col == 'users':
            r = qone('SELECT user,name,role,approved,photo,createdAt FROM users WHERE user=?', (rec_id,))
            if not r: return self.send_json(None)
            d = dict(r); d['approved'] = bool(d['approved']); return self.send_json(d)
        r = qone(f'SELECT data FROM {table} WHERE id=?', (rec_id,))
        self.send_json(json.loads(r['data']) if r else None)

    def _col_put(self, col, rec_id):
        table = COLLECTIONS.get(col)
        if not table: return self.send_json({'ok': False}, 404)
        body = self.read_json()
        now  = datetime.utcnow().isoformat()

        if col == 'users':
            existing  = qone('SELECT pass FROM users WHERE user=?', (rec_id,))
            pass_hash = existing['pass'] if existing else None
            if body.get('pass'): pass_hash = hash_pass(body['pass'])
            run('INSERT INTO users (user,name,pass,role,approved,photo,createdAt) VALUES (?,?,?,?,?,?,?) ON CONFLICT(user) DO UPDATE SET name=excluded.name,role=excluded.role,approved=excluded.approved,photo=COALESCE(excluded.photo,users.photo),pass=COALESCE(excluded.pass,users.pass)',
                (rec_id, body.get('name', rec_id), pass_hash, body.get('role', 'inspetor'), 1 if body.get('approved') else 0, body.get('photo'), body.get('createdAt', now)))
            broadcast('users'); return self.send_json({'ok': True})

        if col == 'pendingUsers':
            pass_hash = hash_pass(body['pass']) if body.get('pass') else None
            run('INSERT INTO pending_users (user,name,pass,role,photo,createdAt) VALUES (?,?,?,?,?,?) ON CONFLICT(user) DO UPDATE SET name=excluded.name,role=excluded.role',
                (rec_id, body.get('name', rec_id), pass_hash, body.get('role', 'inspetor'), body.get('photo'), now))
            broadcast('pendingUsers'); return self.send_json({'ok': True})

        if col == 'audits' and body.get('mediaData'):
            body['mediaData'] = persist_media(rec_id, body['mediaData'])

        run(f'INSERT INTO {table} (id,data,createdAt) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
            (rec_id, json.dumps(body), now))
        broadcast(col); self.send_json({'ok': True})

    def _col_delete(self, col, rec_id):
        table  = COLLECTIONS.get(col)
        if not table: return self.send_json({'ok': False}, 404)
        id_col = 'user' if col in ('users', 'pendingUsers') else 'id'
        run(f'DELETE FROM {table} WHERE {id_col}=?', (rec_id,))
        if col == 'audits': remove_media(rec_id)
        broadcast(col); self.send_json({'ok': True})


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    import socket as _socket

    httpd = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)

    from urllib.parse import quote as _q
    dash_files = sorted([f.name for f in PUBLIC_DIR.glob('dashboard*.html')])
    dash_path  = '/' + _q(dash_files[0]) if dash_files else '/dashboard.html'

    ip = None
    try:
        s = _socket.socket(_socket.AF_INET, _socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print('\n══════════════════════════════════════════')
    print('  TOYINPS AUDITORIA — servidor no ar!')
    print(f'  App Local:      http://localhost:{PORT}')
    if ip:
        print(f'  App Rede:       http://{ip}:{PORT}   (use este no celular/tablet)')
    print(f'  Dashboard:      http://localhost:{PORT}{dash_path}')
    if ip:
        print(f'  Dashboard Rede: http://{ip}:{PORT}{dash_path}')
    print('══════════════════════════════════════════\n')

    httpd.serve_forever()
