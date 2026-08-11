/**
 * ChartPanel.js — Painéis de Gráficos
 * Dashboard Metrologia — Painel de Controle
 *
 * Layout idêntico ao original:
 *  Row 1: Medições por Mês (barras agrupadas) | Cronograma (mini widget)
 *  Row 2: Por Equipamento | Por Problema | Por Ocorrência (barras horiz.)
 */

import { adminFetch } from '../js/utils.js';

export class ChartPanel {
  constructor(container, cfg, bus) {
    this._el  = container;
    this._cfg = cfg;
    this._bus = bus;
    this._data = null;
  }

  render(data) {
    this._data = data;
    this._el.innerHTML = '';
    this._el.className = 'content';

    // Row 1: gráfico de barras + widget cronograma
    const row1 = this._row('chart-row chart-row--2col-wide');
    row1.appendChild(this._buildMedicoesMes(data));
    const cronoWidget = this._buildCronogramaWidget();
    this._cronoWidgetBody = cronoWidget.querySelector('.panel__body');
    row1.appendChild(cronoWidget);
    this._el.appendChild(row1);

    // Row 2: equipamentos (único painel)
    const row2 = this._row('chart-row chart-row--1col');
    row2.appendChild(this._buildEquipamentos(data));
    this._el.appendChild(row2);
  }

  update(data) { this.render(data); }
  setCurrentPage() {}

  /** Atualiza apenas o widget do cronograma (chamado após cronograma:saved) */
  refreshCronograma() {
    if (!this._cronoWidgetBody) return;
    this._loadCronogramaInto(this._cronoWidgetBody);
  }

  /* ------------------------------------------------------------------ */

  _row(cls) {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  }

  _panel(title, chipLabel, chipColor) {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const head = document.createElement('div');
    head.className = 'panel__head';

    const t = document.createElement('div');
    t.className   = 'panel__title';
    t.textContent = title;
    head.appendChild(t);

    if (chipLabel) {
      const chip = document.createElement('span');
      chip.className = `panel__chip panel__chip--${chipColor ?? 'info'}`;
      chip.textContent = chipLabel;
      head.appendChild(chip);
    }

    panel.appendChild(head);

    const body = document.createElement('div');
    body.className = 'panel__body';
    panel.appendChild(body);

    return { panel, body };
  }

