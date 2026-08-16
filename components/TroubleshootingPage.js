/**
 * TroubleshootingPage.js — Registro de Troubleshooting (NEXT-B / Toyota)
 *
 * Layout inspirado no template oficial em Excel/PDF "REGISTRO DE
 * TROUBLESHOOTING | NEXT-B":
 *   I.   INFORME (planta + N° + responsavel)
 *   II.  O QUE GEROU? (checkboxes multiplos)
 *   Problema (categoria + Part No + peca + onde/quem/quando/etc)
 *   PECA NG (fotos)
 *   III. COMENTARIOS
 *
 * CRUD via API do servidor (POST/PUT/DELETE /api/troubleshooting)
 * com fallback em localStorage 'metrologia_troubleshooting'.
 *
 * Modal NAO fecha ao clicar fora (evita perda de dados). Apenas via X,
 * Cancelar ou tecla Esc (com confirmacao se ha alteracoes).
 */

import { adminFetch } from '../js/utils.js';

const LOCAL_KEY  = 'metrologia_troubleshooting';
const OPTS_KEY   = 'metrologia_troubleshooting_opts';
const REFRESH_MS = 30_000;

const PLANTAS  = ['PFZ', 'IDT', 'SOR', 'KDB', 'TASA', 'DVR'];
const PROJETOS = ['NEXT-B', 'M20A', 'SHAFT', 'ALPHA', 'BETA5'];

const GATILHOS = [
  { v: 'in_house',        l: 'In House Saihatsu Boshi' },
  { v: 'rnc_er_b',        l: 'RNC / ER-B Fornecedor' },
  { v: 'rncl_logistica',  l: 'RNCL Logística' },
  { v: 'segregacao',      l: 'Segregação / Reparo' },
  { v: 'shipping_stop',   l: 'Shipping Stop' },
  { v: 'notif_cliente',   l: 'Notificação p/ Cliente' },
];

const STATUS = [
  { v: 'aberta',  l: 'Aberta',     cor: '#ef4444' },
  { v: 'analise', l: 'Em análise', cor: '#f97316' },
  { v: 'fechada', l: 'Fechada',    cor: '#22c55e' },
];

const OPTS_DEFAULT = {
  origens:      ['CESTARI', 'CONTIMATIC', 'TS TECH', 'DENSO', 'AISIN', 'Outro'],
  responsaveis: [],
  onde:         ['Sala da Inspeção', 'Linha de Montagem', 'Recebimento', 'Estoque'],
};

export class TroubleshootingPage {
  constructor(cfg, bus) {
    this._cfg   = cfg;
    this._bus   = bus;
    this._page  = null;
    this._list  = [];
    this._timer = null;
    this._filters = { planta: '', gatilho: '', status: '', q: '' };
    this._init();
  }

  _init() {
    const page = document.createElement('div');
    page.id = 'trouble-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';
    page.innerHTML = this._templateShell();

    page.querySelector('#ts-back').addEventListener('click', () => {
      this.hide();
      this._bus?.emit('nav:change', { page: 'dashboard' });
    });
    page.querySelector('#ts-new').addEventListener('click', () => this._openForm(null));
    page.querySelector('#ts-refresh').addEventListener('click', () => this._reload());
    page.querySelector('#ts-edit-opts').addEventListener('click', () => this._openOptsEditor());

    ['#ts-f-planta', '#ts-f-gatilho', '#ts-f-status', '#ts-f-q'].forEach(sel => {
      const el = page.querySelector(sel);
      el.addEventListener('input', () => {
        const key = sel === '#ts-f-planta' ? 'planta'
                  : sel === '#ts-f-gatilho' ? 'gatilho'
                  : sel === '#ts-f-status' ? 'status' : 'q';
        this._filters[key] = el.value.trim().toLowerCase();
        this._renderList();
      });
    });

    this._injectStyle();
    document.body.appendChild(page);
    this._page = page;
  }

  _templateShell() {
    return `
      <div class="ts-topbar">
        <button class="ts-back" id="ts-back">← Voltar ao Dashboard</button>
        <div class="ts-title">⚠ Troubleshooting <small>· NEXT-B</small></div>
        <div class="ts-center-wrap">
          <button class="ts-new" id="ts-new">+ NOVO TROUBLESHOOTING</button>
        </div>
        <button class="ts-refresh" id="ts-refresh" title="Atualizar">🔄</button>
        <button class="ts-edit-opts" id="ts-edit-opts" title="Editar listas de opções">✏ Editar</button>
      </div>

      <div class="ts-wrap">
        <div class="ts-kpis" id="ts-kpis"></div>

        <div class="ts-filters">
          <input id="ts-f-q" class="ts-inp" placeholder="🔍 Buscar por Part No, peça, problema, responsável..." />
          <select id="ts-f-planta" class="ts-sel">
            <option value="">Planta: todas</option>
            ${PLANTAS.map(p => `<option value="${p.toLowerCase()}">${p}</option>`).join('')}
          </select>
          <select id="ts-f-gatilho" class="ts-sel">
            <option value="">O que gerou: todos</option>
            ${GATILHOS.map(g => `<option value="${g.v}">${g.l}</option>`).join('')}
          </select>
          <select id="ts-f-status" class="ts-sel">
            <option value="">Status: todos</option>
            ${STATUS.map(s => `<option value="${s.v}">${s.l}</option>`).join('')}
          </select>
        </div>

        <div class="ts-list" id="ts-list"></div>
      </div>
    `;
  }

