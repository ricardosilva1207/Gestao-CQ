/**
 * EditDrawer.js — Drawer lateral de configurações do painel
 * Dashboard Operacional Metrologia v2.0
 *
 * Painel deslizante com abas: Aparência, Dados, Filtros, Sobre.
 */

import { escapeHtml } from '../js/utils.js';

/* ==========================================================================
   HELPER GLOBAL — monta link mailto: para Outlook
   ========================================================================== */

export function _buildMailto(sol, recipients = []) {
  const urgente  = sol.urgencia === 'urgente';
  const prefix   = urgente ? '[URGENTE] ' : '';
  const assunto  = encodeURIComponent(`${prefix}[Metrologia PFZ CQ] Nova Solicitação — ${sol.titulo ?? ''}`);

  // Destinatários: supervisor do form + lista do drawer
  const toList   = [sol.emailResp, sol.emailSol]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const ccList   = recipients
    .filter(r => r.email && (r.tipos ?? []).includes('extra'))
    .map(r => r.email)
    .filter(e => !toList.includes(e));

  const motivos  = (sol.motivos ?? []).join(', ') || '—';
  const ts       = sol.timestamp ? sol.timestamp.slice(0,10).split('-').reverse().join('/') : '—';

  const corpo = [
    `Prezado(a),`,
    ``,
    `Uma nova solicitação de Análise Extra foi registrada no sistema Metrologia PFZ CQ.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `${urgente ? '🚨 URGENTE — REQUER ATENÇÃO IMEDIATA' : '✅ Prioridade: Normal'}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `ID:           ${(sol.id ?? '—').toUpperCase()}`,
    `Data:         ${ts}`,
    `Projeto:      ${sol.projeto ?? '—'} › ${sol.linha ?? '—'}`,
    `Processo:     ${sol.processo ?? '—'} / ${sol.operacao ?? '—'}`,
    `Part No.:     ${sol.partNo ?? '—'}`,
    `Part Name:    ${sol.partName ?? '—'}`,
    `Título:       ${sol.titulo ?? '—'}`,
    `Motivo:       ${motivos}`,
    `Prazo:        ${sol.prazo ?? '—'}`,
    ``,
    `Solicitante:  ${sol.solicitante ?? '—'} — ${sol.depto ?? ''}`,
    `E-mail:       ${sol.emailSol ?? '—'}`,
    ``,
    sol.objetivo ? `Objetivo:\n${sol.objetivo}\n` : '',
    sol.conteudo ? `Conteúdo Avaliação:\n${sol.conteudo}\n` : '',
    ``,
    `Por favor, agende a análise assim que possível.`,
    ``,
    `Atenciosamente,`,
    `Sistema de Metrologia PFZ CQ`,
  ].filter(l => l !== undefined).join('\r\n');

  let href = `mailto:${toList.join(';')}?subject=${assunto}&body=${encodeURIComponent(corpo)}`;
  if (ccList.length) href += `&cc=${encodeURIComponent(ccList.join(';'))}`;
  return href;
}

/* ==========================================================================
   EDIT DRAWER COMPONENT
   ========================================================================== */

export class EditDrawer {
  /**
   * @param {Element} container
   * @param {Object}  cfg
   * @param {EventBus} bus
   */
  constructor(container, cfg, bus) {
    this._el     = container;
    this._cfg    = cfg;
    this._bus    = bus;
    this._open   = false;
    this._tab    = 'appearance';
    this._prefs  = {};
  }

