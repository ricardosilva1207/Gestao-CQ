/**
 * PlaceholderPage.js — Página placeholder reutilizável para módulos ainda
 * sem conteúdo (Auditorias, Sala do Motor, etc.). Segue o mesmo padrão de
 * overlay das demais páginas (HinpyouPage, DesenhosPage, ...).
 */
export class PlaceholderPage {
  constructor({ id, title, icon = '🚧', subtitle = 'Módulo em desenvolvimento', bus }) {
    this._id       = id;
    this._title    = title;
    this._icon     = icon;
    this._subtitle = subtitle;
    this._bus      = bus;
    this._page     = null;
    this._init();
  }

  _init() {
    const page = document.createElement('div');
    page.id = `${this._id}-page`;
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .ph-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: var(--surface,#111c2e);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
        }
        .ph-back {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: border-color .15s;
          flex-shrink: 0; white-space: nowrap;
        }
        .ph-back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .ph-page-title { font-size: 15px; font-weight: 700; flex: 1; }

        .ph-wrap {
          min-height: calc(100vh - 60px);
          display: flex; align-items: center; justify-content: center;
          padding: 40px 20px;
        }
        .ph-card {
          max-width: 520px; width: 100%; text-align: center;
          padding: 48px 32px; border-radius: 14px;
          background: var(--surface,#111c2e); border: 1px solid var(--border);
        }
        .ph-icon { font-size: 56px; line-height: 1; margin-bottom: 18px; }
        .ph-title-lg { font-size: 22px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
        .ph-sub { font-size: 13px; color: var(--text-mute); line-height: 1.5; }
      </style>

      <div class="ph-topbar">
        <button class="ph-back" id="ph-back-btn">← Voltar ao Dashboard</button>
        <div class="ph-page-title">${this._icon} ${this._title}</div>
      </div>

      <div class="ph-wrap">
        <div class="ph-card">
          <div class="ph-icon">${this._icon}</div>
          <div class="ph-title-lg">${this._title}</div>
          <div class="ph-sub">${this._subtitle}</div>
        </div>
      </div>
    `;

    page.querySelector('#ph-back-btn').addEventListener('click', () => {
      this.hide();
      this._bus?.emit('nav:change', { page: 'dashboard' });
    });

    document.body.appendChild(page);
    this._page = page;
  }

  show() { this._page.style.display = ''; }
  hide() { this._page.style.display = 'none'; }
}
