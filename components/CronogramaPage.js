/**
 * CronogramaPage.js — Página de Cronograma de Atividades
 *
 * Features:
 *  - Botão Voltar ao Dashboard
 *  - Cores por estado: verde=realizado, amarelo=pendente (futuro), vermelho=atrasado (passado)
 *  - Botão Editar: CRUD completo de itens, peças e projetos
 *  - Salva via POST /api/cronograma
 */

import { adminFetch } from '../js/utils.js';
import { HIERARQUIA } from './AnalisePeriodicaPage.js';

const TURNOS_ATIVOS_KEY = 'metrologia_turnos_ativos';
const TURNOS_ATIVOS_DEFAULT = [1, 2];

export class CronogramaPage {
  constructor(container, cfg, bus) {
    this._el   = container;
    this._cfg  = cfg;
    this._bus  = bus;
    this._data = null;
    this._editOpen = false;
    this._editData = null; // clone para edição
  }

  /* ══════════════════════════════════════════════════════════
     CICLO DE VIDA
  ══════════════════════════════════════════════════════════ */
  async show() {
    this._el.style.display = '';
    this._injectCSS();
    if (!this._data) await this._loadData();
    this._render();
  }

  hide() {
    this._el.style.display = 'none';
    this._editOpen = false;
  }

  /* ══════════════════════════════════════════════════════════
     DADOS
  ══════════════════════════════════════════════════════════ */
  async _loadData() {
    try {
      const r = await fetch('data/cronograma.json', { cache: 'no-store' });
      this._data = await r.json();
    } catch {
      this._data = { mes: '—', ano: new Date().getFullYear(), mesNum: new Date().getMonth()+1, turnosAtivos: this._getTurnosAtivosDefault(), items: [], diario: [], diasSemana: {} };
    }
  }

  async _saveData(dataToSave) {
    try {
      const res = await adminFetch('/api/cronograma', {
        method: 'POST',
        body: JSON.stringify(dataToSave)
      });
      if (!res.ok) throw new Error('Servidor retornou ' + res.status);
      this._data = dataToSave;
      console.log('[Cronograma] Salvo no servidor com sucesso');
      // Notifica o dashboard para atualizar KPIs, badge e widget
      this._bus.emit('cronograma:saved');
      return true;
    } catch (e) {
      alert('Erro ao salvar: ' + e.message);
      return false;
    }
  }

  /* ══════════════════════════════════════════════════════════
     LÓGICA DE CORES
  ══════════════════════════════════════════════════════════ */
  _dayClass(day, v, d) {
    if (v === 4) return 'ok';
    if (v !== 0) return 'vazio';

    const now       = new Date();
    const nowY      = now.getFullYear();
    const nowM      = now.getMonth() + 1;
    const nowD      = now.getDate();
    const cronYear  = d.ano   ?? nowY;
    const cronMonth = d.mesNum ?? nowM;

    const isPast =
      cronYear < nowY ||
      (cronYear === nowY && cronMonth < nowM) ||
      (cronYear === nowY && cronMonth === nowM && day < nowD);

    return isPast ? 'nok' : 'pend';
  }