  /* ---------- Medições por Mês ---------- */
  _buildMedicoesMes(data) {
    const { panel, body } = this._panel('Análises Dimensionais');
    const head = panel.querySelector('.panel__head');

    // Toggle Todos / CHS / HEAD
    const toggleWrap = document.createElement('div');
    toggleWrap.style.cssText = 'display:flex;gap:4px;margin-left:auto;';
    let activeFilter = 'todos';
    [{ id:'todos', label:'Todos' }, { id:'chs', label:'CHS' }, { id:'head', label:'HEAD' }].forEach(item => {
      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.dataset.id  = item.id;
      const sel = item.id === 'todos';
      btn.style.cssText = 'padding:3px 10px;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;border:1px solid '
        + (sel ? 'var(--accent,#4ea3ff)' : 'var(--border)') + ';background:'
        + (sel ? 'var(--accent,#4ea3ff)' : 'transparent') + ';color:' + (sel ? '#fff' : 'var(--text-dim)') + ';';
      btn.addEventListener('click', () => {
        activeFilter = item.id;
        toggleWrap.querySelectorAll('button').forEach(b => {
          const on = b.dataset.id === activeFilter;
          b.style.background  = on ? 'var(--accent,#4ea3ff)' : 'transparent';
          b.style.color       = on ? '#fff' : 'var(--text-dim)';
          b.style.borderColor = on ? 'var(--accent,#4ea3ff)' : 'var(--border)';
        });
        drawBars(item.id);   // redesenha com o filtro selecionado
      });
      toggleWrap.appendChild(btn);
    });
    head.appendChild(toggleWrap);

    // Botão Editar
    const editBtn = document.createElement('button');
    editBtn.title = 'Editar dados mensais';
    editBtn.style.cssText = 'margin-left:8px;background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:5px;padding:3px 9px;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .15s;';
    editBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Editar';
    editBtn.onmouseover = () => { editBtn.style.borderColor = 'var(--accent)'; editBtn.style.color = 'var(--accent)'; };
    editBtn.onmouseout  = () => { editBtn.style.borderColor = 'var(--border)'; editBtn.style.color = 'var(--text-dim)'; };
    // Edita a BASE do mock (sem histórico/extras aplicados) p/ não dobrar contagem
    editBtn.addEventListener('click', () => this._openMedicoesMesModal(data.medicoesBase ?? data.medicoesPorMes ?? []));
    head.appendChild(editBtn);

    // Legenda
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML = '<span class="chart-legend__dot" style="background:#22c55e"></span><span>Conformes (OK)</span>'
      + '<span class="chart-legend__dot" style="background:#ef4757;margin-left:1rem"></span><span>Não Conformes (NG)</span>';
    panel.insertBefore(legend, body);

    body.style.height     = '320px';
    body.style.minHeight  = '320px';
    body.style.paddingTop = '8px';

    const drawBars = (filter) => {
      body.innerHTML = '';
      this._renderGroupedBars(body, data.medicoesPorMes ?? [], filter ?? activeFilter ?? 'todos');
    };

    // Desenho síncrono imediato (usa fallback de largura) — garante que o
    // gráfico apareça no load mesmo com re-renders rápidos; o rAF redesenha
    // com a largura real e o ResizeObserver cobre mudanças de layout.
    drawBars('todos');
    requestAnimationFrame(() => {
      drawBars('todos');
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (body.clientWidth > 50) { ro.disconnect(); drawBars(); }
        });
        ro.observe(body);
      }
    });

    return panel;
  }

  /* ---------- Modal de Edição — Medições por Mês ---------- */
  _openMedicoesMesModal(meses) {
    if (!document.getElementById('_med_modal_css')) {
      const s = document.createElement('style');
      s.id = '_med_modal_css';
      s.textContent = [
        '.med-overlay{position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;}',
        '.med-box{background:var(--panel);border:1px solid var(--border);border-radius:10px;width:min(640px,95vw);max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.5);animation:med-pop .17s ease;}',
        '@keyframes med-pop{from{transform:scale(.93);opacity:0}to{transform:none;opacity:1}}',
        '.med-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);flex-shrink:0;}',
        '.med-hdr h3{margin:0;font-size:14px;font-weight:700;}',
        '.med-close{background:none;border:none;color:var(--text-mute);font-size:20px;cursor:pointer;padding:2px 6px;}',
        '.med-close:hover{color:var(--text);}',
        '.med-body{flex:1;overflow-y:auto;padding:14px 18px;}',
        '.med-sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-mute);padding:8px 0 4px;margin-top:8px;border-top:1px solid var(--border);}',
        '.med-sec-title:first-child{margin-top:0;border-top:none;padding-top:0;}',
        '.med-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:2px;}',
        '.med-table th{background:var(--panel-2);color:var(--text-mute);font-weight:600;padding:6px 10px;text-align:center;border:1px solid var(--border);font-size:11px;}',
        '.med-table th:first-child{text-align:left;}',
        '.med-table td{border:1px solid var(--border);padding:4px 6px;}',
        '.med-table tr:nth-child(even) td{background:rgba(255,255,255,0.02);}',
        '.med-td-mes{font-weight:700;color:var(--text);padding-left:10px !important;}',
        '.med-input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px 7px;font-size:12px;text-align:center;box-sizing:border-box;}',
        '.med-input:focus{outline:none;}',
        '.med-input--ok:focus{border-color:#22c55e;}',
        '.med-input--ng:focus{border-color:#ef4757;}',
        '.med-foot{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--border);flex-shrink:0;}',
        '.med-btn-save{background:var(--accent);color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;}',
        '.med-btn-save:hover{opacity:.88;}',
        '.med-btn-cancel{background:var(--panel-2);color:var(--text-mute);border:1px solid var(--border);padding:7px 14px;border-radius:6px;font-size:12px;cursor:pointer;}',
        '.med-btn-cancel:hover{color:var(--text);}',
      ].join('');
      document.head.appendChild(s);
    }

    const draft = JSON.parse(JSON.stringify(meses));
    const overlay = document.createElement('div');
    overlay.className = 'med-overlay';
    const box = document.createElement('div');
    box.className = 'med-box';

    const hdr = document.createElement('div');
    hdr.className = 'med-hdr';
    hdr.innerHTML = '<h3>&#128202; Editar &#8212; Análises Dimensionais</h3>';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'med-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => overlay.remove());
    hdr.appendChild(closeBtn);
    box.appendChild(hdr);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'med-body';

    const buildSection = (title, fields) => {
      const sec = document.createElement('div');
      sec.className = 'med-sec-title';
      sec.textContent = title;
      bodyEl.appendChild(sec);
      const table = document.createElement('table');
      table.className = 'med-table';
      const thCells = fields.map(f => '<th style="color:' + f.color + ';">' + f.label + '</th>').join('');
      table.innerHTML = '<thead><tr><th style="width:60px;">Mês</th>' + thCells + '</tr></thead>';
      const tbody = document.createElement('tbody');
      draft.forEach((row, i) => {
        const tr = document.createElement('tr');
        const tds = fields.map(f => {
          const val = f.nested ? (row[f.nested] && row[f.nested][f.key] != null ? row[f.nested][f.key] : 0) : (row[f.key] ?? 0);
          return '<td><input class="med-input ' + f.cls + '" type="number" min="0" value="' + val + '" data-i="' + i + '" data-f="' + f.key + '"' + (f.nested ? ' data-nested="' + f.nested + '"' : '') + '></td>';
        }).join('');
        tr.innerHTML = '<td class="med-td-mes">' + row.mes + '</td>' + tds;
        tbody.appendChild(tr);
      });
      tbody.addEventListener('input', e => {
        const inp = e.target;
        if (!inp.classList.contains('med-input')) return;
        const idx = Number(inp.dataset.i);
        const val = Number(inp.value) || 0;
        if (inp.dataset.nested) {
          if (!draft[idx][inp.dataset.nested]) draft[idx][inp.dataset.nested] = {};
          draft[idx][inp.dataset.nested][inp.dataset.f] = val;
        } else {
          draft[idx][inp.dataset.f] = val;
        }
      });
      table.appendChild(tbody);
      bodyEl.appendChild(table);
    };

    buildSection('Geral (Todos)', [
      { key:'conformes',    label:'Conformes (OK)',       color:'#22c55e', cls:'med-input--ok' },
      { key:'naoConformes', label:'Não Conformes (NG)', color:'#ef4757', cls:'med-input--ng' },
    ]);
    buildSection('Camhousing — CHS', [
      { key:'conformes',    nested:'chs', label:'CHS OK', color:'#22c55e', cls:'med-input--ok' },
      { key:'naoConformes', nested:'chs', label:'CHS NG', color:'#ef4757', cls:'med-input--ng' },
    ]);
    buildSection('HEAD', [
      { key:'conformes',    nested:'head', label:'HEAD OK', color:'#22c55e', cls:'med-input--ok' },
      { key:'naoConformes', nested:'head', label:'HEAD NG', color:'#ef4757', cls:'med-input--ng' },
    ]);
    box.appendChild(bodyEl);

    const foot = document.createElement('div');
    foot.className = 'med-foot';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'med-btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => overlay.remove());
    const saveBtn = document.createElement('button');
    saveBtn.className = 'med-btn-save';
    saveBtn.textContent = 'Salvar';
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Salvando...';
      saveBtn.disabled = true;
      try {
        const res = await adminFetch('/api/medicoes', { method:'POST', body:JSON.stringify(draft) });
        if (!res.ok) throw new Error('Servidor ' + res.status);
        overlay.remove();
        this._bus?.emit('data:refresh');
      } catch (e) {
        alert('Erro ao salvar: ' + e.message);
        saveBtn.textContent = 'Salvar';
        saveBtn.disabled = false;
      }
    });
    foot.appendChild(cancelBtn);
    foot.appendChild(saveBtn);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  _renderGroupedBars(container, meses, filter) {
    filter = filter || 'todos';
    if (!meses || !meses.length) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-mute);font-size:12px;">Sem dados disponíveis</div>';
      return;
    }
    // clientWidth/clientHeight pode ser 0 durante re-render (layout ainda não calculado)
    // Usa style.height explícito como fallback seguro
    const containerW = parseInt(container.style.width, 10) || container.clientWidth || container.offsetWidth || 580;
    const H = parseInt(container.style.height, 10) || container.clientHeight || container.offsetHeight || 320;
    // Caso normal (poucos meses): SVG responsivo (100%) — escala p/ caber, sem corte.
    // Muitos meses (jun, jul, ago...): largura fixa por mês + rolagem horizontal,
    // evitando barras/rótulos espremidos.
    const MIN_GROUP = 78;
    const manyMonths = meses.length * MIN_GROUP > containerW;
    const W = manyMonths ? meses.length * MIN_GROUP : containerW;
    container.style.overflowX = manyMonths ? 'auto' : 'hidden';
    container.style.overflowY = 'hidden';
    const padL = 44, padR = 16, padT = 32, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const getVals = (m) => {
      if (filter === 'chs')  return { ok: (m.chs  && m.chs.conformes    != null ? m.chs.conformes    : 0), ng: (m.chs  && m.chs.naoConformes  != null ? m.chs.naoConformes  : 0) };
      if (filter === 'head') return { ok: (m.head && m.head.conformes   != null ? m.head.conformes   : 0), ng: (m.head && m.head.naoConformes != null ? m.head.naoConformes : 0) };
      return { ok: (m.conformes ?? 0), ng: (m.naoConformes ?? 0) };
    };

    const maxVal = Math.max(...meses.map(m => { const v = getVals(m); return v.ok + v.ng; }), 1);
    const groupW = chartW / meses.length;
    const barW   = Math.max(8, Math.min(54, Math.floor(groupW * 0.36)));
    const gap    = Math.max(4, Math.floor(groupW * 0.06));

    const NS  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    // Responsivo quando cabe (escala p/ largura do container, sem corte);
    // px fixo + rolagem quando há muitos meses.
    svg.setAttribute('width', manyMonths ? W : '100%');
    svg.setAttribute('height', H);
    svg.style.display = 'block';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    const mk = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
      return el;
    };

    /* Grid lines */
    [0.25, 0.5, 0.75, 1].forEach(f => {
      const y = padT + chartH * (1 - f);
      svg.appendChild(mk('line', { x1:padL, x2:padL+chartW, y1:y, y2:y, stroke:'rgba(255,255,255,0.07)', 'stroke-width':1 }));
      const lbl = mk('text', { x:padL-7, y:y+4, 'text-anchor':'end', 'font-size':10, fill:'rgba(255,255,255,0.35)' });
      lbl.textContent = Math.round(maxVal * f);
      svg.appendChild(lbl);
    });

    meses.forEach((m, i) => {
      const { ok, ng } = getVals(m);
      const cx   = padL + i * groupW + groupW / 2;
      const base = padT + chartH;

      /* Barra OK */
      const hOK = ok > 0 ? Math.max(4, (ok / maxVal) * chartH) : 0;
      if (hOK > 0) {
        /* gradiente suave */
        const gId = `gok_${i}`;
        const defs = svg.querySelector('defs') || (() => { const d = mk('defs',{}); svg.insertBefore(d, svg.firstChild); return d; })();
        const grad = mk('linearGradient', { id:gId, x1:0, y1:0, x2:0, y2:1 });
        const s1 = mk('stop', { offset:'0%',   'stop-color':'#4ade80' });
        const s2 = mk('stop', { offset:'100%', 'stop-color':'#16a34a' });
        grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);

        svg.appendChild(mk('rect', { x:cx-barW-gap/2, y:base-hOK, width:barW, height:hOK, fill:`url(#${gId})`, rx:4 }));
        const t = mk('text', { x:cx-barW/2-gap/2, y:base-hOK-6, 'text-anchor':'middle', 'font-size':11, 'font-weight':700, fill:'#4ade80' });
        t.textContent = ok;
        svg.appendChild(t);
      } else {
        svg.appendChild(mk('rect', { x:cx-barW-gap/2, y:base-3, width:barW, height:3, fill:'rgba(34,197,94,0.12)', rx:2 }));
      }

      /* Barra NG */
      const hNG = ng > 0 ? Math.max(4, (ng / maxVal) * chartH) : 0;
      if (hNG > 0) {
        const gId2 = `gng_${i}`;
        const defs = svg.querySelector('defs') || (() => { const d = mk('defs',{}); svg.insertBefore(d, svg.firstChild); return d; })();
        const grad2 = mk('linearGradient', { id:gId2, x1:0, y1:0, x2:0, y2:1 });
        const s1 = mk('stop', { offset:'0%',   'stop-color':'#f87171' });
        const s2 = mk('stop', { offset:'100%', 'stop-color':'#dc2626' });
        grad2.appendChild(s1); grad2.appendChild(s2); defs.appendChild(grad2);

        svg.appendChild(mk('rect', { x:cx+gap/2, y:base-hNG, width:barW, height:hNG, fill:`url(#${gId2})`, rx:4 }));
        const t2 = mk('text', { x:cx+barW/2+gap/2, y:base-hNG-6, 'text-anchor':'middle', 'font-size':11, 'font-weight':700, fill:'#f87171' });
        t2.textContent = ng;
        svg.appendChild(t2);
      } else {
        svg.appendChild(mk('rect', { x:cx+gap/2, y:base-3, width:barW, height:3, fill:'rgba(239,71,87,0.12)', rx:2 }));
      }

      /* Label mês */
      const mesLbl = mk('text', { x:cx, y:H-padB+18, 'text-anchor':'middle', 'font-size':11, 'font-weight':600, fill:'rgba(255,255,255,0.6)' });
      mesLbl.textContent = m.mes;
      svg.appendChild(mesLbl);

      /* Total abaixo */
      const tot = ok + ng;
      if (tot > 0) {
        const totLbl = mk('text', { x:cx, y:H-padB+32, 'text-anchor':'middle', 'font-size':9, fill:'rgba(255,255,255,0.25)' });
        totLbl.textContent = '(' + tot + ')';
        svg.appendChild(totLbl);
      }
    });

    container.appendChild(svg);
  }

  /* ---------- Cronograma — Mini Widget ---------- */
  _buildCronogramaWidget() {
    const { panel, body } = this._panel('Cronograma de Atividades');
    body.style.height = '320px';
    body.style.overflow = 'hidden';

    // Inject CSS once
    if (!document.getElementById('_crono_widget_css')) {
      const s = document.createElement('style');
      s.id = '_crono_widget_css';
      s.textContent = `
        .cw-wrap        { display:flex; flex-direction:column; height:100%; padding:14px 16px 10px; box-sizing:border-box; gap:0; }
        .cw-mes-badge   { display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
        .cw-mes-badge span {
          background:rgba(168,85,247,0.15);
          border:1px solid rgba(168,85,247,0.45);
          color:#c084fc;
          font-size:12px; font-weight:800;
          letter-spacing:.12em; text-transform:uppercase;
          padding:5px 18px; border-radius:20px;
        }
        .cw-bars        { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:16px; justify-content:center; }
        .cw-bar-row     { display:flex; flex-direction:column; gap:5px; }
        .cw-bar-header  { display:flex; align-items:center; justify-content:space-between; }
        .cw-bar-lbl     { font-size:11px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
        .cw-bar-pct     { font-size:13px; font-weight:800; flex-shrink:0; margin-left:10px; }
        .cw-bar-track   { width:100%; height:13px; background:rgba(255,255,255,0.07); border-radius:7px; overflow:hidden; }
        .cw-bar-fill    { height:100%; border-radius:7px; transition:width .6s cubic-bezier(.4,0,.2,1); }
        .cw-footer      { display:flex; justify-content:flex-end; padding-top:14px; border-top:1px solid var(--border); margin-top:14px; }
        .cw-btn         { font-size:11px; color:var(--accent); background:none; border:1px solid var(--accent); border-radius:6px; padding:5px 14px; cursor:pointer; transition:all .15s; }
        .cw-btn:hover   { background:var(--accent); color:#fff; }
        .cw-loading     { color:var(--text-mute); font-size:11px; text-align:center; padding:20px; }
      `;
      document.head.appendChild(s);
    }

    // Loading state
    body.innerHTML = '<div class="cw-loading">Carregando...</div>';
    this._loadCronogramaInto(body);

    return panel;
  }

  /* ── Carga/atualização do conteúdo do widget cronograma ── */
  _loadCronogramaInto(body) {
    body.innerHTML = '<div class="cw-loading">Carregando...</div>';

    fetch('data/cronograma.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        /* ── Mesma lógica do CronogramaPage ──────────────────────────────
           Classifica cada célula usando a mesma regra de datas e
           justificativas para garantir valores idênticos entre as telas.
        ──────────────────────────────────────────────────────────────── */
        const now      = new Date();
        const nowY     = now.getFullYear(), nowM = now.getMonth() + 1, nowD = now.getDate();
        const cronYear = d.ano    ?? nowY;
        const cronMon  = d.mesNum ?? nowM;

        // Conjunto de dias justificados: chave "itemNum_day"
        const justSet = new Set();
        (d.diario ?? []).forEach(entry => {
          if (!entry.data) return;
          const day = parseInt(entry.data.split('/')[0], 10);
          String(entry.item).split(/[\s,eE&]+/).forEach(part => {
            const n = part.trim();
            if (n) justSet.add(`${n}_${day}`);
          });
        });

        // Função de classificação idêntica ao CronogramaPage._dayClass
        const dayClass = (day, v) => {
          if (v === 4) return 'ok';
          if (v !== 0) return 'vazio';
          const isPast = cronYear < nowY || cronMon < nowM ||
            (cronYear === nowY && cronMon === nowM && day < nowD);
          return isPast ? 'nok' : 'pend';
        };

        // Totais globais (com justificados)
        let totalOk = 0, totalNok = 0, totalPend = 0, totalJust = 0;
        (d.items ?? []).forEach(it => {
          const turnos = it.turnos ?? [{ dias: it.dias ?? {} }];
          turnos.forEach(t => {
            Object.entries(t.dias ?? {}).forEach(([dayStr, v]) => {
              const cls = dayClass(Number(dayStr), v);
              if      (cls === 'ok')   totalOk++;
              else if (cls === 'nok') {
                if (justSet.has(`${it.item}_${dayStr}`)) totalJust++;
                else totalNok++;
              }
              else if (cls === 'pend') totalPend++;
            });
          });
        });
        const totalSched = totalOk + totalNok + totalJust + totalPend;
        // Cumprimento = (realizados + justificados) / total — igual ao CronogramaPage
        const pct = totalSched ? Math.round(((totalOk + totalJust) / totalSched) * 100) : 0;

        // Agrupar por peça (usando mesma lógica)
        const pecaMap = {};
        (d.items ?? []).forEach(it => {
          if (!pecaMap[it.peca]) pecaMap[it.peca] = { ok: 0, nok: 0, just: 0, pend: 0 };
          const turnos = it.turnos ?? [{ dias: it.dias ?? {} }];
          turnos.forEach(t => {
            Object.entries(t.dias ?? {}).forEach(([dayStr, v]) => {
              const cls = dayClass(Number(dayStr), v);
              if      (cls === 'ok')   pecaMap[it.peca].ok++;
              else if (cls === 'nok') {
                if (justSet.has(`${it.item}_${dayStr}`)) pecaMap[it.peca].just++;
                else pecaMap[it.peca].nok++;
              }
              else if (cls === 'pend') pecaMap[it.peca].pend++;
            });
          });
        });

        body.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'cw-wrap';

        // Badge do mês em destaque
        const isCurrentMonth = cronYear === nowY && cronMon === nowM;
        const isPastMonth    = cronYear < nowY || (cronYear === nowY && cronMon < nowM);
        const mesBadge = document.createElement('div');
        mesBadge.className = 'cw-mes-badge';
        mesBadge.innerHTML = `<span>${d.mes ?? 'Mês atual'}</span>`;
        wrap.appendChild(mesBadge);

        // Fidelidade à mudança de mês: avisa quando o cronograma exibido
        // NÃO é do mês corrente (ex.: ainda em maio quando já é junho).
        if (!isCurrentMonth) {
          const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
          const aviso = document.createElement('div');
          aviso.style.cssText = `font-size:11px;font-weight:600;text-align:center;margin:-8px 0 14px;padding:6px 10px;border-radius:6px;line-height:1.4;`
            + (isPastMonth
                ? 'background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.4);color:#f59e0b;'
                : 'background:rgba(78,163,255,.12);border:1px solid rgba(78,163,255,.4);color:#4ea3ff;');
          aviso.innerHTML = isPastMonth
            ? `⚠ Exibindo mês anterior — crie o cronograma de <strong>${MESES_PT[nowM - 1]}/${nowY}</strong>`
            : `ℹ Cronograma de mês futuro`;
          wrap.appendChild(aviso);
        }

        // Barras por peça
        const barsWrap = document.createElement('div');
        barsWrap.className = 'cw-bars';
        Object.entries(pecaMap).forEach(([peca, vals]) => {
          const tot   = vals.ok + vals.nok + vals.just + vals.pend;
          const p     = tot ? Math.round(((vals.ok + vals.just) / tot) * 100) : 0;
          const color = p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444';

          const row = document.createElement('div');
          row.className = 'cw-bar-row';
          row.innerHTML = `
            <div class="cw-bar-header">
              <span class="cw-bar-lbl" title="${peca}">${peca}</span>
              <span class="cw-bar-pct" style="color:${color}">${p}%</span>
            </div>
            <div class="cw-bar-track">
              <div class="cw-bar-fill" style="width:0%;background:${color}" data-w="${p}"></div>
            </div>`;
          barsWrap.appendChild(row);
        });
        wrap.appendChild(barsWrap);

        // Botão ver completo
        const footer = document.createElement('div');
        footer.className = 'cw-footer';
        const btn = document.createElement('button');
        btn.className = 'cw-btn';
        btn.textContent = 'Ver Cronograma Completo →';
        btn.addEventListener('click', () => this._bus?.emit('nav:change', { page: 'cronograma' }));
        footer.appendChild(btn);
        wrap.appendChild(footer);

        body.appendChild(wrap);

        // Animar barras
        requestAnimationFrame(() => {
          body.querySelectorAll('.cw-bar-fill').forEach(el => {
            el.style.width = el.dataset.w + '%';
          });
        });
      })
      .catch(() => {
        body.innerHTML = '<div class="cw-loading">Sem dados de cronograma</div>';
      });
  }

  /* ---------- Barras Horizontais (reutilizável) ---------- */
  _buildHorizontalBars(title, items, color) {
    const { panel, body } = this._panel(title);

    // Normaliza campo: aceita tanto "count" quanto "qtd"
    const getCount = i => i.count ?? i.qtd ?? 0;

    // Ordena do maior para o menor
    const sorted  = [...items].sort((a, b) => getCount(b) - getCount(a));
    const maxVal  = Math.max(...sorted.map(getCount), 1);
    const totalGeral = sorted.reduce((s, i) => s + getCount(i), 0);

    // Chip de total no cabeçalho
    if (totalGeral > 0) {
      const head = panel.querySelector('.panel__head');
      const chip = document.createElement('span');
      chip.className   = 'panel__chip panel__chip--info';
      chip.textContent = `Total: ${totalGeral}`;
      chip.style.marginLeft = 'auto';
      head.appendChild(chip);
    }

    sorted.forEach((item, idx) => {
      const cnt = getCount(item);
      const row = document.createElement('div');
      row.className = 'hbar-row';

      const lbl = document.createElement('span');
      lbl.className   = 'hbar-label';
      lbl.textContent = item.equipamento ?? item.problema ?? item.ocorrencia ?? '';

      const track = document.createElement('div');
      track.className = 'hbar-track';

      const fill = document.createElement('div');
      fill.className = 'hbar-fill';
      fill.style.background = color;
      fill.style.width = '0%';
      fill.dataset.w = (cnt / maxVal) * 100;

      const val = document.createElement('span');
      val.className   = 'hbar-value';
      val.textContent = cnt;

      track.appendChild(fill);
      row.appendChild(lbl);
      row.appendChild(track);
      row.appendChild(val);
      body.appendChild(row);

      // Anima escalonado
      requestAnimationFrame(() => {
        setTimeout(() => {
          fill.style.width = `${fill.dataset.w}%`;
        }, 60 + idx * 30);
      });
    });

    return panel;
  }

  _buildEquipamentos(data) {
    return this._buildHorizontalBars(
      'Medições Periódicas por Equipamento',
      data.medicoesPorEquipamento ?? [],
      '#ef4757'
    );
  }

}
