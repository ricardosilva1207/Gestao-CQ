/**
 * TroubleshootingPage.js — Registro de Nao Conformidades (linha ou fornecedor)
 *
 * Fluxo:
 *  - Lista com filtros (origem, severidade, status, busca) e KPIs
 *  - Modal de registro/edicao com formulario dinamico (origem muda os campos)
 *  - Persiste via API do servidor (POST/PUT/DELETE /api/troubleshooting)
 *  - Fallback offline: salva em localStorage 'metrologia_troubleshooting'
 *  - Auto-refresh a cada 30s
 */

import { HIERARQUIA } from './AnalisePeriodicaPage.js';
import { adminFetch } from '../js/utils.js';

const LOCAL_KEY  = 'metrologia_troubleshooting';
const REFRESH_MS = 30_000;

const SEVERIDADES = [
  { v: 'leve',    l: 'Leve',    cor: '#22c55e' },
  { v: 'media',   l: 'Média',   cor: '#f97316' },
  { v: 'grave',   l: 'Grave',   cor: '#ef4444' },
  { v: 'critica', l: 'Crítica', cor: '#a30000' },
];
const STATUS = [
  { v: 'aberta',  l: 'Aberta',  cor: '#ef4444' },
  { v: 'analise', l: 'Em análise', cor: '#f97316' },
  { v: 'fechada', l: 'Fechada', cor: '#22c55e' },
];

