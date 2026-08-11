import { HIERARQUIA, RASTREABILIDADE } from './AnalisePeriodicaPage.js';

/**
 * AnaliseExtraModal.js — Análise Extra (página cheia)
 * Dashboard Metrologia — Painel de Controle
 *
 * Passos (8):
 *   1→Projeto  2→Linha  3→Identificação  4→Histórico
 *   5→Objetivo/Croqui  6→Medições  7→Conclusão+Avaliação  8→Assinaturas+PDF
 *
 * PDF: 2 páginas A4 — CAPA (pág 1) + RELATÓRIO (pág 2)
 * Máscara: TDB-PFZ · RELATÓRIO DE ANÁLISES · DEPTO. CONTROLE DA QUALIDADE
 */

/* ═══════════════════════════════════════════════════════════
   HIERARQUIA (espelha AnalisePeriodicaModal)
   ═══════════════════════════════════════════════════════════ */
const HIER_PROJETOS = ['NEXTB', 'M20A', 'SHAFT'];

const HIER_LINHAS = {
  NEXTB: ['Fundição', 'Usinagem', 'Fornecedor'],
  M20A:  ['Fundição', 'Usinagem', 'Fornecedor'],
  SHAFT: ['Forjaria', 'Cold', 'Usinagem'],
};

const HIER_OPERACOES = {
  NEXTB: { Fundição: ['LP','DC'], Usinagem: ['HEAD','CAMHOUSING','CRANK','BLOCO','CONROD'], Fornecedor: [] },
  M20A:  { Fundição: ['LP','DC'], Usinagem: ['HEAD','CAMHOUSING','CRANK','BLOCO','CONROD'], Fornecedor: [] },
  SHAFT: { Forjaria: [], Cold: [], Usinagem: [] },
};

/* HIER_MEDICOES e IMPORT_ITENS gerados a partir do RASTREABILIDADE importado */
function _buildMedicoes() {
  const map = {};
  // Mapeia cada chave de RASTREABILIDADE para as operações que a usam via HIERARQUIA.medicoes
  Object.entries(HIERARQUIA.medicoes ?? {}).forEach(([key, tipos]) => {
    tipos.forEach(tipo => {
      if (!map[tipo]) map[tipo] = [];
      map[tipo].push(key); // chave = 'PROJ|Linha|OP'
    });
  });
  return map;
}

function _getEffectiveRastLocal(tipo) {
  const def = RASTREABILIDADE[tipo];
  if (!def) return null;
  try {
    const key = `metrologia_rast_${(tipo ?? '').replace(/[^a-z0-9]/gi, '_')}`;
    const stored = localStorage.getItem(key);
    if (!stored) return def;
    const custom = JSON.parse(stored);
    return { ...def, titulo: custom.titulo ?? def.titulo, colsResult: custom.colsResult ?? def.colsResult, itens: custom.itens ?? def.itens };
  } catch { return def; }
}

/* ═══════════════════════════════════════════════════════════
   CLASSE
   ═══════════════════════════════════════════════════════════ */
import { adminFetch } from '../js/utils.js';

export class AnaliseExtraModal {
  constructor(cfg, bus) {
    this._cfg       = cfg;
    this._bus       = bus;
    this._data      = {};
    this._steps     = [];
    this._stepIdx   = 0;
    this._page      = null;
    this._headEl    = null;
    this._bodyEl    = null;
    this._footEl    = null;
    this._tbodyEl   = null;
    this._emptyMsg  = null;
    this._itemSeq   = 0;
    this._pendentes = [];   // solicitações pendentes do servidor
    this._histPanel = null; // painel de histórico
  }

  open() {
    this._data    = { medicaoItems: [], anexos: [], relNo: this._nextRelNo(), controleNo: this._nextControleNo() };
    this._stepIdx = 0;
    this._itemSeq = 0;
    this._steps   = this._buildSteps();
    if (!this._page) this._build();
    this._page.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this._renderStep();
    this._fetchPendentes();  // carrega solicitações em background
  }

  /* ── Busca solicitações pendentes ───────────────────────── */
  async _fetchPendentes() {
    try {
      const res = await fetch('/api/solicitacoes');
      if (!res.ok) return;
      this._pendentes = await res.json();
      // Se estiver no passo 0 (Projeto), re-renderiza para mostrar pendentes
      if (this._stepIdx === 0 && this._page?.style.display !== 'none') {
        this._renderStep();
      }
    } catch { this._pendentes = []; }
  }

  /* ── Índice localStorage ──────────────────────────────── */
  _loadIndex() {
    try { return JSON.parse(localStorage.getItem('metrologia_analise_extra_index') ?? '[]'); }
    catch { return []; }
  }
  _saveToIndex(entry) {
    const idx = this._loadIndex();
    idx.push(entry);
    localStorage.setItem('metrologia_analise_extra_index', JSON.stringify(idx));
  }

  /* ── Nº Controle (sequencial eterno — nunca reseta) ─────
     Chave: metrologia_controle_no = { seq: N }
     Inicia em 346 e cresce indefinidamente, independente do ano.
  ────────────────────────────────────────────────────────── */
  static _CONTROLE_KEY   = 'metrologia_controle_no';
  static _CONTROLE_START = 345; // próximo será 346

  _loadControleCounter() {
    try {
      const raw = localStorage.getItem(AnaliseExtraModal._CONTROLE_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (typeof c.seq === 'number') return c;
      }
    } catch {}
    return { seq: AnaliseExtraModal._CONTROLE_START };
  }

  _nextControleNo() {
    return this._loadControleCounter().seq + 1;
  }

  _consumeControleNo() {
    const c = this._loadControleCounter();
    c.seq += 1;
    localStorage.setItem(AnaliseExtraModal._CONTROLE_KEY, JSON.stringify(c));
  }

  /* ── REL. No. (sequencial anual — reseta no virar do ano) ─
     Chave: metrologia_relno_counter = { seq: N, year: YYYY }
     Inicia em 001 para o ano corrente.
  ────────────────────────────────────────────────────────── */
  static _RELNO_KEY   = 'metrologia_relno_counter';
  static _RELNO_START = 0; // próximo será 001/ano-atual

  _loadCounter() {
    try {
      const raw = localStorage.getItem(AnaliseExtraModal._RELNO_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        if (typeof c.seq === 'number' && c.year) return c;
      }
    } catch {}
    return { seq: AnaliseExtraModal._RELNO_START, year: new Date().getFullYear() };
  }

  _nextRelNo() {
    const ano = new Date().getFullYear();
    let c = this._loadCounter();
    if (c.year !== ano) c = { seq: 0, year: ano }; // virou o ano
    return String(c.seq + 1).padStart(3, '0') + '/' + ano;
  }

  _consumeRelNo() {
    const ano = new Date().getFullYear();
    let c = this._loadCounter();
    if (c.year !== ano) c = { seq: 0, year: ano };
    c.seq += 1;
    c.year = ano;
    localStorage.setItem(AnaliseExtraModal._RELNO_KEY, JSON.stringify(c));
  }

  close() {
    if (this._page) this._page.style.display = 'none';
    document.body.style.overflow = '';
    this._bus.emit('analise-extra:closed', this._data);
  }

  /* ── Steps ──────────────────────────────────────────────── */
  _buildSteps() {
    return [
      { id:'projeto',       title:'Escolha o projeto',       render:() => this._renderProjeto()       },
      { id:'linha',         title:'Selecione a linha',        render:() => this._renderLinha()         },
      { id:'identificacao', title:'Identificação',            render:() => this._renderIdentificacao() },
      { id:'historico',     title:'1. Histórico',             render:() => this._renderHistorico()     },
      { id:'objetivo',      title:'2. Objetivo e Croqui',     render:() => this._renderObjetivo()      },
      { id:'medicoes',      title:'6. Resultados da Medição', render:() => this._renderMedicoes()      },
      { id:'conclusao',     title:'5. Conclusão e Avaliação', render:() => this._renderConclusao()     },
      { id:'confirmar',     title:'Assinaturas e PDF',        render:() => this._renderConfirmar()     },
    ];
  }

  get _totalSteps() { return this._steps.length; }
  get _currentStep() { return this._steps[this._stepIdx]; }

