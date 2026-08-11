/**
 * Header.js — Cabeçalho Principal
 * Dashboard Metrologia — Painel de Controle
 */

const ICONS = {
  export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  fullscreen: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
  exitFs:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`,
  edit:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  refresh:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
};

export class Header {
  constructor(container, cfg, bus) {
    this._el  = container;
    this._cfg = cfg;
    this._bus = bus;
    this._lastUpdate = null;
  }

  render() {
    this._el.className = 'header';
    this._el.innerHTML = '';

    // Lado esquerdo — título
    const left = document.createElement('div');
    left.className = 'header__left';

    const title = document.createElement('h1');
    title.className   = 'header__title';
    title.textContent = 'DASHBOARD METROLOGIA';
    left.appendChild(title);

    // Lado direito — botões
    const right = document.createElement('div');
    right.className = 'header__right';

    // Atualizar
    const refreshBtn = this._btn('header__btn', ICONS.refresh + '<span>Atualizar</span>');
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.opacity = '0.5';
      this._bus.emit('data:refresh');
      setTimeout(() => { refreshBtn.style.opacity = ''; }, 1000);
    });
    right.appendChild(refreshBtn);

    // Fullscreen
    this._fsBtn = this._btn('header__btn header__btn--icon', ICONS.fullscreen, 'Tela cheia');
    this._fsBtn.addEventListener('click', () => this._toggleFullscreen());
    right.appendChild(this._fsBtn);

    // Editar Painel (primário)
    const editBtn = this._btn('header__btn header__btn--primary', ICONS.edit + '<span>Editar Painel</span>');
    editBtn.addEventListener('click', () => this._bus.emit('drawer:toggle'));
    right.appendChild(editBtn);

    this._el.appendChild(left);
    this._el.appendChild(right);

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      this._fsBtn.innerHTML = isFs ? ICONS.exitFs : ICONS.fullscreen;

      // Esconde sidebar e expande conteúdo no modo fullscreen
      const sidebar = document.querySelector('.sidebar');
      const main    = document.querySelector('.main');
      if (sidebar) sidebar.style.display = isFs ? 'none' : '';
      if (main)    main.style.marginLeft  = isFs ? '0'    : '';
    });
  }

  setRefreshing(val) {
    if (val) return;
    this._lastUpdate = new Date();
  }

  /* ------------------------------------------------------------------ */

  _btn(className, html, title = '') {
    const b = document.createElement('button');
    b.className = className;
    b.innerHTML = html;
    if (title) b.title = title;
    return b;
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}