export class TroubleshootingPage {
  constructor(cfg, bus) {
    this._cfg   = cfg;
    this._bus   = bus;
    this._page  = null;
    this._list  = [];
    this._timer = null;
    this._filters = { origem: '', severidade: '', status: '', q: '' };
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

    ['#ts-f-origem', '#ts-f-sev', '#ts-f-status', '#ts-f-q'].forEach(sel => {
      page.querySelector(sel).addEventListener('input', () => {
        const el = page.querySelector(sel);
        const key = sel === '#ts-f-origem' ? 'origem'
                  : sel === '#ts-f-sev'    ? 'severidade'
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
        <div class="ts-title">⚠ Troubleshooting <small>· registro de Não Conformidades</small></div>
        <button class="ts-refresh" id="ts-refresh" title="Atualizar">🔄</button>
        <button class="ts-new" id="ts-new">+ Nova NC</button>
      </div>

      <div class="ts-wrap">
        <div class="ts-kpis" id="ts-kpis"></div>

        <div class="ts-filters">
          <input id="ts-f-q" class="ts-inp" placeholder="🔍 Buscar por descrição, peça, fornecedor..." />
          <select id="ts-f-origem" class="ts-sel">
            <option value="">Origem: todas</option>
            <option value="linha">Linha (interna)</option>
            <option value="fornecedor">Fornecedor</option>
          </select>
          <select id="ts-f-sev" class="ts-sel">
            <option value="">Severidade: todas</option>
            ${SEVERIDADES.map(s => `<option value="${s.v}">${s.l}</option>`).join('')}
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
      .ts-topbar {
        display:flex; align-items:center; gap:14px;
        padding:14px 24px; background:var(--surface,#111c2e);
        border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10;
      }
      .ts-back { padding:6px 14px; border-radius:7px; border:1px solid var(--border);
        background:none; color:var(--text); font-size:12px; cursor:pointer; }
      .ts-back:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-title { font-size:15px; font-weight:700; flex:1; display:flex; align-items:center; gap:8px; }
      .ts-title small { font-size:11px; color:var(--text-mute); font-weight:400; }
      .ts-refresh { padding:6px 12px; border-radius:7px; border:1px solid var(--border);
        background:none; color:var(--text-mute); font-size:11px; cursor:pointer; }
      .ts-refresh:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-refresh.spin { animation:ts-spin .8s linear infinite; }
      @keyframes ts-spin { to { transform:rotate(360deg); } }
      .ts-new { padding:8px 16px; border-radius:8px; border:none;
        background:linear-gradient(135deg,#ef4444 0%,#a30000 100%);
        color:#fff; font-size:12px; font-weight:800; cursor:pointer;
        box-shadow:0 4px 12px rgba(239,68,68,.28); }
      .ts-new:hover { transform:translateY(-1px); }

      .ts-wrap { max-width:1240px; margin:20px auto; padding:0 20px 40px; }

      .ts-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
      @media (max-width:820px) { .ts-kpis { grid-template-columns:repeat(2,1fr); } }
      .ts-kpi { background:var(--surface,#111c2e); border:1px solid var(--border);
        border-radius:10px; padding:12px 16px; }
      .ts-kpi__val { font-size:22px; font-weight:900; line-height:1; }
      .ts-kpi__lbl { font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:var(--text-mute); margin-top:6px; }

      .ts-filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
      .ts-inp, .ts-sel { padding:8px 12px; border-radius:7px; border:1px solid var(--border);
        background:var(--surface,#111c2e); color:var(--text); font-size:12px; }
      .ts-inp { flex:1; min-width:220px; }
      .ts-inp:focus, .ts-sel:focus { outline:none; border-color:var(--accent,#4ea3ff); }

      .ts-list { display:grid; grid-template-columns:1fr; gap:8px; }
      .ts-card { background:var(--surface,#111c2e); border:1px solid var(--border);
        border-left:4px solid var(--border); border-radius:10px; padding:12px 14px;
        display:grid; grid-template-columns:80px 1fr auto; gap:12px; cursor:pointer; transition:background .12s; }
      .ts-card:hover { background:rgba(78,163,255,.05); }
      .ts-card[data-sev="critica"] { border-left-color:#a30000; }
      .ts-card[data-sev="grave"]   { border-left-color:#ef4444; }
      .ts-card[data-sev="media"]   { border-left-color:#f97316; }
      .ts-card[data-sev="leve"]    { border-left-color:#22c55e; }
      .ts-card__date { font-family:monospace; font-size:11px; color:var(--text-mute); align-self:start; padding-top:2px; }
      .ts-card__date small { display:block; font-size:9px; opacity:.7; }
      .ts-card__body h4 { font-size:13px; font-weight:700; margin:0 0 4px; color:var(--text); line-height:1.3; }
      .ts-card__body p  { font-size:11px; color:var(--text-mute); margin:1px 0; }
      .ts-card__meta { text-align:right; align-self:start; display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
      .ts-pill { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
        border-radius:10px; text-transform:uppercase; letter-spacing:.4px; }
      .ts-pill--origem { background:var(--panel-2,#182338); color:var(--text-mute); }
      .ts-pill--linha  { background:rgba(59,130,246,.15); color:#3b82f6; }
      .ts-pill--forn   { background:rgba(168,85,247,.15); color:#a855f7; }
      .ts-pill--sev { color:#fff; }
      .ts-pill--status { border:1px solid currentColor; }

      .ts-empty { padding:40px 20px; text-align:center; color:var(--text-mute); font-size:13px; font-style:italic;
        background:var(--surface,#111c2e); border:1px dashed var(--border); border-radius:10px; }

      /* Modal */
      .ts-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(3px);
        z-index:2200; display:flex; align-items:center; justify-content:center; padding:20px; }
      .ts-modal { background:var(--panel,#131c2e); border:1px solid var(--border);
        border-radius:12px; width:min(680px,100%); max-height:92vh; display:flex; flex-direction:column; overflow:hidden; }
      .ts-modal__hdr { padding:14px 18px; border-bottom:1px solid var(--border);
        display:flex; align-items:center; justify-content:space-between; }
      .ts-modal__hdr h3 { margin:0; font-size:15px; font-weight:700; }
      .ts-modal__close { background:none; border:none; font-size:20px; color:var(--text-mute); cursor:pointer; }
      .ts-modal__body { flex:1; overflow-y:auto; padding:16px 18px; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .ts-modal__body .full { grid-column:1/-1; }
      .ts-field { display:flex; flex-direction:column; gap:4px; }
      .ts-field label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--text-mute); }
      .ts-field input, .ts-field select, .ts-field textarea {
        padding:8px 10px; border-radius:6px; border:1px solid var(--border);
        background:var(--panel-2,#182338); color:var(--text); font-size:13px; font-family:inherit; }
      .ts-field input:focus, .ts-field select:focus, .ts-field textarea:focus { outline:none; border-color:var(--accent,#4ea3ff); }
      .ts-field textarea { min-height:70px; resize:vertical; }
      .ts-modal__ft { padding:12px 18px; border-top:1px solid var(--border);
        display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .ts-modal__ft .right { display:flex; gap:8px; }
      .ts-btn { padding:8px 14px; border-radius:7px; border:1px solid var(--border);
        background:var(--panel-2); color:var(--text); font-size:12px; cursor:pointer; }
      .ts-btn:hover { border-color:var(--accent,#4ea3ff); color:var(--accent,#4ea3ff); }
      .ts-btn--primary { background:var(--accent,#4ea3ff); border-color:var(--accent,#4ea3ff); color:#fff; }
      .ts-btn--primary:hover { opacity:.9; color:#fff; }
      .ts-btn--danger { border-color:#ef4444; color:#ef4444; }
      .ts-btn--danger:hover { background:#ef4444; color:#fff; }
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
      // Merge: entradas do servidor + locais não sincronizadas (sem id do servidor)
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
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); }
    catch { return []; }
  }
  _saveLocal(arr) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(arr)); } catch {}
  }

  _filtered() {
    const { origem, severidade, status, q } = this._filters;
    return this._list.filter(e => {
      if (origem && (e.origem ?? '') !== origem) return false;
      if (severidade && (e.severidade ?? '') !== severidade) return false;
      if (status && (e.status ?? '') !== status) return false;
      if (q) {
        const blob = [e.descricao, e.peca, e.fornecedor, e.projeto, e.linha, e.operacao, e.responsavel]
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
    const criticas = this._list.filter(e => e.severidade === 'critica' || e.severidade === 'grave').length;
    el.innerHTML = `
      <div class="ts-kpi"><div class="ts-kpi__val">${total}</div><div class="ts-kpi__lbl">Total</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:#ef4444">${abertas}</div><div class="ts-kpi__lbl">Abertas</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:#f97316">${analise}</div><div class="ts-kpi__lbl">Em análise</div></div>
      <div class="ts-kpi"><div class="ts-kpi__val" style="color:#a30000">${criticas}</div><div class="ts-kpi__lbl">Graves + Críticas</div></div>
    `;
  }

  /* ── Lista ─────────────────────────────────────────────────── */
  _renderList() {
    const el = this._page.querySelector('#ts-list');
    el.innerHTML = '';
    const rows = this._filtered();
    if (!rows.length) {
      el.innerHTML = `<div class="ts-empty">Nenhuma NC ${this._list.length ? 'com esses filtros.' : 'registrada.'}</div>`;
      return;
    }
    rows.forEach(e => {
      const card = document.createElement('div');
      card.className = 'ts-card';
      card.dataset.sev = e.severidade || '';
      const sev = SEVERIDADES.find(s => s.v === e.severidade);
      const stt = STATUS.find(s => s.v === e.status);
      const dataStr = e.data ? e.data.split('-').reverse().join('/') : this._fmtDate(e.ts);
      const origemPill = e.origem === 'fornecedor'
        ? '<span class="ts-pill ts-pill--forn">Fornecedor</span>'
        : e.origem === 'linha'
          ? '<span class="ts-pill ts-pill--linha">Linha</span>'
          : '<span class="ts-pill ts-pill--origem">—</span>';
      const ctx = e.origem === 'fornecedor'
        ? [e.fornecedor, e.peca, e.lote && `Lote ${e.lote}`].filter(Boolean).join(' · ')
        : [e.projeto, e.linha, e.operacao].filter(Boolean).join(' · ');
      card.innerHTML = `
        <div class="ts-card__date">${dataStr}${e.hora ? '<small>' + this._esc(e.hora) + '</small>' : ''}${e.turno ? '<small>T' + this._esc(e.turno) + '</small>' : ''}</div>
        <div class="ts-card__body">
          <h4>${this._esc(e.descricao) || '<em>Sem descrição</em>'}</h4>
          <p>${this._esc(ctx) || '—'}</p>
          ${e.responsavel ? `<p>Resp: ${this._esc(e.responsavel)}</p>` : ''}
        </div>
        <div class="ts-card__meta">
          ${origemPill}
          ${sev ? `<span class="ts-pill ts-pill--sev" style="background:${sev.cor}">${sev.l}</span>` : ''}
          ${stt ? `<span class="ts-pill ts-pill--status" style="color:${stt.cor}">${stt.l}</span>` : ''}
        </div>
      `;
      card.addEventListener('click', () => this._openForm(e));
      el.appendChild(card);
    });
  }

  /* ── Modal (novo / editar) ────────────────────────────────── */
  _openForm(entry) {
    const isEdit = !!entry;
    const e = isEdit ? { ...entry } : {
      data: this._today(),
      hora: this._now(),
      turno: '1',
      origem: 'linha',
      status: 'aberta',
      severidade: 'media',
    };

    const ov = document.createElement('div');
    ov.className = 'ts-modal-ov';
    ov.innerHTML = `
      <div class="ts-modal">
        <div class="ts-modal__hdr">
          <h3>${isEdit ? 'Editar NC' : 'Nova Não Conformidade'}</h3>
          <button class="ts-modal__close" id="ts-close">×</button>
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
    ov.addEventListener('click', ev => { if (ev.target === ov) ov.remove(); });
    ov.querySelector('#ts-close').addEventListener('click', () => ov.remove());
    ov.querySelector('#ts-cancel').addEventListener('click', () => ov.remove());

    const body = ov.querySelector('#ts-body');
    const rebuild = () => {
      body.innerHTML = this._formHtml(e);
      body.querySelectorAll('[data-field]').forEach(inp => {
        inp.addEventListener('input', () => { e[inp.dataset.field] = inp.value; });
      });
      body.querySelector('[data-field="origem"]').addEventListener('change', () => rebuild());
      body.querySelector('[data-field="projeto"]')?.addEventListener('change', () => rebuild());
      body.querySelector('[data-field="linha"]')?.addEventListener('change', () => rebuild());
    };
    rebuild();

    ov.querySelector('#ts-save').addEventListener('click', async () => {
      if (!e.descricao || !e.descricao.trim()) {
        alert('Descreva a Não Conformidade.'); return;
      }
      const ok = isEdit ? await this._update(e) : await this._create(e);
      if (ok) { ov.remove(); await this._reload(); }
    });

    if (isEdit) {
      ov.querySelector('#ts-del').addEventListener('click', async () => {
        if (!confirm('Remover esta Não Conformidade?')) return;
        const ok = await this._delete(e);
        if (ok) { ov.remove(); await this._reload(); }
      });
    }
  }

  _formHtml(e) {
    const projetos = HIERARQUIA?.projetos ?? [];
    const linhas   = e.projeto ? (HIERARQUIA?.linhas?.[e.projeto] ?? []) : [];
    const ops      = (e.projeto && e.linha) ? (HIERARQUIA?.operacoes?.[e.projeto]?.[e.linha] ?? []) : [];

    const isForn = e.origem === 'fornecedor';

    return `
      <div class="ts-field"><label>Data</label>
        <input type="date" data-field="data" value="${this._esc(e.data ?? '')}"></div>
      <div class="ts-field"><label>Hora</label>
        <input type="time" data-field="hora" value="${this._esc(e.hora ?? '')}"></div>
      <div class="ts-field"><label>Turno</label>
        <select data-field="turno">
          ${[1,2,3].map(t => `<option value="${t}"${String(e.turno)===String(t)?' selected':''}>${t}º Turno</option>`).join('')}
        </select></div>
      <div class="ts-field"><label>Origem</label>
        <select data-field="origem">
          <option value="linha"${e.origem==='linha'?' selected':''}>Linha (interna)</option>
          <option value="fornecedor"${e.origem==='fornecedor'?' selected':''}>Fornecedor</option>
        </select></div>

      ${isForn ? `
        <div class="ts-field"><label>Fornecedor</label>
          <input type="text" data-field="fornecedor" value="${this._esc(e.fornecedor ?? '')}" placeholder="Nome do fornecedor"></div>
        <div class="ts-field"><label>Peça</label>
          <input type="text" data-field="peca" value="${this._esc(e.peca ?? '')}" placeholder="Nome / código"></div>
        <div class="ts-field"><label>Lote / OC</label>
          <input type="text" data-field="lote" value="${this._esc(e.lote ?? '')}" placeholder="Ex: L123 · OC 4567"></div>
        <div class="ts-field"><label>NF / Doc</label>
          <input type="text" data-field="nf" value="${this._esc(e.nf ?? '')}" placeholder="Opcional"></div>
      ` : `
        <div class="ts-field"><label>Projeto</label>
          <select data-field="projeto">
            <option value="">—</option>
            ${projetos.map(p => `<option value="${this._esc(p)}"${e.projeto===p?' selected':''}>${this._esc(p)}</option>`).join('')}
          </select></div>
        <div class="ts-field"><label>Linha</label>
          <select data-field="linha">
            <option value="">—</option>
            ${linhas.map(l => `<option value="${this._esc(l)}"${e.linha===l?' selected':''}>${this._esc(l)}</option>`).join('')}
          </select></div>
        <div class="ts-field"><label>Operação</label>
          <select data-field="operacao">
            <option value="">—</option>
            ${ops.map(o => `<option value="${this._esc(o)}"${e.operacao===o?' selected':''}>${this._esc(o)}</option>`).join('')}
          </select></div>
      `}

      <div class="ts-field full"><label>Descrição da Não Conformidade *</label>
        <textarea data-field="descricao" placeholder="Descreva o que foi encontrado...">${this._esc(e.descricao ?? '')}</textarea></div>

      <div class="ts-field"><label>Severidade</label>
        <select data-field="severidade">
          ${SEVERIDADES.map(s => `<option value="${s.v}"${e.severidade===s.v?' selected':''}>${s.l}</option>`).join('')}
        </select></div>
      <div class="ts-field"><label>Status</label>
        <select data-field="status">
          ${STATUS.map(s => `<option value="${s.v}"${e.status===s.v?' selected':''}>${s.l}</option>`).join('')}
        </select></div>

      <div class="ts-field full"><label>Contramedida / Ação corretiva</label>
        <textarea data-field="contramedida" placeholder="Ação tomada ou planejada...">${this._esc(e.contramedida ?? '')}</textarea></div>

      <div class="ts-field"><label>Responsável</label>
        <input type="text" data-field="responsavel" value="${this._esc(e.responsavel ?? '')}" placeholder="Quem tratou"></div>
      <div class="ts-field"><label>Referência / Rel Nº</label>
        <input type="text" data-field="relNo" value="${this._esc(e.relNo ?? '')}" placeholder="Opcional"></div>
    `;
  }

  /* ── CRUD ─────────────────────────────────────────────────── */
  async _create(entry) {
    // Servidor
    try {
      const r = await adminFetch('/api/troubleshooting', {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      const j = await r.json();
      if (j?.ok) return true;
    } catch {}
    // Fallback local
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
        method: 'PUT',
        body: JSON.stringify(entry),
      });
      const j = await r.json();
      if (j?.ok) return true;
    } catch {}
    // Fallback local
    const local = this._loadLocal();
    const idx = local.findIndex(e => e.id === entry.id);
    if (idx >= 0) { local[idx] = { ...local[idx], ...entry }; this._saveLocal(local); }
    return true;
  }

  async _delete(entry) {
    try {
      await adminFetch('/api/troubleshooting/' + encodeURIComponent(entry.id), { method: 'DELETE' });
    } catch {}
    const local = this._loadLocal();
    this._saveLocal(local.filter(e => e.id !== entry.id));
    return true;
  }

  /* ── Helpers ───────────────────────────────────────────────── */
  _today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  _now()   { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  _fmtDate(ts) { try { const d = new Date(ts); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR'); } catch { return '—'; } }
  _esc(v) { const e = document.createElement('div'); e.textContent = String(v ?? ''); return e.innerHTML; }
}