  /* ── Build (tela cheia) ─────────────────────────────────── */
  _build() {
    if (!document.getElementById('extra-styles')) {
      const s = document.createElement('style');
      s.id = 'extra-styles';
      s.textContent = `
        /* ── Página cheia ── */
        .extra-page {
          position: fixed; top: 0; right: 0; bottom: 0; left: var(--sidebar-w, 240px); z-index: 800;
          background: var(--bg, #0b1220);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        /* Topbar */
        .extra-page__topbar {
          display: flex; align-items: center; gap: 12px;
          padding: 0 20px; height: 56px; flex-shrink: 0;
          background: var(--surface, #111c2e);
          border-bottom: 1px solid var(--border);
        }
        .extra-page__back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid var(--border);
          border-radius: 6px; padding: 6px 12px;
          color: var(--text); font-size: 12px; cursor: pointer;
          transition: all .15s;
        }
        .extra-page__back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .extra-page__title { font-size: 14px; font-weight: 700; flex: 1; }
        .extra-page__badge {
          font-size: 11px; color: var(--text-mute); background: var(--surface-2,#1a2940);
          padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border);
        }
        /* Progress */
        .extra-page__progress { height: 3px; background: var(--border); flex-shrink: 0; }
        .extra-page__progress-fill { height: 100%; background: var(--accent,#4ea3ff); transition: width .3s; }
        /* Step header */
        .extra-page__step-hdr {
          padding: 18px 24px 10px;
          flex-shrink: 0;
          background: var(--bg, #0b1220);
        }
        .extra-page__step-label {
          font-size: 10px; font-weight: 700; letter-spacing: .8px;
          color: var(--text-mute); text-transform: uppercase; margin-bottom: 4px;
        }
        .extra-page__step-title { font-size: 20px; font-weight: 700; color: var(--text); }
        /* Body */
        .extra-page__body {
          flex: 1; overflow-y: auto; padding: 0 24px 16px;
        }
        /* Footer */
        .extra-page__foot {
          display: flex; align-items: center; gap: 10px;
          justify-content: space-between;
          padding: 12px 24px; flex-shrink: 0;
          background: var(--surface, #111c2e);
          border-top: 1px solid var(--border);
        }
        .extra-page__foot-right { display: flex; gap: 10px; }
        /* Largura máx para conteúdo */
        .extra-page__inner { max-width: 860px; margin: 0 auto; }

        /* ── Opções de seleção ── */
        .extra-opts { display: flex; flex-wrap: wrap; gap: 10px; padding: 8px 0; }
        .extra-opt {
          padding: 14px 22px; border-radius: 8px;
          border: 1.5px solid var(--border); background: var(--surface);
          color: var(--text); font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .18s;
        }
        .extra-opt:hover, .extra-opt--sel {
          border-color: var(--accent,#4ea3ff);
          background: rgba(78,163,255,.12);
          color: var(--accent,#4ea3ff);
        }

        /* ── Section title ── */
        .extra-sec {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .6px; color: var(--text-mute);
          margin: 18px 0 8px; padding-bottom: 5px;
          border-bottom: 1px solid var(--border);
        }
        .extra-sec:first-child { margin-top: 8px; }

        /* ── Tabela de medições ── */
        .extra-med-wrap  { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; }
        .extra-med-table { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 780px; }
        .extra-med-table thead tr {
          background: #c8a000;
        }
        .extra-med-table th {
          background: transparent; color: #1a1200;
          font-weight: 800; font-size: 11px; text-align: center;
          padding: 8px 6px; border: 1px solid #a07800;
          white-space: nowrap;
        }
        .extra-med-table td { padding: 4px 6px; border: 1px solid var(--border); vertical-align: middle; }
        .extra-med-inp {
          width: 100%; background: transparent; border: none;
          color: var(--text); font-size: 11.5px; padding: 3px 4px; min-width: 70px;
        }
        .extra-med-inp:focus { outline: 1px solid var(--accent,#4ea3ff); border-radius: 2px; }
        .extra-med-inp-sm  { width: 48px; min-width: unset; }
        .extra-med-inp-md  { min-width: 54px; }
        .extra-med-aval { display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700; text-transform:uppercase; white-space:nowrap; }
        .extra-med-aval--ok   { background:rgba(34,197,94,.18);  color:#22c55e; }
        .extra-med-aval--nok  { background:rgba(239,71,87,.18);  color:#ef4757; }
        .extra-med-aval--aten { background:rgba(245,158,11,.18); color:#f59e0b; }
        .extra-med-aval--nd   { color:var(--text-mute); font-size:11px; }
        .extra-med-del { background: none; border: none; color: var(--danger,#ef4757); cursor: pointer; font-size: 15px; padding: 2px 8px; }
        .extra-med-del:hover { opacity: .7; }
        .extra-med-empty { text-align: center; color: var(--text-mute); font-size: 12px; padding: 20px; font-style: italic; }

        /* ── Botões de ação ── */
        .extra-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .extra-action-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 7px;
          border: 1px solid var(--border); background: var(--surface);
          color: var(--text); font-size: 12px; cursor: pointer; transition: all .15s;
        }
        .extra-action-btn:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }

        /* ── Painel de importação filtrado ── */
        .extra-import-panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 14px; margin-bottom: 12px;
        }
        .extra-import-panel-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .4px; color: var(--text-mute); margin-bottom: 10px;
        }
        .extra-import-op { margin-bottom: 10px; }
        .extra-import-op-name {
          font-size: 11px; font-weight: 700; color: var(--accent,#4ea3ff);
          text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px;
        }
        .extra-import-tipos { display: flex; flex-wrap: wrap; gap: 6px; }
        .extra-import-tipo {
          padding: 5px 12px; border: 1px solid var(--border); border-radius: 5px;
          background: var(--bg); font-size: 11.5px; cursor: pointer; transition: all .15s;
        }
        .extra-import-tipo:hover { background: var(--accent,#4ea3ff); color: #fff; border-color: var(--accent,#4ea3ff); }
        .extra-import-empty { font-size: 12px; color: var(--text-mute); font-style: italic; }

        /* ── Avaliação ── */
        .extra-aval-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin: 10px 0 16px; }
        .extra-aval-btn {
          padding: 20px 8px; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface);
          color: var(--text); font-size: 14px; font-weight: 700;
          cursor: pointer; text-align: center; transition: all .2s;
        }
        .extra-aval-btn:hover { filter: brightness(1.1); }
        .extra-aval-btn--ok    { border-color: var(--ok,#22c55e);      color: var(--ok,#22c55e);      }
        .extra-aval-btn--ok.sel{ background: var(--ok,#22c55e);        color: #fff; }
        .extra-aval-btn--nok   { border-color: var(--danger,#ef4757);  color: var(--danger,#ef4757);  }
        .extra-aval-btn--nok.sel{ background: var(--danger,#ef4757);   color: #fff; }
        .extra-aval-btn--inf   { border-color: var(--accent,#4ea3ff);  color: var(--accent,#4ea3ff);  }
        .extra-aval-btn--inf.sel{ background: var(--accent,#4ea3ff);   color: #fff; }

        /* ── Anexos ── */
        .extra-anex-item {
          display: flex; align-items: center; gap: 8px; padding: 7px 12px;
          border: 1px solid var(--border); border-radius: 6px;
          background: var(--surface); margin-bottom: 6px; font-size: 12px;
        }
        .extra-anex-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .extra-anex-del  { background: none; border: none; color: var(--danger,#ef4757); cursor: pointer; font-size: 13px; }

        /* ── Resumo ── */
        .extra-summary-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 5px 20px;
          background: var(--surface); border-radius: 8px;
          padding: 14px; margin-bottom: 18px; font-size: 12px;
        }
        /* ── Assinaturas ── */
        .extra-copia-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .extra-copia-card { border: 1px solid var(--border); border-radius: 8px; padding: 14px; background: var(--surface); }
        .extra-copia-role { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--text-mute); margin-bottom: 8px; }
        .extra-copia-inp  { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--border); color: var(--text); font-size: 12px; padding: 2px 0 4px; margin-bottom: 4px; }
        .extra-copia-inp:focus { outline: none; border-bottom-color: var(--accent,#4ea3ff); }
        .extra-copia-date { width: 100%; background: transparent; border: 1px solid var(--border); border-radius: 4px; color: var(--text); font-size: 11px; padding: 3px 6px; margin-top: 4px; }
        .extra-copia-line { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 4px; font-size: 9px; color: var(--text-mute); text-align: center; }

        /* ── Painel de histórico ── */
        .extra-hist {
          position: absolute; inset: 56px 0 0 0; /* abaixo do topbar */
          background: var(--bg,#0b1220); z-index: 10;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .extra-hist__head {
          display: flex; align-items: center; gap: 10px; padding: 10px 20px;
          background: var(--surface,#111c2e); border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .extra-hist__title { font-size: 14px; font-weight: 700; flex: 1; }
        .extra-hist__close {
          background: none; border: 1px solid var(--border); border-radius: 6px;
          padding: 5px 12px; color: var(--text); font-size: 12px; cursor: pointer;
        }
        .extra-hist__close:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .extra-hist__body { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .extra-hist__inner { max-width: 860px; margin: 0 auto; }
        .extra-hist__sec {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px;
          color: var(--text-mute); padding-bottom: 6px; border-bottom: 1px solid var(--border);
          margin-bottom: 10px; margin-top: 20px;
        }
        .extra-hist__sec:first-child { margin-top: 0; }
        .extra-hist__card {
          display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 12px;
          padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--surface,#111c2e); margin-bottom: 8px; font-size: 12px;
        }
        .extra-hist__card--pendente { border-left: 3px solid var(--danger,#ef4757); }
        .extra-hist__card--concluida { border-left: 3px solid var(--ok,#22c55e); opacity: .85; }
        .extra-hist__id { font-size: 10px; font-weight: 900; font-family: monospace; color: var(--accent,#4ea3ff); padding-top: 2px; }
        .extra-hist__info h4 { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
        .extra-hist__info p  { font-size: 11px; color: var(--text-mute); margin: 1px 0; }
        .extra-hist__meta { text-align: right; }
        .extra-hist__status {
          display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 8px;
          border-radius: 10px; text-transform: uppercase; margin-bottom: 4px;
        }
        .extra-hist__status--pendente  { background: rgba(239,71,87,.15); color: var(--danger,#ef4757); }
        .extra-hist__status--concluida { background: rgba(34,197,94,.15);  color: var(--ok,#22c55e); }
        .extra-hist__atender {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;
          padding: 5px 10px; border-radius: 5px; border: 1px solid var(--danger,#ef4757);
          background: none; color: var(--danger,#ef4757); font-size: 11px; cursor: pointer;
          transition: all .15s;
        }
        .extra-hist__atender:hover { background: var(--danger,#ef4757); color: #fff; }
        .extra-hist__urgente { font-size: 9px; color: var(--danger,#ef4757); font-weight: 700; }
        .extra-hist__empty { text-align: center; color: var(--text-mute); font-size: 13px; padding: 40px 0; font-style: italic; }
        .extra-hist__del-btn {
          display: flex; align-items: center; justify-content: center;
          margin-top: 6px; padding: 4px 7px; border-radius: 5px;
          border: 1px solid transparent; background: none;
          color: var(--text-mute); font-size: 13px; cursor: pointer; opacity: .5;
          transition: all .15s;
        }
        .extra-hist__del-btn:hover { border-color: var(--danger,#ef4757); color: var(--danger,#ef4757); opacity: 1; background: rgba(239,71,87,.1); }
        .extra-hist__del-btn:disabled { opacity: .2; cursor: default; pointer-events: none; }
        .extra-hist__del-confirm {
          grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          margin-top: 8px; padding: 8px 10px; border-radius: 6px;
          background: rgba(239,71,87,.1); border: 1px solid var(--danger,#ef4757);
          font-size: 11px; color: var(--text);
        }
        .extra-hist__del-confirm span { flex: 1; }
        .extra-hist__del-yes {
          padding: 4px 10px; border-radius: 5px; border: none;
          background: var(--danger,#ef4757); color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .extra-hist__del-no {
          padding: 4px 10px; border-radius: 5px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 11px; cursor: pointer;
        }

        /* ── Pendentes no passo 1 ── */
        .extra-pend-card {
          padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--danger,#ef4757);
          background: rgba(239,71,87,.07); margin-bottom: 6px; font-size: 12px;
        }
        .extra-pend-card__head {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          margin-bottom: 8px;
        }
        .extra-pend-id { font-size: 10px; font-weight: 900; font-family: monospace; color: var(--danger,#ef4757); }
        .extra-pend-urg { font-size: 9px; font-weight: 700; color: var(--danger,#ef4757);
          background: rgba(239,71,87,.15); padding: 2px 7px; border-radius: 10px; }
        .extra-pend-titulo { font-size: 12px; font-weight: 700; color: var(--text); flex: 1;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .extra-pend-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; margin-bottom: 6px;
        }
        .extra-pend-field { font-size: 10px; }
        .extra-pend-field span { display: block; font-size: 9px; text-transform: uppercase;
          letter-spacing: .4px; color: var(--text-mute); margin-bottom: 1px; }
        .extra-pend-field strong { color: var(--text); font-weight: 600; }
        .extra-pend-conteudo { font-size: 10px; color: var(--text-mute); font-style: italic;
          border-top: 1px solid rgba(239,71,87,.2); padding-top: 6px; margin-top: 4px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .extra-pend-anexos { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px;
          padding-top: 6px; border-top: 1px solid rgba(239,71,87,.2); }
        .extra-pend-anexo {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
          background: rgba(78,163,255,.1); border: 1px solid rgba(78,163,255,.25);
          border-radius: 5px; font-size: 10px; color: var(--accent,#4ea3ff);
          text-decoration: none; max-width: 160px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; cursor: pointer; transition: background .15s;
        }
        .extra-pend-anexo:hover { background: rgba(78,163,255,.2); }
        .extra-pend-atender {
          padding: 5px 12px; border-radius: 6px; background: var(--danger,#ef4757);
          border: none; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
          white-space: nowrap; transition: opacity .15s; flex-shrink: 0;
        }
        .extra-pend-atender:hover { opacity: .85; }
      `;
      document.head.appendChild(s);
    }

    /* Elemento raiz — cobre 100% da tela */
    this._page = document.createElement('div');
    this._page.className = 'extra-page';
    this._page.style.display = 'none';

    /* Topbar */
    const topbar = document.createElement('div');
    topbar.className = 'extra-page__topbar';

    const backBtn = document.createElement('button');
    backBtn.className = 'extra-page__back';
    backBtn.innerHTML = '← Voltar ao Dashboard';
    backBtn.addEventListener('click', () => this.close());

    this._topTitle = document.createElement('div');
    this._topTitle.className = 'extra-page__title';
    this._topTitle.textContent = 'Análise Extra';

    this._topBadge = document.createElement('div');
    this._topBadge.className = 'extra-page__badge';

    const histBtn = document.createElement('button');
    histBtn.className = 'extra-page__back';
    histBtn.innerHTML = '📋 Histórico';
    histBtn.addEventListener('click', () => this._mostrarHistorico());

    topbar.appendChild(backBtn);
    topbar.appendChild(this._topTitle);
    topbar.appendChild(this._topBadge);
    topbar.appendChild(histBtn);
    this._page.appendChild(topbar);

    /* Barra de progresso */
    const progressBar = document.createElement('div');
    progressBar.className = 'extra-page__progress';
    this._progressFill = document.createElement('div');
    this._progressFill.className = 'extra-page__progress-fill';
    progressBar.appendChild(this._progressFill);
    this._page.appendChild(progressBar);

    /* Step header */
    this._stepHdr = document.createElement('div');
    this._stepHdr.className = 'extra-page__step-hdr';
    this._page.appendChild(this._stepHdr);

    /* Body com largura máxima */
    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'extra-page__body';
    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'extra-page__inner';
    bodyWrap.appendChild(this._bodyEl);
    this._page.appendChild(bodyWrap);

    /* Footer */
    this._footEl = document.createElement('div');
    this._footEl.className = 'extra-page__foot';
    this._page.appendChild(this._footEl);

    /* Painel de histórico (overlay interno) */
    this._histPanel = document.createElement('div');
    this._histPanel.className = 'extra-hist';
    this._histPanel.style.display = 'none';
    this._page.appendChild(this._histPanel);

    document.body.appendChild(this._page);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._page?.style.display !== 'none') {
        if (this._histPanel?.style.display !== 'none') this._fecharHistorico();
        else this.close();
      }
    });
  }

  /* ── Render step ────────────────────────────────────────── */
  _renderStep() {
    const pct = ((this._stepIdx + 1) / this._totalSteps) * 100;
    this._progressFill.style.width = `${pct}%`;

    this._stepHdr.innerHTML = `
      <div class="extra-page__step-label">Passo ${this._stepIdx + 1} de ${this._totalSteps} · Análise Extra</div>
      <div class="extra-page__step-title">${this._currentStep?.title ?? ''}</div>`;

    this._topBadge.textContent = [this._data.projeto, this._data.linha].filter(Boolean).join(' › ') || 'Nova análise';

    this._bodyEl.innerHTML = '';
    this._footEl.innerHTML = '';
    this._tbodyEl  = null;
    this._emptyMsg = null;
    this._currentStep?.render();
    this._renderFoot();
  }

  _renderFoot() {
    const isAutoStep = ['linha'].includes(this._currentStep?.id); // só linha é auto-step; projeto mostra "Avançar"
    const isLast     = this._stepIdx === this._totalSteps - 1;

    /* Esquerda */
    const leftBtn = document.createElement('button');
    leftBtn.className   = 'btn btn--ghost';
    leftBtn.textContent = this._stepIdx === 0 ? '✕ Cancelar' : '← Voltar';
    leftBtn.addEventListener('click', () => {
      if (this._stepIdx === 0) this.close();
      else { this._stepIdx--; this._renderStep(); }
    });
    this._footEl.appendChild(leftBtn);

    /* Direita */
    const right = document.createElement('div');
    right.className = 'extra-page__foot-right';

    if (isAutoStep) {
      const hint = document.createElement('span');
      hint.style.cssText = 'font-size:12px;color:var(--text-mute);align-self:center;';
      hint.textContent = 'Clique numa opção para avançar automaticamente';
      right.appendChild(hint);
    } else if (isLast) {
      const pdfBtn = document.createElement('button');
      pdfBtn.className = 'btn btn--ghost';
      pdfBtn.innerHTML  = '📄 Gerar PDF';
      pdfBtn.addEventListener('click', () => this._gerarPDF());

      const confirmBtn = document.createElement('button');
      confirmBtn.className   = 'btn btn--primary';
      confirmBtn.textContent = '✓ Confirmar e Enviar';
      confirmBtn.addEventListener('click', () => { this._gerarPDF(); this._submit(); });

      right.appendChild(pdfBtn);
      right.appendChild(confirmBtn);
    } else {
      const nextBtn = document.createElement('button');
      nextBtn.className   = 'btn btn--primary';
      nextBtn.textContent = 'Avançar →';
      nextBtn.addEventListener('click', () => { this._stepIdx++; this._renderStep(); });
      right.appendChild(nextBtn);
    }

    this._footEl.appendChild(right);
  }

  /* ── Passo 1: Projeto ──────────────────────────────────── */
  _renderProjeto() {
    /* Layout 2 colunas */
    const cols = document.createElement('div');
    cols.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start;';

    /* ── Coluna esquerda: botões de projeto ── */
    const leftCol = document.createElement('div');

    const wrap = document.createElement('div'); wrap.className = 'extra-opts';
    HIER_PROJETOS.forEach(p => {
      const btn = document.createElement('button');
      btn.className = `extra-opt${this._data.projeto === p ? ' extra-opt--sel' : ''}`;
      btn.textContent = p;
      btn.addEventListener('click', () => {
        this._data.projeto = p;
        wrap.querySelectorAll('.extra-opt').forEach(b => b.classList.remove('extra-opt--sel'));
        btn.classList.add('extra-opt--sel');
      });
      wrap.appendChild(btn);
    });
    leftCol.appendChild(wrap);

    /* Numeração do próximo relatório */
    const nextTag = document.createElement('div');
    nextTag.style.cssText = 'margin-top:18px;padding:12px 14px;border-radius:7px;border:1px solid var(--border);background:var(--surface);';
    nextTag.innerHTML = `
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:8px;">Próxima Numeração</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:baseline;gap:8px;">
          <span style="font-size:10px;font-weight:700;color:var(--text-mute);white-space:nowrap;min-width:90px;">Nº Controle</span>
          <span style="font-size:22px;font-weight:900;color:var(--accent,#4ea3ff);">${this._data.controleNo}</span>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:6px;display:flex;align-items:baseline;gap:8px;">
          <span style="font-size:10px;font-weight:700;color:var(--text-mute);white-space:nowrap;min-width:90px;">REL. No.</span>
          <span style="font-size:16px;font-weight:700;color:var(--text);">${this._data.relNo}</span>
          <span style="font-size:9px;color:var(--text-mute);">(anual)</span>
        </div>
      </div>`;
    leftCol.appendChild(nextTag);

    /* ── Coluna direita: pendentes → análises realizadas ── */
    const rightCol = document.createElement('div');

    /* Pendentes primeiro */
    if (this._pendentes.length) {
      const pendTitle = document.createElement('div');
      pendTitle.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--danger,#ef4757);margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid var(--danger,#ef4757);display:flex;align-items:center;gap:6px;';
      pendTitle.innerHTML = `<span style="animation:badge-pulse 1.3s ease-in-out infinite;display:inline-block;width:8px;height:8px;background:var(--danger,#ef4757);border-radius:50%;"></span>Solicitações Pendentes (${this._pendentes.length})`;
      rightCol.appendChild(pendTitle);

      const pendList = document.createElement('div');
      pendList.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:16px;max-height:220px;overflow-y:auto;';
      this._pendentes.forEach(sol => {
        const card = document.createElement('div'); card.className = 'extra-pend-card';

        // Cabeçalho: ID + urgência + título + botão atender
        const head = document.createElement('div'); head.className = 'extra-pend-card__head';
        const idEl = document.createElement('div'); idEl.className = 'extra-pend-id';
        idEl.textContent = sol.id?.toUpperCase() ?? '—';
        const titulo = document.createElement('div'); titulo.className = 'extra-pend-titulo';
        titulo.textContent = sol.titulo ?? '—';
        const atBtn = document.createElement('button'); atBtn.className = 'extra-pend-atender';
        atBtn.textContent = 'Atender →';
        atBtn.addEventListener('click', () => this._atenderSolicitacao(sol));
        head.appendChild(idEl);
        if (sol.urgencia === 'urgente') {
          const urg = document.createElement('div'); urg.className = 'extra-pend-urg';
          urg.textContent = '🚨 URGENTE'; head.appendChild(urg);
        }
        head.appendChild(titulo);
        head.appendChild(atBtn);
        card.appendChild(head);

        // Grid de campos
        const grid = document.createElement('div'); grid.className = 'extra-pend-grid';
        const campo = (label, valor) => {
          if (!valor) return;
          const f = document.createElement('div'); f.className = 'extra-pend-field';
          f.innerHTML = `<span>${label}</span><strong>${valor}</strong>`;
          grid.appendChild(f);
        };
        const projLinha = [sol.projeto, sol.linha].filter(Boolean).join(' › ');
        const procOp    = [sol.processo, sol.operacao].filter(Boolean).join(' / ');
        campo('Projeto / Linha',      projLinha || '—');
        campo('Solicitante',          sol.solicitante ?? '—');
        campo('Processo / Operação',  procOp || '—');
        campo('Part No.',             sol.partNo ?? '—');
        card.appendChild(grid);

        // Conteúdo a avaliar
        if (sol.conteudo || sol.objetivo) {
          const ctd = document.createElement('div'); ctd.className = 'extra-pend-conteudo';
          ctd.textContent = sol.conteudo || sol.objetivo;
          card.appendChild(ctd);
        }

        // Anexos
        if (sol.anexos?.length) {
          const anexRow = document.createElement('div'); anexRow.className = 'extra-pend-anexos';
          sol.anexos.forEach(a => {
            const icon = a.type?.includes('pdf') ? '📄' : a.type?.startsWith('image/') ? '🖼' : '📎';
            const link = document.createElement('a'); link.className = 'extra-pend-anexo';
            link.href = a.data; link.download = a.name; link.title = a.name;
            link.innerHTML = `${icon} ${a.name}`;
            anexRow.appendChild(link);
          });
          card.appendChild(anexRow);
        }

        // Rodapé: botão Reprovar (esquerda)
        const cardFoot = document.createElement('div');
        cardFoot.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid rgba(239,71,87,.18);';

        const repBtn = document.createElement('button');
        repBtn.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:5px;border:1px solid var(--danger,#ef4757);background:none;color:var(--danger,#ef4757);font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;';
        repBtn.innerHTML = '✕ Reprovar';
        repBtn.title = 'Reprovar esta solicitação';

        repBtn.addEventListener('click', () => {
          // 1º clique → confirmar
          if (!repBtn.dataset.confirm) {
            repBtn.dataset.confirm = '1';
            repBtn.innerHTML = '⚠ Confirmar reprovação?';
            repBtn.style.background = 'rgba(239,71,87,.15)';
            repBtn.style.fontWeight = '700';
            // Cancela confirmação ao clicar fora
            const cancel = e => {
              if (!repBtn.contains(e.target)) {
                repBtn.dataset.confirm = '';
                repBtn.innerHTML = '✕ Reprovar';
                repBtn.style.background = 'none';
                repBtn.style.fontWeight = '600';
                document.removeEventListener('click', cancel);
              }
            };
            setTimeout(() => document.addEventListener('click', cancel), 50);
            return;
          }
          // 2º clique → reprovar de facto
          repBtn.disabled = true;
          repBtn.innerHTML = 'Reprovando…';
          adminFetch(`/api/solicitacoes/${sol.id}`, {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ motivo: 'reprovado' }),
          }).catch(() => {});

          // Remove da lista local e re-renderiza
          this._pendentes = this._pendentes.filter(p => p.id !== sol.id);
          card.style.cssText = 'transition:opacity .25s,max-height .3s;opacity:0;max-height:0;overflow:hidden;margin:0;padding:0;border:none;';
          setTimeout(() => {
            card.remove();
            // Atualiza cabeçalho de pendentes
            pendTitle.innerHTML = `<span style="animation:badge-pulse 1.3s ease-in-out infinite;display:inline-block;width:8px;height:8px;background:var(--danger,#ef4757);border-radius:50%;"></span>Solicitações Pendentes (${this._pendentes.length})`;
            this._bus.emit('solicitacoes:refresh');
          }, 300);

          const toast = document.createElement('div'); toast.className = 'toast toast--ok show';
          toast.textContent = `✕ Solicitação ${sol.id?.toUpperCase() ?? ''} reprovada`;
          document.body.appendChild(toast);
          setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
        });

        cardFoot.appendChild(repBtn);
        card.appendChild(cardFoot);

        pendList.appendChild(card);
      });
      rightCol.appendChild(pendList);
    }

    /* Análises realizadas */
    const idxHeader = document.createElement('div');
    idxHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);';
    const idxTitle = document.createElement('div');
    idxTitle.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-mute);';
    idxTitle.textContent = 'Análises Extras Realizadas';
    idxHeader.appendChild(idxTitle);
    rightCol.appendChild(idxHeader);

    const idx = this._loadIndex();
    if (!idx.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-size:12px;color:var(--text-mute);font-style:italic;text-align:center;padding:24px 0;';
      empty.textContent = 'Nenhuma análise registrada ainda.';
      rightCol.appendChild(empty);
    } else {
      const listWrap = document.createElement('div');
      listWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;';

      const renderCards = () => {
        listWrap.innerHTML = '';
        const current = this._loadIndex();
        [...current].reverse().forEach((entry, revIdx) => {
          const realIdx = current.length - 1 - revIdx; // índice real no array original

          const card = document.createElement('div');
          card.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;padding:8px 12px;border-radius:7px;border:1px solid var(--border);background:var(--surface);font-size:11px;';

          const badge = document.createElement('div');
          badge.style.cssText = 'display:flex;flex-direction:column;gap:2px;white-space:nowrap;';
          badge.innerHTML = `
            <span style="font-size:11px;font-weight:900;color:var(--accent,#4ea3ff);">Nº ${entry.controleNo ?? '—'}</span>
            <span style="font-size:9px;font-weight:600;color:var(--text-mute);">REL. ${entry.relNo ?? '—'}</span>`;

          const info = document.createElement('div');
          const proj = document.createElement('div');
          proj.style.cssText = 'font-weight:700;font-size:12px;color:var(--text);';
          proj.textContent = [entry.projeto, entry.linha].filter(Boolean).join(' › ');
          const meta = document.createElement('div');
          meta.style.cssText = 'font-size:10px;color:var(--text-mute);margin-top:1px;';
          const dataFmt = entry.data ? new Date(entry.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
          meta.textContent = `${entry.processo ?? '—'} · ${dataFmt}`;
          info.appendChild(proj); info.appendChild(meta);

          const avalCor = { APROVADO:'var(--ok,#22c55e)', REPROVADO:'var(--danger,#ef4757)', INFORMATIVO:'var(--accent,#4ea3ff)' }[entry.avaliacao] ?? 'var(--text-mute)';
          const aval = document.createElement('div');
          aval.style.cssText = `font-size:9px;font-weight:700;color:${avalCor};text-align:right;white-space:nowrap;`;
          aval.textContent = entry.avaliacao ?? '—';

          // Botão excluir individual
          const delBtn = document.createElement('button');
          delBtn.title = 'Remover este registro';
          delBtn.style.cssText = 'background:none;border:1px solid transparent;border-radius:4px;color:var(--danger,#ef4757);font-size:13px;cursor:pointer;padding:2px 6px;line-height:1;opacity:.55;transition:all .15s;flex-shrink:0;';
          delBtn.textContent = '✕';
          delBtn.addEventListener('mouseenter', () => { delBtn.style.opacity='1'; delBtn.style.borderColor='var(--danger,#ef4757)'; });
          delBtn.addEventListener('mouseleave', () => { delBtn.style.opacity='.55'; delBtn.style.borderColor='transparent'; });
          delBtn.addEventListener('click', () => {
            const updated = this._loadIndex();
            updated.splice(realIdx, 1);
            localStorage.setItem('metrologia_analise_extra_index', JSON.stringify(updated));
            renderCards(); // re-renderiza a lista
            // Atualiza o contador de total
            totalEl.textContent = `Total: ${updated.length} análise${updated.length !== 1 ? 's' : ''}`;
            if (!updated.length) {
              listWrap.remove();
              totalEl.remove();
              const empty = document.createElement('div');
              empty.style.cssText = 'font-size:12px;color:var(--text-mute);font-style:italic;text-align:center;padding:24px 0;';
              empty.textContent = 'Nenhuma análise registrada ainda.';
              rightCol.appendChild(empty);
            }
          });

          card.appendChild(badge); card.appendChild(info); card.appendChild(aval); card.appendChild(delBtn);
          listWrap.appendChild(card);
        });
      };

      renderCards();
      rightCol.appendChild(listWrap);
      const totalEl = document.createElement('div');
      totalEl.style.cssText = 'font-size:10px;color:var(--text-mute);margin-top:8px;text-align:right;';
      totalEl.textContent = `Total: ${idx.length} análise${idx.length !== 1 ? 's' : ''}`;
      rightCol.appendChild(totalEl);
    }

    cols.appendChild(leftCol);
    cols.appendChild(rightCol);
    this._bodyEl.appendChild(cols);
  }

  /* ── Passo 2: Linha ────────────────────────────────────── */
  _renderLinha() {
    const linhas = HIER_LINHAS[this._data.projeto] ?? [];
    const hint = this._makeHint(`Projeto: ${this._data.projeto} · Selecione a linha de produção.`);
    this._bodyEl.appendChild(hint);
    if (!linhas.length) {
      this._bodyEl.appendChild(this._makeHint('Nenhuma linha disponível.')); return;
    }
    const wrap = document.createElement('div'); wrap.className = 'extra-opts';
    linhas.forEach(l => {
      const btn = document.createElement('button');
      btn.className = `extra-opt${this._data.linha === l ? ' extra-opt--sel' : ''}`;
      btn.textContent = l;
      btn.addEventListener('click', () => {
        this._data.linha = l;
        wrap.querySelectorAll('.extra-opt').forEach(b => b.classList.remove('extra-opt--sel'));
        btn.classList.add('extra-opt--sel');
        setTimeout(() => { this._stepIdx++; this._renderStep(); }, 180);
      });
      wrap.appendChild(btn);
    });
    this._bodyEl.appendChild(wrap);
  }

  /* ── Passo 3: Identificação ────────────────────────────── */
  _renderIdentificacao() {
    /* Garante numeração já preenchida */
    if (!this._data.relNo)     this._data.relNo     = this._nextRelNo();
    if (!this._data.controleNo) this._data.controleNo = this._nextControleNo();

    /* Bloco de numeração (somente leitura — gerado automaticamente) */
    const numBox = document.createElement('div');
    numBox.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;padding:12px 14px;border-radius:8px;border:1px solid var(--accent,#4ea3ff);background:var(--surface);';
    numBox.innerHTML = `
      <div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:3px;">Nº Controle <span style="font-weight:400;font-size:8px;">(sequencial eterno)</span></div>
        <div style="font-size:24px;font-weight:900;color:var(--accent,#4ea3ff);">${this._data.controleNo}</div>
      </div>
      <div style="border-left:1px solid var(--border);padding-left:14px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:3px;">REL. No. <span style="font-weight:400;font-size:8px;">(reseta anualmente)</span></div>
        <div style="font-size:24px;font-weight:900;color:var(--text);">${this._data.relNo}</div>
      </div>`;
    this._bodyEl.appendChild(numBox);

    [
      { key:'processo',    label:'Processo',        type:'text', placeholder:'Ex: Usinagem HEAD'        },
      { key:'opAtividade', label:'OP. / Atividade', type:'text', placeholder:'Ex: OP.140 – Torneamento' },
      { key:'dataAnalise', label:'Data',            type:'date', placeholder:''                         },
    ].forEach(f => this._addField(f));
    if (!this._data.dataAnalise) {
      this._data.dataAnalise = new Date().toISOString().split('T')[0];
      const inp = this._bodyEl.querySelector('#mf-dataAnalise');
      if (inp) inp.value = this._data.dataAnalise;
    }
  }

  /* ── Passo 4: Histórico ────────────────────────────────── */
  _renderHistorico() {
    this._bodyEl.appendChild(this._secTitle('1. Histórico'));
    [
      { key:'partNumber', label:'1.1 Part Number', type:'text',     placeholder:'Ex: 12345-0H030'                              },
      { key:'partName',   label:'1.2 Part Name',   type:'text',     placeholder:'Ex: CYLINDER HEAD ASSY'                       },
      { key:'causa',      label:'1.3 Causa',        type:'textarea', placeholder:'Descreva a causa que originou esta análise...' },
    ].forEach(f => this._addField(f));
  }

  /* ── Passo 5: Objetivo e Croqui ────────────────────────── */
  _renderObjetivo() {
    this._bodyEl.appendChild(this._secTitle('2. Objetivo'));
    this._addField({ key:'objetivo', label:'2.1 Objetivo', type:'textarea', placeholder:'Descreva o objetivo desta análise extra...' });

    this._bodyEl.appendChild(this._secTitle('3. Desenho / Croqui (opcional)'));

    const row    = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;';
    const fileInp = document.createElement('input'); fileInp.type = 'file'; fileInp.accept = 'image/*,.pdf'; fileInp.style.display = 'none';
    const fileLbl = document.createElement('label'); fileLbl.className = 'extra-action-btn'; fileLbl.textContent = '📎 Selecionar imagem/arquivo'; fileLbl.appendChild(fileInp);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'extra-action-btn'; clearBtn.textContent = '✕ Remover'; clearBtn.style.color = 'var(--danger,#ef4757)';
    clearBtn.style.display = this._data.croquiData ? '' : 'none';
    clearBtn.addEventListener('click', () => { this._data.croquiData = null; this._data.croquiNome = null; previewEl.innerHTML = ''; clearBtn.style.display = 'none'; });

    const previewEl = document.createElement('div');
    if (this._data.croquiData && this._data.croquiType?.startsWith('image/')) {
      const img = document.createElement('img'); img.src = this._data.croquiData;
      img.style.cssText = 'max-width:100%;max-height:200px;border-radius:6px;border:1px solid var(--border);margin-top:8px;';
      previewEl.appendChild(img);
    } else if (this._data.croquiNome) {
      const p = document.createElement('p'); p.style.cssText = 'font-size:12px;color:var(--ok);margin-top:6px;'; p.textContent = `✓ ${this._data.croquiNome}`; previewEl.appendChild(p);
    }
    fileInp.addEventListener('change', () => {
      const file = fileInp.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        this._data.croquiNome = file.name; this._data.croquiData = e.target.result; this._data.croquiType = file.type;
        previewEl.innerHTML = '';
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img'); img.src = e.target.result;
          img.style.cssText = 'max-width:100%;max-height:200px;border-radius:6px;border:1px solid var(--border);margin-top:8px;';
          previewEl.appendChild(img);
        } else {
          const p = document.createElement('p'); p.style.cssText = 'font-size:12px;color:var(--ok);margin-top:6px;'; p.textContent = `✓ ${file.name}`; previewEl.appendChild(p);
        }
        clearBtn.style.display = '';
      };
      reader.readAsDataURL(file);
    });

    row.appendChild(fileLbl); row.appendChild(clearBtn);
    this._bodyEl.appendChild(row); this._bodyEl.appendChild(previewEl);

    // Anexos da solicitação original
    const solAnexos = this._data.solAnexos ?? [];
    if (solAnexos.length) {
      const secAnex = document.createElement('div');
      secAnex.style.cssText = 'margin-top:14px;';

      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:8px;';
      lbl.textContent = 'Anexos da Solicitação';
      secAnex.appendChild(lbl);

      solAnexos.forEach(a => {
        const icon = a.type?.includes('pdf') ? '📄' : a.type?.startsWith('image/') ? '🖼' : '📎';
        const sz   = a.size < 1024*1024 ? Math.round(a.size/1024) + ' KB' : (a.size/1024/1024).toFixed(1) + ' MB';

        const item = document.createElement('div');
        item.style.cssText = 'border:1px solid var(--border);border-radius:7px;background:var(--surface);margin-bottom:10px;overflow:hidden;';

        // Barra superior: nome + tamanho + salvar
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);';

        const nameEl = document.createElement('span');
        nameEl.style.cssText = 'flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameEl.textContent = `${icon} ${a.name}`;

        const sizeEl = document.createElement('span');
        sizeEl.style.cssText = 'font-size:10px;color:var(--text-mute);white-space:nowrap;';
        sizeEl.textContent = sz;

        const dlBtn = document.createElement('a');
        dlBtn.href = a.data; dlBtn.download = a.name;
        dlBtn.style.cssText = 'padding:5px 12px;background:var(--accent,#4ea3ff);color:#fff;border-radius:5px;font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap;';
        dlBtn.textContent = '⬇ Salvar';

        bar.appendChild(nameEl); bar.appendChild(sizeEl); bar.appendChild(dlBtn);
        item.appendChild(bar);

        // Preview em tamanho real para imagens
        if (a.type?.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = a.data;
          img.style.cssText = 'width:100%;max-height:420px;object-fit:contain;display:block;cursor:zoom-in;background:#0a0f1e;padding:8px;';
          img.title = 'Clique para abrir em tela cheia';
          img.addEventListener('click', () => window.open(a.data, '_blank'));
          item.appendChild(img);
        }

        secAnex.appendChild(item);
      });

      this._bodyEl.appendChild(secAnex);
    }
  }

  /* ── Passo 6: Medições ─────────────────────────────────── */
  _renderMedicoes() {
    this._bodyEl.appendChild(this._makeHint('Adicione itens manualmente, importe da Análise Periódica (filtrado pela linha selecionada) ou anexe imagens.'));

    /* Tabela */
    const wrap  = document.createElement('div'); wrap.className = 'extra-med-wrap';
    const table = document.createElement('table'); table.className = 'extra-med-table';
    const thead = document.createElement('thead'); const trH = document.createElement('tr');
    [
      { label:'No',           w:'36px'  },
      { label:'Descrição',    w:'auto'  },
      { label:'Especificado', w:'110px' },
      { label:'Máq.',         w:'90px'  },
      { label:'Ponto medido', w:'100px' },
      { label:'Unid',         w:'54px'  },
      { label:'RESULTADO',    w:'80px'  },
      { label:'Aval.',        w:'72px'  },
      { label:'Inspetor',     w:'90px'  },
      { label:'',             w:'36px'  },
    ].forEach(({ label, w }) => {
      const th = document.createElement('th');
      th.textContent = label;
      if (w !== 'auto') th.style.width = w;
      trH.appendChild(th);
    });
    thead.appendChild(trH); table.appendChild(thead);
    this._tbodyEl = document.createElement('tbody'); table.appendChild(this._tbodyEl);
    wrap.appendChild(table); this._bodyEl.appendChild(wrap);

    this._emptyMsg = document.createElement('tr');
    const emptyTd = document.createElement('td'); emptyTd.colSpan = 10; emptyTd.className = 'extra-med-empty';
    emptyTd.textContent = 'Nenhum item adicionado. Use os botões abaixo.';
    this._emptyMsg.appendChild(emptyTd); this._tbodyEl.appendChild(this._emptyMsg);

    this._data.medicaoItems.forEach(item => this._appendMedRow(item));
    this._syncEmpty();

    /* Botões */
    const btnRow = document.createElement('div'); btnRow.className = 'extra-btn-row';

    const addBtn = document.createElement('button'); addBtn.className = 'extra-action-btn'; addBtn.textContent = '＋ Item Manual';
    addBtn.addEventListener('click', () => {
      const item = { id: ++this._itemSeq, desc:'', esp:'', maq:'', ponto:'', unid:'', resultado:'', ins:'' };
      this._data.medicaoItems.push(item); this._appendMedRow(item, true); this._syncEmpty();
    });

    const importBtn = document.createElement('button'); importBtn.className = 'extra-action-btn'; importBtn.textContent = '📋 Importar de Análise Periódica';
    importBtn.addEventListener('click', () => {
      importPanel.style.display = importPanel.style.display === 'none' ? '' : 'none';
    });

    const anexInp = document.createElement('input'); anexInp.type = 'file'; anexInp.accept = 'image/*,.pdf'; anexInp.multiple = true; anexInp.style.display = 'none';
    const anexLbl = document.createElement('label'); anexLbl.className = 'extra-action-btn'; anexLbl.textContent = '📎 Anexar Arquivo/Imagem'; anexLbl.appendChild(anexInp);
    anexInp.addEventListener('change', () => {
      Array.from(anexInp.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const anx = { id: Date.now() + Math.random(), name: file.name, type: file.type, data: e.target.result };
          this._data.anexos.push(anx); this._appendAnexo(anx, anexList);
        };
        reader.readAsDataURL(file);
      });
    });

    btnRow.appendChild(addBtn); btnRow.appendChild(importBtn); btnRow.appendChild(anexLbl);
    this._bodyEl.appendChild(btnRow);

    /* ── Painel de importação — usa RASTREABILIDADE diretamente ── */
    const importPanel = document.createElement('div'); importPanel.className = 'extra-import-panel'; importPanel.style.display = 'none';

    const { projeto, linha } = this._data;

    // Monta lista de operações com tipos disponíveis em RASTREABILIDADE
    const operacoes = projeto && linha ? (HIER_OPERACOES[projeto]?.[linha] ?? []) : [];
    const opComTipos = operacoes
      .map(op => {
        const chave = `${projeto}|${linha}|${op}`;
        const tipos = HIERARQUIA.medicoes?.[chave] ?? [];
        return { op, tipos: tipos.filter(t => RASTREABILIDADE[t]) };
      })
      .filter(x => x.tipos.length > 0);

    // Se não encontrou nada via hierarquia, mostra todos os check sheets disponíveis
    const todosCheckSheets = Object.keys(RASTREABILIDADE);
    const usarTodos = opComTipos.length === 0;

    const impHeader = document.createElement('div'); impHeader.className = 'extra-import-panel-title';
    impHeader.textContent = usarTodos
      ? `Check Sheets disponíveis (selecione para importar os itens)`
      : `Check Sheets — ${projeto} › ${linha}`;
    importPanel.appendChild(impHeader);

    const _importarTipo = (tipo, op = '') => {
      const rast = _getEffectiveRastLocal(tipo);
      if (!rast) return;
      const itens = rast.itens.filter(it => !it.separator);
      itens.forEach(item => {
        const row = {
          id: ++this._itemSeq,
          desc: item.desc ?? '',
          esp:  item.esp  ?? '',
          maq:  item.maq  ?? '',
          ponto:item.ponto?? '',
          unid: item.unid ?? '',
          resultado: '',
          ins: '',
          origem: op ? `${op} › ${tipo}` : tipo,
        };
        this._data.medicaoItems.push(row);
        this._appendMedRow(row);
      });
      this._syncEmpty();
      importPanel.style.display = 'none';
    };

    const _mkTipoBtn = (tipo, op) => {
      const rast = _getEffectiveRastLocal(tipo);
      const btn = document.createElement('button');
      btn.className = 'extra-import-tipo';
      btn.textContent = tipo;
      btn.title = `Importar ${rast?.itens?.filter(i => !i.separator).length ?? 0} itens de "${tipo}"`;
      btn.addEventListener('click', () => {
        _importarTipo(tipo, op);
        btn.textContent = `✓ ${tipo} importado`;
        btn.style.background = 'var(--ok,#22c55e)'; btn.style.color = '#fff';
        setTimeout(() => { btn.textContent = tipo; btn.style.background = ''; btn.style.color = ''; }, 1800);
      });
      return btn;
    };

    if (usarTodos) {
      // Exibe todos agrupados por operação (ou sem grupo)
      const tiposDiv = document.createElement('div'); tiposDiv.className = 'extra-import-tipos';
      tiposDiv.style.flexWrap = 'wrap';
      todosCheckSheets.forEach(tipo => tiposDiv.appendChild(_mkTipoBtn(tipo, '')));
      importPanel.appendChild(tiposDiv);
    } else {
      opComTipos.forEach(({ op, tipos }) => {
        const opDiv = document.createElement('div'); opDiv.className = 'extra-import-op';
        const opName = document.createElement('div'); opName.className = 'extra-import-op-name'; opName.textContent = op;
        const tiposDiv = document.createElement('div'); tiposDiv.className = 'extra-import-tipos';
        tipos.forEach(tipo => tiposDiv.appendChild(_mkTipoBtn(tipo, op)));
        opDiv.appendChild(opName); opDiv.appendChild(tiposDiv);
        importPanel.appendChild(opDiv);
      });
    }

    this._bodyEl.appendChild(importPanel);

    /* Lista de anexos */
    const anexList = document.createElement('div');
    if (this._data.anexos.length) {
      this._bodyEl.appendChild(this._secTitle('Arquivos Anexados'));
      this._data.anexos.forEach(a => this._appendAnexo(a, anexList));
    }
    this._bodyEl.appendChild(anexList);
  }

  _appendMedRow(item, focus = false) {
    if (!this._tbodyEl) return;
    const tr = document.createElement('tr');

    /* No */
    const tdNo = document.createElement('td');
    tdNo.style.cssText = 'text-align:center;color:var(--text-mute);font-size:11px;';
    tdNo.textContent = item.id;
    tr.appendChild(tdNo);

    /* Helper: célula com input */
    const mkInp = (placeholder, val, cb, cls = '') => {
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'extra-med-inp' + (cls ? ' ' + cls : '');
      inp.placeholder = placeholder;
      inp.value = val ?? '';
      inp.addEventListener('input', () => { cb(inp.value); updateAval(); });
      td.appendChild(inp);
      tr.appendChild(td);
      return inp;
    };

    /* Aval automática — referência antecipada ao td */
    const tdAval = document.createElement('td');
    tdAval.style.textAlign = 'center';

    const updateAval = () => {
      const spec   = this._parseSpec(item.esp);
      const numRes = parseFloat(String(item.resultado).replace(',', '.'));
      let label = '—', cls = 'nd';
      if (spec && !isNaN(numRes)) {
        const r = this._avalResult(spec, [numRes]);
        if (r === 'ok')     { label = 'OK';   cls = 'ok';   }
        else if (r === 'nok')  { label = 'NOK';  cls = 'nok';  }
        else if (r === 'atencao') { label = 'ATEN'; cls = 'aten'; }
      }
      item.aval = label;
      tdAval.innerHTML = `<span class="extra-med-aval extra-med-aval--${cls}">${label}</span>`;
    };

    /* Colunas: Descrição → Especificado → Máq. → Ponto medido → Unid → RESULTADO → (Aval) → Inspetor → del */
    const descInp = mkInp('Descrição do item', item.desc, v => { item.desc = v; });
    mkInp('Ex: ≤ 8 / 25±0,6 / 10–20', item.esp,       v => { item.esp       = v; }, 'extra-med-inp-md');
    mkInp('Equipamento',                item.maq,       v => { item.maq       = v; }, 'extra-med-inp-md');
    mkInp('Ponto / Pos.',               item.ponto,     v => { item.ponto     = v; }, 'extra-med-inp-md');
    mkInp('mm / µm…',                   item.unid,      v => { item.unid      = v; }, 'extra-med-inp-sm');
    mkInp('Valor',                      item.resultado, v => { item.resultado = v; }, 'extra-med-inp-sm');

    /* Aval. automática */
    tr.appendChild(tdAval);
    updateAval(); // inicializa

    mkInp('Inspetor', item.ins, v => { item.ins = v; }, 'extra-med-inp-md');

    /* Delete */
    const tdDel = document.createElement('td'); tdDel.style.textAlign = 'center';
    const del = document.createElement('button'); del.className = 'extra-med-del'; del.textContent = '✕';
    del.addEventListener('click', () => {
      const i = this._data.medicaoItems.indexOf(item);
      if (i > -1) this._data.medicaoItems.splice(i, 1);
      tr.remove(); this._syncEmpty();
    });
    tdDel.appendChild(del); tr.appendChild(tdDel);

    this._tbodyEl.appendChild(tr);
    if (focus) setTimeout(() => descInp.focus(), 40);
  }

  /* ── Parsers de especificação (igual à AnalisePeriodicaPage) ── */
  _parseSpec(esp) {
    if (!esp || typeof esp !== 'string') return null;
    const s = esp.trim().replace(',', '.');
    const rng = s.match(/^([+-]?\d+\.?\d*)\s*(?:[±]|\+\/-)\s*(\d+\.?\d*)$/);
    if (rng) return { t:'range', v:parseFloat(rng[1]), tol:parseFloat(rng[2]) };
    const mm = s.match(/^([+-]?\d+\.?\d*)\s*(?:–|-|~|a)\s*([+-]?\d+\.?\d*)$/i);
    if (mm) return { t:'minmax', min:parseFloat(mm[1]), max:parseFloat(mm[2]) };
    const mx = s.match(/^(?:≤|max\.?|<)\s*([+-]?\d+\.?\d*)$/i);
    if (mx) return { t:'max', v:parseFloat(mx[1]) };
    const mn = s.match(/^(?:≥|min\.?|>)\s*([+-]?\d+\.?\d*)$/i);
    if (mn) return { t:'min', v:parseFloat(mn[1]) };
    const num = s.match(/^([+-]?\d+\.?\d*)$/);
    if (num) return { t:'range', v:parseFloat(num[1]), tol:0 };
    return null;
  }

  _avalResult(spec, vals) {
    if (!spec || !vals.length) return 'nd';
    const numVals = vals.map(v => parseFloat(String(v).replace(',', '.'))).filter(v => !isNaN(v));
    if (!numVals.length) return 'nd';
    let nok = 0, aten = 0;
    numVals.forEach(v => {
      let inRange = false, nearEdge = false;
      if (spec.t === 'range') {
        inRange  = Math.abs(v - spec.v) <= spec.tol;
        nearEdge = Math.abs(v - spec.v) <= spec.tol * 1.1;
      } else if (spec.t === 'minmax') {
        inRange  = v >= spec.min && v <= spec.max;
        const margin = (spec.max - spec.min) * 0.05;
        nearEdge = v >= spec.min - margin && v <= spec.max + margin;
      } else if (spec.t === 'max') {
        inRange  = v <= spec.v;
        nearEdge = v <= spec.v * 1.05;
      } else if (spec.t === 'min') {
        inRange  = v >= spec.v;
        nearEdge = v >= spec.v * 0.95;
      }
      if (!inRange) { if (nearEdge) aten++; else nok++; }
    });
    if (nok > 0) return 'nok';
    if (aten > 0) return 'atencao';
    return 'ok';
  }

  _syncEmpty() {
    if (!this._tbodyEl || !this._emptyMsg) return;
    this._emptyMsg.style.display = this._data.medicaoItems.length > 0 ? 'none' : '';
  }

  _appendAnexo(anx, container) {
    const row = document.createElement('div'); row.className = 'extra-anex-item';
    const icon = document.createElement('span'); icon.textContent = anx.type?.startsWith('image/') ? '🖼' : '📄';
    const name = document.createElement('span'); name.className = 'extra-anex-name'; name.textContent = anx.name;
    const del  = document.createElement('button'); del.className = 'extra-anex-del'; del.textContent = '✕';
    del.addEventListener('click', () => { const i = this._data.anexos.indexOf(anx); if (i > -1) this._data.anexos.splice(i, 1); row.remove(); });
    row.appendChild(icon); row.appendChild(name); row.appendChild(del);
    container.appendChild(row);
  }

  /* ── Passo 7: Conclusão e Avaliação ───────────────────── */
  _renderConclusao() {
    this._bodyEl.appendChild(this._secTitle('5. Conclusão'));
    this._addField({ key:'conclusao', label:'5.1 Conclusão', type:'textarea', placeholder:'Descreva a conclusão desta análise extra...' });

    this._bodyEl.appendChild(this._secTitle('Avaliação Final'));

    const avalGrid = document.createElement('div'); avalGrid.className = 'extra-aval-grid';
    [
      { key:'APROVADO',    label:'O   APROVADO',    cls:'extra-aval-btn--ok'  },
      { key:'REPROVADO',   label:'✕   REPROVADO',   cls:'extra-aval-btn--nok' },
      { key:'INFORMATIVO', label:'ℹ   INFORMATIVO', cls:'extra-aval-btn--inf' },
    ].forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `extra-aval-btn ${opt.cls}${this._data.avaliacao === opt.key ? ' sel' : ''}`;
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        this._data.avaliacao = opt.key;
        avalGrid.querySelectorAll('.extra-aval-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
      avalGrid.appendChild(btn);
    });
    this._bodyEl.appendChild(avalGrid);

    const legenda = document.createElement('p');
    legenda.style.cssText = 'font-size:11px;color:var(--text-mute);';
    legenda.textContent = '* AVALIAÇÃO: APROVADO = O   |   REPROVADO = X';
    this._bodyEl.appendChild(legenda);
  }

  /* ── Passo 8: Assinaturas ──────────────────────────────── */
  _renderConfirmar() {
    const sumGrid = document.createElement('div'); sumGrid.className = 'extra-summary-grid';
    [
      ['Projeto',       this._data.projeto      ?? '—'],
      ['Linha',         this._data.linha         ?? '—'],
      ['Processo',      this._data.processo      ?? '—'],
      ['OP./Atividade', this._data.opAtividade   ?? '—'],
      ['Nº Controle',   String(this._data.controleNo ?? '—')],
      ['REL. No.',      this._data.relNo         ?? '—'],
      ['Part Number',   this._data.partNumber    ?? '—'],
      ['Medições',      `${this._data.medicaoItems?.length ?? 0} itens`],
      ['Avaliação',     this._data.avaliacao     ?? '—'],
    ].forEach(([k, v]) => {
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;';
      const key = document.createElement('span'); key.style.cssText = 'font-weight:600;color:var(--text-mute);white-space:nowrap;'; key.textContent = `${k}:`;
      const val = document.createElement('span'); val.textContent = v;
      if (k === 'Avaliação') { val.style.color = v === 'APROVADO' ? 'var(--ok)' : v === 'REPROVADO' ? 'var(--danger)' : 'var(--accent)'; val.style.fontWeight = '700'; }
      row.appendChild(key); row.appendChild(val); sumGrid.appendChild(row);
    });
    this._bodyEl.appendChild(sumGrid);

    const sigTitle = document.createElement('p');
    sigTitle.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:4px;';
    sigTitle.textContent = 'Cópia Para / Assinaturas';
    this._bodyEl.appendChild(sigTitle);

    const copiaGrid = document.createElement('div'); copiaGrid.className = 'extra-copia-grid';
    [
      { key:'sigSupervisor',  role:'Supervisor'      },
      { key:'sigEncarregado', role:'Encarregado'     },
      { key:'sigLider',       role:'Líder de Equipe'  },
      { key:'sigExecutante',  role:'Executante'      },
    ].forEach(sig => {
      const card    = document.createElement('div'); card.className    = 'extra-copia-card';
      const roleEl  = document.createElement('div'); roleEl.className  = 'extra-copia-role'; roleEl.textContent = sig.role;
      const nameInp = document.createElement('input'); nameInp.type = 'text'; nameInp.className = 'extra-copia-inp'; nameInp.placeholder = 'Nome completo';
      nameInp.value = this._data[sig.key] ?? '';
      nameInp.addEventListener('input', () => { this._data[sig.key] = nameInp.value; });
      const dateInp = document.createElement('input'); dateInp.type = 'date'; dateInp.className = 'extra-copia-date';
      dateInp.value = this._data[`${sig.key}_dt`] ?? new Date().toISOString().split('T')[0];
      dateInp.addEventListener('input', () => { this._data[`${sig.key}_dt`] = dateInp.value; });
      const sigLine = document.createElement('div'); sigLine.className = 'extra-copia-line'; sigLine.textContent = 'Assinatura';
      card.appendChild(roleEl); card.appendChild(nameInp); card.appendChild(dateInp); card.appendChild(sigLine);
      copiaGrid.appendChild(card);
    });
    this._bodyEl.appendChild(copiaGrid);
  }

  /* ── PDF A4 (2 páginas) ────────────────────────────────── */
  _gerarPDF() {
    const d     = this._data;
    const hoje  = d.dataAnalise ? new Date(d.dataAnalise + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const logo  = (document.getElementById('_toyota_logo') || {}).src ?? '';
    const relNo = d.relNo ?? '—';

    const avalCor  = d.avaliacao === 'APROVADO' ? '#16a34a' : d.avaliacao === 'REPROVADO' ? '#dc2626' : '#2563eb';
    const avalSimb = d.avaliacao === 'APROVADO' ? 'O' : d.avaliacao === 'REPROVADO' ? 'X' : 'ℹ';

    const medRows = (d.medicaoItems ?? []).map((item, i) => {
      const aCls = { OK:'ok', NOK:'nok', ATEN:'aten' }[item.aval] ?? '';
      return `<tr><td class="tc">${i+1}</td><td>${item.desc??''}</td><td class="tc">${item.esp??''}</td><td class="tc">${item.resultado??''}</td><td class="tc">${item.unid??''}</td><td class="tc ${aCls}">${item.aval??'—'}</td></tr>`;
    }).join('');

    const copiaHTML = [
      { role:'Supervisor',     name: d.sigSupervisor  ?? '', dt: d.sigSupervisor_dt  ?? '' },
      { role:'Encarregado',    name: d.sigEncarregado ?? '', dt: d.sigEncarregado_dt ?? '' },
      { role:'Líder de Equipe',name: d.sigLider       ?? '', dt: d.sigLider_dt       ?? '' },
      { role:'Executante',     name: d.sigExecutante  ?? '', dt: d.sigExecutante_dt  ?? '' },
    ].map(s => `<div style="border:1px solid #ccc;border-radius:4px;padding:8px;flex:1;">
      <div style="font-size:7pt;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:6px;">${s.role}</div>
      <div style="font-size:10pt;font-weight:600;min-height:18px;">${s.name}</div>
      <div style="font-size:8pt;color:#555;margin-bottom:18px;">${s.dt}</div>
      <div style="border-top:1px solid #333;margin-bottom:3px;"></div>
      <div style="font-size:7pt;color:#888;text-align:center;">Assinatura</div>
    </div>`).join('');

    // Imagem padronizada: max 38mm de altura (~145px) para caber na pág 1 sem sobrescrever
    const _imgMaxH = '38mm';
    const croquiHTML = d.croquiData && d.croquiType?.startsWith('image/')
      ? `<div style="text-align:center;"><img src="${d.croquiData}" style="display:block;margin:0 auto;max-width:92%;max-height:${_imgMaxH};border:1px solid #ccc;border-radius:4px;"></div>`
      : (d.croquiNome ? `<p style="font-size:9pt;color:#555;">📄 ${d.croquiNome}</p>` : '');

    // Anexos da solicitação original no relatório
    const _solAnexArr = d.solAnexos ?? [];
    const _maxHAnex   = _solAnexArr.length > 1 ? '28mm' : '38mm';
    const solAnexosHTML = _solAnexArr.map(a => {
      if (a.type?.startsWith('image/')) {
        return `<div style="text-align:center;margin-bottom:8px;">
          <p style="font-size:8pt;color:#555;margin:0 0 4px;">🖼 ${a.name}</p>
          <img src="${a.data}" style="display:block;margin:0 auto;max-width:92%;max-height:${_maxHAnex};border:1px solid #ccc;border-radius:4px;">
        </div>`;
      }
      return `<p style="font-size:8pt;color:#555;margin:2px 0;text-align:center;">📄 ${a.name}</p>`;
    }).join('');

    const croquiSecHTML = (croquiHTML || solAnexosHTML)
      ? (croquiHTML + (solAnexosHTML ? `<div style="margin-top:6px;"><p style="font-size:8pt;font-weight:700;color:#555;margin-bottom:6px;text-align:center;">Anexos da Solicitação</p>${solAnexosHTML}</div>` : ''))
      : `<p style="font-size:9pt;font-style:italic;color:#aaa;text-align:center;">Sem desenho/croqui.</p>`;

    const imgAnexos = (d.anexos ?? []).filter(a => a.type?.startsWith('image/')).map(a =>
      `<div style="margin-bottom:10px;"><p style="font-size:8pt;color:#555;margin:0 0 3px;">${a.name}</p><img src="${a.data}" style="max-width:100%;max-height:200px;border:1px solid #ccc;border-radius:4px;"></div>`
    ).join('');
    const docAnexos = (d.anexos ?? []).filter(a => !a.type?.startsWith('image/')).map(a =>
      `<p style="font-size:8pt;color:#555;margin:2px 0;">📄 ${a.name}</p>`
    ).join('');

    const logoTag = logo ? `<img src="${logo}" style="width:40px;height:auto;">` : '<div style="width:40px;"></div>';
    const mkHdr = pag => `
      <div style="display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:8px;border-bottom:2.5px solid #1a3a6b;padding-bottom:6px;margin-bottom:10px;">
        <div>${logoTag}</div>
        <div style="text-align:center;">
          <div style="font-size:12pt;font-weight:700;color:#1a3a6b;">TDB - PFZ · RELATÓRIO DE ANÁLISES</div>
          <div style="font-size:8pt;color:#555;">DEPTO. CONTROLE DA QUALIDADE</div>
        </div>
        <div style="text-align:right;font-size:8pt;line-height:1.7;">
          <b style="font-size:9pt;">REL. No. ${relNo}</b><br>
          <span style="font-size:7.5pt;color:#444;">Nº Controle: ${d.controleNo ?? '—'}</span><br>
          DATA: ${hoje}<br>PAG.: ${pag}
        </div>
      </div>`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Análise Extra — ${[d.projeto,d.linha,d.processo].filter(Boolean).join(' - ')}</title>
<style>
  @page{size:A4 portrait;margin:14mm 12mm 18mm 12mm;}
  *{box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:10pt;color:#111;background:#fff;margin:0;padding:0;}
  .ib{background:#f4f6f9;border-radius:4px;padding:7px 10px;margin-bottom:8px;font-size:8.5pt;}
  .ir{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:2px;}
  .il{font-weight:700;color:#555;}
  .sec{margin-bottom:8px;}
  .st{font-size:9pt;font-weight:700;color:#1a3a6b;border-bottom:1px solid #c8d4e8;padding-bottom:2px;margin-bottom:4px;}
  .sb{font-size:9pt;min-height:24px;padding:4px 6px;border:1px solid #e2e8f0;border-radius:3px;background:#fafbfc;}
  .mt{width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:10px;}
  .mt th{background:#f0b429;color:#1a1a1a;font-weight:700;text-align:center;padding:3px 5px;border:1px solid #c89000;}
  .mt td{padding:2px 5px;border:1px solid #ccc;vertical-align:middle;}
  .tc{text-align:center;}
  .ok{color:#16a34a;font-weight:700;}.nok{color:#dc2626;font-weight:700;}.aten{color:#d97706;font-weight:700;}
  .av{border:2px solid ${avalCor};border-radius:6px;padding:8px 16px;display:inline-flex;align-items:center;gap:10px;margin:6px 0;}
  .as{font-size:10pt;font-weight:900;color:${avalCor};}.at{font-size:10pt;font-weight:700;color:${avalCor};}
  .cg{display:flex;gap:8px;margin-top:4px;}
  .pb{page-break-after:always;}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
</style></head><body>

${mkHdr('1 / 2')}

<div class="ib">
  <div class="ir"><span><span class="il">PROJETO:</span> ${d.projeto??'—'}</span><span><span class="il">LINHA:</span> ${d.linha??'—'}</span></div>
  <div class="ir"><span><span class="il">PROCESSO:</span> ${d.processo??'—'}</span><span><span class="il">OP. / ATIVIDADE:</span> ${d.opAtividade??'—'}</span></div>
</div>

<div class="sec"><div class="st">1. HISTÓRICO</div>
  <div class="ir" style="font-size:8.5pt;margin-bottom:6px;">
    <span><span class="il">1.1 Part Number:</span> ${d.partNumber??'—'}</span>
    <span><span class="il">1.2 Part Name:</span> ${d.partName??'—'}</span>
  </div>
  <div style="font-size:8pt;font-weight:700;color:#555;margin-bottom:3px;">1.3 CAUSA:</div>
  <div class="sb">${(d.causa??'').replace(/\n/g,'<br>')||'<em style="color:#aaa">—</em>'}</div>
</div>

<div class="sec"><div class="st">2. OBJETIVO</div>
  <div class="sb">${(d.objetivo??'').replace(/\n/g,'<br>')||'<em style="color:#aaa">—</em>'}</div>
</div>

<div class="sec"><div class="st">3. Desenho / Croqui</div>${croquiSecHTML}</div>

<div class="sec"><div class="st">4. RESULTADO</div>
  <div class="av"><span class="as">${avalSimb}</span><span class="at">${d.avaliacao??'—'}</span></div>
</div>

<div class="sec"><div class="st">5. CONCLUSÃO</div>
  <div class="sb">${(d.conclusao??'').replace(/\n/g,'<br>')||'<em style="color:#aaa">—</em>'}</div>
</div>

<div style="margin-top:10px;border-top:1px solid #ccc;padding-top:6px;">
  <div style="font-size:8pt;font-weight:700;color:#555;margin-bottom:4px;">Cópia para:</div>
  <div class="cg">${copiaHTML}</div>
  <div style="margin-top:6px;font-size:8pt;color:#555;"><b>* AVALIAÇÃO: &nbsp; APROVADO = O &nbsp;&nbsp; REPROVADO = X</b></div>
</div>

<div class="pb"></div>

${mkHdr('2 / 2')}
<div class="st" style="margin-bottom:8px;">6. Resultado Anexado</div>

${d.medicaoItems?.length ? `
<div style="background:#ffc000;color:#1a1a1a;font-size:8.5pt;font-weight:700;padding:4px 8px;letter-spacing:.3px;border-radius:3px 3px 0 0;">
  TABELA DE RESULTADOS — ${d.processo??'Análise Extra'}
</div>
<table class="mt">
  <thead><tr><th>No.</th><th>Descrição</th><th>Especificação</th><th>Resultado</th><th>Unid.</th><th>Aval.</th></tr></thead>
  <tbody>${medRows}</tbody>
</table>` : '<p style="font-size:9pt;font-style:italic;color:#aaa;margin:8px 0;">Nenhum item de medição registrado.</p>'}

${imgAnexos||docAnexos ? `<div class="st" style="margin-top:10px;margin-bottom:6px;">Arquivos Anexados</div>${docAnexos}${imgAnexos}` : ''}

</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Permita pop-ups para gerar o PDF.'); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 600);
  }

  /* ── Helpers ──────────────────────────────────────────── */
  _secTitle(text) {
    const el = document.createElement('div'); el.className = 'extra-sec'; el.textContent = text; return el;
  }

  _makeHint(text) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:12px;color:var(--text-mute);margin:4px 0 12px;';
    p.textContent = text; return p;
  }

  _addField({ key, label, type, placeholder = '' }) {
    const wrap = document.createElement('div'); wrap.className = 'modal__field';
    const lbl  = document.createElement('label'); lbl.className = 'modal__field-label'; lbl.textContent = label; lbl.htmlFor = `mf-${key}`;
    let input;
    if (type === 'textarea') { input = document.createElement('textarea'); input.rows = 3; }
    else { input = document.createElement('input'); input.type = type; }
    input.className = 'modal__field-input';
    if (placeholder) input.placeholder = placeholder;
    input.value = this._data[key] ?? '';
    input.id = `mf-${key}`;
    input.addEventListener('input',  () => { this._data[key] = input.value; });
    input.addEventListener('change', () => { this._data[key] = input.value; });
    wrap.appendChild(lbl); wrap.appendChild(input); this._bodyEl.appendChild(wrap);
  }

  /* ── Atender uma solicitação pendente ──────────────────── */
  _atenderSolicitacao(sol) {
    // Pre-preenche dados a partir da solicitação
    this._data.solicitacaoId = sol.id;
    this._data.projeto       = sol.projeto    ?? null;
    this._data.linha         = sol.linha      ?? null;
    this._data.processo      = sol.processo   ?? '';
    this._data.opAtividade   = sol.operacao   ?? '';
    this._data.partNumber    = sol.partNo     ?? '';
    this._data.partName      = sol.partName   ?? '';
    this._data.causa         = sol.objetivo   ?? sol.conteudo ?? '';
    this._data.solAnexos     = sol.anexos     ?? [];   // anexos da solicitação

    // Vai direto para Identificação (passo 3, índice 2) pulando projeto/linha
    this._stepIdx = 2;
    this._renderStep();

    // Fecha histórico se estiver aberto
    this._fecharHistorico();
  }

  /* ── Painel de histórico ─────────────────────────────── */
  async _mostrarHistorico() {
    if (!this._histPanel) return;
    this._histPanel.innerHTML = '';

    /* Cabeçalho */
    const head = document.createElement('div'); head.className = 'extra-hist__head';
    const title = document.createElement('div'); title.className = 'extra-hist__title';
    title.textContent = '📋 Histórico de Análises Extras';
    const closeBtn = document.createElement('button'); closeBtn.className = 'extra-hist__close';
    closeBtn.textContent = '✕ Fechar';
    closeBtn.addEventListener('click', () => this._fecharHistorico());
    head.appendChild(title); head.appendChild(closeBtn);
    this._histPanel.appendChild(head);

    /* Body */
    const body = document.createElement('div'); body.className = 'extra-hist__body';
    const inner = document.createElement('div'); inner.className = 'extra-hist__inner';

    // Loading
    inner.textContent = 'Carregando...';
    body.appendChild(inner); this._histPanel.appendChild(body);
    this._histPanel.style.display = 'flex';
    this._histPanel.style.flexDirection = 'column';

    /* ── Helpers de exclusão ────────────────────────────── */
    const HIDDEN_KEY = 'metrologia_hist_ocultos';
    const _hiddenSet = () => new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]'));
    const _addHidden = (id) => {
      const s = _hiddenSet(); s.add((id ?? '').toLowerCase());
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...s]));
    };
    const _deleteLocal = (sol) => {
      const KEY = 'metrologia_analise_extra_index';
      const idx = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const relNo  = sol.relNoConclusao;
      const ctrlNo = sol.id?.replace('CTRL-', '');
      const filtered = idx.filter(x => {
        if (relNo   && x.relNo === relNo)                   return false;
        if (ctrlNo  && String(x.controleNo) === String(ctrlNo)) return false;
        return true;
      });
      localStorage.setItem(KEY, JSON.stringify(filtered));
    };

    let todos = [];
    try {
      const res = await fetch('/api/historico');
      if (res.ok) todos = await res.json();
    } catch { todos = []; }

    /* Filtra entradas manualmente ocultadas pelo usuário */
    const hidden = _hiddenSet();
    todos = todos.filter(s => !hidden.has((s.id ?? '').toLowerCase()));

    /* Adiciona registros do localStorage (análises realizadas) como "concluídas" */
    const idxLocal = this._loadIndex();
    const localConcluidas = idxLocal.map(r => ({
      id:             `CTRL-${r.controleNo}`,
      titulo:         r.processo || r.partName || 'Análise Extra',
      projeto:        r.projeto  ?? '',
      linha:          r.linha    ?? '',
      partName:       r.partName ?? '',
      processo:       r.processo ?? '',
      objetivo:       r.objetivo ?? '',
      avaliacao:      r.avaliacao ?? '—',
      status:         'concluida',
      relNoConclusao: r.relNo    ?? '',
      dataConclusao:  r.data ? r.data + 'T12:00:00' : '',
      timestamp:      r.timestamp ?? '',
      _local:         true,
    }));
    // Merge: API concluidas + localStorage (sem duplicar por relNoConclusao)
    const apiRelNos = new Set(todos.filter(s => s.relNoConclusao).map(s => s.relNoConclusao));
    const localNovos = localConcluidas.filter(r => !apiRelNos.has(r.relNoConclusao));
    todos = [...todos, ...localNovos];

    inner.innerHTML = '';
    const pendentes  = todos.filter(s => s.status === 'pendente');
    const concluidas = todos.filter(s => s.status === 'concluida')
      .sort((a, b) => (b.dataConclusao ?? b.timestamp ?? '').localeCompare(a.dataConclusao ?? a.timestamp ?? ''));

    const mkCard = (sol) => {
      const card = document.createElement('div');
      card.className = `extra-hist__card extra-hist__card--${sol.status}`;

      const idEl = document.createElement('div'); idEl.className = 'extra-hist__id';
      idEl.textContent = sol.id?.toUpperCase() ?? '—';

      const info = document.createElement('div'); info.className = 'extra-hist__info';

      // Título
      const h4 = document.createElement('h4'); h4.textContent = sol.titulo ?? '—';
      info.appendChild(h4);

      // Projeto / Linha · Part No · Part Name
      const p1 = document.createElement('p');
      const projLinha = [sol.projeto, sol.linha].filter(Boolean).join(' › ');
      const partInfo  = [sol.partNo, sol.partName].filter(Boolean).join(' · ');
      p1.textContent = [projLinha, partInfo].filter(Boolean).join(' · ') || '—';
      info.appendChild(p1);

      // Processo / Operação
      const procOp = [sol.processo, sol.operacao].filter(Boolean).join(' / ');
      if (procOp) {
        const p2 = document.createElement('p');
        p2.textContent = `Processo: ${procOp}`;
        info.appendChild(p2);
      }

      // Solicitante · Depto · Data  (ou Data de análise para registros locais)
      const tsRef = sol.dataConclusao || sol.timestamp;
      const ts = tsRef?.slice(0,10).split('-').reverse().join('/') ?? '—';
      const p3 = document.createElement('p');
      if (sol._local) {
        const avalCor = { APROVADO:'var(--ok,#22c55e)', REPROVADO:'var(--danger,#ef4757)', INFORMATIVO:'var(--accent,#4ea3ff)' }[sol.avaliacao] ?? '';
        p3.innerHTML = `${ts}${sol.avaliacao && sol.avaliacao !== '—' ? ` · <span style="font-weight:700;color:${avalCor}">${sol.avaliacao}</span>` : ''}`;
      } else {
        p3.textContent = [sol.solicitante, sol.depto, ts].filter(Boolean).join(' · ');
      }
      info.appendChild(p3);

      // Motivos (só para registros de API)
      if (!sol._local) {
        const p4 = document.createElement('p');
        p4.textContent = `Motivos: ${(sol.motivos ?? []).join(', ') || '—'}`;
        info.appendChild(p4);
      }

      // Conteúdo a avaliar
      const conteudo = sol.conteudo || sol.objetivo;
      if (conteudo) {
        const p5 = document.createElement('p');
        p5.style.cssText = 'margin-top:4px;padding-top:4px;border-top:1px solid var(--border);font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
        p5.textContent = conteudo;
        info.appendChild(p5);
      }

      // Anexos
      if (sol.anexos?.length) {
        const anexRow = document.createElement('div');
        anexRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border);';
        sol.anexos.forEach(a => {
          const icon = a.type?.includes('pdf') ? '📄' : a.type?.startsWith('image/') ? '🖼' : '📎';
          const link = document.createElement('a'); link.className = 'extra-pend-anexo';
          link.href = a.data; link.download = a.name; link.title = a.name;
          link.innerHTML = `${icon} ${a.name}`;
          anexRow.appendChild(link);
        });
        info.appendChild(anexRow);
      }

      const meta = document.createElement('div'); meta.className = 'extra-hist__meta';
      const stEl = document.createElement('div');
      stEl.className = `extra-hist__status extra-hist__status--${sol.status}`;
      stEl.textContent = sol.status === 'pendente' ? '● Pendente' : '✓ Concluída';
      meta.appendChild(stEl);

      if (sol.status === 'pendente') {
        if (sol.urgencia === 'urgente') {
          const urg = document.createElement('div'); urg.className = 'extra-hist__urgente';
          urg.textContent = '🚨 URGENTE'; meta.appendChild(urg);
        }
        const atBtn = document.createElement('button'); atBtn.className = 'extra-hist__atender';
        atBtn.innerHTML = 'Atender →';
        atBtn.addEventListener('click', () => this._atenderSolicitacao(sol));
        meta.appendChild(atBtn);
      } else {
        if (sol.relNoConclusao) {
          const rel = document.createElement('div');
          rel.style.cssText = 'font-size:10px;color:var(--accent,#4ea3ff);margin-top:4px;font-weight:700;';
          rel.textContent = `REL. ${sol.relNoConclusao}`;
          meta.appendChild(rel);
        }
        if (sol.dataConclusao) {
          const dc = document.createElement('div');
          dc.style.cssText = 'font-size:9px;color:var(--text-mute);margin-top:3px;';
          dc.textContent = sol.dataConclusao.slice(0,10).split('-').reverse().join('/');
          meta.appendChild(dc);
        }
      }

      /* ── Botão de exclusão ── */
      const delBtn = document.createElement('button');
      delBtn.className = 'extra-hist__del-btn';
      delBtn.innerHTML = '🗑';
      delBtn.title = 'Remover do histórico';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Confirmação inline no card
        const confirm = document.createElement('div');
        confirm.className = 'extra-hist__del-confirm';
        confirm.innerHTML = `
          <span>Remover esta análise do histórico?</span>
          <button class="extra-hist__del-yes">Sim, remover</button>
          <button class="extra-hist__del-no">Cancelar</button>
        `;
        card.appendChild(confirm);
        delBtn.disabled = true;

        confirm.querySelector('.extra-hist__del-no').addEventListener('click', () => {
          confirm.remove();
          delBtn.disabled = false;
        });

        confirm.querySelector('.extra-hist__del-yes').addEventListener('click', () => {
          // Remove da fonte correta
          if (sol._local) {
            _deleteLocal(sol);
          } else {
            _addHidden(sol.id);
          }
          // Remove dos arrays em memória e re-renderiza
          const pIdx = pendentes.findIndex(x => x.id === sol.id);
          if (pIdx !== -1) pendentes.splice(pIdx, 1);
          const cIdx = concluidas.findIndex(x => x.id === sol.id);
          if (cIdx !== -1) concluidas.splice(cIdx, 1);
          card.style.cssText = 'transition:opacity .2s,max-height .25s;opacity:0;max-height:0;overflow:hidden;margin:0;padding:0;border:none;';
          setTimeout(() => renderList(searchInp.value.trim()), 250);
        });
      });

      meta.appendChild(delBtn);
      card.appendChild(idEl); card.appendChild(info); card.appendChild(meta);
      return card;
    };

    /* Barra de busca (útil com muitos registros) */
    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'margin-bottom:14px;';
    const searchInp = document.createElement('input');
    searchInp.type = 'text';
    searchInp.placeholder = '🔍  Buscar por REL, projeto, part, solicitante, processo...';
    searchInp.style.cssText = 'width:100%;background:var(--surface);border:1px solid var(--border);border-radius:7px;padding:8px 12px;color:var(--text);font-size:12px;';
    searchWrap.appendChild(searchInp);
    inner.appendChild(searchWrap);

    const listContainer = document.createElement('div');
    inner.appendChild(listContainer);

    const renderList = (q) => {
      listContainer.innerHTML = '';
      const qL = q.toLowerCase();
      const match = s => !q ||
        (s.titulo  ?? '').toLowerCase().includes(qL) ||
        (s.processo ?? '').toLowerCase().includes(qL) ||
        (s.relNoConclusao ?? '').toLowerCase().includes(qL) ||
        (s.relNo ?? '').toLowerCase().includes(qL) ||
        (s.projeto ?? '').toLowerCase().includes(qL) ||
        (s.linha ?? '').toLowerCase().includes(qL) ||
        (s.partNo ?? '').toLowerCase().includes(qL) ||
        (s.partName ?? '').toLowerCase().includes(qL) ||
        (s.solicitante ?? '').toLowerCase().includes(qL) ||
        (s.operacao ?? '').toLowerCase().includes(qL) ||
        (s.objetivo ?? '').toLowerCase().includes(qL);

      const filtPend  = pendentes.filter(match);
      const filtConc  = concluidas.filter(match);

      if (filtPend.length) {
        const sec = document.createElement('div'); sec.className = 'extra-hist__sec';
        sec.textContent = `⏳ Pendentes (${filtPend.length})`;
        listContainer.appendChild(sec);
        filtPend.forEach(s => listContainer.appendChild(mkCard(s)));
      }

      if (filtConc.length) {
        const sec = document.createElement('div'); sec.className = 'extra-hist__sec';
        sec.textContent = `✅ Concluídas (${filtConc.length})`;
        listContainer.appendChild(sec);
        filtConc.forEach(s => listContainer.appendChild(mkCard(s)));
      }

      if (!filtPend.length && !filtConc.length) {
        const empty = document.createElement('div'); empty.className = 'extra-hist__empty';
        empty.textContent = q ? 'Nenhum resultado para a busca.' : 'Nenhuma análise encontrada.';
        listContainer.appendChild(empty);
      }
    };

    searchInp.addEventListener('input', () => renderList(searchInp.value.trim()));
    renderList('');
  }

  _fecharHistorico() {
    if (this._histPanel) this._histPanel.style.display = 'none';
  }

  /* ── Submit ──────────────────────────────────────────── */
  _submit() {
    this._data.timestamp = new Date().toISOString();

    /* Consome os dois contadores (incrementa e persiste) */
    this._consumeControleNo();
    this._consumeRelNo();

    /* Salva no índice localStorage */
    this._saveToIndex({
      controleNo:   this._data.controleNo ?? '',
      relNo:        this._data.relNo      ?? '',
      projeto:      this._data.projeto    ?? '',
      linha:        this._data.linha      ?? '',
      processo:     this._data.processo   ?? '',
      data:         this._data.dataAnalise ?? new Date().toISOString().split('T')[0],
      avaliacao:    this._data.avaliacao  ?? '—',
      timestamp:    this._data.timestamp,
      medicaoItems: (this._data.medicaoItems ?? []).map(it => ({
        desc: it.desc ?? '', maq: (it.maq ?? '').trim().toUpperCase(), aval: it.aval ?? '—',
      })),
    });

    /* Se estava atendendo uma solicitação, arquiva ela no servidor */
    if (this._data.solicitacaoId) {
      adminFetch(`/api/solicitacoes/${this._data.solicitacaoId}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ relNo: this._data.relNo }),
      }).catch(() => {});
    }

    this._bus.emit('analise-extra:submit', this._data);
    this._bus.emit('solicitacoes:refresh');   // atualiza badge/ticker
    this.close();
    const partes = [this._data.relNo, this._data.projeto, this._data.linha].filter(Boolean);
    const toast = document.createElement('div'); toast.className = 'toast toast--ok show';
    toast.textContent = `✓ Análise Extra ${partes.join(' · ')} registrada`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
  }
}
