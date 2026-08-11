/**
 * DesenhosPage.js — Página Desenhos
 * Tabela com cabeçalho editável (colunas em branco por padrão)
 */

const KEY_DESENHOS  = 'metrologia_desenhos';
const KEY_CABECALHO = 'metrologia_desenhos_cabecalho';
const DEFAULT_CABECALHO = { col1: '', col2: '', col3: '' };

export class DesenhosPage {
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
    page.id = 'desenhos-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .desenhos-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: var(--surface,#111c2e);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
        }
        .desenhos-back {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: border-color .15s;
          flex-shrink: 0; white-space: nowrap;
        }
        .desenhos-back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .desenhos-page-title { font-size: 15px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .desenhos-wrap { max-width: 960px; margin: 28px auto; padding: 0 20px 40px; }

        .desenhos-toolbar {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .desenhos-add-btn {
          padding: 7px 16px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s;
        }
        .desenhos-add-btn:hover { opacity: .85; }
        .desenhos-edit-header-btn {
          padding: 7px 16px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          transition: border-color .15s, color .15s;
        }
        .desenhos-edit-header-btn:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }

        .desenhos-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .desenhos-table thead tr {
          background: #f5d800; color: #1a1200;
        }
        .desenhos-table thead th {
          padding: 10px 14px; font-weight: 900; font-size: 12px;
          text-transform: uppercase; letter-spacing: .5px; text-align: left;
          border: 1px solid #c8a000;
        }
        .desenhos-table thead th:first-child { width: 110px; }
        .desenhos-table thead th:last-child  { width: 80px; text-align: center; }

        .desenhos-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background .12s;
        }
        .desenhos-table tbody tr:hover { background: rgba(78,163,255,.06); }
        .desenhos-table tbody td {
          padding: 10px 14px; vertical-align: middle; color: var(--text);
        }
        .desenhos-table tbody td:last-child { text-align: center; }

        .desenhos-link {
          color: var(--accent,#4ea3ff); text-decoration: none; font-size: 12px;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .desenhos-link:hover { text-decoration: underline; }

        .desenhos-empty {
          text-align: center; color: var(--text-mute); padding: 40px 0;
          font-size: 13px; font-style: italic;
        }

        /* Ações por linha */
        .desenhos-row-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .desenhos-del-btn {
          background: none; border: 1px solid transparent; border-radius: 5px;
          color: var(--text-mute); font-size: 13px; cursor: pointer; padding: 3px 6px;
          opacity: .5; transition: all .15s;
        }
        .desenhos-del-btn:hover { border-color: var(--danger,#ef4757); color: var(--danger,#ef4757); opacity: 1; background: rgba(239,71,87,.1); }

        /* Modal genérico */
        .desenhos-modal-overlay {
          display: none; position: fixed; inset: 0; z-index: 1300;
          background: rgba(0,0,0,.55); align-items: center; justify-content: center;
        }
        .desenhos-modal-overlay.open { display: flex; }
        .desenhos-modal {
          background: var(--surface,#111c2e); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px; width: 440px; max-width: 95vw;
        }
        .desenhos-modal h3 { margin: 0 0 16px; font-size: 14px; font-weight: 700; }
        .desenhos-modal label { display: block; font-size: 11px; color: var(--text-mute); margin-bottom: 4px; margin-top: 12px; }
        .desenhos-modal input {
          width: 100%; box-sizing: border-box;
          background: var(--bg,#0d1521); border: 1px solid var(--border); border-radius: 6px;
          padding: 8px 10px; color: var(--text); font-size: 13px;
        }
        .desenhos-modal input:focus { outline: none; border-color: var(--accent,#4ea3ff); }
        .desenhos-modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .desenhos-modal-save {
          padding: 7px 18px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff; font-weight: 700; font-size: 12px; cursor: pointer;
        }
        .desenhos-modal-cancel {
          padding: 7px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
        }
      </style>

      <!-- Top bar -->
      <div class="desenhos-topbar">
        <button class="desenhos-back" id="desenhos-back-btn">← Voltar ao Dashboard</button>
        <div class="desenhos-page-title">✏️ Desenhos</div>
      </div>

      <!-- Conteúdo -->
      <div class="desenhos-wrap">
        <div class="desenhos-toolbar">
          <button class="desenhos-add-btn" id="desenhos-add-btn">+ Adicionar</button>
          <button class="desenhos-edit-header-btn" id="desenhos-edit-header-btn">✎ Editar Cabeçalho</button>
        </div>

        <table class="desenhos-table">
          <thead>
            <tr>
              <th id="desenhos-th-col1"></th>
              <th id="desenhos-th-col2"></th>
              <th id="desenhos-th-col3"></th>
              <th></th>
            </tr>
          </thead>
          <tbody id="desenhos-tbody"></tbody>
        </table>
        <div id="desenhos-empty" class="desenhos-empty" style="display:none;">Nenhum item cadastrado.</div>
      </div>

      <!-- Modal editar cabeçalho -->
      <div class="desenhos-modal-overlay" id="desenhos-header-modal">
        <div class="desenhos-modal">
          <h3>✏️ Editar Cabeçalho</h3>
          <label>Coluna 1</label>
          <input id="desenhos-hdr-col1" />
          <label>Coluna 2</label>
          <input id="desenhos-hdr-col2" />
          <label>Coluna 3</label>
          <input id="desenhos-hdr-col3" />
          <div class="desenhos-modal-footer">
            <button class="desenhos-modal-cancel" id="desenhos-hdr-cancel">Cancelar</button>
            <button class="desenhos-modal-save"   id="desenhos-hdr-save">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal adicionar -->
      <div class="desenhos-modal-overlay" id="desenhos-modal">
        <div class="desenhos-modal">
          <h3>Adicionar Item</h3>
          <label id="desenhos-lbl-col1">Coluna 1</label>
          <input id="desenhos-inp-col1" />
          <label id="desenhos-lbl-col2">Coluna 2</label>
          <input id="desenhos-inp-col2" />
          <label id="desenhos-lbl-col3">Coluna 3 (opcional)</label>
          <input id="desenhos-inp-col3" type="url" placeholder="https://..." />
          <div class="desenhos-modal-footer">
            <button class="desenhos-modal-cancel" id="desenhos-modal-cancel">Cancelar</button>
            <button class="desenhos-modal-save"   id="desenhos-modal-save">Salvar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(page);
    this._page = page;
    this._tbody = page.querySelector('#desenhos-tbody');
    this._emptyEl = page.querySelector('#desenhos-empty');

    // Navegação
    page.querySelector('#desenhos-back-btn').addEventListener('click', () => {
      this.hide();
      this._bus.emit('nav:change', { page: 'dashboard' });
    });

    // Adicionar item
    page.querySelector('#desenhos-add-btn').addEventListener('click', () => this._openModal());
    page.querySelector('#desenhos-modal-cancel').addEventListener('click', () => this._closeModal());
    page.querySelector('#desenhos-modal-save').addEventListener('click', () => this._saveItem());
    page.querySelector('#desenhos-modal').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveItem();
      if (e.key === 'Escape') this._closeModal();
    });

    // Editar cabeçalho
    page.querySelector('#desenhos-edit-header-btn').addEventListener('click', () => this._openHeaderModal());
    page.querySelector('#desenhos-hdr-cancel').addEventListener('click', () => this._closeHeaderModal());
    page.querySelector('#desenhos-hdr-save').addEventListener('click', () => this._saveHeader());
    page.querySelector('#desenhos-header-modal').addEventListener('keydown', e => {
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
    try { return JSON.parse(localStorage.getItem(KEY_DESENHOS) ?? '[]'); }
    catch { return []; }
  }

  _save(lst) {
    localStorage.setItem(KEY_DESENHOS, JSON.stringify(lst));
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
        a.className = 'desenhos-link';
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
      const actWrap = document.createElement('div'); actWrap.className = 'desenhos-row-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'desenhos-del-btn'; delBtn.innerHTML = '🗑'; delBtn.title = 'Remover';
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
    const modal = this._page.querySelector('#desenhos-modal');
    this._page.querySelector('#desenhos-lbl-col1').textContent = h.col1 || 'Coluna 1';
    this._page.querySelector('#desenhos-lbl-col2').textContent = h.col2 || 'Coluna 2';
    this._page.querySelector('#desenhos-lbl-col3').textContent = (h.col3 || 'Coluna 3') + ' (opcional)';
    this._page.querySelector('#desenhos-inp-col1').value = '';
    this._page.querySelector('#desenhos-inp-col2').value = '';
    this._page.querySelector('#desenhos-inp-col3').value = '';
    modal.classList.add('open');
    this._page.querySelector('#desenhos-inp-col1').focus();
  }

  _closeModal() {
    this._page.querySelector('#desenhos-modal').classList.remove('open');
  }

  _saveItem() {
    const col1 = this._page.querySelector('#desenhos-inp-col1').value.trim();
    const col2 = this._page.querySelector('#desenhos-inp-col2').value.trim();
    const col3 = this._page.querySelector('#desenhos-inp-col3').value.trim();

    if (!col1 || !col2) {
      this._page.querySelector('#desenhos-inp-col1').focus();
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
    this._page.querySelector('#desenhos-th-col1').textContent = h.col1;
    this._page.querySelector('#desenhos-th-col2').textContent = h.col2;
    this._page.querySelector('#desenhos-th-col3').textContent = h.col3;
  }

  _openHeaderModal() {
    const h = this._loadHeader();
    this._page.querySelector('#desenhos-hdr-col1').value = h.col1;
    this._page.querySelector('#desenhos-hdr-col2').value = h.col2;
    this._page.querySelector('#desenhos-hdr-col3').value = h.col3;
    this._page.querySelector('#desenhos-header-modal').classList.add('open');
    this._page.querySelector('#desenhos-hdr-col1').focus();
  }

  _closeHeaderModal() {
    this._page.querySelector('#desenhos-header-modal').classList.remove('open');
  }

  _saveHeader() {
    const col1 = this._page.querySelector('#desenhos-hdr-col1').value.trim();
    const col2 = this._page.querySelector('#desenhos-hdr-col2').value.trim();
    const col3 = this._page.querySelector('#desenhos-hdr-col3').value.trim();
    this._saveHeaderData({ col1, col2, col3 });
    this._closeHeaderModal();
    this._renderHeader();
  }
}
