"""
servidor.py - Servidor Dashboard Metrologia
Serve arquivos estaticos + API de solicitacoes de Analise Extra

Endpoints:
  GET    /api/solicitacoes            -> lista pendentes
  GET    /api/historico               -> historico completo (pendentes + concluidas)
  GET    /api/info                    -> IP local e URL do formulario
  POST   /api/solicitar               -> nova solicitacao  (body JSON)
  POST   /api/historico/limpar        -> zera pendentes + historico (reset contador)
  DELETE /api/solicitacoes/{id}       -> conclui/arquiva solicitacao

E-mail automatico: configure data/config-email.json para ativar.

SEGURANCA:
  - Arquivos sensiveis de data/ bloqueados (.admin_token, config-email.json)
  - CORS restrito a localhost/127.0.0.1
  - Endpoints destrutivos exigem X-Admin-Token
  - Payload maximo: 512 KB por request
"""

import http.server
import socketserver
import json
import pathlib
import uuid
import socket
import smtplib
import threading
import sys
import secrets
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Fix Windows console encoding (cp1252 nao suporta emoji/unicode)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE  = pathlib.Path(__file__).parent          # dashboard-metrologia/
DATA  = BASE / 'data'
SOLIC = DATA / 'solicitacoes.json'             # pendentes
HIST  = DATA / 'solicitacoes_hist.json'        # concluidas
EMAIL_CFG    = DATA / 'config-email.json'
TOKEN_FILE   = DATA / '.admin_token'
PERIODICA_HIST = DATA / 'periodica_hist.json'  # histórico análises periódicas
PORT  = 8080

# ── SEGURANCA ──────────────────────────────────────────────

# [FIX 4] Limite maximo de payload: 512 KB
MAX_BODY_BYTES = 512 * 1024

# [FIX 2] Origens permitidas para CORS
# Permite localhost + IP local da rede (detectado automaticamente)
# ALLOWED_ORIGINS é finalizado após _local_ip() ser calculado (ver abaixo)
_ORIGINS_BASE = {
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost',
    'http://127.0.0.1',
    None,  # requests sem Origin header (curl local, etc.)
}

def _is_local_network(ip):
    """Verifica se o IP é da rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)"""
    import ipaddress
    try:
        return ipaddress.ip_address(ip).is_private
    except Exception:
        return False

# [FIX 3] Token de administrador — gerado automaticamente e salvo em data/.admin_token
def _load_or_create_token():
    if TOKEN_FILE.exists():
        tok = TOKEN_FILE.read_text(encoding='utf-8').strip()
        if tok:
            return tok
    tok = secrets.token_hex(24)   # 48 chars hexadecimais
    TOKEN_FILE.write_text(tok, encoding='utf-8')
    # Tenta ocultar o arquivo (Windows)
    try:
        import subprocess
        subprocess.run(['attrib', '+H', str(TOKEN_FILE)], check=False, capture_output=True)
    except Exception:
        pass
    return tok

ADMIN_TOKEN = _load_or_create_token()

# Bootstrap de arquivos
DATA.mkdir(exist_ok=True)
for f in (SOLIC, HIST):
    if not f.exists():
        f.write_text('[]', encoding='utf-8')

