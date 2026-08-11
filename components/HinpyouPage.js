/**
 * HinpyouPage.js — Página Hinpyou
 * Tabela com cabeçalho editável (colunas em branco por padrão)
 */

const KEY_HINPYOU   = 'metrologia_hinpyou';
const KEY_CABECALHO = 'metrologia_hinpyou_cabecalho';
const DEFAULT_CABECALHO = { col1: '', col2: '', col3: '' };

export class HinpyouPage {
  constructor(cfg, bus) {
    this._cfg = cfg;
    this._bus = bus;
    this._page = null;
    this._tbody = null;
    this._init();
  }

  /* ── Bootstrap ─────────────────────────────────────────── */
  _init() {
    const page = document.createElement('div');
    page.id = 'hinpyou-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .hinpyou-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: var(--surface,#111c2e);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
        }
        .hinpyou-back {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: border-color .15s;
          flex-shrink: 0; white-space: nowrap;
        }
        .hinpyou-back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .hinpyou-page-title { font-size: 15px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .hinpyou-wrap { max-width: 960px; margin: 28px auto; padding: 0 20px 40px; }

        .hinpyou-toolbar {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .hinpyou-add-btn {
          padding: 7px 16px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s;
        }
        .hinpyou-add-btn:hover { opacity: .85; }
        .hinpyou-edit-header-btn {
          padding: 7px 16px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          transition: border-color .15s, color .15s;
        }
        .hinpyou-edit-header-btn:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }

        .hinpyou-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .hinpyou-table thead tr {
          background: #f5d800; color: #1a1200;
        }
        .hinpyou-table thead th {
          padding: 10px 14px; font-weight: 900; font-size: 12px;
          text-transform: uppercase; letter-spacing: .5px; text-align: left;
          border: 1px solid #c8a000;
        }
        .hinpyou-table thead th:first-child { width: 110px; }
        .hinpyou-table thead th:last-child  { width: 80px; text-align: center; }

        .hinpyou-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background .12s;
        }
        .hinpyou-table tbody tr:hover { background: rgba(78,163,255,.06); }
        .hinpyou-table tbody td {
          padding: 10px 14px; vertical-align: middle; color: var(--text);
        }
        .hinpyou-table tbody td:last-child { text-align: center; }