  /* ══════════════════════════════════════════════════════════
     CSS
  ══════════════════════════════════════════════════════════ */
  _injectCSS() {
    if (document.getElementById('_crono_css_v8')) return;
    ['_crono_css','_crono_css_v2','_crono_css_v3','_crono_css_v4','_crono_css_v5','_crono_css_v6','_crono_css_v7'].forEach(id => document.getElementById(id)?.remove());
    const s = document.createElement('style');
    s.id = '_crono_css_v8';
    s.textContent = `
      /* ── Layout ── */
      .crono-page {
        display: flex; flex-direction: column;
        height: 100%; overflow: hidden;
        background: var(--bg); color: var(--text);
        box-sizing: border-box;
      }
      .crono-scroll {
        flex: 1; overflow-y: auto;
        padding: 16px 20px 24px;
      }

      /* ── Cabeçalho ── */
      .crono-header {
        display: flex; align-items: center;
        justify-content: space-between;
        flex-wrap: wrap; gap: 10px;
        margin-bottom: 14px;
      }
      .crono-header__left  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .crono-header__right { display: flex; align-items: center; gap: 8px; }

      .crono-title {
        font-size: 15px; font-weight: 700;
        color: var(--text);
        display: flex; align-items: center; gap: 8px;
      }
      .crono-month-chip {
        font-size: 11px; font-weight: 700;
        padding: 3px 10px; border-radius: 12px;
        background: var(--accent); color: #fff; letter-spacing: .4px;
      }

      /* ── Botões do cabeçalho ── */
      .crono-btn {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 11px; font-weight: 600; cursor: pointer;
        padding: 5px 12px; border-radius: 6px;
        border: 1px solid var(--border);
        background: var(--panel); color: var(--text);
        transition: background .15s;
      }
      .crono-btn:hover { background: var(--panel-2); }
      .crono-btn--back  { color: var(--text-mute); }
      .crono-btn--back:hover { color: var(--text); }
      .crono-btn--edit  { border-color: var(--accent); color: var(--accent); }
      .crono-btn--edit:hover { background: var(--accent); color: #fff; }

      /* ── KPIs ── */
      .crono-kpis { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
      .crono-kpi  {
        background: var(--panel); border: 1px solid var(--border);
        border-radius: 8px; padding: 7px 14px; text-align: center; min-width: 72px;
      }
      .crono-kpi__val { font-size: 20px; font-weight: 800; line-height: 1.1; }
      .crono-kpi__val--ok   { color: #22c55e; }
      .crono-kpi__val--nok  { color: #f97316; }
      .crono-kpi__val--pend { color: #f59e0b; }
      .crono-kpi__val--pct  { color: var(--accent); }
      .crono-kpi__lbl { font-size: 10px; color: var(--text-mute); margin-top: 2px; }

      /* ── Tabela Gantt ── */
      .crono-table-wrap {
        overflow-x: auto; margin-bottom: 20px;
        border-radius: 8px; border: 1px solid var(--border);
      }
      .crono-table {
        border-collapse: collapse; width: 100%;
        font-size: 11px; min-width: 900px;
      }
      .crono-table th {
        background: var(--panel-2); color: var(--text-mute);
        font-weight: 600; padding: 5px 4px; text-align: center;
        border: 1px solid var(--border); white-space: nowrap;
      }
      .crono-th--info { text-align: left !important; padding-left: 8px !important; }
      .crono-table td {
        border: 1px solid var(--border); padding: 3px 4px;
        vertical-align: middle; white-space: nowrap;
      }
      .crono-td--item  { text-align:center; font-weight:700; width:28px; }
      .crono-td--peca  { font-weight:600; font-size:10px; min-width:80px; max-width:90px; overflow:hidden; text-overflow:ellipsis; }
      .crono-td--dim   { font-size:10px; min-width:140px; max-width:190px; white-space:normal; line-height:1.3; }
      .crono-td--freq  { text-align:center; font-size:10px; color:var(--text-mute); min-width:72px; }
      .crono-td--tempo { text-align:center; font-size:10px; color:var(--text-mute); min-width:56px; }
      .crono-td--day   { text-align:center; width:22px; min-width:22px; }

      /* Células de estado */
      .crono-cell--ok   { background:#16a34a; color:#fff; font-weight:700; border-radius:3px; font-size:11px; display:inline-block; width:16px; line-height:16px; }
      .crono-cell--nok  { background:transparent; color:#f97316; font-size:13px; display:inline-block; width:16px; line-height:16px; filter: drop-shadow(0 0 2px rgba(249,115,22,.5)); }
      .crono-cell--pend { background:#d97706; color:#fff; font-weight:700; border-radius:3px; font-size:11px; display:inline-block; width:16px; line-height:16px; }
      .crono-cell--vazio { color:var(--text-mute); opacity:.3; }

      .crono-thead--day { font-size:10px; min-width:22px; padding:3px 2px; }
      .crono-thead--ds  { font-size:9px; color:var(--text-mute); font-weight:400; }

      .crono-tr--peca-hdr td {
        background: #1a3a6b; color: #fff;
        font-weight: 700; font-size: 11px;
        padding: 3px 8px; letter-spacing: .4px;
      }
      .crono-tr:not(.crono-tr--t1):not(.crono-tr--t2):nth-child(even) { background: var(--panel-2); }

      /* ── Turnos ── */
      /* 1º Turno: azul */
      .crono-tr--t1 { background: #0d2240 !important; }
      /* 2º Turno (linha inteira): preto */
      .crono-tr--t2 { background: #0a0f1a !important; }
      /* Células individuais do 2º turno dentro de linha única */
      .crono-td--day--gray { background: #0a0f1a !important; }

      /* Tema claro: mesmas cores, mais suaves */
      [data-theme="light"] .crono-tr--t1   { background: #dbeafe !important; }
      [data-theme="light"] .crono-tr--t2   { background: #1e293b !important; }
      [data-theme="light"] .crono-td--day--gray { background: #1e293b !important; }

      .crono-td--turno {
        text-align: center; width: 20px; min-width: 20px;
        font-size: 9px; font-weight: 700; color: var(--text-mute);
        padding: 2px 3px !important;
      }
      .crono-tr--t2 .crono-td--day { background: rgba(0,0,0,0.15); }
      .crono-td--turno--t2 { color: #94a3b8; font-weight: 800; }

      /* ── Legenda ── */
      .crono-legend {
        display: flex; gap: 14px; align-items: center;
        font-size: 11px; color: var(--text-mute);
        margin-bottom: 10px; flex-wrap: wrap;
      }
      .crono-legend__dot {
        display: inline-block; width: 12px; height: 12px;
        border-radius: 3px; margin-right: 4px; vertical-align: middle;
      }

      /* ── Diário de Bordo ── */
      .crono-sec-title {
        font-size: 12px; font-weight: 700; color: var(--text);
        border-bottom: 2px solid var(--accent);
        padding-bottom: 4px; margin-bottom: 10px;
        display: flex; align-items: center; gap: 6px;
      }
      .crono-diario-table {
        width: 100%; border-collapse: collapse;
        font-size: 12px; border: 1px solid var(--border);
        border-radius: 8px; overflow: hidden;
      }
      .crono-diario-table th {
        background: var(--panel-2); color: var(--text-mute);
        font-weight: 600; padding: 6px 10px;
        text-align: left; border-bottom: 1px solid var(--border);
      }
      .crono-diario-table td {
        padding: 6px 10px; border-bottom: 1px solid var(--border); vertical-align: top;
      }
      .crono-diario-table tr:last-child td { border-bottom: none; }
      .crono-diario-table tr:nth-child(even) td { background: var(--panel-2); }
      .crono-d-data { white-space:nowrap; color:var(--text-mute); font-size:11px; }
      .crono-d-item { text-align:center; font-weight:700; color:var(--accent); }
      .crono-d-med  { color:#22c55e; font-style:italic; font-size:11px; }
      .crono-empty  { text-align:center; color:var(--text-mute); padding:18px; font-style:italic; }

      /* ══════════════════════════════════════════════════════
         MODAL DE EDIÇÃO
      ══════════════════════════════════════════════════════ */
      .crono-edit-overlay {
        position: fixed; top:0; right:0; bottom:0; left:var(--sidebar-w,240px); z-index: 1200;
        background: rgba(0,0,0,.55); backdrop-filter: blur(2px);
        display: flex; align-items: flex-start; justify-content: flex-end;
      }
      .crono-edit-panel {
        width: min(520px, 96vw); height: 100vh;
        background: var(--panel); border-left: 1px solid var(--border);
        display: flex; flex-direction: column;
        box-shadow: -6px 0 24px rgba(0,0,0,.3);
        animation: crono-slide-in .2s ease;
      }
      @keyframes crono-slide-in { from { transform: translateX(100%); } to { transform: none; } }

      .crono-edit-hdr {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px; border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }
      .crono-edit-hdr h3 { margin: 0; font-size: 14px; font-weight: 700; }
      .crono-edit-close {
        background: none; border: none; color: var(--text-mute);
        font-size: 20px; cursor: pointer; line-height: 1; padding: 2px 6px;
      }
      .crono-edit-close:hover { color: var(--text); }

      .crono-edit-body {
        flex: 1; overflow-y: auto; padding: 14px 18px;
      }
      .crono-edit-footer {
        display: flex; justify-content: flex-end; gap: 8px;
        padding: 12px 18px; border-top: 1px solid var(--border); flex-shrink: 0;
      }

      /* Grupos de peça no editor */
      .crono-edit-group {
        border: 1px solid var(--border); border-radius: 8px;
        margin-bottom: 14px; overflow: hidden;
      }
      .crono-edit-group-hdr {
        display: flex; align-items: center; justify-content: space-between;
        background: #1a3a6b; color: #fff; padding: 6px 12px;
        font-size: 12px; font-weight: 700;
      }
      .crono-edit-group-hdr input {
        background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
        color: #fff; border-radius: 4px; padding: 2px 8px;
        font-size: 12px; font-weight: 700; width: 160px;
      }
      .crono-edit-group-hdr input:focus { outline: none; background: rgba(255,255,255,.25); }

      /* Itens no editor */
      .crono-edit-item {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        gap: 6px; align-items: start;
        padding: 8px 12px; border-bottom: 1px solid var(--border);
        font-size: 11px;
      }
      .crono-edit-item:last-child { border-bottom: none; }
      .crono-edit-item__num { font-weight:700; color:var(--accent); padding-top:6px; }
      .crono-edit-item__fields { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
      .crono-edit-item__del {
        background: none; border: none; color: #ef4444;
        cursor: pointer; font-size: 16px; padding: 4px; line-height:1;
      }
      .crono-edit-item__del:hover { color: #dc2626; }

      /* Campos de input no editor */
      .crono-field { display:flex; flex-direction:column; gap:2px; }
      .crono-field label { font-size:9px; color:var(--text-mute); font-weight:600; text-transform:uppercase; }
      .crono-field input, .crono-field select {
        background: var(--bg); border: 1px solid var(--border);
        border-radius: 4px; color: var(--text);
        padding: 4px 7px; font-size: 11px;
      }
      .crono-field input:focus, .crono-field select:focus {
        outline: none; border-color: var(--accent);
      }
      .crono-field--full { grid-column: 1 / -1; }

      /* Botão adicionar item */
      .crono-edit-add-item {
        display: flex; align-items: center; gap: 5px;
        width: 100%; padding: 6px 12px;
        background: none; border: none; border-top: 1px solid var(--border);
        color: var(--accent); font-size: 11px; font-weight: 600; cursor: pointer;
      }
      .crono-edit-add-item:hover { background: var(--panel-2); }

      /* Botão adicionar grupo */
      .crono-edit-add-group {
        display: flex; align-items: center; gap: 6px;
        width: 100%; padding: 8px 12px; margin-bottom: 12px;
        background: var(--panel-2); border: 1px dashed var(--border);
        border-radius: 8px; color: var(--text-mute);
        font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .crono-edit-add-group:hover { border-color: var(--accent); color: var(--accent); }

      /* Seções do editor (turnos, atividades) */
      .crono-edit-sec { margin-bottom: 12px; }
      .crono-edit-sec-lbl {
        font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .6px; color: var(--text-mute); margin-bottom: 6px;
      }

      /* Chips de turnos */
      .crono-turnos-row { display: flex; gap: 6px; flex-wrap: wrap; }
      .crono-turno-chip {
        padding: 6px 14px; border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--panel-2); color: var(--text-mute);
        font-size: 12px; font-weight: 600; cursor: pointer;
        transition: all .15s;
      }
      .crono-turno-chip:hover { border-color: var(--accent); color: var(--text); }
      .crono-turno-chip.active {
        background: var(--accent); border-color: var(--accent); color: #fff;
      }

      /* Grade de chips de atividades */
      .crono-atv-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 6px;
      }
      .crono-atv-chip {
        display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
        padding: 8px 10px; border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--panel-2); color: var(--text);
        font-size: 11px; text-align: left; cursor: pointer;
        transition: all .15s;
      }
      .crono-atv-chip:hover:not(:disabled) { border-color: var(--accent); background: var(--panel); }
      .crono-atv-chip strong { font-size: 12px; font-weight: 700; line-height: 1.2; }
      .crono-atv-chip small  { font-size: 9px; color: var(--text-mute); }
      .crono-atv-chip.selected, .crono-atv-chip:disabled {
        opacity: .5; cursor: not-allowed;
        border-color: var(--ok, #22c55e);
      }
      .crono-atv-chip.selected strong::before { content: '✓ '; color: var(--ok, #22c55e); }

      /* Barra de ações do editor */
      .crono-edit-actions { display: flex; gap: 6px; margin-bottom: 8px; }
      .crono-edit-action-btn {
        flex: 1; padding: 8px 10px;
        background: var(--panel-2); border: 1px solid var(--accent);
        color: var(--accent); border-radius: 8px;
        font-size: 11px; font-weight: 700; cursor: pointer;
        transition: all .15s;
      }
      .crono-edit-action-btn:hover { background: var(--accent); color: #fff; }

      /* Ações do item (todos + remover) */
      .crono-edit-item__actions { display: flex; align-items: center; gap: 4px; padding-top: 6px; }
      .crono-edit-item__all {
        padding: 4px 8px; border-radius: 6px;
        border: 1px solid var(--border); background: none;
        color: var(--text-mute); font-size: 10px; font-weight: 700;
        cursor: pointer; white-space: nowrap; transition: all .15s;
      }
      .crono-edit-item__all:hover {
        border-color: var(--accent); color: var(--accent); background: rgba(78,163,255,.08);
      }

      /* ── Célula Justificada (azul) ── */
      .crono-cell--just {
        background:#1d4ed8; color:#fff; font-weight:700; border-radius:3px;
        font-size:11px; display:inline-block; width:16px; line-height:16px;
        cursor:pointer;
      }
      .crono-cell--just:hover { background:#2563eb; }
      .crono-kpi__val--just  { color:#3b82f6; }

      /* Células clicáveis */
      .crono-td--day--clickable { cursor:pointer; }
      .crono-td--day--clickable:hover { filter:brightness(1.3); }
      .crono-td--day--ok-click  { cursor:pointer; }
      .crono-td--day--ok-click:hover  { filter:brightness(1.15); }

      /* ── Modal de Atividade (Realizada/Não Realizada) ── */
      .crono-act-overlay {
        position:fixed; top:0; right:0; bottom:0; left:var(--sidebar-w,240px); z-index:1300;
        background:rgba(0,0,0,.65); backdrop-filter:blur(3px);
        display:flex; align-items:center; justify-content:center;
      }
      .crono-act-box {
        background:var(--panel); border:1px solid var(--border);
        border-radius:12px; padding:24px 26px; width:min(460px,94vw);
        box-shadow:0 24px 64px rgba(0,0,0,.55);
        animation:crono-pop .17s ease;
      }
      .crono-act-box h4 {
        margin:0 0 4px; font-size:14px; font-weight:700; color:var(--text);
        display:flex; align-items:center; gap:8px;
      }
      .crono-act-info {
        font-size:11px; color:var(--text-mute);
        margin-bottom:18px; padding-left:22px;
      }
      /* Toggle Realizada / Não Realizada */
      .crono-status-toggle {
        display:grid; grid-template-columns:1fr 1fr;
        gap:8px; margin-bottom:18px;
      }
      .crono-status-btn {
        padding:10px 8px; border-radius:8px; font-size:12px; font-weight:700;
        border:2px solid var(--border); background:var(--panel-2);
        color:var(--text-dim); cursor:pointer; transition:all .15s;
        display:flex; align-items:center; justify-content:center; gap:6px;
      }
      .crono-status-btn:hover { border-color:var(--text-dim); color:var(--text); }
      .crono-status-btn--ok.active {
        border-color:#22c55e; background:rgba(34,197,94,.12); color:#22c55e;
      }
      .crono-status-btn--nok.active {
        border-color:#f97316; background:rgba(249,115,22,.12); color:#f97316;
      }
      /* Campos de justificativa dentro do modal de atividade */
      .crono-act-just {
        border-top:1px solid var(--border); padding-top:14px; margin-top:2px;
      }
      .crono-act-just-label {
        font-size:10px; font-weight:700; color:var(--text-mute);
        text-transform:uppercase; letter-spacing:.4px;
        margin-bottom:10px; display:flex; align-items:center; gap:6px;
      }
      .crono-act-just-label::after {
        content:'opcional'; font-size:9px; font-weight:400;
        background:var(--panel-2); border:1px solid var(--border);
        padding:1px 6px; border-radius:4px; letter-spacing:0;
        text-transform:none; color:var(--text-mute);
      }

      /* ── Modal de Justificativa ── */
      .crono-justify-overlay {
        position:fixed; top:0; right:0; bottom:0; left:var(--sidebar-w,240px); z-index:1300;
        background:rgba(0,0,0,.65); backdrop-filter:blur(3px);
        display:flex; align-items:center; justify-content:center;
      }
      .crono-justify-box {
        background:var(--panel); border:1px solid var(--border);
        border-radius:10px; padding:22px 24px; width:min(440px,94vw);
        box-shadow:0 24px 64px rgba(0,0,0,.55);
        animation:crono-pop .17s ease;
      }
      @keyframes crono-pop { from{transform:scale(.93);opacity:0} to{transform:none;opacity:1} }
      .crono-justify-box h4 {
        margin:0 0 16px; font-size:14px; font-weight:700; color:var(--text);
        display:flex; align-items:center; gap:8px;
      }
      .crono-justify-box h4 .j-chip {
        font-size:11px; background:#1d4ed8; color:#fff;
        padding:2px 8px; border-radius:5px; font-weight:600;
      }
      .crono-j-field { margin-bottom:12px; }
      .crono-j-field label {
        display:block; font-size:10px; font-weight:700;
        color:var(--text-mute); text-transform:uppercase; margin-bottom:4px;
        letter-spacing:.4px;
      }
      .crono-j-field textarea, .crono-j-field input {
        width:100%; background:var(--bg); border:1px solid var(--border);
        border-radius:5px; color:var(--text); padding:7px 9px;
        font-size:12px; resize:vertical; font-family:inherit; box-sizing:border-box;
      }
      .crono-j-field textarea:focus, .crono-j-field input:focus {
        outline:none; border-color:#3b82f6;
      }
      .crono-j-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }
      .crono-j-del {
        margin-right:auto; background:none; border:1px solid #ef4444;
        color:#ef4444; border-radius:5px; padding:6px 12px;
        font-size:11px; cursor:pointer;
      }
      .crono-j-del:hover { background:#ef4444; color:#fff; }

      /* ── Diário Editável ── */
      .crono-diario-wrap { margin-bottom:24px; }
      .crono-diario-toolbar {
        display:flex; align-items:center; justify-content:flex-end;
        margin-bottom:8px;
      }
      .crono-diario-add-btn {
        display:inline-flex; align-items:center; gap:5px;
        background:#3b82f6; color:#fff; border:none;
        border-radius:5px; padding:5px 13px; font-size:11px;
        font-weight:700; cursor:pointer;
      }
      .crono-diario-add-btn:hover { background:#2563eb; }
      .crono-d-btn {
        background:none; border:none; cursor:pointer;
        font-size:13px; padding:2px 6px; border-radius:3px;
        color:var(--text-mute); line-height:1;
      }
      .crono-d-btn:hover { color:var(--text); background:var(--panel-2); }
      .crono-d-btn--del:hover { color:#ef4444; }
      .crono-d-edit-row td { background:var(--panel-2) !important; }
      .crono-d-edit-row input, .crono-d-edit-row textarea {
        width:100%; background:var(--bg); border:1px solid var(--border);
        border-radius:4px; color:var(--text); padding:4px 6px;
        font-size:11px; font-family:inherit; box-sizing:border-box;
      }
      .crono-d-edit-row input:focus, .crono-d-edit-row textarea:focus {
        outline:none; border-color:#3b82f6;
      }
      .crono-d-just-tag {
        display:inline-block; font-size:9px; font-weight:700;
        background:#1d4ed8; color:#fff; border-radius:3px;
        padding:1px 5px; margin-left:4px; vertical-align:middle;
      }

      /* Botões salvar/cancelar */
      .crono-btn-save {
        background: var(--accent); color: #fff; border: none;
        padding: 7px 18px; border-radius: 6px; font-size: 12px;
        font-weight: 700; cursor: pointer;
      }
      .crono-btn-save:hover { opacity: .9; }
      .crono-btn-cancel {
        background: var(--panel-2); color: var(--text-mute);
        border: 1px solid var(--border); padding: 7px 14px;
        border-radius: 6px; font-size: 12px; cursor: pointer;
      }
      .crono-btn-cancel:hover { color: var(--text); }
      .crono-del-group {
        background: none; border: none; color: rgba(255,255,255,.6);
        cursor: pointer; font-size: 14px; padding: 0 4px;
      }
      .crono-del-group:hover { color: #fca5a5; }

      /* ── Dias sem expediente ── */
      .crono-thead--sem-exp { background:#431407 !important; color:#fb923c !important; }
      .crono-td--sem-exp { background:rgba(251,146,60,.07) !important; }
      /* Sábado e Domingo — destaque distinto do 'sem expediente' */
      .crono-thead--weekend {
        background: linear-gradient(180deg, rgba(148,163,184,.18), rgba(148,163,184,.08)) !important;
        color: #cbd5e1 !important;
        border-left: 1px solid rgba(148,163,184,.35);
        border-right: 1px solid rgba(148,163,184,.35);
      }
      .crono-td--weekend {
        background: rgba(148,163,184,.06);
        border-left: 1px solid rgba(148,163,184,.18);
        border-right: 1px solid rgba(148,163,184,.18);
      }

      /* Botões S/ Expediente e Próximo Mês */
      .crono-btn--semexp { color:#f97316; border-color:#f97316; }
      .crono-btn--semexp:hover { background:#f97316; color:#fff; }
      .crono-btn--next   { color:#8b5cf6; border-color:#8b5cf6; }
      .crono-btn--next:hover   { background:#8b5cf6; color:#fff; }
      .crono-btn--pdf    { color:#22c55e; border-color:#22c55e; }
      .crono-btn--pdf:hover    { background:#22c55e; color:#fff; }

      /* ── Modal Sem Expediente ── */
      .crono-semexp-overlay {
        position:fixed; top:0; right:0; bottom:0; left:var(--sidebar-w,240px); z-index:1300;
        background:rgba(0,0,0,.65); backdrop-filter:blur(3px);
        display:flex; align-items:center; justify-content:center;
      }
      .crono-semexp-box {
        background:var(--panel); border:1px solid var(--border);
        border-radius:12px; padding:24px; width:min(500px,96vw);
        box-shadow:0 24px 64px rgba(0,0,0,.55); animation:crono-pop .17s ease;
      }
      .crono-semexp-box h3 { margin:0 0 4px; font-size:15px; font-weight:700; }
      .crono-semexp-subtitle { font-size:11px; color:var(--text-mute); margin-bottom:16px; }
      .crono-cal-grid {
        display:grid; grid-template-columns:repeat(7,1fr); gap:4px; margin-bottom:14px;
      }
      .crono-cal-wd {
        text-align:center; font-size:9px; font-weight:700;
        color:var(--text-mute); text-transform:uppercase; padding:4px 0;
      }
      .crono-cal-day {
        aspect-ratio:1; display:flex; align-items:center; justify-content:center;
        border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;
        border:1px solid var(--border); transition:all .15s;
        background:var(--panel-2); color:var(--text);
      }
      .crono-cal-day:hover:not(.crono-cal-day--weekend):not(.crono-cal-day--empty) {
        border-color:var(--accent);
      }
      .crono-cal-day--weekend {
        background:var(--bg); color:var(--text-mute); opacity:.45;
        cursor:default; border-style:dashed;
      }
      .crono-cal-day--selected { background:#f97316; color:#fff; border-color:#f97316; }
      .crono-cal-day--selected:hover { background:#ea6c00; border-color:#ea6c00; }
      .crono-cal-day--empty { background:transparent; border:none; cursor:default; }

      /* ── Modal Confirmação Próximo Mês ── */
      .crono-confirm-overlay {
        position:fixed; top:0; right:0; bottom:0; left:var(--sidebar-w,240px); z-index:1300;
        background:rgba(0,0,0,.65); backdrop-filter:blur(3px);
        display:flex; align-items:center; justify-content:center;
      }
      .crono-confirm-box {
        background:var(--panel); border:1px solid var(--border);
        border-radius:12px; padding:24px 26px; width:min(490px,96vw);
        box-shadow:0 24px 64px rgba(0,0,0,.55); animation:crono-pop .17s ease;
      }
      .crono-confirm-box h3 {
        margin:0 0 14px; font-size:15px; font-weight:700;
        display:flex; align-items:center; gap:8px;
      }
      .crono-confirm-list {
        font-size:11px; color:var(--text-mute);
        margin:0 0 14px; padding-left:18px; line-height:1.9;
      }
      .crono-confirm-warn {
        background:rgba(249,115,22,.1); border:1px solid rgba(249,115,22,.3);
        border-radius:6px; padding:8px 12px; font-size:11px;
        color:#f97316; margin-bottom:18px; line-height:1.6;
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     RENDER PRINCIPAL
  ══════════════════════════════════════════════════════════ */
  _render() {
    const d = this._data;
    this._el.className = 'crono-page';
    this._el.innerHTML = '';

    // ── Justificativas ──
    const justifiedSet    = this._buildJustifiedSet(d.diario ?? []);
    const semExpedienteSet = new Set((d.diasSemExpediente ?? []).map(Number));

    // ── Calcular KPIs ──
    let totalOk = 0, totalNok = 0, totalPend = 0, totalJust = 0;
    (d.items ?? []).forEach(it => {
      const turnos = it.turnos ?? [{ turno: 1, dias: it.dias ?? {} }];
      turnos.forEach(turnoObj => {
        Object.entries(turnoObj.dias ?? {}).forEach(([day, v]) => {
          if (semExpedienteSet.has(Number(day))) return; // Sem expediente: não conta nos KPIs
          const cls = this._dayClass(Number(day), v, d);
          if (cls === 'ok')        totalOk++;
          else if (cls === 'nok') {
            if (justifiedSet.has(`${it.item}_${day}`)) totalJust++;
            else totalNok++;
          }
          else if (cls === 'pend') totalPend++;
        });
      });
    });
    const totalSched = totalOk + totalNok + totalJust + totalPend;
    const pct = totalSched ? Math.round(((totalOk + totalJust) / totalSched) * 100) : 0;

    // ── Scroll container ──
    const scroll = document.createElement('div');
    scroll.className = 'crono-scroll';

    // ── Cabeçalho ──
    const hdr = document.createElement('div');
    hdr.className = 'crono-header';

    // Esquerda: título + chip
    const hdrL = document.createElement('div');
    hdrL.className = 'crono-header__left';
    hdrL.innerHTML = `
      <div class="crono-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Cronograma de Atividades
      </div>
      <span class="crono-month-chip">${d.mes ?? '—'}</span>`;
    hdr.appendChild(hdrL);

    // Direita: botões Voltar + Editar
    const hdrR = document.createElement('div');
    hdrR.className = 'crono-header__right';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'crono-btn crono-btn--edit';
    btnEdit.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar`;
    btnEdit.addEventListener('click', () => this._openEditModal());

    const btnBack = document.createElement('button');
    btnBack.className = 'crono-btn crono-btn--back';
    btnBack.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg> Dashboard`;
    btnBack.addEventListener('click', () => this._bus?.emit('nav:change', { page: 'dashboard' }));

    const btnPDF = document.createElement('button');
    btnPDF.className = 'crono-btn crono-btn--pdf';
    btnPDF.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF`;
    btnPDF.title = 'Exportar cronograma e diário de bordo em PDF';
    btnPDF.addEventListener('click', () => this._exportPDF());

    const btnSemExp = document.createElement('button');
    btnSemExp.className = 'crono-btn crono-btn--semexp';
    btnSemExp.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg> S/ Expediente`;
    btnSemExp.title = 'Marcar dias sem expediente';
    btnSemExp.addEventListener('click', () => this._openSemExpedienteModal());

    const btnNextMonth = document.createElement('button');
    btnNextMonth.className = 'crono-btn crono-btn--next';
    btnNextMonth.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg> Próximo Mês`;
    btnNextMonth.title = 'Avançar para o próximo mês mantendo as atividades';
    btnNextMonth.addEventListener('click', () => this._avancarMes());

    hdrR.appendChild(btnPDF);
    hdrR.appendChild(btnSemExp);
    hdrR.appendChild(btnNextMonth);
    hdrR.appendChild(btnEdit);
    hdrR.appendChild(btnBack);
    hdr.appendChild(hdrR);
    scroll.appendChild(hdr);

    // ── KPIs ──
    const kpis = document.createElement('div');
    kpis.className = 'crono-kpis';
    kpis.innerHTML = `
      <div class="crono-kpi"><div class="crono-kpi__val crono-kpi__val--ok">${totalOk}</div><div class="crono-kpi__lbl">Realizados</div></div>
      <div class="crono-kpi"><div class="crono-kpi__val crono-kpi__val--pend">${totalPend}</div><div class="crono-kpi__lbl">Pendentes</div></div>
      <div class="crono-kpi"><div class="crono-kpi__val crono-kpi__val--nok">${totalNok}</div><div class="crono-kpi__lbl">Atrasados</div></div>
      <div class="crono-kpi"><div class="crono-kpi__val crono-kpi__val--just">${totalJust}</div><div class="crono-kpi__lbl">Justificados</div></div>
      <div class="crono-kpi"><div class="crono-kpi__val crono-kpi__val--pct">${pct}%</div><div class="crono-kpi__lbl">Cumprimento</div></div>`;
    scroll.appendChild(kpis);

    // ── Legenda ──
    const leg = document.createElement('div');
    leg.className = 'crono-legend';
    leg.innerHTML = `
      <span><span class="crono-legend__dot" style="background:#16a34a;"></span>✓ Realizado</span>
      <span><span class="crono-legend__dot" style="background:#1d4ed8;"></span>✓ Justificado</span>
      <span><span class="crono-legend__dot" style="background:#f97316;"></span>⚠ Atrasado</span>
      <span><span class="crono-legend__dot" style="background:#d97706;"></span>⏳ Pendente</span>
      <span><span class="crono-legend__dot" style="background:var(--border);"></span>· N/A</span>
      <span style="margin-left:6px;border-left:1px solid var(--border);padding-left:10px;"><span class="crono-legend__dot" style="background:#0d2240;border:1px solid #1e4080;"></span>1º Turno</span>
      <span><span class="crono-legend__dot" style="background:#0a0f1a;border:1px solid #333;"></span>2º Turno</span>
      <span style="margin-left:6px;border-left:1px solid var(--border);padding-left:10px;"><span class="crono-legend__dot" style="background:rgba(251,146,60,.15);border:1px solid #f97316;"></span>⊘ Sem expediente</span>`;
    scroll.appendChild(leg);

    // ── Tabela ──
    scroll.appendChild(this._buildTable(d, justifiedSet, semExpedienteSet));

    // ── Diário de Bordo ──
    const secTitle = document.createElement('div');
    secTitle.className = 'crono-sec-title';
    secTitle.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      Diário de Bordo`;
    scroll.appendChild(secTitle);
    scroll.appendChild(this._buildDiario(d.diario ?? [], d));

    this._el.appendChild(scroll);
  }

  /* ══════════════════════════════════════════════════════════
     TABELA GANTT
  ══════════════════════════════════════════════════════════ */
  _buildTable(d, justifiedSet = new Set(), semExpedienteSet = new Set()) {
    const wrap  = document.createElement('div');
    wrap.className = 'crono-table-wrap';
    const table = document.createElement('table');
    table.className = 'crono-table';

    const diasNum = Object.keys(d.diasSemana ?? {}).map(Number).sort((a,b)=>a-b);
    const now     = new Date();
    const isCurrentMonth = (d.mesNum === now.getMonth()+1) && (d.ano === now.getFullYear());
    const INFO_COLS = 6; // Nº, Dimensional, Freq/Turno, Freq/Mês, Tempo, T

    // ── Thead ──
    const thead = document.createElement('thead');
    const trH1  = document.createElement('tr');
    ['Nº','Dimensional','Freq/Turno','Freq/Mês','Tempo','T'].forEach(lbl => {
      const th = document.createElement('th');
      th.textContent = lbl; th.className = 'crono-th--info'; th.rowSpan = 2;
      if (lbl === 'T') { th.style.width = '20px'; th.style.minWidth = '20px'; th.style.padding = '3px 2px'; }
      trH1.appendChild(th);
    });
    const weekendSet = new Set(); // dias que caem em sáb/dom
    Object.entries(d.diasSemana ?? {}).forEach(([day, nome]) => {
      if (nome === 'sáb' || nome === 'dom') weekendSet.add(Number(day));
    });

    diasNum.forEach(day => {
      const th = document.createElement('th');
      th.textContent = String(day).padStart(2,'0');
      th.className = 'crono-thead--day';
      if (weekendSet.has(day))       th.className += ' crono-thead--weekend';
      if (semExpedienteSet.has(day)) th.className += ' crono-thead--sem-exp';
      if (isCurrentMonth && day === now.getDate()) th.style.color = 'var(--accent)';
      trH1.appendChild(th);
    });
    thead.appendChild(trH1);

    const trH2 = document.createElement('tr');
    diasNum.forEach(day => {
      const th = document.createElement('th');
      th.textContent = (d.diasSemana?.[String(day)] ?? '').substring(0,3);
      th.className = 'crono-thead--day crono-thead--ds';
      if (weekendSet.has(day)) th.className += ' crono-thead--weekend';
      trH2.appendChild(th);
    });
    thead.appendChild(trH2);
    table.appendChild(thead);

    // ── Tbody ──
    const tbody  = document.createElement('tbody');
    let currPeca = null;

    (d.items ?? []).forEach(it => {
      // Grupo header de peça
      if (it.peca !== currPeca) {
        currPeca = it.peca;
        const trP = document.createElement('tr');
        trP.className = 'crono-tr--peca-hdr';
        const td = document.createElement('td');
        td.colSpan = INFO_COLS + diasNum.length;
        td.textContent = it.peca;
        trP.appendChild(td);
        tbody.appendChild(trP);
      }

      // Normaliza: usa it.turnos se disponível; senão, deriva dos turnos ativos globais
      const turnosAtivos = Array.isArray(d.turnosAtivos) && d.turnosAtivos.length
        ? d.turnosAtivos : [1];
      const turnos = it.turnos ?? turnosAtivos.map(t => ({ turno: t, dias: it.dias ?? {} }));
      const multi  = turnos.length > 1;
      const tempoFmt = /^\d+$/.test(it.tempo || '') ? `${it.tempo} min` : (it.tempo || '—');

      turnos.forEach((turnoObj, tIdx) => {
        const tr = document.createElement('tr');
        tr.className = `crono-tr crono-tr--t${tIdx === 0 ? '1' : '2'}`;

        // Colunas de info — apenas na primeira linha do turno (rowspan se multi)
        if (tIdx === 0) {
          const infoCells = [
            { cls: 'crono-td--item',  txt: it.item },
            { cls: 'crono-td--dim',   txt: it.dimensional },
            { cls: 'crono-td--freq',  txt: it.freqPorTurno ?? '' },
            { cls: 'crono-td--freq',  txt: it.freqMes ?? '' },
            { cls: 'crono-td--tempo', txt: tempoFmt },
          ];
          infoCells.forEach(c => {
            const td = document.createElement('td');
            td.className = c.cls;
            td.textContent = c.txt;
            if (multi) td.rowSpan = turnos.length;
            tr.appendChild(td);
          });
        }

        // Célula T (turno label)
        const tdT = document.createElement('td');
        tdT.className = `crono-td--turno${tIdx > 0 ? ' crono-td--turno--t2' : ''}`;
        tdT.textContent = multi ? `T${turnoObj.turno}` : '';
        tr.appendChild(tdT);

        // Células de dias
        const graySet = new Set(turnoObj.grayDias ?? []);
        diasNum.forEach(day => {
          const td  = document.createElement('td');
          const isGrayCell = graySet.has(String(day));
          const isSemExp   = semExpedienteSet.has(day);
          const v   = isSemExp ? undefined : turnoObj.dias?.[String(day)];
          const cls = isSemExp ? 'vazio' : this._dayClass(day, v, d);
          const jKey = `${it.item}_${day}`;
          const isJust = cls === 'nok' && justifiedSet.has(jKey);

          let tdCls = 'crono-td--day';
          if (isGrayCell) tdCls += ' crono-td--day--gray';
          if (isSemExp)   tdCls += ' crono-td--sem-exp';
          if (weekendSet.has(day)) tdCls += ' crono-td--weekend';
          if (cls === 'nok' && !isJust) tdCls += ' crono-td--day--nok';
          td.className = tdCls;

          if (isSemExp)            td.innerHTML = '<span class="crono-cell--vazio" title="Sem expediente" style="opacity:.4;font-size:10px;">⊘</span>';
          else if (cls === 'ok')   td.innerHTML = '<span class="crono-cell--ok" title="Realizado — clique para alterar">✓</span>';
          else if (isJust)         td.innerHTML = '<span class="crono-cell--just" title="Justificado — clique para ver/editar">✓</span>';
          else if (cls === 'nok')  td.innerHTML = '<span class="crono-cell--nok" title="Atrasado — clique para registrar">⚠</span>';
          else if (cls === 'pend') td.innerHTML = '<span class="crono-cell--pend" title="Pendente — clique para registrar">⏳</span>';
          else                     td.innerHTML = '<span class="crono-cell--vazio">·</span>';

          // Clique: abre modal para todos os estados agendados (não em dias sem expediente)
          if (cls !== 'vazio' && !isSemExp) {
            td.classList.add(cls === 'ok' ? 'crono-td--day--ok-click' : 'crono-td--day--clickable');
            td.addEventListener('click', () => {
              this._openActivityModal(it, day, d, turnoObj, cls, isJust);
            });
          }

          if (isCurrentMonth && day === now.getDate())
            td.style.background = 'rgba(37,99,235,.08)';
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /* ══════════════════════════════════════════════════════════
     DIÁRIO DE BORDO (editável)
  ══════════════════════════════════════════════════════════ */
  _buildDiario(diario, d) {
    const wrap = document.createElement('div');
    wrap.className = 'crono-diario-wrap';

    // Toolbar com botão Add
    const toolbar = document.createElement('div');
    toolbar.className = 'crono-diario-toolbar';
    const addBtn = document.createElement('button');
    addBtn.className = 'crono-diario-add-btn';
    addBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nova Ocorrência`;
    addBtn.addEventListener('click', () => this._addDiarioRow(tbody, d, null));
    toolbar.appendChild(addBtn);
    wrap.appendChild(toolbar);

    // Tabela
    const table = document.createElement('table');
    table.className = 'crono-diario-table';
    table.innerHTML = `<thead><tr>
      <th style="width:90px;">Data</th>
      <th style="width:46px;">Item</th>
      <th>Motivo / Descrição</th>
      <th>Contramedida</th>
      <th style="width:62px;"></th>
    </tr></thead>`;
    const tbody = document.createElement('tbody');

    if (!diario.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="crono-empty">Nenhuma ocorrência registrada. Clique em ⚠ no cronograma ou em "Nova Ocorrência".</td>`;
      tbody.appendChild(tr);
    } else {
      diario.forEach((row, idx) => this._renderDiarioRow(tbody, row, idx, d));
    }

    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  _renderDiarioRow(tbody, row, idx, d) {
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    const isJust = row._justified;
    tr.innerHTML = `
      <td class="crono-d-data">${row.data}${isJust ? '<span class="crono-d-just-tag">JUST</span>' : ''}</td>
      <td class="crono-d-item">${row.item}</td>
      <td>${row.descricao || '<em style="color:var(--text-mute)">—</em>'}</td>
      <td class="crono-d-med">${row.contramedida || '<em style="color:var(--text-mute)">—</em>'}</td>
      <td style="text-align:right;white-space:nowrap;">
        <button class="crono-d-btn crono-d-btn--edit" title="Editar">✏</button>
        <button class="crono-d-btn crono-d-btn--del" title="Excluir">🗑</button>
      </td>`;
    tr.querySelector('.crono-d-btn--edit').addEventListener('click', () => {
      this._editDiarioRow(tr, row, idx, d);
    });
    tr.querySelector('.crono-d-btn--del').addEventListener('click', () => {
      if (!confirm('Remover esta ocorrência?')) return;
      this._data.diario.splice(idx, 1);
      this._saveData(this._data).then(ok => { if (ok) this._render(); });
    });
    tbody.appendChild(tr);
  }

  _editDiarioRow(tr, row, idx, d) {
    tr.className = 'crono-d-edit-row';
    tr.innerHTML = `
      <td><input class="f-data" value="${row.data}" placeholder="DD/MM/AAAA" style="width:84px"></td>
      <td><input class="f-item" value="${row.item}" placeholder="Nº" style="width:36px"></td>
      <td><textarea class="f-desc" rows="2" placeholder="Motivo / Descrição da ocorrência">${row.descricao || ''}</textarea></td>
      <td><textarea class="f-med" rows="2" placeholder="Contramedida aplicada">${row.contramedida || ''}</textarea></td>
      <td style="white-space:nowrap;vertical-align:middle;">
        <button class="crono-d-btn crono-d-btn--save" title="Salvar">💾</button>
        <button class="crono-d-btn" title="Cancelar">✕</button>
      </td>`;
    tr.querySelector('.crono-d-btn--save').addEventListener('click', async () => {
      row.data         = tr.querySelector('.f-data').value.trim();
      row.item         = tr.querySelector('.f-item').value.trim();
      row.descricao    = tr.querySelector('.f-desc').value.trim();
      row.contramedida = tr.querySelector('.f-med').value.trim();
      if (!row.data || !row.item) { alert('Preencha Data e Item.'); return; }
      const ok = await this._saveData(this._data);
      if (ok) this._render();
    });
    tr.querySelectorAll('.crono-d-btn')[1].addEventListener('click', () => this._render());
  }

  _addDiarioRow(tbody, d, prefill) {
    // Remove empty-state row se existir
    const empty = tbody.querySelector('[colspan]')?.closest('tr');
    if (empty) empty.remove();

    const now = new Date();
    const defData = prefill?.data ??
      `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

    const tr = document.createElement('tr');
    tr.className = 'crono-d-edit-row';
    tr.innerHTML = `
      <td><input class="f-data" value="${defData}" placeholder="DD/MM/AAAA" style="width:84px"></td>
      <td><input class="f-item" value="${prefill?.item ?? ''}" placeholder="Nº" style="width:36px"></td>
      <td><textarea class="f-desc" rows="2" placeholder="Motivo / Descrição da ocorrência">${prefill?.descricao ?? ''}</textarea></td>
      <td><textarea class="f-med" rows="2" placeholder="Contramedida aplicada">${prefill?.contramedida ?? ''}</textarea></td>
      <td style="white-space:nowrap;vertical-align:middle;">
        <button class="crono-d-btn crono-d-btn--save" title="Salvar">💾</button>
        <button class="crono-d-btn" title="Cancelar">✕</button>
      </td>`;
    tbody.appendChild(tr);
    tr.querySelector('.f-desc').focus();

    tr.querySelector('.crono-d-btn--save').addEventListener('click', async () => {
      const data  = tr.querySelector('.f-data').value.trim();
      const item  = tr.querySelector('.f-item').value.trim();
      const desc  = tr.querySelector('.f-desc').value.trim();
      const med   = tr.querySelector('.f-med').value.trim();
      if (!data || !item) { alert('Preencha Data e Item.'); return; }
      const entry = { data, item, descricao: desc, contramedida: med };
      if (prefill?._justified) entry._justified = true;
      this._data.diario = this._data.diario ?? [];
      this._data.diario.push(entry);
      const ok = await this._saveData(this._data);
      if (ok) this._render();
    });
    tr.querySelectorAll('.crono-d-btn')[1].addEventListener('click', () => this._render());
  }

  /* ══════════════════════════════════════════════════════════
     JUSTIFICATIVAS
  ══════════════════════════════════════════════════════════ */

  /** Constrói Set com chaves "itemNum_day" de entradas justificadas */
  _buildJustifiedSet(diario) {
    const s = new Set();
    (diario ?? []).forEach(entry => {
      if (!entry.data) return;
      const day = parseInt(entry.data.split('/')[0], 10);
      // item pode ser "2", "2 e 11", "11", etc.
      String(entry.item).split(/[\s,eE&]+/).forEach(part => {
        const n = part.trim();
        if (n) s.add(`${n}_${day}`);
      });
    });
    return s;
  }

  /** Abre modal unificado de atividade: marca Realizada ou Não Realizada + justificativa */
  _openActivityModal(item, day, d, turnoObj, cls, isJust) {
    const dateStr = `${String(day).padStart(2,'0')}/${String(d.mesNum).padStart(2,'0')}/${d.ano}`;

    // Busca justificativa existente
    const existing = (this._data.diario ?? []).find(e => {
      const eDay = parseInt((e.data ?? '').split('/')[0], 10);
      return eDay === day && String(e.item).split(/[\s,eE&]+/).some(p => p.trim() === String(item.item));
    });

    // Estado inicial do toggle
    let selectedStatus = cls === 'ok' ? 'ok' : (cls === 'nok' || isJust ? 'nok' : null);

    const overlay = document.createElement('div');
    overlay.className = 'crono-act-overlay';

    const box = document.createElement('div');
    box.className = 'crono-act-box';

    const iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

    box.innerHTML = `
      <h4>${iconSvg} Item ${item.item} &nbsp;·&nbsp; Dia ${day}/${d.mesNum}/${d.ano}</h4>
      <div class="crono-act-info">${item.dimensional ?? ''}</div>

      <div class="crono-status-toggle">
        <button class="crono-status-btn crono-status-btn--ok${selectedStatus==='ok'?' active':''}" id="btnOk">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Realizada
        </button>
        <button class="crono-status-btn crono-status-btn--nok${selectedStatus==='nok'?' active':''}" id="btnNok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Não Realizada
        </button>
      </div>

      <div class="crono-act-just" id="justFields" style="${selectedStatus==='nok'?'':'display:none'}">
        <div class="crono-act-just-label">Justificativa</div>
        <div class="crono-j-field">
          <label>Motivo / Descrição da Ocorrência</label>
          <textarea id="aDesc" rows="3" placeholder="Ex: Peça não disponível, equipamento em manutenção...">${existing?.descricao ?? ''}</textarea>
        </div>
        <div class="crono-j-field" style="margin-top:8px;">
          <label>Contramedida</label>
          <textarea id="aMed" rows="2" placeholder="Ex: Reagendado para amanhã, acionado fornecedor...">${existing?.contramedida ?? ''}</textarea>
        </div>
      </div>

      <div class="crono-j-actions" style="margin-top:18px;">
        ${existing ? '<button class="crono-j-del" id="aDel">🗑 Remover Justificativa</button>' : ''}
        <button class="crono-btn-cancel" id="aCancel">Cancelar</button>
        <button class="crono-btn-save" id="aSave">Salvar</button>
      </div>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const btnOk  = box.querySelector('#btnOk');
    const btnNok = box.querySelector('#btnNok');
    const justFields = box.querySelector('#justFields');

    const setStatus = (s) => {
      selectedStatus = s;
      btnOk.classList.toggle('active',  s === 'ok');
      btnNok.classList.toggle('active', s === 'nok');
      justFields.style.display = s === 'nok' ? '' : 'none';
      if (s === 'nok') box.querySelector('#aDesc')?.focus();
    };

    btnOk.addEventListener('click',  () => setStatus('ok'));
    btnNok.addEventListener('click', () => setStatus('nok'));

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    box.querySelector('#aCancel').addEventListener('click', () => overlay.remove());

    // Remover justificativa existente
    box.querySelector('#aDel')?.addEventListener('click', () => {
      if (!confirm('Remover esta justificativa?')) return;
      const idx = this._data.diario.indexOf(existing);
      if (idx >= 0) this._data.diario.splice(idx, 1);
      this._saveData(this._data).then(ok => { overlay.remove(); if (ok) this._render(); });
    });

    // Salvar
    box.querySelector('#aSave').addEventListener('click', async () => {
      if (!selectedStatus) { alert('Selecione o status da atividade.'); return; }

      // Encontra o turnoObj correto em this._data para modificar
      const itData = this._data.items.find(i => i.item === item.item);
      if (itData) {
        const tObj = itData.turnos
          ? itData.turnos.find(t => t.turno === turnoObj.turno) ?? itData.turnos[0]
          : itData;
        if (selectedStatus === 'ok') {
          // Marca como realizada
          tObj.dias = tObj.dias ?? {};
          tObj.dias[String(day)] = 4;
          // Remove justificativa se existir
          if (existing) {
            const idx = this._data.diario.indexOf(existing);
            if (idx >= 0) this._data.diario.splice(idx, 1);
          }
        } else {
          // Não realizada: garante que o dia não está marcado como 4
          if (tObj.dias?.[String(day)] === 4) {
            tObj.dias[String(day)] = 0;
          }
          // Salva justificativa
          const desc = box.querySelector('#aDesc')?.value.trim() ?? '';
          const med  = box.querySelector('#aMed')?.value.trim() ?? '';
          this._data.diario = this._data.diario ?? [];
          if (existing) {
            existing.descricao    = desc;
            existing.contramedida = med;
            existing._justified   = true;
          } else if (desc) {
            this._data.diario.push({ data: dateStr, item: String(item.item), descricao: desc, contramedida: med, _justified: true });
          }
        }
      }

      const ok = await this._saveData(this._data);
      overlay.remove();
      if (ok) this._render();
    });
  }

  /** Abre modal para justificar (ou ver/editar) uma célula ⚠ */
  _openJustifyModal(item, day, d, isAlreadyJustified) {
    const dateStr = `${String(day).padStart(2,'0')}/${String(d.mesNum).padStart(2,'0')}/${d.ano}`;

    // Busca entrada existente se já justificado
    const existing = (this._data.diario ?? []).find(e => {
      const eDay = parseInt((e.data ?? '').split('/')[0], 10);
      return eDay === day && String(e.item).split(/[\s,eE&]+/).some(p => p.trim() === String(item.item));
    });

    const overlay = document.createElement('div');
    overlay.className = 'crono-justify-overlay';

    const box = document.createElement('div');
    box.className = 'crono-justify-box';

    box.innerHTML = `
      <h4>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        ${existing ? 'Editar Justificativa' : 'Justificar Atividade'}
        <span class="j-chip">Item ${item.item} · Dia ${day}/${d.mesNum}</span>
      </h4>
      <div style="font-size:11px;color:var(--text-mute);margin:-10px 0 14px;padding-left:22px;">
        ${item.dimensional}
      </div>
      <div class="crono-j-field">
        <label>Motivo / Descrição da Ocorrência</label>
        <textarea id="jDesc" rows="3" placeholder="Ex: Peça não disponível, equipamento em manutenção...">${existing?.descricao ?? ''}</textarea>
      </div>
      <div class="crono-j-field">
        <label>Contramedida</label>
        <textarea id="jMed" rows="2" placeholder="Ex: Reagendado para amanhã, acionado fornecedor...">${existing?.contramedida ?? ''}</textarea>
      </div>
      <div class="crono-j-actions">
        ${existing ? '<button class="crono-j-del" id="jDel">🗑 Remover</button>' : ''}
        <button class="crono-btn-cancel" id="jCancel">Cancelar</button>
        <button class="crono-btn-save" id="jSave">✓ Justificar</button>
      </div>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    box.querySelector('#jDesc').focus();

    // Fechar fundo
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    box.querySelector('#jCancel').addEventListener('click', () => overlay.remove());

    // Remover justificativa
    box.querySelector('#jDel')?.addEventListener('click', () => {
      if (!confirm('Remover esta justificativa?')) return;
      const idx = this._data.diario.indexOf(existing);
      if (idx >= 0) this._data.diario.splice(idx, 1);
      this._saveData(this._data).then(ok => { overlay.remove(); if (ok) this._render(); });
    });

    // Salvar
    box.querySelector('#jSave').addEventListener('click', async () => {
      const desc = box.querySelector('#jDesc').value.trim();
      const med  = box.querySelector('#jMed').value.trim();
      if (!desc) { box.querySelector('#jDesc').focus(); box.querySelector('#jDesc').style.borderColor='#ef4444'; return; }

      if (existing) {
        existing.descricao    = desc;
        existing.contramedida = med;
        existing._justified   = true;
      } else {
        this._data.diario = this._data.diario ?? [];
        this._data.diario.push({ data: dateStr, item: String(item.item), descricao: desc, contramedida: med, _justified: true });
      }
      const ok = await this._saveData(this._data);
      overlay.remove();
      if (ok) this._render();
    });
  }

  /* ══════════════════════════════════════════════════════════
     MODAL DE EDIÇÃO
  ══════════════════════════════════════════════════════════ */
  _openEditModal() {
    // Clone profundo dos dados para edição
    this._editData = JSON.parse(JSON.stringify(this._data));
    if (!Array.isArray(this._editData.turnosAtivos)) {
      this._editData.turnosAtivos = this._getTurnosAtivosDefault();
    }

    const overlay = document.createElement('div');
    overlay.className = 'crono-edit-overlay';

    const panel = document.createElement('div');
    panel.className = 'crono-edit-panel';

    // Cabeçalho
    const editHdr = document.createElement('div');
    editHdr.className = 'crono-edit-hdr';
    editHdr.innerHTML = `<h3>✏ Editar Cronograma</h3>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'crono-edit-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => overlay.remove());
    editHdr.appendChild(closeBtn);
    panel.appendChild(editHdr);

    // Body (reconstruído ao alterar)
    const body = document.createElement('div');
    body.className = 'crono-edit-body';
    panel.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'crono-edit-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'crono-btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());
    const saveBtn = document.createElement('button');
    saveBtn.className = 'crono-btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Salvando...';
      saveBtn.disabled = true;
      const ok = await this._saveData(this._editData);
      if (ok) {
        overlay.remove();
        this._render(); // re-render com novos dados
        this._bus?.emit('cronograma:saved'); // atualiza badge na sidebar
      } else {
        saveBtn.textContent = 'Salvar';
        saveBtn.disabled = false;
      }
    });
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);
    panel.appendChild(footer);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    // Fechar clicando no fundo
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    this._rebuildEditBody(body);
  }

  /* ══════════════════════════════════════════════════════════
     EXPORTAR PDF
  ══════════════════════════════════════════════════════════ */
  _exportPDF() {
    const d = this._data;
    if (!d) return;

    const semExpSet   = new Set((d.diasSemExpediente ?? []).map(Number));
    const justSet     = this._buildJustifiedSet(d.diario ?? []);
    const diasNum     = Object.keys(d.diasSemana ?? {}).map(Number).sort((a,b)=>a-b);

    const now  = new Date();
    const nowY = now.getFullYear(), nowM = now.getMonth()+1, nowD = now.getDate();
    const cronY = d.ano ?? nowY, cronM = d.mesNum ?? nowM;

    // Estado de cada célula
    const cellStatus = (day, v, itemNum) => {
      if (semExpSet.has(day)) return 'sem-exp';
      if (v === 4) return 'ok';
      if (v !== 0 && v !== undefined) return 'vazio';
      const isPast = cronY < nowY || cronM < nowM || (cronY===nowY && cronM===nowM && day < nowD);
      if (v === 0 && justSet.has(`${itemNum}_${day}`)) return 'just';
      if (v === 0) return isPast ? 'nok' : 'pend';
      return 'vazio';
    };

    // ── KPIs ──
    let totalOk=0, totalNok=0, totalPend=0, totalJust=0;
    (d.items ?? []).forEach(it => {
      (it.turnos ?? [{ turno:1, dias: it.dias ?? {} }]).forEach(to => {
        Object.entries(to.dias ?? {}).forEach(([ds, v]) => {
          if (semExpSet.has(Number(ds))) return;
          const s = cellStatus(Number(ds), v, it.item);
          if (s==='ok')   totalOk++;
          else if (s==='just') totalJust++;
          else if (s==='nok')  totalNok++;
          else if (s==='pend') totalPend++;
        });
      });
    });
    const totalSched = totalOk+totalNok+totalJust+totalPend;
    const pct = totalSched ? Math.round(((totalOk+totalJust)/totalSched)*100) : 0;
    const dataImpressao = now.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

    // ── Cabeçalho da tabela Gantt ──
    const thInfos = [
      `<th rowspan="2" style="width:2.5%;min-width:20px;">Nº</th>`,
      `<th rowspan="2" style="width:14%;text-align:left;padding-left:5px;">Dimensional</th>`,
      `<th rowspan="2" style="width:5%;">Freq/Turno</th>`,
      `<th rowspan="2" style="width:5%;">Freq/Mês</th>`,
      `<th rowspan="2" style="width:4.5%;">Tempo</th>`,
      `<th rowspan="2" style="width:1.8%;">T</th>`,
    ].join('');

    const dayColW = ((100 - 32.8) / diasNum.length).toFixed(2);
    const thDays  = diasNum.map(day => {
      const cls = semExpSet.has(day) ? ' class="th-sem-exp"' : '';
      return `<th${cls} style="width:${dayColW}%">${String(day).padStart(2,'0')}</th>`;
    }).join('');
    const thDs = diasNum.map(day =>
      `<th class="th-ds">${(d.diasSemana?.[String(day)]??'').slice(0,3)}</th>`
    ).join('');

    // ── Linhas do Gantt ──
    let ganttRows = '';
    let currPeca  = null;
    const totalCols = 6 + diasNum.length;

    (d.items ?? []).forEach(it => {
      if (it.peca !== currPeca) {
        currPeca = it.peca;
        ganttRows += `<tr><td colspan="${totalCols}" class="td-peca-hdr">${it.peca}</td></tr>`;
      }
      const turnos  = it.turnos ?? [{ turno:1, dias: it.dias ?? {} }];
      const multi   = turnos.length > 1;
      const tempoFmt = /^\d+$/.test(it.tempo||'') ? `${it.tempo}min` : (it.tempo||'—');

      turnos.forEach((turnoObj, tIdx) => {
        const trCls = tIdx === 0 ? 'tr-t1' : 'tr-t2';
        ganttRows += `<tr class="${trCls}">`;

        if (tIdx === 0) {
          const rs = multi ? ` rowspan="${turnos.length}"` : '';
          ganttRows += `<td${rs} class="td-item">${it.item}</td>`;
          ganttRows += `<td${rs} class="td-dim">${it.dimensional}</td>`;
          ganttRows += `<td${rs} class="td-freq">${it.freqPorTurno??'—'}</td>`;
          ganttRows += `<td${rs} class="td-freq">${it.freqMes??'—'}</td>`;
          ganttRows += `<td${rs} class="td-tempo">${tempoFmt}</td>`;
        }

        ganttRows += `<td class="td-t">${multi ? `T${turnoObj.turno}` : ''}</td>`;

        const graySet = new Set(turnoObj.grayDias ?? []);
        diasNum.forEach(day => {
          const v   = turnoObj.dias?.[String(day)];
          const s   = cellStatus(day, v, it.item);
          const isGray   = graySet.has(String(day)) && tIdx > 0;
          const isSemExp = semExpSet.has(day);

          let tdCls = 'td-day';
          if (isGray)   tdCls += ' td-gray';
          if (isSemExp) tdCls += ' td-sem-exp-cell';

          let cell = '';
          if      (s==='ok')      cell = `<span class="c-ok">✓</span>`;
          else if (s==='just')    cell = `<span class="c-just">✓</span>`;
          else if (s==='nok')     cell = `<span class="c-nok">!</span>`;
          else if (s==='pend')    cell = `<span class="c-pend">·</span>`;
          else if (s==='sem-exp') cell = `<span class="c-semexp">⊘</span>`;
          else                    cell = `<span class="c-vazio">·</span>`;

          ganttRows += `<td class="${tdCls}">${cell}</td>`;
        });
        ganttRows += `</tr>`;
      });
    });

    // ── Linhas do Diário ──
    let diarRows = '';
    if ((d.diario ?? []).length) {
      d.diario.forEach(row => {
        const just = row._justified ? '<span class="just-tag">JUST</span>' : '';
        diarRows += `<tr>
          <td style="white-space:nowrap">${row.data??'—'} ${just}</td>
          <td style="text-align:center;font-weight:700">${row.item??'—'}</td>
          <td>${(row.descricao??'').replace(/\n/g,'<br>')}</td>
          <td>${(row.contramedida??'').replace(/\n/g,'<br>')}</td>
        </tr>`;
      });
    } else {
      diarRows = `<tr><td colspan="4" style="text-align:center;color:#999;font-style:italic;padding:10px;">Nenhuma ocorrência registrada.</td></tr>`;
    }

    // ── Legenda ──
    const legendHtml = `
      <div class="legend">
        <span class="leg-item"><span class="leg-dot" style="background:#16a34a"></span>✓ Realizado</span>
        <span class="leg-item"><span class="leg-dot" style="background:#1d4ed8"></span>✓ Justificado</span>
        <span class="leg-item"><span class="leg-dot" style="background:#f97316;opacity:.8"></span>! Atrasado</span>
        <span class="leg-item"><span class="leg-dot" style="background:#d97706"></span>· Pendente</span>
        <span class="leg-item"><span class="leg-dot" style="background:#e2e8f0;border:1px solid #ccc"></span>· N/A</span>
        <span class="leg-item"><span class="leg-dot" style="background:#431407;border:1px solid #f97316"></span>⊘ Sem expediente</span>
        <span class="leg-item"><span class="leg-dot" style="background:#dbeafe;border:1px solid #93c5fd"></span>1º Turno</span>
        <span class="leg-item"><span class="leg-dot" style="background:#1e293b;border:1px solid #475569"></span>2º Turno</span>
      </div>`;

    // ── HTML completo ──
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Cronograma — ${d.mes ?? ''}</title>
<style>
@page { size: A4 landscape; margin: 10mm 8mm; }
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8px; color: #111;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Cabeçalho da página */
.page-hdr {
  display:flex; justify-content:space-between; align-items:flex-end;
  border-bottom: 2.5px solid #1a3a6b; padding-bottom: 6px; margin-bottom: 8px;
}
.page-hdr-left { display:flex; flex-direction:column; gap:2px; }
.page-title { font-size:14px; font-weight:800; color:#1a3a6b; }
.page-sub   { font-size:9px; color:#64748b; }
.page-hdr-right { text-align:right; font-size:8px; color:#64748b; }
.page-badge {
  display:inline-block; background:#1a3a6b; color:#fff;
  padding:2px 8px; border-radius:10px; font-size:9px; font-weight:700;
}

/* KPIs */
.kpi-row { display:flex; gap:8px; margin-bottom:8px; }
.kpi-box {
  background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px;
  padding:4px 10px; text-align:center; min-width:65px;
}
.kpi-val { font-size:15px; font-weight:800; line-height:1.1; }
.kpi-lbl { font-size:7px; color:#64748b; margin-top:1px; }
.kv-ok   { color:#16a34a; } .kv-pend { color:#d97706; }
.kv-nok  { color:#f97316; } .kv-just { color:#1d4ed8; }
.kv-pct  { color:#2563eb; }

/* Legenda */
.legend { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:7px; }
.leg-item { display:flex; align-items:center; gap:3px; font-size:7px; color:#475569; }
.leg-dot { display:inline-block; width:9px; height:9px; border-radius:2px; flex-shrink:0; }

/* Títulos de seção */
.sec-title {
  font-size:9px; font-weight:700; color:#1a3a6b;
  border-bottom:1.5px solid #1a3a6b; padding-bottom:3px; margin-bottom:5px;
  display:flex; align-items:center; gap:5px;
}

/* Tabela Gantt */
.gantt-wrap { overflow:hidden; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:4px; }
.gantt {
  border-collapse:collapse; width:100%;
  font-size:7px; table-layout:fixed;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.gantt th, .gantt td {
  border:1px solid #e2e8f0; padding:1px 2px;
  text-align:center; vertical-align:middle; overflow:hidden;
}
.gantt th { background:#f1f5f9; color:#475569; font-weight:700; }
.th-sem-exp { background:#431407 !important; color:#fb923c !important; }
.th-ds { font-size:6px; color:#94a3b8; font-weight:400; }

.td-peca-hdr { background:#1a3a6b !important; color:#fff !important; font-weight:700; font-size:8px; text-align:left !important; padding:2px 6px !important; }
.td-item  { font-weight:700; color:#2563eb; }
.td-dim   { text-align:left !important; font-size:7px; padding-left:4px !important; white-space:normal; line-height:1.3; }
.td-freq  { font-size:6px; color:#64748b; }
.td-tempo { font-size:6px; color:#64748b; }
.td-t     { font-size:6px; font-weight:700; color:#94a3b8; }
.td-day   { padding:0 !important; }
.td-gray  { background:#0d1829 !important; }
.td-sem-exp-cell { background:rgba(251,146,60,.12) !important; }
.tr-t1    { background:#eef3ff !important; }
.tr-t2    { background:#1e293b !important; }
.tr-t2 .td-freq, .tr-t2 .td-tempo, .tr-t2 .td-t { color:#94a3b8; }
.tr-t2 .td-item { color:#93c5fd; }
.tr-t2 .td-dim  { color:#e2e8f0; }

/* Células de estado */
.c-ok    { display:inline-block; background:#16a34a; color:#fff; border-radius:2px; width:11px; height:11px; line-height:11px; font-size:8px; font-weight:800; }
.c-just  { display:inline-block; background:#1d4ed8; color:#fff; border-radius:2px; width:11px; height:11px; line-height:11px; font-size:8px; font-weight:800; }
.c-nok   { display:inline-block; color:#f97316; font-size:10px; font-weight:800; line-height:11px; width:11px; height:11px; }
.c-pend  { display:inline-block; background:#d97706; border-radius:2px; width:11px; height:11px; }
.c-semexp{ color:#f97316; opacity:.35; font-size:8px; }
.c-vazio { color:#ddd; font-size:8px; }

/* Tabela Diário */
.diario { border-collapse:collapse; width:100%; font-size:8px; }
.diario th { background:#f1f5f9; color:#475569; font-weight:700; border:1px solid #e2e8f0; padding:3px 6px; text-align:left; }
.diario td { border:1px solid #e2e8f0; padding:3px 6px; vertical-align:top; line-height:1.4; }
.diario tr:nth-child(even) td { background:#f8fafc; }
.just-tag { display:inline-block; background:#1d4ed8; color:#fff; border-radius:2px; padding:0 3px; font-size:7px; margin-left:3px; }

/* Rodapé */
.page-footer {
  position:fixed; bottom:4mm; left:8mm; right:8mm;
  display:flex; justify-content:space-between;
  font-size:7px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:2px;
}

@media print {
  body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
</style>
</head>
<body>

<!-- Cabeçalho -->
<div class="page-hdr">
  <div class="page-hdr-left">
    <div class="page-title">📅 Cronograma de Atividades</div>
    <div class="page-sub">Gerenciamento de Atividade CQ — Dashboard</div>
  </div>
  <div class="page-hdr-right">
    <div class="page-badge">${d.mes ?? '—'}</div>
    <div style="margin-top:4px;">Gerado em: ${dataImpressao}</div>
  </div>
</div>

<!-- KPIs -->
<div class="kpi-row">
  <div class="kpi-box"><div class="kpi-val kv-ok">${totalOk}</div><div class="kpi-lbl">Realizados</div></div>
  <div class="kpi-box"><div class="kpi-val kv-pend">${totalPend}</div><div class="kpi-lbl">Pendentes</div></div>
  <div class="kpi-box"><div class="kpi-val kv-nok">${totalNok}</div><div class="kpi-lbl">Atrasados</div></div>
  <div class="kpi-box"><div class="kpi-val kv-just">${totalJust}</div><div class="kpi-lbl">Justificados</div></div>
  <div class="kpi-box"><div class="kpi-val kv-pct">${pct}%</div><div class="kpi-lbl">Cumprimento</div></div>
</div>

${legendHtml}

<!-- Gantt -->
<div class="sec-title">▦ Cronograma Gantt</div>
<div class="gantt-wrap">
<table class="gantt">
<colgroup>
  <col style="width:2.5%"><col style="width:14%"><col style="width:5%">
  <col style="width:5%"><col style="width:4.5%"><col style="width:1.8%">
  ${diasNum.map(() => `<col style="width:${dayColW}%">`).join('')}
</colgroup>
<thead>
  <tr>${thInfos}${thDays}</tr>
  <tr>${thDs}</tr>
</thead>
<tbody>${ganttRows}</tbody>
</table>
</div>

<!-- Diário de Bordo -->
<div class="sec-title" style="margin-top:10px;">📋 Diário de Bordo</div>
<table class="diario">
<thead>
  <tr>
    <th style="width:14%">Data</th>
    <th style="width:6%">Item</th>
    <th>Motivo / Descrição da Ocorrência</th>
    <th>Contramedida</th>
  </tr>
</thead>
<tbody>${diarRows}</tbody>
</table>

<!-- Rodapé -->
<div class="page-footer">
  <span>Gerenciamento de Atividade CQ</span>
  <span>${d.mes ?? '—'} — Gerado em ${dataImpressao}</span>
</div>

</body>
</html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    if (!win) {
      alert('Popup bloqueado. Permita popups para este site e tente novamente.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Aguarda imagens/fonts carregarem antes de abrir diálogo de impressão
    win.addEventListener('load', () => setTimeout(() => win.print(), 300));
    setTimeout(() => { try { win.print(); } catch {} }, 800);
  }

  /* ══════════════════════════════════════════════════════════
     DIAS SEM EXPEDIENTE
  ══════════════════════════════════════════════════════════ */
  _openSemExpedienteModal() {
    const d = this._data;
    const selected = new Set((d.diasSemExpediente ?? []).map(Number));

    const overlay = document.createElement('div');
    overlay.className = 'crono-semexp-overlay';

    const box = document.createElement('div');
    box.className = 'crono-semexp-box';

    const h3 = document.createElement('h3');
    h3.innerHTML = `📅 Dias sem Expediente`;
    box.appendChild(h3);

    const subtitle = document.createElement('div');
    subtitle.className = 'crono-semexp-subtitle';
    subtitle.textContent = `${d.mes} — Clique para marcar/desmarcar dias. Fins de semana são excluídos automaticamente.`;
    box.appendChild(subtitle);

    // Grade do calendário
    const grid = document.createElement('div');
    grid.className = 'crono-cal-grid';

    // Cabeçalhos de dia da semana (Seg → Dom)
    ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach(lbl => {
      const el = document.createElement('div');
      el.className = 'crono-cal-wd';
      el.textContent = lbl;
      grid.appendChild(el);
    });

    // Primeira coluna da semana (0=Seg...6=Dom)
    const firstWd = new Date(d.ano, d.mesNum - 1, 1).getDay(); // 0=Dom
    const firstCol = (firstWd === 0) ? 6 : firstWd - 1;
    for (let i = 0; i < firstCol; i++) {
      const empty = document.createElement('div');
      empty.className = 'crono-cal-day crono-cal-day--empty';
      grid.appendChild(empty);
    }

    // Células dos dias
    const wkends = new Set(['sáb','dom']);
    const daysInMonth = new Date(d.ano, d.mesNum, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const ds = (d.diasSemana ?? {})[String(day)] ?? '';
      const isWeekend = wkends.has(ds);

      const el = document.createElement('div');
      el.className = 'crono-cal-day' +
        (isWeekend ? ' crono-cal-day--weekend' : '') +
        (selected.has(day) ? ' crono-cal-day--selected' : '');
      el.textContent = day;
      el.title = ds || '';

      if (!isWeekend) {
        el.addEventListener('click', () => {
          if (selected.has(day)) { selected.delete(day); el.classList.remove('crono-cal-day--selected'); }
          else                   { selected.add(day);    el.classList.add('crono-cal-day--selected'); }
        });
      }
      grid.appendChild(el);
    }
    box.appendChild(grid);

    // Legenda
    const leg = document.createElement('div');
    leg.style.cssText = 'display:flex;gap:14px;font-size:10px;color:var(--text-mute);margin-bottom:18px;';
    leg.innerHTML = `
      <span><span style="display:inline-block;width:10px;height:10px;background:#f97316;border-radius:2px;margin-right:4px;vertical-align:middle;"></span>Sem expediente selecionado</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:var(--panel-2);border:1px dashed var(--border);border-radius:2px;margin-right:4px;vertical-align:middle;opacity:.5;"></span>Fim de semana (automático)</span>`;
    box.appendChild(leg);

    // Ações
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'crono-btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const saveBtn = document.createElement('button');
    saveBtn.className = 'crono-btn-save';
    saveBtn.textContent = '💾 Salvar';
    saveBtn.addEventListener('click', async () => {
      this._data.diasSemExpediente = [...selected].sort((a,b) => a - b);
      saveBtn.textContent = 'Salvando...'; saveBtn.disabled = true;
      const ok = await this._saveData(this._data);
      overlay.remove();
      if (ok) this._render();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    box.appendChild(actions);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ══════════════════════════════════════════════════════════
     AVANÇAR MÊS
  ══════════════════════════════════════════════════════════ */
  _avancarMes() {
    const d = this._data;
    let novoMes = d.mesNum + 1;
    let novoAno = d.ano;
    if (novoMes > 12) { novoMes = 1; novoAno++; }

    const mesesPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const novoMesLabel = `${mesesPt[novoMes-1].toUpperCase()}/${novoAno}`;

    const overlay = document.createElement('div');
    overlay.className = 'crono-confirm-overlay';

    const box = document.createElement('div');
    box.className = 'crono-confirm-box';

    const atividadesList = (d.items ?? [])
      .map(it => `<li><strong>${it.peca}</strong> — ${it.dimensional} (${it.freqMes ?? it.freqPorTurno ?? '—'})</li>`)
      .join('');

    box.innerHTML = `
      <h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 8 16 12 12 16"/><line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Avançar para ${novoMesLabel}?
      </h3>
      <div style="font-size:12px;color:var(--text-mute);margin-bottom:10px;">
        Atividades que serão mantidas com o mesmo padrão de frequência:
      </div>
      <ul class="crono-confirm-list">${atividadesList}</ul>
      <div class="crono-confirm-warn">
        ⚠ Fins de semana são excluídos automaticamente.<br>
        Os dias seguirão o mesmo padrão semanal do mês atual.<br>
        O Diário de Bordo será limpo para o novo mês.
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button class="crono-btn-cancel" id="cConfCancel">Cancelar</button>
        <button class="crono-btn-save" id="cConfOk" style="background:#8b5cf6;border-color:#8b5cf6;">▶ Avançar</button>
      </div>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    box.querySelector('#cConfCancel').addEventListener('click', () => overlay.remove());
    box.querySelector('#cConfOk').addEventListener('click', async () => {
      overlay.remove();
      await this._executarAvancamentoMes(novoAno, novoMes, novoMesLabel);
    });
  }

  async _executarAvancamentoMes(novoAno, novoMes, novoMesLabel) {
    // Gerar diasSemana para o novo mês
    const diasNomes = ['dom','seg','ter','qua','qui','sex','sáb'];
    const daysInMonth = new Date(novoAno, novoMes, 0).getDate();
    const novosDiasSemana = {};
    for (let day = 1; day <= daysInMonth; day++) {
      novosDiasSemana[String(day)] = diasNomes[new Date(novoAno, novoMes - 1, day).getDay()];
    }

    const novosItens = this._gerarDiasProximoMes(novoAno, novoMes, novosDiasSemana, new Set());

    const novoCronograma = {
      mes: novoMesLabel,
      ano: novoAno,
      mesNum: novoMes,
      turnosAtivos: Array.isArray(this._data.turnosAtivos) && this._data.turnosAtivos.length
        ? [...this._data.turnosAtivos]
        : this._getTurnosAtivosDefault(),
      diasSemExpediente: [],
      diasSemana: novosDiasSemana,
      items: novosItens,
      diario: [],
    };

    const ok = await this._saveData(novoCronograma);
    if (ok) this._render();
  }

  _gerarDiasProximoMes(novoAno, novoMes, novosDiasSemana, semExpedienteSet) {
    const curAno = this._data.ano;
    const curMes = this._data.mesNum;
    const workDayNomes = new Set(['seg','ter','qua','qui','sex']);

    // Dias úteis do mês atual (base para proporção "daily")
    const curWorkDays = Object.values(this._data.diasSemana ?? {})
      .filter(ds => workDayNomes.has(ds)).length;

    // Todos os dias úteis do novo mês
    const allWorkDays = Object.entries(novosDiasSemana)
      .filter(([d, ds]) => workDayNomes.has(ds) && !semExpedienteSet.has(Number(d)))
      .map(([d]) => Number(d))
      .sort((a,b) => a - b);

    return (this._data.items ?? []).map(it => {
      const novoItem = JSON.parse(JSON.stringify(it));
      novoItem.turnos = [];

      (it.turnos ?? [{ turno: 1, dias: it.dias ?? {} }]).forEach(turnoObj => {
        const schedDays = Object.keys(turnoObj.dias ?? {}).map(Number).sort((a,b) => a - b);
        const N = schedDays.length;

        if (N === 0) {
          novoItem.turnos.push({ turno: turnoObj.turno, dias: {} });
          return;
        }

        // Verificar se é atividade diária (≥75% dos dias úteis)
        const isDaily = curWorkDays > 0 && (N / curWorkDays) >= 0.75;

        let eligibleDays;
        if (isDaily) {
          eligibleDays = allWorkDays;
        } else {
          // Extrair dia(s) da semana dominante(s) do mês atual
          const wdCount = {};
          schedDays.forEach(day => {
            const wd = new Date(curAno, curMes - 1, day).getDay();
            wdCount[wd] = (wdCount[wd] || 0) + 1;
          });
          const maxCount = Math.max(...Object.values(wdCount));
          const dominantWds = new Set(
            Object.entries(wdCount)
              .filter(([,c]) => c === maxCount)
              .map(([wd]) => Number(wd))
          );

          eligibleDays = allWorkDays.filter(day =>
            dominantWds.has(new Date(novoAno, novoMes - 1, day).getDay())
          );

          // Fallback: usar todos os dias úteis se não há elegíveis
          if (eligibleDays.length === 0) eligibleDays = allWorkDays;
        }

        // Selecionar N dias distribuídos uniformemente
        const selected = this._pickEvenly(eligibleDays, Math.min(N, eligibleDays.length));

        const novosDias = {};
        selected.forEach(day => { novosDias[String(day)] = 0; });

        // grayDias: manter mesma proporção
        const grayN = (turnoObj.grayDias ?? []).length;
        const novasGrayDias = [];
        if (grayN > 0) {
          this._pickEvenly(selected, Math.min(grayN, selected.length))
            .forEach(day => novasGrayDias.push(String(day)));
        }

        const novoTurno = { turno: turnoObj.turno, dias: novosDias };
        if (novasGrayDias.length) novoTurno.grayDias = novasGrayDias;
        novoItem.turnos.push(novoTurno);
      });

      return novoItem;
    });
  }

  /** Seleciona N elementos distribuídos uniformemente de arr */
  _pickEvenly(arr, n) {
    if (!arr.length || n <= 0) return [];
    if (n >= arr.length) return [...arr];
    if (n === 1) return [arr[Math.floor(arr.length / 2)]];
    const result = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round(i * (arr.length - 1) / (n - 1));
      const val = arr[idx];
      if (!result.includes(val)) result.push(val);
    }
    return result;
  }

  _rebuildEditBody(body) {
    body.innerHTML = '';
    const d = this._editData;

    // Garante turnosAtivos (herda do salvo global ou do padrão)
    if (!Array.isArray(d.turnosAtivos)) {
      d.turnosAtivos = this._getTurnosAtivosDefault();
    }

    /* ── Seção: Turnos rodando (global) ─────────────────────── */
    const secTurnos = document.createElement('div');
    secTurnos.className = 'crono-edit-sec';
    const turnosLbl = document.createElement('div');
    turnosLbl.className = 'crono-edit-sec-lbl';
    turnosLbl.textContent = 'Turnos rodando';
    secTurnos.appendChild(turnosLbl);
    const turnosRow = document.createElement('div');
    turnosRow.className = 'crono-turnos-row';
    [1, 2, 3].forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const active = d.turnosAtivos.includes(t);
      btn.className = 'crono-turno-chip' + (active ? ' active' : '');
      btn.textContent = `${t}º Turno`;
      btn.addEventListener('click', () => {
        const idx = d.turnosAtivos.indexOf(t);
        if (idx >= 0) d.turnosAtivos.splice(idx, 1);
        else { d.turnosAtivos.push(t); d.turnosAtivos.sort(); }
        this._saveTurnosAtivosDefault(d.turnosAtivos);
        this._rebuildEditBody(body);
      });
      turnosRow.appendChild(btn);
    });
    secTurnos.appendChild(turnosRow);
    body.appendChild(secTurnos);

    /* ── Seção: Atividades disponíveis (chips) ───────────────── */
    const secDisp = document.createElement('div');
    secDisp.className = 'crono-edit-sec';
    const dispLbl = document.createElement('div');
    dispLbl.className = 'crono-edit-sec-lbl';
    dispLbl.textContent = 'Atividades disponíveis (clique para adicionar)';
    secDisp.appendChild(dispLbl);
    const dispGrid = document.createElement('div');
    dispGrid.className = 'crono-atv-grid';
    const jaAdicionadas = new Set(d.items.map(i => `${i.peca}||${i.dimensional}`));
    this._getAtividadesDisponiveis().forEach(({ contexto, atividade }) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const usado = jaAdicionadas.has(`${contexto}||${atividade}`);
      chip.className = 'crono-atv-chip' + (usado ? ' selected' : '');
      chip.disabled = usado;
      chip.innerHTML = `<strong>${atividade}</strong><small>${contexto}</small>`;
      chip.addEventListener('click', () => {
        if (usado) return;
        const nextNum = (d.items.length ? Math.max(...d.items.map(i=>i.item)) : 0) + 1;
        const novo = {
          item: nextNum,
          peca: contexto,
          dimensional: atividade,
          freqPorTurno: 1,
          freqMes: 4,
          tempo: '',
          dias: {},
        };
        d.items.push(novo);
        this._distribuirItem(novo, d.items, d);
        this._rebuildEditBody(body);
      });
      dispGrid.appendChild(chip);
    });
    secDisp.appendChild(dispGrid);
    body.appendChild(secDisp);

    /* ── Seção: Selecionadas ───────────────────────────────── */
    const secLbl = document.createElement('div');
    secLbl.className = 'crono-edit-sec-lbl';
    secLbl.style.cssText = 'margin-top:10px;';
    secLbl.textContent = 'Selecionadas';
    body.appendChild(secLbl);

    // Barra de ações rápidas (redistribuir tudo)
    if ((d.items ?? []).length > 0) {
      const actionsBar = document.createElement('div');
      actionsBar.className = 'crono-edit-actions';

      const redistribuirBtn = document.createElement('button');
      redistribuirBtn.type = 'button';
      redistribuirBtn.className = 'crono-edit-action-btn';
      redistribuirBtn.innerHTML = '🔄 Redistribuir todas (espaçar e alternar turnos)';
      redistribuirBtn.title = 'Recalcula os dias de todas as atividades, evitando colisões';
      redistribuirBtn.addEventListener('click', () => {
        this._redistribuirTudo(d);
        this._rebuildEditBody(body);
      });
      actionsBar.appendChild(redistribuirBtn);

      body.appendChild(actionsBar);
    }

    // Botão adicionar grupo/peça (avulso)
    const addGroupBtn = document.createElement('button');
    addGroupBtn.className = 'crono-edit-add-group';
    addGroupBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Adicionar Peça / Grupo (avulso)`;
    addGroupBtn.addEventListener('click', () => {
      const nome = prompt('Nome da nova Peça/Grupo:', '');
      if (!nome?.trim()) return;
      const nextNum = (d.items.length ? Math.max(...d.items.map(i=>i.item)) : 0) + 1;
      d.items.push({ item: nextNum, peca: nome.trim(), dimensional: '', freqPorTurno: '', freqMes: '', tempo: '', dias: {} });
      this._rebuildEditBody(body);
    });
    body.appendChild(addGroupBtn);

    // Agrupar por peça
    const grupos = {};
    d.items.forEach(it => {
      if (!grupos[it.peca]) grupos[it.peca] = [];
      grupos[it.peca].push(it);
    });

    Object.entries(grupos).forEach(([peca, itens]) => {
      const grp = document.createElement('div');
      grp.className = 'crono-edit-group';

      // Cabeçalho do grupo
      const grpHdr = document.createElement('div');
      grpHdr.className = 'crono-edit-group-hdr';

      const pecaInput = document.createElement('input');
      pecaInput.value = peca;
      pecaInput.addEventListener('change', () => {
        const novoNome = pecaInput.value.trim() || peca;
        d.items.forEach(it => { if (it.peca === peca) it.peca = novoNome; });
        this._rebuildEditBody(body);
      });
      grpHdr.appendChild(pecaInput);

      const delGrp = document.createElement('button');
      delGrp.className = 'crono-del-group';
      delGrp.title = 'Remover grupo e todos os itens';
      delGrp.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      delGrp.addEventListener('click', () => {
        if (!confirm(`Remover todos os itens do grupo "${peca}"?`)) return;
        d.items = d.items.filter(it => it.peca !== peca);
        this._rebuildEditBody(body);
      });
      grpHdr.appendChild(delGrp);
      grp.appendChild(grpHdr);

      // Itens do grupo
      itens.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'crono-edit-item';

        const num = document.createElement('div');
        num.className = 'crono-edit-item__num';
        num.textContent = it.item;
        row.appendChild(num);

        const fields = document.createElement('div');
        fields.className = 'crono-edit-item__fields';

        const fieldDefs = [
          { key: 'dimensional',   label: 'Atividade / Dimensional', full: true },
          { key: 'freqPorTurno',  label: 'Freq/Turno', type: 'number' },
          { key: 'freqMes',       label: 'Freq/Mês',   type: 'number', recomputeDias: true },
          { key: 'tempo',         label: 'Tempo',      full: true },
        ];
        fieldDefs.forEach(fd => {
          const fWrap = document.createElement('div');
          fWrap.className = 'crono-field' + (fd.full ? ' crono-field--full' : '');
          const lbl = document.createElement('label');
          lbl.textContent = fd.label;
          const inp = document.createElement('input');
          if (fd.type === 'number') { inp.type = 'number'; inp.min = '0'; inp.step = '1'; }
          inp.value = it[fd.key] ?? '';
          inp.placeholder = fd.label;
          inp.addEventListener('input', () => {
            const raw = inp.value;
            it[fd.key] = fd.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw;
            if (fd.recomputeDias) {
              this._distribuirItem(it, d.items, d);
            }
          });
          fWrap.appendChild(lbl); fWrap.appendChild(inp);
          fields.appendChild(fWrap);
        });
        row.appendChild(fields);

        // Ações do item: "todos os dias úteis" + remover
        const rowActions = document.createElement('div');
        rowActions.className = 'crono-edit-item__actions';

        const allDaysBtn = document.createElement('button');
        allDaysBtn.type = 'button';
        allDaysBtn.className = 'crono-edit-item__all';
        allDaysBtn.title = 'Programar em todos os dias úteis';
        allDaysBtn.innerHTML = '📅 Todos';
        allDaysBtn.addEventListener('click', () => {
          const diasUteis = this._diasUteisDo(d);
          it.freqMes = diasUteis.length;
          it.freqPorTurno = it.freqPorTurno || 1;
          this._distribuirItem(it, d.items, d);
          this._rebuildEditBody(body);
        });
        rowActions.appendChild(allDaysBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'crono-edit-item__del';
        delBtn.title = 'Remover item';
        delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>`;
        delBtn.addEventListener('click', () => {
          d.items = d.items.filter(i => i !== it);
          this._rebuildEditBody(body);
        });
        rowActions.appendChild(delBtn);

        row.appendChild(rowActions);
        grp.appendChild(row);
      });

      // Botão adicionar item dentro do grupo
      const addItemBtn = document.createElement('button');
      addItemBtn.className = 'crono-edit-add-item';
      addItemBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Adicionar item em "${peca}"`;
      addItemBtn.addEventListener('click', () => {
        const nextNum = (d.items.length ? Math.max(...d.items.map(i=>i.item)) : 0) + 1;
        d.items.push({ item: nextNum, peca, dimensional: '', freqPorTurno: '', freqMes: '', tempo: '', dias: {} });
        this._rebuildEditBody(body);
      });
      grp.appendChild(addItemBtn);
      body.appendChild(grp);
    });
  }

  /* ══════════════════════════════════════════════════════════
     HELPERS — Turnos Ativos + Atividades + Distribuição
  ══════════════════════════════════════════════════════════ */
  _getTurnosAtivosDefault() {
    try {
      const raw = JSON.parse(localStorage.getItem(TURNOS_ATIVOS_KEY) ?? 'null');
      if (Array.isArray(raw)) {
        const filtrado = raw.filter(n => [1, 2, 3].includes(Number(n))).map(Number);
        if (filtrado.length) return filtrado.sort();
      }
    } catch {}
    return [...TURNOS_ATIVOS_DEFAULT];
  }

  _saveTurnosAtivosDefault(arr) {
    try { localStorage.setItem(TURNOS_ATIVOS_KEY, JSON.stringify(arr)); } catch {}
  }

  _getAtividadesDisponiveis() {
    const out = [];
    const seen = new Set();
    Object.entries(HIERARQUIA?.medicoes ?? {}).forEach(([key, atividades]) => {
      const contexto = key.replace(/\|/g, ' · ');
      (atividades ?? []).forEach(a => {
        const combo = `${contexto}||${a}`;
        if (seen.has(combo)) return;
        seen.add(combo);
        out.push({ contexto, atividade: a });
      });
    });
    return out;
  }

  _diasUteisDo(cronograma) {
    const semExpSet = new Set((cronograma.diasSemExpediente ?? []).map(Number));
    const workDayNomes = new Set(['seg', 'ter', 'qua', 'qui', 'sex']);
    return Object.entries(cronograma.diasSemana ?? {})
      .filter(([day, nome]) => workDayNomes.has(nome) && !semExpSet.has(Number(day)))
      .map(([day]) => Number(day))
      .sort((a, b) => a - b);
  }

  /* Legado: distribuição simples usada quando não há necessidade de considerar colisão. */
  _gerarDiasParaFreq(freqMes, diasSemana, semExpediente = []) {
    const n = Number(freqMes);
    if (!Number.isFinite(n) || n <= 0) return {};
    const diasUteis = this._diasUteisDo({ diasSemana, diasSemExpediente: semExpediente });
    const escolhidos = this._pickEvenly(diasUteis, Math.min(n, diasUteis.length));
    const dias = {};
    escolhidos.forEach(d => { dias[String(d)] = 4; });
    return dias;
  }

  /**
   * Distribui um item respeitando o "calor" dos outros — evita colisão
   * dia+turno com atividades já agendadas e rotaciona turnos.
   * Se freqMes for suficiente para cobrir todos os slots, marca todos.
   */
  _distribuirItem(item, todosItens, cronograma) {
    const turnosAtivos = Array.isArray(cronograma.turnosAtivos) && cronograma.turnosAtivos.length
      ? [...cronograma.turnosAtivos].sort() : [1];
    const diasUteis = this._diasUteisDo(cronograma);
    const freqMes   = Number(item.freqMes);

    // Sem freqMes -> zera
    if (!Number.isFinite(freqMes) || freqMes <= 0) {
      item.turnos = turnosAtivos.map(t => ({ turno: t, dias: {} }));
      item.dias = {};
      return;
    }

    const totalSlots = diasUteis.length * turnosAtivos.length;

    // Cobrir todos os dias úteis: freqMes >= total ou >= diasUteis.length
    if (freqMes >= diasUteis.length) {
      item.turnos = turnosAtivos.map(t => ({
        turno: t,
        dias: Object.fromEntries(diasUteis.map(d => [String(d), 4]))
      }));
      item.dias = Object.fromEntries(diasUteis.map(d => [String(d), 4]));
      return;
    }

    // Mapa de "carga" dos outros itens: quantas atividades já usam cada (dia, turno)
    const load = new Map();
    const key = (d, t) => `${d}|${t}`;
    diasUteis.forEach(d => turnosAtivos.forEach(t => load.set(key(d, t), 0)));

    todosItens.forEach(it => {
      if (it === item) return;
      const itTurnos = it.turnos
        ?? turnosAtivos.map(t => ({ turno: t, dias: it.dias ?? {} }));
      itTurnos.forEach(tobj => {
        const t = Number(tobj.turno);
        if (!turnosAtivos.includes(t)) return;
        Object.keys(tobj.dias ?? {}).forEach(d => {
          const k = key(Number(d), t);
          if (load.has(k)) load.set(k, load.get(k) + 1);
        });
      });
    });

    // Gera slots ordenados (dia crescente, turno round-robin) e picka N espaçados
    const slots = [];
    diasUteis.forEach((d, di) => {
      turnosAtivos.forEach((t, ti) => slots.push({ d, t, order: di + ti / turnosAtivos.length }));
    });

    // Bucketiza em freqMes grupos; de cada bucket, escolhe o slot com menor carga
    const escolhidos = [];
    const bucketSize = slots.length / freqMes;
    for (let i = 0; i < freqMes; i++) {
      const start = Math.floor(i * bucketSize);
      const end   = Math.min(Math.floor((i + 1) * bucketSize), slots.length);
      const bucket = slots.slice(start, end);
      if (!bucket.length) continue;
      bucket.sort((a, b) => {
        const la = load.get(key(a.d, a.t)) ?? 0;
        const lb = load.get(key(b.d, b.t)) ?? 0;
        if (la !== lb) return la - lb;
        return a.order - b.order;
      });
      const pick = bucket[0];
      escolhidos.push(pick);
      load.set(key(pick.d, pick.t), (load.get(key(pick.d, pick.t)) ?? 0) + 1);
    }

    // Monta it.turnos e it.dias (união, para compatibilidade)
    const byTurno = {};
    turnosAtivos.forEach(t => { byTurno[t] = {}; });
    const uniao = {};
    escolhidos.forEach(({ d, t }) => {
      byTurno[t][String(d)] = 4;
      uniao[String(d)] = 4;
    });
    item.turnos = turnosAtivos.map(t => ({ turno: t, dias: byTurno[t] }));
    item.dias = uniao;
  }

  /** Roda a distribuição para todos os itens em ordem, respeitando colisão. */
  _redistribuirTudo(cronograma) {
    (cronograma.items ?? []).forEach(it => {
      // Se não tem freqMes, mantém intacto (peças avulsas com dias digitados à mão)
      if (Number.isFinite(Number(it.freqMes)) && Number(it.freqMes) > 0) {
        this._distribuirItem(it, cronograma.items, cronograma);
      }
    });
  }
}