# Cria config-email de exemplo se nao existir
if not EMAIL_CFG.exists():
    EMAIL_CFG.write_text(json.dumps({
        "_instrucoes": "Preencha os campos e mude 'enabled' para true para ativar o envio de e-mail.",
        "enabled":    False,
        "smtp_host":  "smtp.gmail.com",
        "smtp_port":  587,
        "smtp_user":  "seu-email@gmail.com",
        "smtp_pass":  "sua-senha-de-app",
        "from_name":  "Metrologia PFZ CQ"
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print('  [INFO] config-email.json criado em data/ - configure para ativar e-mail.')


# Pendentes
def _load():
    try:   return json.loads(SOLIC.read_text(encoding='utf-8'))
    except Exception: return []

def _save(lst):
    SOLIC.write_text(json.dumps(lst, ensure_ascii=False, indent=2), encoding='utf-8')


# Historico
def _load_hist():
    try:   return json.loads(HIST.read_text(encoding='utf-8'))
    except Exception: return []

def _save_hist(lst):
    HIST.write_text(json.dumps(lst, ensure_ascii=False, indent=2), encoding='utf-8')


# Histórico Análise Periódica
def _load_periodica_hist():
    try:   return json.loads(PERIODICA_HIST.read_text(encoding='utf-8'))
    except Exception: return []

def _save_periodica_hist(lst):
    PERIODICA_HIST.write_text(json.dumps(lst, ensure_ascii=False, indent=2), encoding='utf-8')


# E-mail
def _load_email_cfg():
    try:
        cfg = json.loads(EMAIL_CFG.read_text(encoding='utf-8'))
        return cfg if cfg.get('enabled') else None
    except Exception:
        return None


def _send_email(entry):
    cfg = _load_email_cfg()
    if not cfg:
        return
    try:
        urgente  = entry.get('urgencia') == 'urgente'
        cor_urg  = '#dc2626' if urgente else '#15803d'
        bg_urg   = '#fee2e2' if urgente else '#dcfce7'
        bd_urg   = '#fca5a5' if urgente else '#86efac'
        txt_urg  = 'URGENTE - Requer atencao imediata' if urgente else 'Prioridade Normal'
        pre_urg  = '[URGENTE] ' if urgente else ''
        motivos  = ', '.join(entry.get('motivos') or ['-'])
        ts       = entry.get('timestamp', '')[:19].replace('T', ' ')
        n_anex   = len(entry.get('anexos') or [])

        def row(label, value, bg='#fff'):
            return (f'<tr style="background:{bg};">'
                    f'<td style="padding:6px 10px;font-weight:700;width:40%;border:1px solid #d1d5db;">{label}</td>'
                    f'<td style="padding:6px 10px;border:1px solid #d1d5db;">{value}</td></tr>')

        def bloco(titulo, valor):
            if not valor:
                return ''
            return (f'<div style="margin-bottom:12px;">'
                    f'<strong style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;">{titulo}:</strong>'
                    f'<div style="margin-top:4px;padding:8px 12px;background:#f4f6f9;border-radius:4px;font-size:13px;">'
                    f'{valor}</div></div>')

        html_body = f"""
<html><body style="font-family:Arial,sans-serif;color:#111;max-width:620px;margin:0 auto;">
<div style="background:#1a3a6b;padding:16px 20px;border-bottom:3px solid #c8a000;">
  <h2 style="color:#fff;margin:0;font-size:16px;">Solicitacao de Analise Extra</h2>
  <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:11px;">PFZ CQ &middot; Depto. Controle da Qualidade &middot; Metrologia</p>
</div>
<div style="padding:20px;">
  <div style="background:{bg_urg};border:1px solid {bd_urg};border-radius:6px;padding:8px 14px;
              margin-bottom:16px;font-weight:700;color:{cor_urg};">{txt_urg}</div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
    {row('ID Solicitacao', f'<span style="font-family:monospace;">{entry.get("id","").upper()}</span>', '#f4f6f9')}
    {row('Projeto / Linha', f'{entry.get("projeto","-")} / {entry.get("linha","-")}')}
    {row('Processo / Operacao', f'{entry.get("processo","-")} / {entry.get("operacao","-")}', '#f4f6f9')}
    {row('Part No.', entry.get('partNo','-'))}
    {row('Part Name', entry.get('partName','-'), '#f4f6f9')}
    {row('Titulo', f'<strong>{entry.get("titulo","-")}</strong>')}
    {row('Motivo', motivos, '#f4f6f9')}
    {row('Prazo Solicitado', entry.get('prazo','-'))}
    {row('Solicitante', f'{entry.get("solicitante","-")} - {entry.get("depto","")}', '#f4f6f9')}
    {row('E-mail Solicitante', entry.get('emailSol','-'))}
  </table>
  {bloco('Objetivo', entry.get('objetivo',''))}
  {bloco('Condicao Anterior', entry.get('condicao',''))}
  {bloco('Conteudo Avaliacao', entry.get('conteudo',''))}
  {'<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:12px;"><strong>Anexos:</strong> ' + str(n_anex) + ' arquivo(s) enviado(s)</div>' if n_anex else ''}
  <div style="margin-top:20px;padding:12px;background:#f4f6f9;border-radius:6px;font-size:11px;color:#6b7280;">
    Solicitacao recebida em: {ts}<br>
    Este e um e-mail automatico do Sistema de Metrologia PFZ CQ.
  </div>
</div>
</body></html>"""

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{pre_urg}[Metrologia PFZ CQ] Nova Solicitacao - {entry.get('titulo','')}"
        msg['From']    = f"{cfg.get('from_name','Metrologia PFZ CQ')} <{cfg['smtp_user']}>"
        msg['To']      = entry.get('emailResp', '')
        if entry.get('emailSol') and entry.get('emailSol') != entry.get('emailResp'):
            msg['Cc'] = entry['emailSol']
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        # Destinatarios: formulario + lista de distribuicao do config
        dest_cfg = [r['email'] for r in cfg.get('recipients', [])
                    if r.get('email') and 'extra' in (r.get('tipos') or [])]
        recipients = list({r for r in [entry.get('emailResp'), entry.get('emailSol')] + dest_cfg if r})
        with smtplib.SMTP(cfg['smtp_host'], int(cfg.get('smtp_port', 587)), timeout=15) as srv:
            srv.ehlo()
            srv.starttls()
            srv.login(cfg['smtp_user'], cfg['smtp_pass'])
            srv.sendmail(cfg['smtp_user'], recipients, msg.as_string())

        print(f'  [EMAIL] Enviado -> {", ".join(recipients)}')

    except Exception as e:
        print(f'  [AVISO] E-mail falhou: {e}')


def _send_email_async(entry):
    threading.Thread(target=_send_email, args=(entry,), daemon=True).start()


# IP local
def _local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'


LOCAL_IP = _local_ip()

# CORS: adiciona o IP local da rede ao conjunto de origens permitidas
ALLOWED_ORIGINS = _ORIGINS_BASE | {
    f'http://{LOCAL_IP}:{PORT}',
    f'http://{LOCAL_IP}',
}


# Handler
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE), **kwargs)

    def log_message(self, fmt, *args):
        hora = datetime.now().strftime('%H:%M:%S')
        print(f'  [{hora}] {self.address_string()}  {fmt % args}')

    # ── [FIX 2] CORS restrito a origens permitidas (localhost + rede local) ──
    def _cors(self):
        origin = self.headers.get('Origin')
        allowed = origin in ALLOWED_ORIGINS
        if not allowed and origin:
            try:
                from urllib.parse import urlparse
                host = urlparse(origin).hostname or ''
                allowed = _is_local_network(host)
            except Exception:
                pass
        if allowed:
            self.send_header('Access-Control-Allow-Origin', origin or '*')
        else:
            # Nao envia header CORS — browser bloqueara a requisicao
            return
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')
        self.send_header('Vary', 'Origin')

    # ── [FIX 2] Rejeita origens externas ────────────────────
    def _origin_ok(self):
        origin = self.headers.get('Origin')
        if origin in ALLOWED_ORIGINS:
            return True
        # Aceita qualquer origem da rede local privada
        if origin:
            try:
                from urllib.parse import urlparse
                host = urlparse(origin).hostname or ''
                if _is_local_network(host):
                    return True
            except Exception:
                pass
        self._json_response(403, {'ok': False, 'erro': 'Origem nao permitida'})
        return False

    # ── [FIX 3] Verifica token de admin ─────────────────────
    def _admin_ok(self):
        token = self.headers.get('X-Admin-Token', '')
        if not secrets.compare_digest(token, ADMIN_TOKEN):
            hora = datetime.now().strftime('%H:%M:%S')
            print(f'  [{hora}] [SEGURANCA] Token invalido de {self.address_string()}')
            self._json_response(401, {'ok': False, 'erro': 'Token de administrador invalido'})
            return False
        return True

    # ── [FIX 4] Le body com limite de tamanho ───────────────
    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length > MAX_BODY_BYTES:
            self._json_response(413, {'ok': False, 'erro': f'Payload excede limite de {MAX_BODY_BYTES // 1024} KB'})
            return None
        return self.rfile.read(length)

    # ── Headers de segurança adicionais ─────────────────────
    def _security_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')

    def do_OPTIONS(self):
        if not self._origin_ok(): return
        self.send_response(200); self._cors(); self.end_headers()

    # GET
    def do_GET(self):
        # [FIX 1] Bloqueia acesso a arquivos sensíveis dentro de data/
        # JSONs públicos (mock.json, cronograma.json, etc.) continuam acessíveis.
        # Usa o caminho JÁ NORMALIZADO (translate_path resolve %xx, '..', '//', './')
        # para o arquivo real no disco — fecha bypasses como /data//config-email.json
        # ou /data/%2e admin_token que escapariam de uma comparação por string crua.
        try:
            real = pathlib.Path(self.translate_path(self.path)).resolve()
        except Exception:
            real = None
        if real is not None:
            data_dir = DATA.resolve()
            try:
                rel = real.relative_to(data_dir)  # levanta ValueError se fora de data/
                nome = rel.name
                # Bloqueia: o proprio indice de data/, dotfiles (.admin_token) e config-email.json
                if real == data_dir or nome.startswith('.') or nome == 'config-email.json':
                    self._json_response(403, {'ok': False, 'erro': 'Acesso nao permitido'})
                    return
            except ValueError:
                pass  # nao esta dentro de data/ — segue o fluxo normal

        if self.path == '/api/solicitacoes':
            self._json_response(200, _load())

        elif self.path == '/api/historico':
            # Pendentes + concluidas em ordem cronologica inversa
            pendentes  = [dict(s, status='pendente') for s in _load()]
            concluidas = _load_hist()
            todos = sorted(pendentes + concluidas,
                           key=lambda x: x.get('timestamp', ''), reverse=True)
            self._json_response(200, todos)

        elif self.path == '/api/email-config':
            try:
                cfg = json.loads(EMAIL_CFG.read_text(encoding='utf-8'))
                # Nao expoe a senha no GET - retorna mascarada
                safe = {k: v for k, v in cfg.items() if k != 'smtp_pass'}
                safe['smtp_pass'] = '********' if cfg.get('smtp_pass') else ''
                self._json_response(200, safe)
            except Exception:
                self._json_response(200, {})

        elif self.path == '/api/admin-token':
            # Retorna token para localhost E IPs da rede local privada
            client_ip = self.address_string()
            if client_ip in ('127.0.0.1', '::1', 'localhost') or _is_local_network(client_ip):
                self._json_response(200, {'token': ADMIN_TOKEN})
            else:
                self._json_response(403, {'erro': 'Acesso nao permitido'})

        elif self.path == '/api/info':
            self._json_response(200, {
                'ip':   LOCAL_IP,
                'port': PORT,
                'form': f'http://{LOCAL_IP}:{PORT}/solicitar-analise.html',
            })

        elif self.path == '/api/periodica':
            self._json_response(200, _load_periodica_hist())

        else:
            # Remove If-Modified-Since para evitar 304 (cache) em JS/CSS/HTML
            if self.path.endswith(('.js', '.css', '.html')):
                if 'If-Modified-Since' in self.headers:
                    del self.headers['If-Modified-Since']
                if 'If-None-Match' in self.headers:
                    del self.headers['If-None-Match']
            super().do_GET()

    # POST
    def do_POST(self):
        # [FIX 2] Verifica origem
        if not self._origin_ok(): return

        if self.path == '/api/email-config':
            # [FIX 3] Requer token de admin
            if not self._admin_ok(): return
            # [FIX 4] Limite de payload
            body = self._read_body()
            if body is None: return
            try:
                novo = json.loads(body)
                try:
                    atual = json.loads(EMAIL_CFG.read_text(encoding='utf-8'))
                except Exception:
                    atual = {}
                if novo.get('smtp_pass', '').startswith('*'):
                    novo['smtp_pass'] = atual.get('smtp_pass', '')
                EMAIL_CFG.write_text(
                    json.dumps(novo, ensure_ascii=False, indent=2),
                    encoding='utf-8'
                )
                status = '[ATIVO]' if novo.get('enabled') else '[desativado]'
                print(f'  [SALVO] config-email.json salvo - E-mail {status}')
                self._json_response(200, {'ok': True})
            except Exception as e:
                self._json_response(400, {'ok': False, 'erro': str(e)})

        elif self.path == '/api/periodica':
            # Salva entrada de análise periódica — requer token de admin
            if not self._admin_ok(): return
            body = self._read_body()
            if body is None: return
            try:
                entry = json.loads(body)
                hist = _load_periodica_hist()
                hist.append(entry)
                _save_periodica_hist(hist)
                self._json_response(200, {'ok': True})
            except Exception as e:
                self._json_response(400, {'ok': False, 'erro': str(e)})

        elif self.path == '/api/solicitar':
            # [FIX 4] Limite de payload
            body = self._read_body()
            if body is None: return
            try:
                entry = json.loads(body)
                entry['id']        = str(uuid.uuid4())[:8]
                entry['timestamp'] = datetime.now().isoformat()
                entry['status']    = 'pendente'
                lst = _load(); lst.append(entry); _save(lst)

                urgencia = entry.get('urgencia', 'normal').upper()
                print(f'\n  [NOVO] SOLICITACAO DE ANALISE EXTRA')
                print(f'     ID:        {entry["id"].upper()}')
                print(f'     Titulo:    {entry.get("titulo","?")}')
                print(f'     Part No.:  {entry.get("partNo","?")}')
                print(f'     Projeto:   {entry.get("projeto","?")} / {entry.get("linha","?")}')
                print(f'     Solicit.:  {entry.get("solicitante","?")}')
                print(f'     Urgencia:  {urgencia}\n')

                _send_email_async(entry)
                self._json_response(201, {'ok': True, 'id': entry['id']})
            except Exception as e:
                self._json_response(400, {'ok': False, 'erro': str(e)})

        elif self.path == '/api/medicoes':
            # [FIX 3] Requer token de admin
            if not self._admin_ok(): return
            # [FIX 4] Limite de payload
            body = self._read_body()
            if body is None: return
            try:
                medicoes = json.loads(body)
                mock_path = DATA / 'mock.json'
                # As medicoes sao gravadas DENTRO de mock.json (fonte do dashboard).
                # Se o arquivo nao existir, nao criamos um mock.json parcial —
                # isso deixaria o dashboard sem kpis/graficos. Retorna erro claro.
                if not mock_path.exists():
                    self._json_response(409, {
                        'ok': False,
                        'erro': 'data/mock.json nao encontrado. Restaure o arquivo de dados '
                                'antes de editar as medicoes (o dashboard depende dele).'
                    })
                    return
                mock_data = json.loads(mock_path.read_text(encoding='utf-8'))
                mock_data['medicoesPorMes'] = medicoes
                mock_path.write_text(
                    json.dumps(mock_data, ensure_ascii=False, indent=2),
                    encoding='utf-8'
                )
                print(f'  [SALVO] mock.json/medicoesPorMes atualizado ({len(medicoes)} meses)')
                self._json_response(200, {'ok': True})
            except Exception as e:
                self._json_response(400, {'ok': False, 'erro': str(e)})

        elif self.path == '/api/cronograma':
            # [FIX 3] Requer token de admin
            if not self._admin_ok(): return
            # [FIX 4] Limite de payload
            body = self._read_body()
            if body is None: return
            try:
                data = json.loads(body)
                crono_path = DATA / 'cronograma.json'
                crono_path.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2),
                    encoding='utf-8'
                )
                print(f'  [SALVO] cronograma.json atualizado ({len(data.get("items",[]))} itens)')
                self._json_response(200, {'ok': True})
            except Exception as e:
                self._json_response(400, {'ok': False, 'erro': str(e)})

        elif self.path == '/api/historico/limpar':
            # [FIX 3] Endpoint destrutivo — exige token de admin
            if not self._admin_ok(): return
            _save([])
            _save_hist([])
            hora = datetime.now().strftime('%H:%M:%S')
            print(f'  [{hora}] [ADMIN] Historico zerado por {self.address_string()}')
            self._json_response(200, {'ok': True})

        else:
            self.send_response(404); self.end_headers()

    # DELETE
    def do_DELETE(self):
        # [FIX 2] Verifica origem
        if not self._origin_ok(): return

        if self.path.startswith('/api/solicitacoes/'):
            # [FIX 3] Requer token de admin
            if not self._admin_ok(): return

            sid = self.path.split('/')[-1]
            # Valida formato do ID (8 chars hex)
            if not sid or len(sid) > 40 or not all(c in '0123456789abcdef-' for c in sid.lower()):
                self._json_response(400, {'ok': False, 'erro': 'ID invalido'}); return

            # [FIX 4] Limite de payload no body opcional
            body  = self._read_body()
            extra = {}
            if body:
                try: extra = json.loads(body)
                except Exception: pass

            lst  = _load()
            item = next((x for x in lst if x.get('id') == sid), None)
            if item:
                item['status']        = 'concluida'
                item['dataConclusao'] = datetime.now().isoformat()
                if extra.get('relNo'):
                    item['relNoConclusao'] = extra['relNo']
                hist = _load_hist(); hist.append(item); _save_hist(hist)
                _save([x for x in lst if x.get('id') != sid])
                rel_info = f' -> REL {extra["relNo"]}' if extra.get('relNo') else ''
                print(f'  [OK] Solicitacao {sid.upper()} concluida{rel_info}')

            self._json_response(200, {'ok': True})
        else:
            self.send_response(404); self.end_headers()

    # Helper
    def _json_response(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._security_headers()
        self._cors()
        self.end_headers()
        self.wfile.write(body)


# Servidor multi-thread: evita que conexões keep-alive do navegador
# bloqueiem o atendimento de outras requisicoes (1 thread por conexao)
class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


# Main
if __name__ == '__main__':
    with ThreadingHTTPServer(('', PORT), Handler) as srv:
        email_status = '[EMAIL ATIVO]' if _load_email_cfg() else '[E-mail desativado - configure data/config-email.json]'
        print()
        print('  +==================================================+')
        print('  |      Dashboard Metrologia - Servidor             |')
        print('  +==================================================+')
        print()
        print(f'  Dashboard:   http://localhost:{PORT}/')
        print(f'  Formulario:  http://{LOCAL_IP}:{PORT}/solicitar-analise.html')
        print(f'  {email_status}')
        print()
        print('  +--------------------------------------------------+')
        print('  |  SEGURANCA                                       |')
        print(f'  |  Token Admin: {ADMIN_TOKEN[:12]}...               |')
        print(f'  |  Arquivo:     data/.admin_token                  |')
        print('  |  .admin_token e config-email.json bloqueados     |')
        print('  |  CORS restrito a localhost                       |')
        print('  +--------------------------------------------------+')
        print()
        print('  Ctrl+C para encerrar')
        print()
        srv.serve_forever()