  _injectStyle() {
    if (document.getElementById('_ts_css')) return;
    const s = document.createElement('style');
    s.id = '_ts_css';
    s.textContent = `
      /* ── Topbar ── */
      .ts-topbar {
        display:flex; align-items:center; gap:12px;
        padding:12px 20px; background:var(--surface,#111c2e);
        border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10;
      }
      .ts-back { padding:6px 14px; border-radius:7px; border:1px solid var(--border);
        background:none; color:var(--text); font-size:12px; cursor:pointer; }
      .ts-back:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-title { font-size:15px; font-weight:700; display:flex; align-items:center; gap:8px; white-space:nowrap; }
      .ts-title small { font-size:11px; color:var(--text-mute); font-weight:400; }
      .ts-center-wrap { flex:1; display:flex; justify-content:center; }
      .ts-new {
        padding:10px 22px; border-radius:8px; border:none;
        background:linear-gradient(135deg,#ef4444 0%,#a30000 100%);
        color:#fff; font-size:13px; font-weight:900; letter-spacing:.6px; cursor:pointer;
        box-shadow:0 4px 14px rgba(239,68,68,.32); transition:transform .12s;
      }
      .ts-new:hover { transform:translateY(-1px); }
      .ts-refresh, .ts-edit-opts {
        padding:6px 12px; border-radius:7px; border:1px solid var(--border);
        background:none; color:var(--text-mute); font-size:11px; cursor:pointer;
        white-space:nowrap; transition:all .15s;
      }
      .ts-refresh:hover, .ts-edit-opts:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-refresh.spin { animation:ts-spin .8s linear infinite; }
      @keyframes ts-spin { to { transform:rotate(360deg); } }

      /* ── Página ── */
      .ts-wrap { max-width:1240px; margin:20px auto; padding:0 20px 40px; }

      /* KPIs */
      .ts-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
      @media (max-width:820px) { .ts-kpis { grid-template-columns:repeat(2,1fr); } }
      .ts-kpi { background:var(--surface,#111c2e); border:1px solid var(--border); border-radius:10px; padding:12px 16px; }
      .ts-kpi__val { font-size:22px; font-weight:900; line-height:1; }
      .ts-kpi__lbl { font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:var(--text-mute); margin-top:6px; }

      /* Filtros */
      .ts-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
      .ts-inp, .ts-sel {
        padding:8px 12px; border-radius:7px; border:1px solid var(--border);
        background:var(--surface,#111c2e); color:var(--text); font-size:12px;
      }
      .ts-inp { flex:1; min-width:220px; }
      .ts-inp:focus, .ts-sel:focus { outline:none; border-color:var(--accent,#4ea3ff); }

      /* Lista */
      .ts-list { display:grid; grid-template-columns:1fr; gap:8px; }
      .ts-card {
        background:var(--surface,#111c2e); border:1px solid var(--border);
        border-left:4px solid var(--border); border-radius:10px; padding:12px 14px;
        display:grid; grid-template-columns:110px 1fr auto; gap:12px; cursor:pointer;
        transition:background .12s;
      }
      .ts-card:hover { background:rgba(78,163,255,.05); }
      .ts-card[data-planta] { border-left-color:#3b82f6; }
      .ts-card__id { font-family:monospace; font-size:11px; color:var(--accent,#4ea3ff); font-weight:700; }
      .ts-card__date { font-family:monospace; font-size:11px; color:var(--text-mute); }
      .ts-card__body h4 { font-size:13px; font-weight:700; margin:0 0 3px; color:var(--text); }
      .ts-card__body p { font-size:11px; color:var(--text-mute); margin:1px 0; }
      .ts-card__meta { text-align:right; display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
      .ts-pill { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
        border-radius:10px; text-transform:uppercase; letter-spacing:.4px; }
      .ts-pill--planta { background:rgba(59,130,246,.15); color:#3b82f6; }
      .ts-pill--proj   { background:rgba(168,85,247,.15); color:#a855f7; }
      .ts-pill--gat { background:var(--panel-2,#182338); color:var(--text-mute); text-transform:none; letter-spacing:0; }
      .ts-pill--status { border:1px solid currentColor; }
      .ts-empty {
        padding:40px 20px; text-align:center; color:var(--text-mute); font-size:13px; font-style:italic;
        background:var(--surface,#111c2e); border:1px dashed var(--border); border-radius:10px;
      }

      /* ── Modal ── */
      .ts-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(4px);
        z-index:2200; display:flex; align-items:center; justify-content:center; padding:16px; }
      .ts-modal {
        background:var(--panel,#131c2e); border:1px solid var(--border);
        border-radius:12px; width:min(960px,100%); max-height:94vh; display:flex; flex-direction:column; overflow:hidden;
      }
      .ts-modal__hdr {
        padding:12px 18px; background:#1a1a1a; color:#fff;
        display:flex; align-items:center; justify-content:space-between; gap:12px;
      }
      .ts-modal__hdr h3 { margin:0; font-size:14px; font-weight:800; letter-spacing:.5px; flex:1; }
      .ts-modal__hdr-proj { display:flex; align-items:center; gap:6px; margin-right:8px; }
      .ts-modal__hdr-proj label { font-size:11px; color:rgba(255,255,255,.7); font-weight:600; }
      .ts-modal__hdr-proj select {
        padding:4px 8px; border-radius:5px; border:1px solid #444;
        background:#2a2a2a; color:#fff; font-size:12px; font-weight:700;
      }
      .ts-modal__close { background:none; border:none; font-size:22px; color:#fff; cursor:pointer; padding:0 8px; }
      .ts-modal__body { flex:1; overflow-y:auto; padding:0; background:var(--bg,#0d1521); }
      .ts-modal__ft { padding:12px 18px; border-top:1px solid var(--border);
        display:flex; justify-content:space-between; align-items:center; gap:8px; background:var(--panel,#131c2e); }
      .ts-modal__ft .right { display:flex; gap:8px; }
      .ts-btn { padding:8px 14px; border-radius:7px; border:1px solid var(--border);
        background:var(--panel-2); color:var(--text); font-size:12px; cursor:pointer; }
      .ts-btn:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-btn--primary { background:var(--accent,#4ea3ff); border-color:var(--accent,#4ea3ff); color:#fff; }
      .ts-btn--primary:hover { opacity:.9; color:#fff; }
      .ts-btn--danger { border-color:#ef4444; color:#ef4444; }
      .ts-btn--danger:hover { background:#ef4444; color:#fff; }

      /* ── Layout Template (I/II/Problema/Peça NG/III) ── */
      .tpl-sec-hdr {
        background:#0b1220; color:#fff; padding:8px 14px;
        font-size:12px; font-weight:800; letter-spacing:.5px;
        border-top:1px solid var(--border);
      }
      .tpl-sec-hdr--red { background:#c0392b; text-align:center; }

      .tpl-informe { display:grid; grid-template-columns:1fr auto; gap:0; align-items:stretch; }
      .tpl-informe__plantas {
        padding:10px 14px; background:var(--panel,#131c2e);
        display:flex; flex-wrap:wrap; align-items:center; gap:12px;
      }
      .tpl-informe__plantas .informe-inline {
        display:inline-flex; align-items:center; gap:8px; font-size:12px;
      }
      .informe-lbl { font-weight:700; color:var(--text-mute); }
      .tpl-informe__plantas select {
        padding:6px 10px; border-radius:6px; border:1px solid var(--border);
        background:var(--panel-2,#182338); color:var(--text); font-size:12px; font-weight:700;
      }
      .tpl-informe__num {
        display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center;
        padding:10px 14px; background:var(--panel-2,#182338); border-left:1px solid var(--border);
        min-width:280px;
      }
      .tpl-informe__num label { font-size:11px; font-weight:700; color:var(--text-mute); }
      .tpl-informe__num input {
        padding:5px 8px; border-radius:5px; border:1px solid var(--border);
        background:var(--panel,#131c2e); color:var(--text); font-size:12px;
      }

      .tpl-gatilhos {
        padding:12px 14px; background:var(--panel,#131c2e);
        display:grid; grid-template-columns:repeat(2,1fr); gap:6px 16px;
      }
      .tpl-gatilhos label { display:inline-flex; align-items:center; gap:8px; font-size:12px; cursor:pointer; }

      .tpl-problema {
        display:grid; grid-template-columns:130px 1fr 130px 1fr; gap:0;
        border-top:1px solid var(--border);
      }
      .tpl-problema .cell {
        padding:8px 12px; border-right:1px solid var(--border); border-bottom:1px solid var(--border);
        background:var(--panel,#131c2e); font-size:12px;
      }
      .tpl-problema .cell:last-child { border-right:none; }
      .tpl-problema .lbl {
        background:var(--panel-2,#182338); font-weight:700; color:var(--text-mute);
        display:flex; align-items:center;
      }
      .tpl-problema .cell input, .tpl-problema .cell select, .tpl-problema .cell textarea {
        width:100%; padding:5px 8px; border-radius:5px; border:1px solid var(--border);
        background:var(--panel,#131c2e); color:var(--text); font-size:12px; font-family:inherit;
      }
      .tpl-problema .cell input:focus, .tpl-problema .cell select:focus, .tpl-problema .cell textarea:focus {
        outline:none; border-color:var(--accent,#4ea3ff);
      }
      .tpl-problema .cell.wide { grid-column:span 3; }
      .tpl-problema .cell.wide-all { grid-column:span 4; }
      .tpl-problema .problema-titulo {
        background:#f4c518 !important; color:#1a1a1a !important;
        text-align:center; font-weight:900; font-size:14px; padding:10px !important;
      }
      .tpl-problema .cell textarea { min-height:60px; resize:vertical; }
      .tpl-problema .yn-inline { display:flex; align-items:center; gap:14px; }

      .tpl-fotos {
        padding:12px 14px; background:var(--panel,#131c2e);
        display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:8px; align-items:start;
        border-top:1px solid var(--border);
      }
      .tpl-fotos--only { grid-template-columns:1fr 1fr 1fr; }
      .tpl-anexos {
        padding:12px 14px; background:var(--panel,#131c2e);
        display:grid; grid-template-columns:1fr 1fr; gap:12px;
        border-top:1px solid var(--border);
      }
      .tpl-anexo-item { display:flex; flex-direction:column; gap:6px; }
      .tpl-anexo-item small { font-size:10px; color:var(--text-mute); text-align:center; }
      .tpl-fotos__slot {
        border:1px dashed var(--border); border-radius:8px; min-height:120px;
        display:flex; align-items:center; justify-content:center; position:relative;
        background:var(--panel-2,#182338); cursor:pointer; overflow:hidden;
      }
      .tpl-fotos__slot:hover { border-color:var(--accent,#4ea3ff); }
      .tpl-fotos__slot img { width:100%; height:100%; object-fit:cover; }
      .tpl-fotos__slot .hint { color:var(--text-mute); font-size:11px; }
      .tpl-fotos__slot .del {
        position:absolute; top:4px; right:4px; background:rgba(0,0,0,.6); color:#fff;
        border:none; border-radius:4px; padding:2px 6px; font-size:11px; cursor:pointer; opacity:0; transition:opacity .15s;
      }
      .tpl-fotos__slot:hover .del { opacity:1; }
      .tpl-fotos__lateral { display:flex; flex-direction:column; gap:6px; min-width:180px; }
      .tpl-fotos__lateral .tpl-fotos__slot { min-height:80px; }
      .tpl-fotos__lateral small { font-size:9px; color:var(--text-mute); text-align:center; }

      .tpl-comentarios {
        padding:12px 14px; background:var(--panel,#131c2e); border-top:1px solid var(--border);
      }
      .tpl-comentarios textarea {
        width:100%; min-height:60px; padding:8px; border-radius:6px; border:1px solid var(--border);
        background:var(--panel-2,#182338); color:var(--text); font-size:12px; font-family:inherit; resize:vertical;
      }

      /* Opts editor */
      .opts-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:16px 18px; }
      @media (max-width:640px) { .opts-grid { grid-template-columns:1fr; } }
      .opts-item label { display:block; font-size:11px; font-weight:700; text-transform:uppercase;
        letter-spacing:.4px; color:var(--text-mute); margin-bottom:4px; }
      .opts-item textarea {
        width:100%; min-height:130px; padding:8px; border-radius:6px; border:1px solid var(--border);
        background:var(--panel-2,#182338); color:var(--text); font-size:12px; font-family:monospace; resize:vertical;
      }
      .opts-item small { display:block; color:var(--text-mute); font-size:10px; margin-top:4px; }
    `;
    document.head.appendChild(s);
  }

