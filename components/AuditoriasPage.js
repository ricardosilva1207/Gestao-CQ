/**
 * AuditoriasPage.js — Dashboard resumido do modulo Auditorias
 * Consome as rotas publicas do TOYINPS (porta 3001):
 *   GET /api/public/auditorias?limit=20
 *   GET /api/public/defeitos?limit=20
 *
 * Cabecalho tem botao que abre o app completo em nova aba.
 * Cards clicaveis abrem o app tambem (deep-link via hash).
 * Auto-refresh a cada 30 segundos.
 */

const REFRESH_MS   = 30_000;
const DEFAULT_PORT = 3001;

export class AuditoriasPage {
  constructor(cfg, bus) {
    this._cfg  = cfg;
    this._bus  = bus;
    this._page = null;
    this._auds = [];
    this._defs = [];
    this._timer = null;
    this._init();
  }

  _init() {
    const page = document.createElement('div');
    page.id = 'auditorias-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .aud-topbar {
          display:flex; align-items:center; gap:14px;
          padding:14px 24px; background:var(--surface,#111c2e);
          border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10;
        }
        .aud-back {
          padding:6px 14px; border-radius:7px; border:1px solid var(--border);
          background:none; color:var(--text); font-size:12px; cursor:pointer;
          transition:border-color .15s; white-space:nowrap;
        }
        .aud-back:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
        .aud-title { font-size:15px; font-weight:700; flex:1; display:flex; align-items:center; gap:8px; }
        .aud-title small { font-size:11px; color:var(--text-mute); font-weight:400; }
        .aud-open-btn {
          padding:8px 16px; border-radius:8px; border:none;
          background:linear-gradient(135deg,#e50000 0%,#a30000 100%);
          color:#fff; font-size:12px; font-weight:800; cursor:pointer;
          display:flex; align-items:center; gap:6px;
          box-shadow:0 4px 12px rgba(229,0,0,.28);
          transition:transform .15s;
        }
        .aud-open-btn:hover { transform:translateY(-1px); }
        .aud-refresh-btn {
          padding:6px 12px; border-radius:7px; border:1px solid var(--border);
          background:none; color:var(--text-mute); font-size:11px; cursor:pointer;
          transition:all .15s;
        }
        .aud-refresh-btn:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
        .aud-refresh-btn.spin { animation:aud-spin .8s linear infinite; }
        @keyframes aud-spin { to { transform:rotate(360deg); } }

        .aud-wrap { max-width:1240px; margin:20px auto; padding:0 20px 40px; }

        .aud-status-bar {
          display:flex; align-items:center; justify-content:space-between;
          font-size:11px; color:var(--text-mute); margin-bottom:12px;
        }
        .aud-status-dot {
          display:inline-block; width:8px; height:8px; border-radius:50%;
          background:#22c55e; margin-right:6px; vertical-align:middle;
        }
        .aud-status-dot--off { background:#ef4444; }

        .aud-cols {
          display:grid; grid-template-columns:1fr 1fr; gap:16px;
        }
        @media (max-width:820px) { .aud-cols { grid-template-columns:1fr; } }

        .aud-card {
          background:var(--surface,#111c2e); border:1px solid var(--border);
          border-radius:12px; overflow:hidden;
        }
        .aud-card-hdr {
          padding:12px 16px; background:rgba(78,163,255,.06);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          font-size:12px; font-weight:700; letter-spacing:.4px; text-transform:uppercase;
          color:var(--text);
        }
        .aud-card-count {
          background:var(--panel-2,#182338); color:var(--text-mute);
          font-size:10px; padding:2px 8px; border-radius:10px; font-weight:600; letter-spacing:0;
          text-transform:none;
        }
        .aud-list { max-height:70vh; overflow-y:auto; }
        .aud-item {
          display:grid; grid-template-columns:64px 1fr auto;
          gap:10px; padding:10px 14px; border-bottom:1px solid var(--border);
          cursor:pointer; transition:background .12s;
        }
        .aud-item:last-child { border-bottom:none; }
        .aud-item:hover { background:rgba(78,163,255,.06); }
        .aud-item__date { font-family:monospace; font-size:11px; color:var(--text-mute); align-self:start; padding-top:2px; }
        .aud-item__body h4 { font-size:13px; font-weight:600; margin:0 0 3px; color:var(--text); line-height:1.3; }
        .aud-item__body p  { font-size:11px; color:var(--text-mute); margin:0; }
        .aud-item__meta { text-align:right; align-self:start; }
        .aud-item__status {
          display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
          border-radius:10px; text-transform:uppercase; letter-spacing:.4px;
        }
        .aud-item__status--ok  { background:rgba(34,197,94,.15);  color:#22c55e; }
        .aud-item__status--nc  { background:rgba(239,68,68,.15);  color:#ef4444; }
        .aud-item__status--and { background:rgba(59,130,246,.15); color:#3b82f6; }
        .aud-item__status--na  { background:var(--panel-2,#182338); color:var(--text-mute); }
        .aud-item__sev--baixa   { color:#22c55e; font-size:10px; font-weight:700; text-transform:uppercase; }
        .aud-item__sev--media   { color:#f97316; font-size:10px; font-weight:700; text-transform:uppercase; }
        .aud-item__sev--alta    { color:#ef4444; font-size:10px; font-weight:700; text-transform:uppercase; }

        .aud-empty { padding:40px 20px; text-align:center; color:var(--text-mute); font-size:12px; font-style:italic; }
        .aud-error { padding:20px; color:#ef4444; font-size:12px; text-align:center; }
      </style>

      <div class="aud-topbar">
        <button class="aud-back" id="aud-back">← Voltar ao Dashboard</button>
        <div class="aud-title">📋 Auditorias <small>· visão geral</small></div>
        <button class="aud-refresh-btn" id="aud-refresh" title="Atualizar agora">🔄</button>
        <button class="aud-open-btn"    id="aud-open">🚀 Abrir App de Auditoria ↗</button>
      </div>

      <div class="aud-wrap">
        <div class="aud-status-bar">
          <div id="aud-status"><span class="aud-status-dot"></span> Conectado ao servidor de Auditoria</div>
          <div id="aud-updated">—</div>
        </div>

        <div class="aud-cols">
          <div class="aud-card">
            <div class="aud-card-hdr">
              Últimas Auditorias
              <span class="aud-card-count" id="aud-count-auds">0</span>
            </div>
            <div class="aud-list" id="aud-list-auds"></div>
          </div>

          <div class="aud-card">
            <div class="aud-card-hdr">
              Defeitos Apontados
              <span class="aud-card-count" id="aud-count-defs">0</span>
            </div>
            <div class="aud-list" id="aud-list-defs"></div>
          </div>
        </div>
      </div>
    `;

    page.querySelector('#aud-back').addEventListener('click', () => {
      this.hide();
      this._bus?.emit('nav:change', { page: 'dashboard' });
    });
    page.querySelector('#aud-open').addEventListener('click', () => this._openApp());
    page.querySelector('#aud-refresh').addEventListener('click', () => this._reload(true));

    document.body.appendChild(page);
    this._page = page;
  }

  /* ── URL do servidor TOYINPS ─────────────────────────────────────── */
  _baseUrl() {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:${DEFAULT_PORT}`;
  }

  _openApp(deepLink = '') {
    const url = this._baseUrl() + '/' + (deepLink || '');
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) alert('Nao foi possivel abrir a Auditoria (pop-up bloqueado).\nAcesse: ' + url);
  }

  /* ── Ciclo de vida ─────────────────────────────────────────────── */
  show() {
    this._page.style.display = '';
    this._reload(true);
    if (!this._timer) {
      this._timer = setInterval(() => this._reload(false), REFRESH_MS);
    }
  }

  hide() {
    this._page.style.display = 'none';
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  /* ── Fetch ──────────────────────────────────────────────────────── */
  async _reload(userInitiated) {
    const refreshBtn = this._page.querySelector('#aud-refresh');
    refreshBtn.classList.add('spin');

    const [auds, defs] = await Promise.all([
      this._fetchJson('/api/public/auditorias?limit=20'),
      this._fetchJson('/api/public/defeitos?limit=20'),
    ]);

    refreshBtn.classList.remove('spin');
    const online = auds !== null && defs !== null;
    this._setStatus(online);

    if (online) {
      this._auds = Array.isArray(auds) ? auds : [];
      this._defs = Array.isArray(defs) ? defs : [];
      this._renderList('#aud-list-auds', this._auds, this._renderAuditoriaItem);
      this._renderList('#aud-list-defs', this._defs, this._renderDefeitoItem);
      this._page.querySelector('#aud-count-auds').textContent = String(this._auds.length);
      this._page.querySelector('#aud-count-defs').textContent = String(this._defs.length);
      this._page.querySelector('#aud-updated').textContent =
        'Última atualização: ' + new Date().toLocaleTimeString('pt-BR');
    } else if (userInitiated) {
      this._page.querySelector('#aud-list-auds').innerHTML = `<div class="aud-error">Servidor de Auditoria offline (porta ${DEFAULT_PORT}).</div>`;
      this._page.querySelector('#aud-list-defs').innerHTML = '';
    }
  }

  async _fetchJson(path) {
    try {
      const r = await fetch(this._baseUrl() + path, { cache: 'no-store' });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  _setStatus(online) {
    const el = this._page.querySelector('#aud-status');
    if (online) {
      el.innerHTML = '<span class="aud-status-dot"></span> Conectado ao servidor de Auditoria';
    } else {
      el.innerHTML = `<span class="aud-status-dot aud-status-dot--off"></span> Servidor de Auditoria offline (porta ${DEFAULT_PORT})`;
    }
  }

  /* ── Renderização ──────────────────────────────────────────────── */
  _renderList(sel, arr, renderer) {
    const box = this._page.querySelector(sel);
    box.innerHTML = '';
    if (!arr.length) {
      box.innerHTML = '<div class="aud-empty">Nenhum registro.</div>';
      return;
    }
    arr.forEach(entry => box.appendChild(renderer.call(this, entry)));
  }

  _renderAuditoriaItem = (a) => {
    const row = document.createElement('div');
    row.className = 'aud-item';

    const date = this._pickDate(a);
    const auditor = this._esc(a.auditor ?? a.inspector ?? a.usuario ?? a.user ?? a.userName ?? a.criadoPor ?? '');
    const linha   = this._esc(a.linha ?? a.line ?? a.area ?? a.setor ?? a.projeto ?? a.project ?? '');
    const turno   = a.turno ?? a.shift ?? '';
    const status  = String(a.status ?? a.result ?? a.resultado ?? '').toLowerCase();
    const scPct   = a.score ?? a.scorePct ?? a.pontuacao ?? null;

    const stLbl = this._statusLabel(status, scPct);
    const stCls = this._statusClass(status);

    row.innerHTML = `
      <div class="aud-item__date">${date}${turno ? '<br><small>T'+this._esc(turno)+'</small>' : ''}</div>
      <div class="aud-item__body">
        <h4>${linha || '<em>Sem local</em>'}</h4>
        <p>${auditor ? 'Auditor: ' + auditor : ''}</p>
      </div>
      <div class="aud-item__meta">
        <span class="aud-item__status aud-item__status--${stCls}">${stLbl}</span>
      </div>
    `;
    row.addEventListener('click', () => this._openApp(`#audit-${encodeURIComponent(a.id ?? '')}`));
    return row;
  };

  _renderDefeitoItem = (d) => {
    const row = document.createElement('div');
    row.className = 'aud-item';

    const date  = this._pickDate(d);
    const desc  = this._esc(d.descricao ?? d.description ?? d.defect ?? d.titulo ?? d.nome ?? 'Defeito');
    const item  = this._esc(d.item ?? d.itemNo ?? d.codigo ?? '');
    const sev   = String(d.severidade ?? d.severity ?? d.gravidade ?? '').toLowerCase();
    const st    = String(d.status ?? '').toLowerCase();

    const sevCls = sev.includes('alt') || sev.includes('grav') ? 'alta'
                : sev.includes('med') ? 'media'
                : sev.includes('bai') || sev.includes('lev') ? 'baixa' : '';
    const stLbl  = st.includes('fech') || st === 'closed' ? 'Fechado'
                : st.includes('aber') || st === 'open'   ? 'Aberto'
                : (st || '—');
    const stCls  = stLbl === 'Fechado' ? 'ok' : stLbl === 'Aberto' ? 'nc' : 'na';

    row.innerHTML = `
      <div class="aud-item__date">${date}</div>
      <div class="aud-item__body">
        <h4>${desc}</h4>
        <p>${item ? 'Item ' + item : ''} ${sevCls ? '· <span class="aud-item__sev--'+sevCls+'">'+this._esc(sev)+'</span>' : ''}</p>
      </div>
      <div class="aud-item__meta">
        <span class="aud-item__status aud-item__status--${stCls}">${stLbl}</span>
      </div>
    `;
    row.addEventListener('click', () => this._openApp(`#defect-${encodeURIComponent(d.id ?? '')}`));
    return row;
  };

  _pickDate(o) {
    const raw = o.data ?? o.date ?? o.createdAt ?? o.dataCriacao ?? o.dataAuditoria ?? '';
    if (!raw) return '—';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR');
    } catch {}
    return String(raw).slice(0, 10);
  }

  _statusLabel(status, score) {
    if (status.includes('confor') && !status.includes('nao'))   return 'Conforme';
    if (status.includes('nao conf') || status.includes('reprov')) return 'Nao Conforme';
    if (status.includes('and'))    return 'Em andamento';
    if (status === 'ok' || status === 'ap' || status === 'aprov') return 'Conforme';
    if (score != null) return `${score}%`;
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
  }

  _statusClass(status) {
    if (status.includes('confor') && !status.includes('nao')) return 'ok';
    if (status.includes('nao conf') || status.includes('reprov')) return 'nc';
    if (status.includes('and')) return 'and';
    if (status === 'ok' || status === 'ap' || status === 'aprov') return 'ok';
    return 'na';
  }

  _esc(v) { const e = document.createElement('div'); e.textContent = String(v ?? ''); return e.innerHTML; }
}