        .hinpyou-link {
          color: var(--accent,#4ea3ff); text-decoration: none; font-size: 12px;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .hinpyou-link:hover { text-decoration: underline; }

        .hinpyou-empty {
          text-align: center; color: var(--text-mute); padding: 40px 0;
          font-size: 13px; font-style: italic;
        }

        /* Ações por linha */
        .hinpyou-row-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .hinpyou-del-btn {
          background: none; border: 1px solid transparent; border-radius: 5px;
          color: var(--text-mute); font-size: 13px; cursor: pointer; padding: 3px 6px;
          opacity: .5; transition: all .15s;
        }
        .hinpyou-del-btn:hover { border-color: var(--danger,#ef4757); color: var(--danger,#ef4757); opacity: 1; background: rgba(239,71,87,.1); }

        /* Modal genérico */
        .hinpyou-modal-overlay {
          display: none; position: fixed; inset: 0; z-index: 1300;
          background: rgba(0,0,0,.55); align-items: center; justify-content: center;
        }
        .hinpyou-modal-overlay.open { display: flex; }
        .hinpyou-modal {
          background: var(--surface,#111c2e); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px; width: 440px; max-width: 95vw;
        }
        .hinpyou-modal h3 { margin: 0 0 16px; font-size: 14px; font-weight: 700; }
        .hinpyou-modal label { display: block; font-size: 11px; color: var(--text-mute); margin-bottom: 4px; margin-top: 12px; }
        .hinpyou-modal input {
          width: 100%; box-sizing: border-box;
          background: var(--bg,#0d1521); border: 1px solid var(--border); border-radius: 6px;
          padding: 8px 10px; color: var(--text); font-size: 13px;
        }
        .hinpyou-modal input:focus { outline: none; border-color: var(--accent,#4ea3ff); }
        .hinpyou-modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .hinpyou-modal-save {
          padding: 7px 18px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff; font-weight: 700; font-size: 12px; cursor: pointer;
        }
        .hinpyou-modal-cancel {
          padding: 7px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
        }
      </style>

      <!-- Top bar -->
      <div class="hinpyou-topbar">
        <button class="hinpyou-back" id="hinpyou-back-btn">← Voltar ao Dashboard</button>
        <div class="hinpyou-page-title">📋 Hinpyou</div>
      </div>

      <!-- Conteúdo -->
      <div class="hinpyou-wrap">
        <div class="hinpyou-toolbar">
          <button class="hinpyou-add-btn" id="hinpyou-add-btn">+ Adicionar</button>
          <button class="hinpyou-edit-header-btn" id="hinpyou-edit-header-btn">✎ Editar Cabeçalho</button>
        </div>

        <table class="hinpyou-table">
          <thead>
            <tr>
              <th id="hinpyou-th-col1"></th>
              <th id="hinpyou-th-col2"></th>
              <th id="hinpyou-th-col3"></th>
              <th></th>
            </tr>
          </thead>
          <tbody id="hinpyou-tbody"></tbody>
        </table>
        <div id="hinpyou-empty" class="hinpyou-empty" style="display:none;">Nenhum item cadastrado.</div>
      </div>

      <!-- Modal editar cabeçalho -->
      <div class="hinpyou-modal-overlay" id="hinpyou-header-modal">
        <div class="hinpyou-modal">
          <h3>✏️ Editar Cabeçalho</h3>
          <label>Coluna 1</label>
          <input id="hinpyou-hdr-col1" />
          <label>Coluna 2</label>
          <input id="hinpyou-hdr-col2" />
          <label>Coluna 3</label>
          <input id="hinpyou-hdr-col3" />
          <div class="hinpyou-modal-footer">
            <button class="hinpyou-modal-cancel" id="hinpyou-hdr-cancel">Cancelar</button>
            <button class="hinpyou-modal-save"   id="hinpyou-hdr-save">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal adicionar -->
      <div class="hinpyou-modal-overlay" id="hinpyou-modal">
        <div class="hinpyou-modal">
          <h3>Adicionar Item</h3>
          <label id="hinpyou-lbl-col1">Coluna 1</label>
          <input id="hinpyou-inp-col1" />
          <label id="hinpyou-lbl-col2">Coluna 2</label>
          <input id="hinpyou-inp-col2" />
          <label id="hinpyou-lbl-col3">Coluna 3 (opcional)</label>
          <input id="hinpyou-inp-col3" type="url" placeholder="https://..." />
          <div class="hinpyou-modal-footer">
            <button class="hinpyou-modal-cancel" id="hinpyou-modal-cancel">Cancelar</button>
            <button class="hinpyou-modal-save"   id="hinpyou-modal-save">Salvar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(page);
    this._page = page;
    this._tbody = page.querySelector('#hinpyou-tbody');
    this._emptyEl = page.querySelector('#hinpyou-empty');

    // Navegação
    page.querySelector('#hinpyou-back-btn').addEventListener('click', () => {
      this.hide();
      this._bus.emit('nav:change', { page: 'dashboard' });
    });

    // Adicionar item
    page.querySelector('#hinpyou-add-btn').addEventListener('click', () => this._openModal());
    page.querySelector('#hinpyou-modal-cancel').addEventListener('click', () => this._closeModal());
    page.querySelector('#hinpyou-modal-save').addEventListener('click', () => this._saveItem());
    page.querySelector('#hinpyou-modal').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveItem();
      if (e.key === 'Escape') this._closeModal();
    });

    // Editar cabeçalho
    page.querySelector('#hinpyou-edit-header-btn').addEventListener('click', () => this._openHeaderModal());
    page.querySelector('#hinpyou-hdr-cancel').addEventListener('click', () => this._closeHeaderModal());
    page.querySelector('#hinpyou-hdr-save').addEventListener('click', () => this._saveHeader());
    page.querySelector('#hinpyou-header-modal').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveHeader();
      if (e.key === 'Escape') this._closeHeaderModal();
    });

    this._renderHeader();
    this._renderTable();
  }

  /* ── Público ───────────────────────────────────────────── */
  show() {
    this._renderTable();
    this._page.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this._page.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ── Dados ─────────────────────────────────────────────── */
  _load() {
    try { return JSON.parse(localStorage.getItem(KEY_HINPYOU) ?? '[]'); }
    catch { return []; }
  }

  _save(lst) {
    localStorage.setItem(KEY_HINPYOU, JSON.stringify(lst));
  }

  /* ── Tabela ────────────────────────────────────────────── */
  _renderTable() {
    const items = this._load();
    this._tbody.innerHTML = '';

    if (!items.length) {
      this._emptyEl.style.display = '';
      return;
    }
    this._emptyEl.style.display = 'none';

    items.forEach((n, idx) => {
      const tr = document.createElement('tr');

      const td1 = document.createElement('td'); td1.textContent = n.col1;
      const td2 = document.createElement('td'); td2.textContent = n.col2;
      const td3 = document.createElement('td');

      if (n.col3 && n.col3.startsWith('http')) {
        const a = document.createElement('a');
        a.className = 'hinpyou-link';
        a.href = n.col3; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.innerHTML = '🔗 Abrir';
        td3.appendChild(a);
      } else if (n.col3) {
        td3.textContent = n.col3;
      } else {
        td3.textContent = '—';
        td3.style.color = 'var(--text-mute)';
      }

      const tdAcoes = document.createElement('td');
      const actWrap = document.createElement('div'); actWrap.className = 'hinpyou-row-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'hinpyou-del-btn'; delBtn.innerHTML = '🗑'; delBtn.title = 'Remover';
      delBtn.addEventListener('click', () => this._deleteItem(idx));
      actWrap.appendChild(delBtn);
      tdAcoes.appendChild(actWrap);

      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(tdAcoes);
      this._tbody.appendChild(tr);
    });
  }

  /* ── Modal adicionar ───────────────────────────────────── */
  _openModal() {
    const h = this._loadHeader();
    const modal = this._page.querySelector('#hinpyou-modal');
    this._page.querySelector('#hinpyou-lbl-col1').textContent = h.col1 || 'Coluna 1';
    this._page.querySelector('#hinpyou-lbl-col2').textContent = h.col2 || 'Coluna 2';
    this._page.querySelector('#hinpyou-lbl-col3').textContent = (h.col3 || 'Coluna 3') + ' (opcional)';
    this._page.querySelector('#hinpyou-inp-col1').value = '';
    this._page.querySelector('#hinpyou-inp-col2').value = '';
    this._page.querySelector('#hinpyou-inp-col3').value = '';
    modal.classList.add('open');
    this._page.querySelector('#hinpyou-inp-col1').focus();
  }

  _closeModal() {
    this._page.querySelector('#hinpyou-modal').classList.remove('open');
  }

  _saveItem() {
    const col1 = this._page.querySelector('#hinpyou-inp-col1').value.trim();
    const col2 = this._page.querySelector('#hinpyou-inp-col2').value.trim();
    const col3 = this._page.querySelector('#hinpyou-inp-col3').value.trim();

    if (!col1 || !col2) {
      this._page.querySelector('#hinpyou-inp-col1').focus();
      return;
    }

    const lst = this._load();
    lst.push({ col1, col2, col3 });
    this._save(lst);
    this._closeModal();
    this._renderTable();
  }

  _deleteItem(idx) {
    const lst = this._load();
    lst.splice(idx, 1);
    this._save(lst);
    this._renderTable();
  }

  /* ── Cabeçalho editável ────────────────────────────────── */
  _loadHeader() {
    try { return { ...DEFAULT_CABECALHO, ...JSON.parse(localStorage.getItem(KEY_CABECALHO) ?? '{}') }; }
    catch { return { ...DEFAULT_CABECALHO }; }
  }

  _saveHeaderData(h) {
    localStorage.setItem(KEY_CABECALHO, JSON.stringify(h));
  }

  _renderHeader() {
    const h = this._loadHeader();
    this._page.querySelector('#hinpyou-th-col1').textContent = h.col1;
    this._page.querySelector('#hinpyou-th-col2').textContent = h.col2;
    this._page.querySelector('#hinpyou-th-col3').textContent = h.col3;
  }

  _openHeaderModal() {
    const h = this._loadHeader();
    this._page.querySelector('#hinpyou-hdr-col1').value = h.col1;
    this._page.querySelector('#hinpyou-hdr-col2').value = h.col2;
    this._page.querySelector('#hinpyou-hdr-col3').value = h.col3;
    this._page.querySelector('#hinpyou-header-modal').classList.add('open');
    this._page.querySelector('#hinpyou-hdr-col1').focus();
  }

  _closeHeaderModal() {
    this._page.querySelector('#hinpyou-header-modal').classList.remove('open');
  }

  _saveHeader() {
    const col1 = this._page.querySelector('#hinpyou-hdr-col1').value.trim();
    const col2 = this._page.querySelector('#hinpyou-hdr-col2').value.trim();
    const col3 = this._page.querySelector('#hinpyou-hdr-col3').value.trim();
    this._saveHeaderData({ col1, col2, col3 });
    this._closeHeaderModal();
    this._renderHeader();
  }
}
