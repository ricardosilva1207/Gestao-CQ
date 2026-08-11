/**
 * NormasPage.js — Página de Normas Metrologia
 * Exibe tabela de normas: Nº Norma | Nome da Norma | Link
 */

const KEY_NORMAS   = 'metrologia_normas';
const KEY_CABECALHO = 'metrologia_normas_cabecalho';
const DEFAULT_CABECALHO = { col1: 'Nº Norma', col2: 'Nome da Norma', col3: 'Link' };

export class NormasPage {
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
    page.id = 'normas-page';
    page.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;left:var(--sidebar-w,240px);z-index:1200;background:var(--bg,#0d1521);overflow-y:auto;';

    page.innerHTML = `
      <style>
        .normas-topbar {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 24px; background: var(--surface,#111c2e);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 10;
        }
        .normas-back {
          padding: 6px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: border-color .15s;
          flex-shrink: 0; white-space: nowrap;
        }
        .normas-back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .normas-page-title { font-size: 15px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .normas-wrap { max-width: 960px; margin: 28px auto; padding: 0 20px 40px; }

        .normas-toolbar {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .normas-add-btn {
          padding: 7px 16px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff;
          font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity .15s;
        }
        .normas-add-btn:hover { opacity: .85; }

        .normas-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .normas-table thead tr {
          background: #f5d800; color: #1a1200;
        }
        .normas-table thead th {
          padding: 10px 14px; font-weight: 900; font-size: 12px;
          text-transform: uppercase; letter-spacing: .5px; text-align: left;
          border: 1px solid #c8a000;
        }
        .normas-table thead th:first-child { width: 110px; }
        .normas-table thead th:last-child  { width: 80px; text-align: center; }
        .normas-edit-header-btn {
          padding: 7px 16px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
          transition: border-color .15s, color .15s;
        }
        .normas-edit-header-btn:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }

        .normas-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: background .12s;
        }
        .normas-table tbody tr:hover { background: rgba(78,163,255,.06); }
        .normas-table tbody td {
          padding: 10px 14px; vertical-align: middle; color: var(--text);
        }
        .normas-table tbody td:last-child { text-align: center; }

        .normas-link {
          color: var(--accent,#4ea3ff); text-decoration: none; font-size: 12px;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .normas-link:hover { text-decoration: underline; }

        .normas-empty {
          text-align: center; color: var(--text-mute); padding: 40px 0;
          font-size: 13px; font-style: italic;
        }

        /* Ações por linha */
        .normas-row-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .normas-del-btn {
          background: none; border: 1px solid transparent; border-radius: 5px;
          color: var(--text-mute); font-size: 13px; cursor: pointer; padding: 3px 6px;
          opacity: .5; transition: all .15s;
        }
        .normas-del-btn:hover { border-color: var(--danger,#ef4757); color: var(--danger,#ef4757); opacity: 1; background: rgba(239,71,87,.1); }

        /* Modal de adicionar */
        .normas-modal-overlay {
          display: none; position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.55); align-items: center; justify-content: center;
        }
        .normas-modal-overlay.open { display: flex; }
        .normas-modal {
          background: var(--surface,#111c2e); border: 1px solid var(--border);
          border-radius: 12px; padding: 24px; width: 440px; max-width: 95vw;
        }
        .normas-modal h3 { margin: 0 0 16px; font-size: 14px; font-weight: 700; }
        .normas-modal label { display: block; font-size: 11px; color: var(--text-mute); margin-bottom: 4px; margin-top: 12px; }
        .normas-modal input {
          width: 100%; box-sizing: border-box;
          background: var(--bg,#0d1521); border: 1px solid var(--border); border-radius: 6px;
          padding: 8px 10px; color: var(--text); font-size: 13px;
        }
        .normas-modal input:focus { outline: none; border-color: var(--accent,#4ea3ff); }
        .normas-modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .normas-modal-save {
          padding: 7px 18px; border-radius: 7px; border: none;
          background: var(--accent,#4ea3ff); color: #fff; font-weight: 700; font-size: 12px; cursor: pointer;
        }
        .normas-modal-cancel {
          padding: 7px 14px; border-radius: 7px; border: 1px solid var(--border);
          background: none; color: var(--text); font-size: 12px; cursor: pointer;
        }
      </style>

      <!-- Top bar -->
      <div class="normas-topbar">
        <button class="normas-back" id="normas-back-btn">← Voltar ao Dashboard</button>
        <div class="normas-page-title">📄 Normas Metrologia</div>
      </div>

      <!-- Conteúdo -->
      <div class="normas-wrap">
        <div class="normas-toolbar">
          <button class="normas-add-btn" id="normas-add-btn">+ Adicionar Norma</button>
          <button class="normas-edit-header-btn" id="normas-edit-header-btn">✎ Editar Cabeçalho</button>
        </div>

        <table class="normas-table">
          <thead>
            <tr>
              <th id="normas-th-col1"></th>
              <th id="normas-th-col2"></th>
              <th id="normas-th-col3"></th>
              <th></th>
            </tr>
          </thead>
          <tbody id="normas-tbody"></tbody>
        </table>
        <div id="normas-empty" class="normas-empty" style="display:none;">Nenhuma norma cadastrada.</div>
      </div>

      <!-- Modal editar cabeçalho -->
      <div class="normas-modal-overlay" id="normas-header-modal">
        <div class="normas-modal">
          <h3>✏️ Editar Cabeçalho</h3>
          <label>Coluna 1</label>
          <input id="normas-hdr-col1" />
          <label>Coluna 2</label>
          <input id="normas-hdr-col2" />
          <label>Coluna 3</label>
          <input id="normas-hdr-col3" />
          <div class="normas-modal-footer">
            <button class="normas-modal-cancel" id="normas-hdr-cancel">Cancelar</button>
            <button class="normas-modal-save"   id="normas-hdr-save">Salvar</button>
          </div>
        </div>
      </div>

      <!-- Modal adicionar -->
      <div class="normas-modal-overlay" id="normas-modal">
        <div class="normas-modal">
          <h3>Adicionar Norma</h3>
          <label>Nº Norma</label>
          <input id="normas-inp-num" placeholder="Ex: NBR ISO 9001" />
          <label>Nome da Norma</label>
          <input id="normas-inp-nome" placeholder="Ex: Sistemas de gestão da qualidade" />
          <label>Link (opcional)</label>
          <input id="normas-inp-link" placeholder="https://..." type="url" />
          <div class="normas-modal-footer">
            <button class="normas-modal-cancel" id="normas-modal-cancel">Cancelar</button>
            <button class="normas-modal-save"   id="normas-modal-save">Salvar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(page);
    this._page = page;
    this._tbody = page.querySelector('#normas-tbody');
    this._emptyEl = page.querySelector('#normas-empty');

    // Eventos — navegação
    page.querySelector('#normas-back-btn').addEventListener('click', () => {
      this.hide();
      this._bus.emit('nav:change', { page: 'dashboard' });
    });

    // Eventos — adicionar norma
    page.querySelector('#normas-add-btn').addEventListener('click', () => this._openModal());
    page.querySelector('#normas-modal-cancel').addEventListener('click', () => this._closeModal());
    page.querySelector('#normas-modal-save').addEventListener('click', () => this._saveNorma());
    page.querySelector('#normas-modal').addEventListener('keydown', e => {
      if (e.key === 'Enter') this._saveNorma();
      if (e.key === 'Escape') this._closeModal();
    });

    // Eventos — editar cabeçalho
    page.querySelector('#normas-edit-header-btn').addEventListener('click', () => this._openHeaderModal());
    page.querySelector('#normas-hdr-cancel').addEventListener('click', () => this._closeHeaderModal());
    page.querySelector('#normas-hdr-save').addEventListener('click', () => this._saveHeader());
    page.querySelector('#normas-header-modal').addEventListener('keydown', e => {
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
    try { return JSON.parse(localStorage.getItem(KEY_NORMAS) ?? '[]'); }
    catch { return []; }
  }

  _save(lst) {
    localStorage.setItem(KEY_NORMAS, JSON.stringify(lst));
  }

  /* ── Tabela ────────────────────────────────────────────── */
  _renderTable() {
    const normas = this._load();
    this._tbody.innerHTML = '';

    if (!normas.length) {
      this._emptyEl.style.display = '';
      return;
    }
    this._emptyEl.style.display = 'none';

    normas.forEach((n, idx) => {
      const tr = document.createElement('tr');

      const tdNum  = document.createElement('td'); tdNum.textContent = n.numero;
      const tdNome = document.createElement('td'); tdNome.textContent = n.nome;
      const tdLink = document.createElement('td');

      if (n.link) {
        const a = document.createElement('a');
        a.className = 'normas-link';
        a.href = n.link; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.innerHTML = '🔗 Abrir';
        tdLink.appendChild(a);
      } else {
        tdLink.textContent = '—';
        tdLink.style.color = 'var(--text-mute)';
      }

      const tdAcoes = document.createElement('td');
      const actWrap = document.createElement('div'); actWrap.className = 'normas-row-actions';

      const delBtn = document.createElement('button');
      delBtn.className = 'normas-del-btn'; delBtn.innerHTML = '🗑'; delBtn.title = 'Remover';
      delBtn.addEventListener('click', () => this._deleteNorma(idx));
      actWrap.appendChild(delBtn);
      tdAcoes.appendChild(actWrap);

      tr.appendChild(tdNum); tr.appendChild(tdNome); tr.appendChild(tdLink); tr.appendChild(tdAcoes);
      this._tbody.appendChild(tr);
    });
  }

  /* ── Modal ─────────────────────────────────────────────── */
  _openModal() {
    const modal = this._page.querySelector('#normas-modal');
    this._page.querySelector('#normas-inp-num').value  = '';
    this._page.querySelector('#normas-inp-nome').value = '';
    this._page.querySelector('#normas-inp-link').value = '';
    modal.classList.add('open');
    this._page.querySelector('#normas-inp-num').focus();
  }

  _closeModal() {
    this._page.querySelector('#normas-modal').classList.remove('open');
  }

  _saveNorma() {
    const num  = this._page.querySelector('#normas-inp-num').value.trim();
    const nome = this._page.querySelector('#normas-inp-nome').value.trim();
    const link = this._page.querySelector('#normas-inp-link').value.trim();

    if (!num || !nome) {
      this._page.querySelector('#normas-inp-num').focus();
      return;
    }

    const lst = this._load();
    lst.push({ numero: num, nome, link });
    this._save(lst);
    this._closeModal();
    this._renderTable();
  }

  _deleteNorma(idx) {
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
    this._page.querySelector('#normas-th-col1').textContent = h.col1;
    this._page.querySelector('#normas-th-col2').textContent = h.col2;
    this._page.querySelector('#normas-th-col3').textContent = h.col3;
  }

  _openHeaderModal() {
    const h = this._loadHeader();
    this._page.querySelector('#normas-hdr-col1').value = h.col1;
    this._page.querySelector('#normas-hdr-col2').value = h.col2;
    this._page.querySelector('#normas-hdr-col3').value = h.col3;
    this._page.querySelector('#normas-header-modal').classList.add('open');
    this._page.querySelector('#normas-hdr-col1').focus();
  }

  _closeHeaderModal() {
    this._page.querySelector('#normas-header-modal').classList.remove('open');
  }

  _saveHeader() {
    const col1 = this._page.querySelector('#normas-hdr-col1').value.trim();
    const col2 = this._page.querySelector('#normas-hdr-col2').value.trim();
    const col3 = this._page.querySelector('#normas-hdr-col3').value.trim();
    if (!col1 || !col2 || !col3) return;
    this._saveHeaderData({ col1, col2, col3 });
    this._closeHeaderModal();
    this._renderHeader();
  }
}