  /* ── Ciclo de vida ─────────────────────────────────────────── */
  show() {
    this._page.style.display = '';
    this._reload();
    if (!this._timer) this._timer = setInterval(() => this._reload(true), REFRESH_MS);
  }
  hide() {
    this._page.style.display = 'none';
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  /* ── Dados ─────────────────────────────────────────────────── */
  async _reload(silent) {
    const btn = this._page.querySelector('#ts-refresh');
    if (!silent) btn.classList.add('spin');
    let server = null;
    try {
      const r = await fetch('/api/troubleshooting', { cache: 'no-store' });
      if (r.ok) server = await r.json();
    } catch {}
    btn.classList.remove('spin');

    const local = this._loadLocal();
    if (Array.isArray(server)) {
      const ids = new Set(server.map(e => e.id));
      const orphans = local.filter(e => !ids.has(e.id));
      this._list = [...server, ...orphans];
    } else {
      this._list = local;
    }
    this._list.sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''));
    this._renderKpis();
    this._renderList();
  }

  _loadLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); } catch { return []; }
  }
  _saveLocal(arr) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)); } catch {}
  }

  _loadOpts() {
    try {
      const raw = JSON.parse(localStorage.getItem(OPTS_KEY) ?? 'null');
      if (raw && typeof raw === 'object') return { ...OPTS_DEFAULT, ...raw };
    } catch {}
    return { ...OPTS_DEFAULT };
  }
  _saveOpts(o) { try { localStorage.setItem(OPTS_KEY, JSON.stringify(o)); } catch {} }

  _filtered() {
    const { planta, gatilho, status, q } = this._filters;
    return this._list.filter(e => {
      if (planta && String(e.planta ?? '').toLowerCase() !== planta) return false;
      if (gatilho && !((e.gatilhos ?? []).includes(gatilho))) return false;
      if (status && (e.status ?? '') !== status) return false;
      if (q) {
        const blob = [e.numInforme, e.responsavel, e.problema, e.partNumber, e.pecaComProblema,
                      e.onde, e.quem, e.origem, e.como, e.obs, e.comentarios]
          .filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }

  /* ── KPIs ─────────────────────────────────────────────────── */
  _renderKpis() {
    const el = this._page.querySelector('#ts-kpis');
    const total = this._list.length;
    const abertas = this._list.filter(e => e.status === 'aberta').length;
    const analise = this._list.filter(e => e.status === 'analise').length;
    const anoAtual = new Date().getFullYear();
    const noAno = this._list.filter(e => (e.ts ?? '').startsWith(String(anoAtual))).length;
    el.innerHTML = `
      <div class="ts-kpi"><div class="ts-kpi__val">${total}</div><div class="ts-kpi__lbl">Total geral</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:#ef4444">${abertas}</div><div class="ts-kpi__lbl">Abertas</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:#f97316">${analise}</div><div class="ts-kpi__lbl">Em análise</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:var(--accent,#4ea3ff)">${noAno}</div><div class="ts-kpi__lbl">Registrados em ${anoAtual}</div></div>
    `;
  }

  /* ── Lista ─────────────────────────────────────────────────── */
  _renderList() {
    const el = this._page.querySelector('#ts-list');
    el.innerHTML = '';
    const rows = this._filtered();
    if (!rows.length) {
      el.innerHTML = `<div class="ts-empty">Nenhum registro ${this._list.length ? 'com esses filtros.' : 'ainda.'}</div>`;
      return;
    }
    rows.forEach(e => {
      const card = document.createElement('div');
      card.className = 'ts-card';
      card.dataset.planta = e.planta || '';
      const stt = STATUS.find(s => s.v === e.status);
      const dataStr = e.quando ? e.quando.split('-').reverse().join('/') : this._fmtDate(e.ts);
      const gats = (e.gatilhos ?? []).map(g => {
        const found = GATILHOS.find(x => x.v === g);
        return found ? found.l : g;
      }).slice(0, 2);
      card.innerHTML = `
        <div>
          <div class="ts-card__id">Nº ${this._esc(e.numInforme) || '—'}</div>
          <div class="ts-card__date">${dataStr}</div>
          ${e.horario ? `<div class="ts-card__date">${this._esc(e.horario)}</div>` : ''}
        </div>
        <div class="ts-card__body">
          <h4>${this._esc(e.problema) || '<em>Sem categoria</em>'} — ${this._esc(e.pecaComProblema) || '—'}</h4>
          <p>Part No: <strong>${this._esc(e.partNumber) || '—'}</strong> · Origem: ${this._esc(e.origem) || '—'}</p>
          <p>${this._esc((e.como || '').slice(0, 140))}${(e.como || '').length > 140 ? '…' : ''}</p>
        </div>
        <div class="ts-card__meta">
          ${e.projeto ? `<span class="ts-pill ts-pill--proj">${this._esc(e.projeto)}</span>` : ''}
          ${e.planta ? `<span class="ts-pill ts-pill--planta">${this._esc(e.planta)}</span>` : ''}
          ${gats.map(g => `<span class="ts-pill ts-pill--gat">${this._esc(g)}</span>`).join('')}
          ${stt ? `<span class="ts-pill ts-pill--status" style="color:${stt.cor}">${stt.l}</span>` : ''}
        </div>
      `;
      card.addEventListener('click', () => this._openForm(e));
      el.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════════
     MODAL — Novo / Editar registro (layout do template Excel/PDF)
  ══════════════════════════════════════════════════════════ */
  _openForm(entry) {
    const isEdit = !!entry;
    const opts = this._loadOpts();

    // Estado inicial
    const e = isEdit ? JSON.parse(JSON.stringify(entry)) : {
      planta:            'DVR',
      projeto:           'NEXT-B',
      numInforme:        this._nextNumInforme(),
      responsavel:       '',
      gatilhos:          [],
      problema:          '',
      partNumber:        '',
      pecaComProblema:   '',
      possuiAnexo:       false,
      onde:              '',
      quem:              '',
      origem:            '',
      quando:            this._today(),
      horario:           '1T',
      qtdChecada:        '',
      qtdNG:             '',
      como:              '',
      obs:               '',
      fotos:             ['', '', ''],  // 3 slots principais
      orderLabel:        '',
      rastreabilidade:   '',
      comentarios:       '',
      status:            'aberta',
    };
    if (!Array.isArray(e.fotos)) e.fotos = [e.fotos, '', ''].slice(0, 3);
    while (e.fotos.length < 3) e.fotos.push('');
    if (!Array.isArray(e.gatilhos)) e.gatilhos = [];

    let dirty = false;
    const markDirty = () => { dirty = true; };

    const ov = document.createElement('div');
    ov.className = 'ts-modal-ov';
    ov.innerHTML = `
      <div class="ts-modal">
        <div class="ts-modal__hdr">
          <h3>REGISTRO DE TROUBLESHOOTING</h3>
          <div class="ts-modal__hdr-proj">
            <label>Projeto:</label>
            <select id="ts-projeto">
              ${PROJETOS.map(p => `<option value="${p}"${e.projeto===p?' selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <button class="ts-modal__close" id="ts-close" title="Fechar">×</button>
        </div>
        <div class="ts-modal__body" id="ts-body"></div>
        <div class="ts-modal__ft">
          ${isEdit ? '<button class="ts-btn ts-btn--danger" id="ts-del">🗑 Remover</button>' : '<div></div>'}
          <div class="right">
            <button class="ts-btn" id="ts-cancel">Cancelar</button>
            <button class="ts-btn ts-btn--primary" id="ts-save">${isEdit ? 'Atualizar' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    // NAO fecha ao clicar fora — evita perder dados.
    // Fecha por: X, Cancelar, Esc (com confirmacao se dirty).
    const tryClose = () => {
      if (dirty && !confirm('Descartar alterações não salvas?')) return;
      ov.remove();
      document.removeEventListener('keydown', escHandler);
    };
    const escHandler = ev => { if (ev.key === 'Escape') tryClose(); };
    document.addEventListener('keydown', escHandler);
    ov.querySelector('#ts-close').addEventListener('click', tryClose);
    ov.querySelector('#ts-cancel').addEventListener('click', tryClose);

    // Select do projeto (no cabeçalho do modal)
    ov.querySelector('#ts-projeto').addEventListener('change', ev => {
      e.projeto = ev.target.value;
      markDirty();
    });

    const body = ov.querySelector('#ts-body');
    body.innerHTML = this._formHtml(e, opts);
    this._bindForm(body, e, markDirty);

    ov.querySelector('#ts-save').addEventListener('click', async () => {
      if (!this._validate(e)) return;
      const ok = isEdit ? await this._update(e) : await this._create(e);
      if (ok) {
        // Persistir origem/responsavel novos como opções
        this._maybePersistOpt(opts, 'origens',      e.origem);
        this._maybePersistOpt(opts, 'responsaveis', e.responsavel);
        this._maybePersistOpt(opts, 'onde',         e.onde);
        dirty = false;
        ov.remove();
        document.removeEventListener('keydown', escHandler);
        await this._reload();
      }
    });

    if (isEdit) {
      ov.querySelector('#ts-del').addEventListener('click', async () => {
        if (!confirm('Remover este Troubleshooting?')) return;
        const ok = await this._delete(e);
        if (ok) { dirty = false; ov.remove(); document.removeEventListener('keydown', escHandler); await this._reload(); }
      });
    }
  }

  _formHtml(e, opts) {
    const dl = (id, arr) => `<datalist id="${id}">${(arr ?? []).map(v => `<option value="${this._esc(v)}"></option>`).join('')}</datalist>`;

    return `
      ${dl('dl-origem',      opts.origens)}
      ${dl('dl-responsavel', opts.responsaveis)}
      ${dl('dl-onde',        opts.onde)}

      <!-- I. INFORME -->
      <div class="tpl-sec-hdr">I. INFORME</div>
      <div class="tpl-informe">
        <div class="tpl-informe__plantas">
          <label class="informe-inline">
            <span class="informe-lbl">Planta:</span>
            <select data-field="planta">
              ${PLANTAS.map(p => `<option value="${p}"${e.planta===p?' selected':''}>${p}</option>`).join('')}
            </select>
          </label>
        </div>
        <div class="tpl-informe__num">
          <label>Nº</label>
          <input type="text" data-field="numInforme" value="${this._esc(e.numInforme)}" placeholder="073-2026">
          <label>Resp.:</label>
          <input type="text" data-field="responsavel" list="dl-responsavel" value="${this._esc(e.responsavel)}">
        </div>
      </div>

      <div class="tpl-sec-hdr">II. O QUE GEROU?</div>
      <div class="tpl-gatilhos">
        ${GATILHOS.map(g => `
          <label>
            <input type="checkbox" data-gatilho="${g.v}"${e.gatilhos.includes(g.v) ? ' checked' : ''}> ${g.l}
          </label>
        `).join('')}
      </div>

      <!-- Bloco PROBLEMA -->
      <div class="tpl-problema">
        <div class="cell wide-all problema-titulo">
          <input type="text" data-field="problema" value="${this._esc(e.problema)}" placeholder="Digite o problema (ex: Contaminação)" style="text-align:center;background:transparent;border:none;color:#1a1a1a;font-weight:900;font-size:14px;">
        </div>

        <div class="cell lbl">Part Number:</div>
        <div class="cell"><input type="text" data-field="partNumber" value="${this._esc(e.partNumber)}"></div>
        <div class="cell lbl">Peça c/ problema</div>
        <div class="cell"><input type="text" data-field="pecaComProblema" value="${this._esc(e.pecaComProblema)}"></div>

        <div class="cell lbl">Onde:</div>
        <div class="cell"><input type="text" data-field="onde" list="dl-onde" value="${this._esc(e.onde)}"></div>
        <div class="cell lbl">Possui anexo:</div>
        <div class="cell">
          <div class="yn-inline">
            <label><input type="radio" name="ts-anexo" value="true"${e.possuiAnexo ? ' checked' : ''}> Sim</label>
            <label><input type="radio" name="ts-anexo" value="false"${!e.possuiAnexo ? ' checked' : ''}> Não</label>
          </div>
        </div>

        <div class="cell lbl">Quem:</div>
        <div class="cell"><input type="text" data-field="quem" value="${this._esc(e.quem)}"></div>
        <div class="cell lbl">Origem:</div>
        <div class="cell"><input type="text" data-field="origem" list="dl-origem" value="${this._esc(e.origem)}"></div>

        <div class="cell lbl">Quando:</div>
        <div class="cell"><input type="date" data-field="quando" value="${this._esc(e.quando)}"></div>
        <div class="cell lbl">Horário:</div>
        <div class="cell">
          <select data-field="horario">
            ${['1T','2T','3T'].map(t => `<option value="${t}"${e.horario===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>

        <div class="cell lbl">Qtd. checada:</div>
        <div class="cell"><input type="text" data-field="qtdChecada" value="${this._esc(e.qtdChecada)}" placeholder="Ex: 100 ou —"></div>
        <div class="cell lbl">Qtd. NG:</div>
        <div class="cell"><input type="number" data-field="qtdNG" value="${this._esc(e.qtdNG)}" min="0"></div>

        <div class="cell lbl">Como (detalhe):</div>
        <div class="cell wide"><textarea data-field="como" placeholder="Descreva em detalhe...">${this._esc(e.como)}</textarea></div>

        <div class="cell lbl">Obs:</div>
        <div class="cell wide"><textarea data-field="obs">${this._esc(e.obs)}</textarea></div>
      </div>

      <!-- PECA NG (fotos do defeito) -->
      <div class="tpl-sec-hdr tpl-sec-hdr--red">PEÇA NG</div>
      <div class="tpl-fotos tpl-fotos--only">
        ${[0,1,2].map(i => this._fotoSlotHtml('foto-'+i, e.fotos[i], 'Foto ' + (i+1))).join('')}
      </div>

      <!-- ANEXOS ADICIONAIS (Order Label + Rastreabilidade) -->
      <div class="tpl-sec-hdr">ANEXOS</div>
      <div class="tpl-anexos">
        <div class="tpl-anexo-item">
          ${this._fotoSlotHtml('order-label', e.orderLabel, 'Order Label')}
          <small>Order Label / Kanban / Pallet</small>
        </div>
        <div class="tpl-anexo-item">
          ${this._fotoSlotHtml('rastreab', e.rastreabilidade, 'Rastreab.')}
          <small>Rastreabilidade Peça/Motor</small>
        </div>
      </div>

      <!-- III. COMENTARIOS -->
      <div class="tpl-sec-hdr" style="background:#c0392b;">III. COMENTÁRIOS</div>
      <div class="tpl-comentarios">
        <textarea data-field="comentarios" placeholder="Comentários finais / ações tomadas...">${this._esc(e.comentarios)}</textarea>
      </div>

      <!-- Status (metadado, fora do template original) -->
      <div class="tpl-sec-hdr">STATUS DO REGISTRO</div>
      <div class="tpl-comentarios">
        <select data-field="status">
          ${STATUS.map(s => `<option value="${s.v}"${e.status===s.v?' selected':''}>${s.l}</option>`).join('')}
        </select>
      </div>
    `;
  }

  _fotoSlotHtml(slot, dataUrl, hint) {
    return `
      <div class="tpl-fotos__slot" data-slot="${slot}">
        ${dataUrl ? `<img src="${dataUrl}" alt=""><button class="del" data-del-slot="${slot}">✕</button>` : `<div class="hint">📷 ${this._esc(hint)}<br><small>Clique p/ adicionar</small></div>`}
      </div>
    `;
  }

  _bindForm(body, e, markDirty) {
    // Inputs de texto/select/textarea
    body.querySelectorAll('[data-field]').forEach(inp => {
      inp.addEventListener('input', () => {
        const v = inp.type === 'number' ? (inp.value === '' ? '' : Number(inp.value)) : inp.value;
        e[inp.dataset.field] = v;
        markDirty();
      });
    });

    // Radio possui anexo
    body.querySelectorAll('input[name="ts-anexo"]').forEach(r => {
      r.addEventListener('change', () => { e.possuiAnexo = r.value === 'true'; markDirty(); });
    });

    // Checkbox gatilhos
    body.querySelectorAll('[data-gatilho]').forEach(cb => {
      cb.addEventListener('change', () => {
        const g = cb.dataset.gatilho;
        const set = new Set(e.gatilhos);
        cb.checked ? set.add(g) : set.delete(g);
        e.gatilhos = [...set];
        markDirty();
      });
    });

    // Fotos: clique nos slots
    body.querySelectorAll('.tpl-fotos__slot').forEach(slot => {
      slot.addEventListener('click', ev => {
        if (ev.target.matches('[data-del-slot]')) return; // deletar tratado abaixo
        const key = slot.dataset.slot;
        this._pickImage((dataUrl) => {
          this._setFoto(e, key, dataUrl);
          markDirty();
          // Re-render só o container de fotos
          const container = body.querySelector('.tpl-fotos');
          if (container) container.outerHTML = this._formHtml(e, this._loadOpts()).match(/<div class="tpl-fotos">[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? container.outerHTML;
          this._bindForm(body, e, markDirty); // rebind
        });
      });
    });
    body.querySelectorAll('[data-del-slot]').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        const key = btn.dataset.delSlot;
        this._setFoto(e, key, '');
        markDirty();
        // Reset do slot HTML
        const slot = btn.closest('.tpl-fotos__slot');
        slot.innerHTML = `<div class="hint">📷 Clique p/ adicionar</div>`;
        slot.addEventListener('click', () => {
          this._pickImage((dataUrl) => {
            this._setFoto(e, key, dataUrl);
            markDirty();
            body.querySelector('.tpl-fotos').outerHTML = body.querySelector('.tpl-fotos').outerHTML; // no-op fallback
          });
        });
      });
    });
  }

  _setFoto(e, key, dataUrl) {
    if (key.startsWith('foto-')) {
      const idx = Number(key.slice(5));
      if (!Array.isArray(e.fotos)) e.fotos = ['', '', ''];
      e.fotos[idx] = dataUrl;
    } else if (key === 'order-label') {
      e.orderLabel = dataUrl;
    } else if (key === 'rastreab') {
      e.rastreabilidade = dataUrl;
    }
  }

  _pickImage(cb) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.addEventListener('change', () => {
      const f = inp.files?.[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        // Redimensiona para no maximo 1200px (mantem base64 gerenciavel)
        const img = new Image();
        img.onload = () => {
          const maxW = 1200;
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          cb(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = String(rd.result);
      };
      rd.readAsDataURL(f);
    });
    inp.click();
  }

  _validate(e) {
    if (!e.problema?.trim())        { alert('Preencha a categoria do problema.'); return false; }
    if (!e.partNumber?.trim())      { alert('Preencha o Part Number.'); return false; }
    if (!e.pecaComProblema?.trim()) { alert('Preencha a peça com problema.'); return false; }
    if (!e.como?.trim())            { alert('Preencha o campo "Como (detalhe)".'); return false; }
    return true;
  }

  /* ── Numeração automática (nnn-YYYY) ───────────────────────── */
  _nextNumInforme() {
    const ano = new Date().getFullYear();
    const nos = (this._list ?? [])
      .map(e => String(e.numInforme ?? ''))
      .filter(s => s.endsWith('-' + ano))
      .map(s => parseInt(s.split('-')[0], 10))
      .filter(n => Number.isFinite(n));
    const next = (nos.length ? Math.max(...nos) : 0) + 1;
    return `${String(next).padStart(3, '0')}-${ano}`;
  }

  _maybePersistOpt(opts, key, value) {
    const v = String(value ?? '').trim();
    if (!v) return;
    const arr = opts[key] ?? [];
    if (arr.includes(v)) return;
    arr.push(v);
    opts[key] = arr.sort((a, b) => a.localeCompare(b));
    this._saveOpts(opts);
  }

  /* ── CRUD ─────────────────────────────────────────────────── */
  async _create(entry) {
    try {
      const r = await adminFetch('/api/troubleshooting', { method: 'POST', body: JSON.stringify(entry) });
      const j = await r.json();
      if (j?.ok) return true;
    } catch {}
    const local = this._loadLocal();
    entry.id = 'l-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    entry.ts = new Date().toISOString();
    local.push(entry);
    this._saveLocal(local);
    return true;
  }

  async _update(entry) {
    try {
      const r = await adminFetch('/api/troubleshooting/' + encodeURIComponent(entry.id), {
        method: 'PUT', body: JSON.stringify(entry),
      });
      const j = await r.json();
      if (j?.ok) return true;
    } catch {}
    const local = this._loadLocal();
    const idx = local.findIndex(e => e.id === entry.id);
    if (idx >= 0) { local[idx] = { ...local[idx], ...entry }; this._saveLocal(local); }
    return true;
  }

  async _delete(entry) {
    try { await adminFetch('/api/troubleshooting/' + encodeURIComponent(entry.id), { method: 'DELETE' }); } catch {}
    const local = this._loadLocal();
    this._saveLocal(local.filter(e => e.id !== entry.id));
    return true;
  }

  /* ══════════════════════════════════════════════════════════
     EDITOR DE OPÇÕES (autocompletes)
  ══════════════════════════════════════════════════════════ */
  _openOptsEditor() {
    const opts = this._loadOpts();
    const ov = document.createElement('div');
    ov.className = 'ts-modal-ov';
    const mk = (key, lbl) => `
      <div class="opts-item">
        <label>${lbl}</label>
        <textarea id="opts-${key}" spellcheck="false">${this._esc((opts[key] ?? []).join('\n'))}</textarea>
        <small>Uma opção por linha. Aparecem como sugestão nos campos.</small>
      </div>`;
    ov.innerHTML = `
      <div class="ts-modal" style="width:min(720px,100%);">
        <div class="ts-modal__hdr">
          <h3>✏ Editar listas de opções</h3>
          <button class="ts-modal__close" id="opts-close">×</button>
        </div>
        <div class="ts-modal__body">
          <div class="opts-grid">
            ${mk('origens',      'Origens / fornecedores')}
            ${mk('responsaveis', 'Responsáveis frequentes')}
            ${mk('onde',         'Locais (Onde)')}
          </div>
        </div>
        <div class="ts-modal__ft">
          <div></div>
          <div class="right">
            <button class="ts-btn" id="opts-cancel">Cancelar</button>
            <button class="ts-btn ts-btn--primary" id="opts-save">Salvar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    const close = () => ov.remove();
    ov.querySelector('#opts-close').addEventListener('click', close);
    ov.querySelector('#opts-cancel').addEventListener('click', close);
    ov.querySelector('#opts-save').addEventListener('click', () => {
      const upd = { ...opts };
      ['origens', 'responsaveis', 'onde'].forEach(k => {
        const raw = ov.querySelector('#opts-' + k).value;
        upd[k] = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      });
      this._saveOpts(upd);
      close();
    });
  }

  /* ── Helpers ───────────────────────────────────────────────── */
  _today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  _fmtDate(ts) { try { const d = new Date(ts); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR'); } catch { return '—'; } }
  _esc(v) { const e = document.createElement('div'); e.textContent = String(v ?? ''); return e.innerHTML; }
}
