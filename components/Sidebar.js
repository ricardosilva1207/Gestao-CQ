/**
 * Sidebar.js — Barra Lateral
 * Dashboard Metrologia — Painel de Controle
 */

const ICONS = {
  home:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  chart:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>`,
  plus:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  file:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  bell:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  pen:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  history:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>`,
  cog:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  moon:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  sun:      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  edit:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  clipboard:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2h6a2 2 0 0 1 2 2v1h2a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h2V4a2 2 0 0 1 2-2z"/><path d="M9 12l2 2 4-4"/></svg>`,
  engine:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 11V8h3l2-2h4l2 2h3v3l-2 2v3h-3l-2 2h-4l-2-2H6v-3z"/><circle cx="12" cy="12" r="2"/></svg>`,
};

export class Sidebar {
  constructor(container, cfg, bus) {
    this._el   = container;
    this._cfg  = cfg;
    this._bus  = bus;
    this._page = 'analise-periodica';
    this._theme = 'dark';
  }

  render() {
    const { app = {}, navItems = [] } = this._cfg;

    this._el.className = 'sidebar';
    this._el.innerHTML = '';

    // Brand
    this._el.appendChild(this._buildBrand(app));

    // Botão Início
    this._el.appendChild(this._buildHomeBtn());

    // Nav
    const nav = document.createElement('nav');
    nav.className = 'sidebar__nav';
    nav.setAttribute('aria-label', 'Navegação principal');

    const sectionLabel = document.createElement('div');
    sectionLabel.className   = 'sidebar__section-label';
    sectionLabel.textContent = 'ATIVIDADES';
    nav.appendChild(sectionLabel);

    navItems.forEach(item => nav.appendChild(this._buildNavBtn(item)));

    this._el.appendChild(nav);

    // Footer
    this._el.appendChild(this._buildFooter());
  }

  setActivePage(pageId) {
    this._page = pageId;
    this._el.querySelectorAll('.navbtn').forEach(btn => {
      btn.classList.toggle('navbtn--active', btn.dataset.id === pageId);
    });
  }

  setBadge(itemId, count, pulse = false) {
    const badge = this._el.querySelector(`[data-id="${itemId}"] .navbtn__badge`);
    if (!badge) return;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = count > 0 ? '' : 'none';
    badge.classList.toggle('navbtn__badge--pulse', pulse && count > 0);
  }

  setTheme(theme) {
    this._theme = theme;
    const btn = this._el.querySelector('.sidebar__theme-btn');
    if (!btn) return;
    const icon = btn.querySelector('.sidebar__theme-icon');
    const txt  = btn.querySelector('.sidebar__theme-txt');
    if (icon) icon.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    if (txt)  txt.textContent = theme === 'dark' ? 'Claro' : 'Escuro';
  }

  /* ------------------------------------------------------------------ */

  _buildBrand(app) {
    const brand = document.createElement('div');
    brand.className = 'sidebar__brand';

    const logo = document.createElement('div');
    logo.className = 'sidebar__logo';
    logo.textContent = app.name?.[0] ?? 'M';

    const text = document.createElement('div');
    text.className = 'sidebar__brand-text';

    const sub = document.createElement('div');
    sub.className   = 'sidebar__brand-sub';
    sub.textContent = app.subtitle ?? 'Painel de Controle';

    text.appendChild(sub);
    brand.appendChild(logo);
    brand.appendChild(text);
    return brand;
  }

  _buildHomeBtn() {
    // Injeta CSS uma vez
    if (!document.getElementById('_sidebar_home_css')) {
      const s = document.createElement('style');
      s.id = '_sidebar_home_css';
      s.textContent = `
        .sidebar__home-wrap {
          padding: 10px 14px 4px;
        }
        .sidebar__home-btn {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 9px 14px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          color: #fff; border: none; border-radius: 8px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          letter-spacing: .3px;
          box-shadow: 0 4px 12px rgba(37,99,235,.35);
          transition: opacity .15s, transform .12s;
        }
        .sidebar__home-btn:hover  { opacity: .88; transform: translateY(-1px); }
        .sidebar__home-btn:active { transform: translateY(0); opacity: 1; }
        .sidebar__home-btn svg    { flex-shrink: 0; }
      `;
      document.head.appendChild(s);
    }

    const wrap = document.createElement('div');
    wrap.className = 'sidebar__home-wrap';

    const btn = document.createElement('button');
    btn.className = 'sidebar__home-btn';
    btn.title     = 'Ir para o Dashboard principal';
    btn.innerHTML = `${ICONS.home} Página Inicial`;

    btn.addEventListener('click', () => {
      this.setActivePage('analise-periodica');
      this._bus.emit('nav:change', { page: 'dashboard' });
    });

    wrap.appendChild(btn);
    return wrap;
  }

  _buildNavBtn(item) {
    const btn = document.createElement('button');
    btn.className  = `navbtn${item.id === this._page ? ' navbtn--active' : ''}`;
    btn.dataset.id = item.id;
    btn.title      = item.label;

    const icon = document.createElement('span');
    icon.className = 'navbtn__icon';
    icon.innerHTML = ICONS[item.icon] ?? '●';

    const label = document.createElement('span');
    label.className   = 'navbtn__label';
    label.textContent = item.label;

    btn.appendChild(icon);
    btn.appendChild(label);

    // Badge numérico — sempre criado para permitir atualização dinâmica
    const badge = document.createElement('span');
    badge.className   = 'navbtn__badge';
    badge.textContent = item.badge ? String(item.badge) : '';
    badge.style.display = item.badge ? '' : 'none';
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      // Se tem action especial, emite evento de ação
      if (item.action) {
        this._bus.emit('nav:action', { action: item.action, id: item.id });
      } else {
        this.setActivePage(item.id);
        this._bus.emit('nav:change', { page: item.page ?? item.id, id: item.id });
      }
    });

    return btn;
  }

  _buildFooter() {
    const foot = document.createElement('div');
    foot.className = 'sidebar__foot';

    // Botão tema (Claro / Escuro)
    const themeBtn = document.createElement('button');
    themeBtn.className = 'sidebar__foot-btn sidebar__theme-btn';
    themeBtn.title     = 'Alternar tema';

    const themeIcon = document.createElement('span');
    themeIcon.className = 'sidebar__theme-icon';
    themeIcon.innerHTML = ICONS.moon;

    const themeTxt = document.createElement('span');
    themeTxt.className   = 'sidebar__theme-txt';
    themeTxt.textContent = 'Claro';

    themeBtn.appendChild(themeIcon);
    themeBtn.appendChild(themeTxt);
    themeBtn.addEventListener('click', () => this._bus.emit('theme:toggle'));
    foot.appendChild(themeBtn);

    // Botão editar painel
    const editBtn = document.createElement('button');
    editBtn.className = 'sidebar__foot-btn sidebar__edit-btn';
    editBtn.title     = 'Editar painel';
    editBtn.innerHTML = ICONS.edit;
    editBtn.addEventListener('click', () => this._bus.emit('drawer:toggle'));
    foot.appendChild(editBtn);

    return foot;
  }
}
