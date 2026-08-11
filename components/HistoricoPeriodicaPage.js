/**
 * HistoricoPeriodicaPage.js — Página de consulta do histórico de Análises Periódicas
 * Dashboard Metrologia — Painel de Controle
 *
 * Fonte de dados:
 *   1. Servidor  → GET /api/periodica (persiste ao transferir a pasta)
 *   2. localStorage 'metrologia_periodica_hist' (fallback offline)
 * Faz merge das duas fontes deduplicando por timestamp (campo `ts`).
 */

const LOCAL_KEY = 'metrologia_periodica_hist';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export class HistoricoPeriodicaPage {
  constructor(cfg, bus) {
    this._cfg  = cfg;
    this._bus  = bus;
    this._page = null;
    this._tbody = null;
    this._registros = [];
    this._init();
  }

  /* ── Bootstrap ─────────────────────────────────────────── */
  _init() {
    const page = document.createElement('div');
    page.id = 'hist-periodica-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .hp-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: var(--surface,#111c2e);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
        }
        .hp-back {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: border-color .15s;
          flex-shrink: 0; white-space: nowrap;
        }
        .hp-back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .hp-title { font-size: 15px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hp-refresh {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer; transition: border-color .15s;
        }
        .hp-refresh:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }

        .hp-wrap { max-width: 1100px; margin: 24px auto; padding: 0 20px 40px; }

        /* KPIs resumo */
        .hp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 720px) { .hp-kpis { grid-template-columns: repeat(2, 1fr); } }
        .hp-kpi {
          background: var(--surface,#111c2e); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px;
        }
        .hp-kpi__val { font-size: 24px; font-weight: 900; line-height: 1; }
        .hp-kpi__lbl { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: var(--text-mute); margin-top: 6px; }

        /* Toolbar de filtros */
        .hp-toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; align-items: center; }
        .hp-search {
          flex: 1; min-width: 200px;
          background: var(--surface,#111c2e); border: 1px solid var(--border); border-radius: 7px;
          padding: 9px 12px; color: var(--text); font-size: 13px;
        }
        .hp-search:focus { outline: none; border-color: var(--accent,#4ea3ff); }
        .hp-select {
          background: var(--surface,#111c2e); border: 1px solid var(--border); border-radius: 7px;
          padding: 9px 12px; color: var(--text); font-size: 13px; cursor: pointer;
        }
        .hp-select:focus { outline: none; border-color: var(--accent,#4ea3ff); }
        .hp-export {
          padding: 9px 16px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s;
        }
        .hp-export:hover { opacity: .85; }

        .hp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .hp-table thead tr { background: #f5d800; color: #1a1200; }
        .hp-table thead th {
          padding: 9px 12px; font-weight: 900; font-size: 11px;
          text-transform: uppercase; letter-spacing: .4px; text-align: left;
          border: 1px solid #c8a000; white-space: nowrap;
        }
        .hp-table tbody tr { border-bottom: 1px solid var(--border); transition: background .12s; }
        .hp-table tbody tr:hover { background: rgba(78,163,255,.06); }
        .hp-table tbody td { padding: 8px 12px; vertical-align: middle; color: var(--text); }

        .hp-status { display: inline-block; padding: 2px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 700; white-space: nowrap; }
        .hp-status--ok  { background: rgba(34,197,94,.15);  color: var(--ok,#22c55e); }
        .hp-status--nok { background: rgba(239,71,87,.15);  color: var(--danger,#ef4757); }
        .hp-status--na  { background: rgba(148,163,184,.15); color: var(--text-mute); }

        .hp-turno { display: inline-block; padding: 2px 8px; border-radius: 5px; font-size: 10.5px; font-weight: 700; background: var(--panel-2,#182338); border: 1px solid var(--border); }

        .hp-empty { text-align: center; color: var(--text-mute); padding: 50px 0; font-size: 13px; font-style: italic; }
      </style>

      <div class="hp-topbar">
        <button class="hp-back" id="hp-back-btn">← Voltar ao Dashboard</button>
        <div class="hp-title">📈 Histórico de Análises Periódicas</div>
        <button class="hp-refresh" id="hp-refresh-btn">🔄 Atualizar</button>
      </div>

      <div class="hp-wrap">
        <div class="hp-kpis" id="hp-kpis"></div>

        <div class="hp-toolbar">
          <input class="hp-search" id="hp-search" type="text" placeholder="🔍  Buscar por tipo, operação, projeto, operador..." />
          <select class="hp-select" id="hp-filter-status">
            <option value="">Todos os status</option>
            <option value="Conforme">Conforme</option>
            <option value="Não Conforme">Não Conforme</option>
            <option value="__sem">Sem avaliação</option>
          </select>
          <select class="hp-select" id="hp-filter-mes">
            <option value="">Todos os meses</option>
          </select>
          <button class="hp-export" id="hp-export-btn">⬇ Exportar CSV</button>
        </div>

        <table class="hp-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Turno</th>
              <th>Projeto</th>
              <th>Linha</th>
              <th>Operação</th>
              <th>Tipo de Medição</th>
              <th>Peça / Nº Order</th>
              <th>Operador</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="hp-tbody"></tbody>
        </table>
        <div id="hp-empty" class="hp-empty" style="display:none;">Nenhum registro de análise periódica encontrado.</div>
      </div>
    `;

    document.body.appendChild(page);
    this._page  = page;
    this._tbody = page.querySelector('#hp-tbody');
    this._emptyEl = page.querySelector('#hp-empty');

    page.querySelector('#hp-back-btn').addEventListener('click', () => {
      this.hide();
      this._bus.emit('nav:change', { page: 'dashboard' });
    });
    page.querySelector('#hp-refresh-btn').addEventListener('click', () => this._reload());
    page.querySelector('#hp-export-btn').addEventListener('click', () => this._exportCSV());

    ['#hp-search', '#hp-filter-status', '#hp-filter-mes'].forEach(sel => {
      page.querySelector(sel).addEventListener('input', () => this._renderTable());
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._page?.style.display !== 'none') {
        this.hide();
        this._bus.emit('nav:change', { page: 'dashboard' });
      }
    });
  }

  /* ── Público ───────────────────────────────────────────── */
  async show() {
    this._page.style.display = '';
    document.body.style.overflow = 'hidden';
    await this._reload();
  }

  hide() {
    this._page.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Dados ─────────────────────────────────────────────── */
  async _reload() {
    this._registros = await this._loadMerged();
    this._registros.sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''));
    this._populateMesFilter();
    this._renderKpis();
    this._renderTable();
  }

  async _loadMerged() {
    // 1. Servidor
    let serverHist = [];
    try {
      const res = await fetch('/api/periodica', { cache: 'no-store' });
      if (res.ok) {
        const arr = await res.json();
        if (Array.isArray(arr)) serverHist = arr;
      }
    } catch { /* servidor indisponível — usa só localStorage */ }

    // 2. localStorage
    let localHist = [];
    try { localHist = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); }
    catch { /* silencioso */ }

    // Merge deduplicando por ts
    const serverTs = new Set(serverHist.map(e => e.ts));
    return [...serverHist, ...localHist.filter(e => !serverTs.has(e.ts))];
  }

  _mesLabel(ts) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '—';
    return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
  }

  _populateMesFilter() {
    const sel = this._page.querySelector('#hp-filter-mes');
    const atual = sel.value;
    const meses = [...new Set(this._registros.map(r => this._mesLabel(r.ts)).filter(m => m !== '—'))];
    sel.innerHTML = '<option value="">Todos os meses</option>' +
      meses.map(m => `<option value="${m}">${m}</option>`).join('');
    sel.value = atual;
  }

  /* ── KPIs resumo ───────────────────────────────────────── */
  _renderKpis() {
    const total = this._registros.length;
    const conf  = this._registros.filter(r => r.status === 'Conforme').length;
    const nok   = this._registros.filter(r => r.status === 'Não Conforme').length;
    const pct   = (conf + nok) ? Math.round((conf / (conf + nok)) * 100) : 0;

    const kpis = [
      { val: total, lbl: 'Total de Análises', color: 'var(--accent,#4ea3ff)' },
      { val: conf,  lbl: 'Conformes',          color: 'var(--ok,#22c55e)' },
      { val: nok,   lbl: 'Não Conformes',      color: 'var(--danger,#ef4757)' },
      { val: `${pct}%`, lbl: 'Taxa de Conformidade', color: 'var(--info,#38bdf8)' },
    ];

    this._page.querySelector('#hp-kpis').innerHTML = kpis.map(k => `
      <div class="hp-kpi">
        <div class="hp-kpi__val" style="color:${k.color};">${k.val}</div>
        <div class="hp-kpi__lbl">${k.lbl}</div>
      </div>
    `).join('');
  }

  /* ── Tabela ────────────────────────────────────────────── */
  _filtered() {
    const q      = this._page.querySelector('#hp-search').value.trim().toLowerCase();
    const status = this._page.querySelector('#hp-filter-status').value;
    const mes    = this._page.querySelector('#hp-filter-mes').value;

    return this._registros.filter(r => {
      if (mes && this._mesLabel(r.ts) !== mes) return false;
      if (status === '__sem') { if (r.status) return false; }
      else if (status && r.status !== status) return false;

      if (!q) return true;
      const blob = [r.tipo, r.operacao, r.projeto, r.linha, r.operador, r.pecaNome, r.nrOrder]
        .map(v => String(v ?? '').toLowerCase()).join(' ');
      return blob.includes(q);
    });
  }

  _renderTable() {
    const regs = this._filtered();
    this._tbody.innerHTML = '';

    if (!regs.length) {
      this._emptyEl.style.display = '';
      this._emptyEl.textContent = this._registros.length
        ? 'Nenhum registro corresponde aos filtros.'
        : 'Nenhum registro de análise periódica encontrado.';
      return;
    }
    this._emptyEl.style.display = 'none';

    regs.forEach(r => {
      const tr = document.createElement('tr');

      const data = r.dataAnalise
        ? r.dataAnalise.split('-').reverse().join('/')
        : (r.ts ? new Date(r.ts).toLocaleDateString('pt-BR') : '—');

      const statusCls = r.status === 'Conforme' ? 'ok'
                      : r.status === 'Não Conforme' ? 'nok' : 'na';
      const statusTxt = r.status || 'Sem avaliação';

      const peca = [r.pecaNome, r.nrOrder].filter(Boolean).join(' · ') || '—';

      tr.innerHTML = `
        <td>${data}</td>
        <td><span class="hp-turno">T${r.turno ?? 1}</span></td>
        <td>${this._esc(r.projeto) || '—'}</td>
        <td>${this._esc(r.linha) || '—'}</td>
        <td>${this._esc(r.operacao) || '—'}</td>
        <td>${this._esc(r.tipo) || '—'}</td>
        <td>${this._esc(peca)}</td>
        <td>${this._esc(r.operador) || '—'}</td>
        <td><span class="hp-status hp-status--${statusCls}">${statusTxt}</span></td>
      `;
      this._tbody.appendChild(tr);
    });
  }

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  /* ── Exportação CSV ────────────────────────────────────── */
  _exportCSV() {
    const regs = this._filtered();
    if (!regs.length) { alert('Nenhum registro para exportar.'); return; }

    const headers = ['Data', 'Turno', 'Projeto', 'Linha', 'Operação', 'Tipo de Medição', 'Peça', 'Nº Order', 'Operador', 'Status'];
    const linhas = regs.map(r => {
      const data = r.dataAnalise
        ? r.dataAnalise.split('-').reverse().join('/')
        : (r.ts ? new Date(r.ts).toLocaleDateString('pt-BR') : '');
      return [
        data, `T${r.turno ?? 1}`, r.projeto ?? '', r.linha ?? '',
        r.operacao ?? '', r.tipo ?? '', r.pecaNome ?? '', r.nrOrder ?? '',
        r.operador ?? '', r.status || 'Sem avaliação',
      ];
    });

    const csv = [headers, ...linhas]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    // BOM para Excel reconhecer UTF-8
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `historico-periodica-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