  /** Renderiza a estrutura base do drawer */
  render() {
    this._el.className = 'drawer';
    this._el.setAttribute('role', 'dialog');
    this._el.setAttribute('aria-label', 'Editar Painel');
    this._el.setAttribute('aria-hidden', 'true');
    this._el.innerHTML = '';

    // Overlay backdrop
    this._overlay = document.createElement('div');
    this._overlay.className = 'drawer__overlay';
    this._overlay.addEventListener('click', () => this.close());
    document.body.appendChild(this._overlay);

    // Cabeçalho do drawer
    const head = document.createElement('div');
    head.className = 'drawer__head';

    const title = document.createElement('h2');
    title.className   = 'drawer__title';
    title.textContent = 'Configurações do Painel';

    const closeBtn = document.createElement('button');
    closeBtn.className   = 'drawer__close';
    closeBtn.title       = 'Fechar';
    closeBtn.innerHTML   = '&times;';
    closeBtn.setAttribute('aria-label', 'Fechar drawer');
    closeBtn.addEventListener('click', () => this.close());

    head.appendChild(title);
    head.appendChild(closeBtn);
    this._el.appendChild(head);

    // Abas
    const tabBar = this._buildTabBar();
    this._el.appendChild(tabBar);

    // Conteúdo
    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'drawer__body';
    this._el.appendChild(this._bodyEl);

    // Footer com ações
    const foot = this._buildFooter();
    this._el.appendChild(foot);

    this._renderTab(this._tab);

    // ESC fecha o drawer
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._open) this.close();
    });
  }

  /** Abre o drawer */
  open() {
    this._open = true;
    this._el.classList.add('open');
    this._overlay.classList.add('open');
    this._el.setAttribute('aria-hidden', 'false');
    // Foca o primeiro elemento interativo
    setTimeout(() => {
      const first = this._el.querySelector('button, input, select');
      first?.focus();
    }, 150);
    this._bus.emit('drawer:opened');
  }

  /** Fecha o drawer */
  close() {
    this._open = false;
    this._el.classList.remove('open');
    this._overlay.classList.remove('open');
    this._el.setAttribute('aria-hidden', 'true');
    this._bus.emit('drawer:closed');
  }

  /** Alterna aberto/fechado */
  toggle() {
    this._open ? this.close() : this.open();
  }

  /** Atualiza preferências exibidas */
  setPrefs(prefs) {
    this._prefs = { ...prefs };
    this._renderTab(this._tab);
  }

  /* ---------------------------------------------------------------------- */
  /* PRIVATE                                                                   */
  /* ---------------------------------------------------------------------- */

  _buildTabBar() {
    const tabs = [
      { id: 'appearance', label: '🎨 Aparência' },
      { id: 'data',       label: '📊 Dados'     },
      { id: 'filters',    label: '🔍 Filtros'   },
      { id: 'about',      label: 'ℹ️ Sobre'      },
    ];

    const bar = document.createElement('div');
    bar.className = 'drawer__tabs';
    bar.setAttribute('role', 'tablist');

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `drawer__tab${tab.id === this._tab ? ' active' : ''}`;
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', String(tab.id === this._tab));
      btn.addEventListener('click', () => this._selectTab(tab.id, bar));
      bar.appendChild(btn);
    });

    this._tabBarEl = bar;
    return bar;
  }

  _selectTab(tabId, bar) {
    this._tab = tabId;
    bar.querySelectorAll('.drawer__tab').forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    this._renderTab(tabId);
  }

  _renderTab(tabId) {
    if (!this._bodyEl) return;
    this._bodyEl.innerHTML = '';

    switch (tabId) {
      case 'appearance': this._renderAppearanceTab(); break;
      case 'data':       this._renderDataTab();       break;
      case 'filters':    this._renderFiltersTab();    break;
      case 'about':      this._renderAboutTab();      break;
    }
  }

  /* ---- ABA APARÊNCIA ---- */
  _renderAppearanceTab() {
    const body = this._bodyEl;

    // Tema
    this._section(body, 'Tema Visual', () => {
      const row = this._row();

      const darkBtn = this._themeCard('dark', '🌙', 'Escuro', this._prefs.theme === 'dark' || !this._prefs.theme);
      const lightBtn = this._themeCard('light', '☀️', 'Claro', this._prefs.theme === 'light');

      darkBtn.addEventListener('click', () => {
        this._bus.emit('prefs:change', { theme: 'dark' });
        darkBtn.classList.add('active');
        lightBtn.classList.remove('active');
      });
      lightBtn.addEventListener('click', () => {
        this._bus.emit('prefs:change', { theme: 'light' });
        lightBtn.classList.add('active');
        darkBtn.classList.remove('active');
      });

      row.appendChild(darkBtn);
      row.appendChild(lightBtn);
      body.appendChild(row);
    });

    // Densidade
    this._section(body, 'Densidade do Layout', () => {
      const sel = this._select([
        { value: 'compact',  label: 'Compacto' },
        { value: 'normal',   label: 'Normal (padrão)' },
        { value: 'spacious', label: 'Espaçoso' },
      ], this._prefs.density ?? 'normal');
      sel.addEventListener('change', e => this._bus.emit('prefs:change', { density: e.target.value }));
      body.appendChild(sel);
    });

    // Animações
    this._section(body, 'Animações', () => {
      body.appendChild(this._toggle('Ativar animações', 'animations', this._prefs.animations !== false));
      body.appendChild(this._toggle('Ticker de status', 'ticker', this._prefs.ticker !== false));
    });

    // Logo do Dashboard
    this._section(body, 'Logo do Dashboard', () => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;';

      /* Preview */
      const preview = document.createElement('div');
      preview.style.cssText = 'width:52px;height:52px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);overflow:hidden;flex-shrink:0;';
      const currentSrc = localStorage.getItem('metrologia_logo') || document.getElementById('_toyota_logo')?.src || '';
      if (currentSrc) {
        const prevImg = document.createElement('img');
        prevImg.src = currentSrc;
        prevImg.style.cssText = 'width:100%;height:100%;object-fit:contain;';
        preview.appendChild(prevImg);
      } else {
        preview.textContent = 'M';
        preview.style.cssText += 'font-size:22px;font-weight:800;color:var(--accent);';
      }

      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

      /* Botão upload */
      const uploadBtn = document.createElement('button');
      uploadBtn.className = 'btn btn--secondary';
      uploadBtn.textContent = '📁 Trocar Logo';
      const fileInput = document.createElement('input');
      fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          const src = e.target.result;
          localStorage.setItem('metrologia_logo', src);
          /* Atualiza preview */
          preview.innerHTML = '';
          const img = document.createElement('img');
          img.src = src; img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
          preview.appendChild(img);
          /* Atualiza sidebar ao vivo */
          window.dispatchEvent(new CustomEvent('metrologia:logo', { detail: src }));
        };
        reader.readAsDataURL(file);
      });
      uploadBtn.addEventListener('click', () => fileInput.click());

      /* Botão reset */
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn--ghost';
      resetBtn.textContent = '↺ Restaurar Padrão';
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem('metrologia_logo');
        const defaultSrc = 'toyota-logo.png.png';
        window.dispatchEvent(new CustomEvent('metrologia:logo', { detail: defaultSrc }));
        preview.innerHTML = '';
        if (defaultSrc) {
          const img = document.createElement('img');
          img.src = defaultSrc; img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
          preview.appendChild(img);
        } else {
          preview.textContent = 'M';
        }
      });

      btns.appendChild(uploadBtn); btns.appendChild(fileInput); btns.appendChild(resetBtn);
      wrap.appendChild(preview); wrap.appendChild(btns);
      body.appendChild(wrap);
    });

    // Atualização automática
    this._section(body, 'Atualização Automática', () => {
      const sel = this._select([
        { value: '0',    label: 'Desativado' },
        { value: '60',   label: '1 minuto' },
        { value: '300',  label: '5 minutos' },
        { value: '600',  label: '10 minutos (padrão)' },
        { value: '1800', label: '30 minutos' },
      ], String(this._prefs.refreshInterval ?? 600));
      sel.addEventListener('change', e => this._bus.emit('prefs:change', { refreshInterval: Number(e.target.value) }));
      body.appendChild(sel);
    });
  }

  /* ---- ABA DADOS ---- */
  _renderDataTab() {
    const body = this._bodyEl;

    const { api = {} } = this._cfg;

    // Fonte de dados
    this._section(body, 'Fonte de Dados', () => {
      const sel = this._select([
        { value: 'mock',     label: 'Mock (Demonstração)' },
        { value: 'rest',     label: 'API REST' },
        { value: 'onedrive', label: 'OneDrive / SharePoint' },
        { value: 'excel',    label: 'Arquivo Excel (upload)' },
      ], this._prefs.dataSource ?? (api.useMock ? 'mock' : 'rest'));
      sel.addEventListener('change', e => this._bus.emit('prefs:change', { dataSource: e.target.value }));
      body.appendChild(sel);
    });

    // Botões de ação
    this._section(body, 'Ações', () => {
      const row = this._row('gap');

      const refreshBtn = this._actionBtn('🔄 Atualizar Agora', 'btn--secondary');
      refreshBtn.addEventListener('click', () => this._bus.emit('data:refresh'));

      const importBtn = this._actionBtn('📂 Importar Excel', 'btn--secondary');
      importBtn.addEventListener('click', () => this._bus.emit('excel:import'));

      const exportBtn = this._actionBtn('⬇ Exportar Dados', 'btn--secondary');
      exportBtn.addEventListener('click', () => this._bus.emit('excel:export'));

      row.appendChild(refreshBtn);
      row.appendChild(importBtn);
      row.appendChild(exportBtn);
      body.appendChild(row);
    });

    // Info de sincronização
    this._section(body, 'Status de Sincronização', () => {
      const info = document.createElement('div');
      info.className = 'drawer__info-box';
      info.innerHTML = `
        <div class="drawer__info-row"><span>Fonte:</span><strong>${api.useMock ? 'Mock Data' : api.baseUrl ?? 'N/A'}</strong></div>
        <div class="drawer__info-row"><span>Status:</span><strong class="text-ok">Conectado</strong></div>
        <div class="drawer__info-row"><span>Cache TTL:</span><strong>${api.cacheTTL ?? 300}s</strong></div>
      `;
      body.appendChild(info);
    });
  }

  /* ---- ABA FILTROS ---- */
  _renderFiltersTab() {
    const body = this._bodyEl;

    this._section(body, 'Filtros Salvos', () => {
      const p = document.createElement('p');
      p.className   = 'drawer__hint';
      p.textContent = 'Os filtros ativos são preservados entre sessões automaticamente.';
      body.appendChild(p);

      const clearBtn = this._actionBtn('🗑 Limpar Todos os Filtros', 'btn--danger');
      clearBtn.addEventListener('click', () => {
        this._bus.emit('filters:reset');
        clearBtn.textContent = '✓ Filtros limpos';
        clearBtn.disabled = true;
        setTimeout(() => {
          clearBtn.textContent = '🗑 Limpar Todos os Filtros';
          clearBtn.disabled = false;
        }, 2000);
      });
      body.appendChild(clearBtn);
    });

    this._section(body, 'Persistência', () => {
      body.appendChild(this._toggle('Salvar filtros ao sair', 'persistFilters', this._prefs.persistFilters !== false));
    });
  }

  /* ---- ABA SOBRE ---- */
  _renderAboutTab() {
    const body = this._bodyEl;

    const box = document.createElement('div');
    box.className = 'drawer__about';
    box.innerHTML = `
      <div class="drawer__about-logo" style="background:#fff;padding:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        ${(localStorage.getItem('metrologia_logo') || document.getElementById('_toyota_logo')?.src)
          ? `<img src="${localStorage.getItem('metrologia_logo') || document.getElementById('_toyota_logo')?.src}" style="width:100%;height:100%;object-fit:contain;" alt="Logo">`
          : 'M'}
      </div>
      <h3>${escapeHtml(this._cfg.app?.name ?? 'Dashboard Metrologia')}</h3>
      <p class="text-muted">${escapeHtml(this._cfg.app?.subtitle ?? 'Dashboard Operacional')}</p>
      <hr class="drawer__hr">
      <div class="drawer__info-row"><span>Versão:</span><strong>2.1.0</strong></div>
      <div class="drawer__info-row"><span>Desenvolvimento:</span><strong>2025 / 2026</strong></div>
      <div class="drawer__info-row"><span>Arquitetura:</span><strong>ES6 Modules + Vanilla JS</strong></div>
      <div class="drawer__info-row"><span>Compatível com:</span><strong>SharePoint, OneDrive</strong></div>
      <hr class="drawer__hr">
      <p class="text-xs text-muted">Dashboard Operacional de Metrologia. Desenvolvido para uso corporativo.</p>
      <p class="text-xs text-muted" style="margin-top:6px;">Desenvolvido por <strong style="color:var(--text);">Ricardo Gilberto</strong> — <a href="mailto:rgdsilva@toyota.om.br" style="color:var(--accent,#4ea3ff);text-decoration:none;">rgdsilva@toyota.om.br</a></p>
    `;
    body.appendChild(box);
  }

  /* ---- ABA E-MAILS ---- */
  _buildFooter() {
    const foot = document.createElement('div');
    foot.className = 'drawer__foot';

    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'btn btn--ghost';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = document.createElement('button');
    saveBtn.className   = 'btn btn--primary';
    saveBtn.textContent = 'Salvar Configurações';
    saveBtn.addEventListener('click', () => {
      this._bus.emit('prefs:save');
      this.close();
    });

    foot.appendChild(cancelBtn);
    foot.appendChild(saveBtn);
    return foot;
  }

  /* ---- HELPERS DE UI ---- */

  _section(parent, title, builder) {
    const sec = document.createElement('div');
    sec.className = 'drawer__section';

    const h = document.createElement('h3');
    h.className   = 'drawer__section-title';
    h.textContent = title;
    sec.appendChild(h);

    builder();
    parent.appendChild(sec);
  }

  _row(className = '') {
    const row = document.createElement('div');
    row.className = `drawer__row ${className}`;
    return row;
  }

  _select(options, value) {
    const sel = document.createElement('select');
    sel.className = 'select drawer__select';
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value   = opt.value;
      o.text    = opt.label;
      if (opt.value === value) o.selected = true;
      sel.appendChild(o);
    });
    return sel;
  }

  _toggle(label, key, checked) {
    const wrap = document.createElement('label');
    wrap.className = 'drawer__toggle';

    const chk = document.createElement('input');
    chk.type    = 'checkbox';
    chk.checked = checked;
    chk.addEventListener('change', e => this._bus.emit('prefs:change', { [key]: e.target.checked }));

    const span = document.createElement('span');
    span.className   = 'drawer__toggle-track';

    const txt = document.createElement('span');
    txt.textContent = label;

    wrap.appendChild(chk);
    wrap.appendChild(span);
    wrap.appendChild(txt);
    return wrap;
  }

  _themeCard(value, emoji, label, active) {
    const btn = document.createElement('button');
    btn.className    = `drawer__theme-card${active ? ' active' : ''}`;
    btn.dataset.theme = value;
    btn.innerHTML    = `<span class="drawer__theme-emoji">${emoji}</span><span>${label}</span>`;
    return btn;
  }

  _actionBtn(label, variant = 'btn--secondary') {
    const btn = document.createElement('button');
    btn.className   = `btn ${variant}`;
    btn.textContent = label;
    return btn;
  }
}
