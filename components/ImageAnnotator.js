/**
 * ImageAnnotator.js — Editor de imagem canvas-based
 *
 * Ferramentas: seleção, corte, retângulo, elipse, seta, linha, pincel livre, texto.
 * Cores, espessura, preenchido/vazado, contorno tracejado/contínuo.
 * Undo (histórico completo) e limpar tudo.
 * Salvamento destrutivo: rasteriza todas as marcações na imagem final.
 * Vanilla JS, sem dependências. Mouse + touch.
 *
 * Uso:
 *   ImageAnnotator.open(dataUrl, (newDataUrl) => { ... });
 *   Para cancelar, o callback não é chamado (retorna null se preferir):
 *   ImageAnnotator.open(dataUrl, (dataUrl, cancelled) => { ... });
 */

const COLORS     = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#000000', '#ffffff'];
const THICKNESS  = [2, 4, 8];
const TOOLS = {
  select: '🖱',
  crop:   '✂',
  rect:   '▭',
  ellipse:'⭕',
  arrow:  '➜',
  line:   '─',
  pen:    '✏',
  text:   'A',
};
const TOOL_LABELS = {
  select: 'Selecionar', crop: 'Cortar', rect: 'Retângulo', ellipse: 'Elipse',
  arrow: 'Seta',       line: 'Linha',  pen: 'Pincel',     text: 'Texto',
};

export class ImageAnnotator {
  static open(dataUrl, cb) {
    const inst = new ImageAnnotator();
    inst._open(dataUrl, cb);
    return inst;
  }

  constructor() {
    this._injectCss();
  }

  _injectCss() {
    if (document.getElementById('_annot_css')) return;
    const s = document.createElement('style');
    s.id = '_annot_css';
    s.textContent = `
      .annot-ov {
        position:fixed; inset:0; background:#111; z-index:2500;
        display:flex; flex-direction:column;
      }
      .annot-topbar {
        display:flex; align-items:center; gap:8px; padding:8px 12px;
        background:#1a1a1a; border-bottom:1px solid #333; color:#fff;
        flex-wrap:wrap;
      }
      .annot-title { font-size:13px; font-weight:800; margin-right:auto; letter-spacing:.4px; }

      .annot-group {
        display:flex; align-items:center; gap:2px;
        padding:0 8px; border-left:1px solid #333;
      }
      .annot-group:first-of-type { border-left:none; padding-left:0; }
      .annot-tool {
        min-width:34px; height:34px; padding:0 8px;
        background:#2a2a2a; border:1px solid #333;
        color:#eaeaea; border-radius:6px; font-size:14px; font-weight:700;
        cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
        transition:all .12s;
      }
      .annot-tool:hover { background:#3a3a3a; border-color:#4ea3ff; }
      .annot-tool.active {
        background:#4ea3ff; border-color:#4ea3ff; color:#fff;
      }
      .annot-tool[disabled] { opacity:.35; cursor:not-allowed; }
      .annot-tool small { font-size:10px; margin-left:4px; font-weight:600; }

      .annot-color {
        width:26px; height:26px; border-radius:50%; border:2px solid #444; cursor:pointer;
        transition:transform .12s;
      }
      .annot-color:hover { transform:scale(1.1); }
      .annot-color.active { border-color:#fff; box-shadow:0 0 0 2px #4ea3ff; }

      .annot-thick {
        width:34px; height:34px; background:#2a2a2a; border:1px solid #333; border-radius:6px;
        cursor:pointer; display:inline-flex; align-items:center; justify-content:center;
      }
      .annot-thick.active { background:#4ea3ff; border-color:#4ea3ff; }
      .annot-thick .dot { background:currentColor; border-radius:50%; color:#fff; }

      .annot-chk {
        display:inline-flex; align-items:center; gap:5px; padding:0 8px; height:34px;
        background:#2a2a2a; border:1px solid #333; border-radius:6px; color:#eaeaea;
        font-size:11px; font-weight:600; cursor:pointer;
      }
      .annot-chk input { accent-color:#4ea3ff; }

      .annot-canvas-wrap {
        flex:1; overflow:auto; display:flex; align-items:center; justify-content:center;
        background:#0a0a0a; padding:12px; position:relative;
      }
      .annot-canvas {
        background:#fff; box-shadow:0 8px 32px rgba(0,0,0,.5);
        cursor:crosshair;
        touch-action:none;
        max-width:100%; max-height:100%;
      }
      .annot-canvas.tool-select { cursor:default; }
      .annot-canvas.tool-text   { cursor:text; }

      .annot-textbox {
        position:absolute; z-index:10;
        border:1px dashed #4ea3ff; background:rgba(255,255,255,.9);
        padding:4px 6px; font-family:inherit; outline:none;
        min-width:60px;
      }

      .annot-footer {
        padding:10px 14px; background:#1a1a1a; border-top:1px solid #333;
        display:flex; justify-content:space-between; align-items:center; color:#ccc;
      }
      .annot-info { font-size:11px; opacity:.7; }
      .annot-btn {
        padding:8px 16px; border-radius:6px; border:1px solid #444; background:#2a2a2a;
        color:#eaeaea; font-size:12px; font-weight:700; cursor:pointer;
      }
      .annot-btn:hover { border-color:#4ea3ff; color:#4ea3ff; }
      .annot-btn--primary { background:#4ea3ff; border-color:#4ea3ff; color:#fff; }
      .annot-btn--primary:hover { opacity:.9; color:#fff; }
    `;
    document.head.appendChild(s);
  }

  _open(dataUrl, cb) {
    const img = new Image();
    img.onload = () => this._start(img, cb);
    img.onerror = () => cb?.(dataUrl, true);
    img.src = dataUrl;
  }

  _start(img, cb) {
    // Estado
    this._img       = img;
    this._shapes    = [];     // shapes já commitadas
    this._history   = [];     // stack de states para undo (JSON de shapes)
    this._tool      = 'rect';
    this._color     = COLORS[0];
    this._thickness = THICKNESS[0];
    this._filled    = false;
    this._dashed    = false;
    this._drawing   = false;
    this._current   = null;   // shape em preview
    this._cropRect  = null;   // rect ativo em modo crop
    this._callback  = cb;

    // ─ Elementos do UI ──────────────────────────────
    const ov = document.createElement('div');
    ov.className = 'annot-ov';
    ov.innerHTML = `
      <div class="annot-topbar">
        <div class="annot-title">✏ Editar Imagem</div>

        <div class="annot-group" id="annot-tools"></div>

        <div class="annot-group" id="annot-colors"></div>

        <div class="annot-group" id="annot-thicks"></div>

        <div class="annot-group">
          <label class="annot-chk"><input type="checkbox" id="annot-filled"> Preenchido</label>
          <label class="annot-chk"><input type="checkbox" id="annot-dashed"> Tracejado</label>
        </div>

        <div class="annot-group">
          <button class="annot-tool" id="annot-undo" title="Desfazer (Ctrl+Z)">↶</button>
          <button class="annot-tool" id="annot-clear" title="Limpar tudo">🗑</button>
        </div>
      </div>

      <div class="annot-canvas-wrap" id="annot-wrap">
        <canvas class="annot-canvas" id="annot-canvas"></canvas>
      </div>

      <div class="annot-footer">
        <div class="annot-info" id="annot-info"></div>
        <div>
          <button class="annot-btn" id="annot-cancel">Cancelar</button>
          <button class="annot-btn annot-btn--primary" id="annot-save">Salvar</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    this._ov = ov;

    // Canvas
    this._canvas = ov.querySelector('#annot-canvas');
    this._ctx    = this._canvas.getContext('2d');
    // Escala inicial (fit em tela)
    const wrap = ov.querySelector('#annot-wrap');
    const maxW = wrap.clientWidth  - 32;
    const maxH = wrap.clientHeight - 32;
    const scale = Math.min(1, maxW / img.width, maxH / img.height);
    this._canvas.width  = Math.round(img.width);
    this._canvas.height = Math.round(img.height);
    this._canvas.style.width  = Math.round(img.width * scale)  + 'px';
    this._canvas.style.height = Math.round(img.height * scale) + 'px';
    this._displayScale = scale;

    // Toolbars
    this._buildToolBtns(ov);
    this._buildColorBtns(ov);
    this._buildThickBtns(ov);
    this._updateActive();

    ov.querySelector('#annot-filled').addEventListener('change', ev => this._filled = ev.target.checked);
    ov.querySelector('#annot-dashed').addEventListener('change', ev => this._dashed = ev.target.checked);
    ov.querySelector('#annot-undo').addEventListener('click', () => this._undo());
    ov.querySelector('#annot-clear').addEventListener('click', () => this._clear());

    ov.querySelector('#annot-cancel').addEventListener('click', () => this._close(false));
    ov.querySelector('#annot-save').addEventListener('click', () => this._save());

    // Eventos de desenho (mouse + touch)
    this._bindPointer();

    // Atalho Ctrl+Z e Esc
    this._keyHandler = e => {
      if (e.key === 'Escape') this._close(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this._undo(); }
    };
    document.addEventListener('keydown', this._keyHandler);

    this._render();
    this._updateInfo();
  }

  _buildToolBtns(ov) {
    const box = ov.querySelector('#annot-tools');
    Object.entries(TOOLS).forEach(([id, icon]) => {
      const b = document.createElement('button');
      b.className = 'annot-tool';
      b.dataset.tool = id;
      b.title = TOOL_LABELS[id];
      b.textContent = icon;
      b.addEventListener('click', () => { this._tool = id; this._current = null; this._cropRect = null; this._updateActive(); this._render(); });
      box.appendChild(b);
    });
  }
  _buildColorBtns(ov) {
    const box = ov.querySelector('#annot-colors');
    COLORS.forEach(c => {
      const b = document.createElement('button');
      b.className = 'annot-color';
      b.style.background = c;
      b.dataset.color = c;
      b.title = c;
      b.addEventListener('click', () => { this._color = c; this._updateActive(); });
      box.appendChild(b);
    });
  }
  _buildThickBtns(ov) {
    const box = ov.querySelector('#annot-thicks');
    THICKNESS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'annot-thick';
      b.dataset.thick = t;
      b.title = t + 'px';
      b.innerHTML = `<span class="dot" style="width:${t*2}px;height:${t*2}px;"></span>`;
      b.addEventListener('click', () => { this._thickness = t; this._updateActive(); });
      box.appendChild(b);
    });
  }
  _updateActive() {
    this._ov.querySelectorAll('.annot-tool[data-tool]').forEach(b =>
      b.classList.toggle('active', b.dataset.tool === this._tool));
    this._ov.querySelectorAll('.annot-color').forEach(b =>
      b.classList.toggle('active', b.dataset.color === this._color));
    this._ov.querySelectorAll('.annot-thick').forEach(b =>
      b.classList.toggle('active', Number(b.dataset.thick) === this._thickness));
    // Cursor
    this._canvas.className = 'annot-canvas tool-' + this._tool;
  }

  /* ── Pointer events ─────────────────────────────────────────── */
  _bindPointer() {
    const c = this._canvas;
    const getPt = ev => {
      const r = c.getBoundingClientRect();
      const src = ev.touches ? ev.touches[0] : ev;
      return {
        x: (src.clientX - r.left) / this._displayScale,
        y: (src.clientY - r.top)  / this._displayScale,
      };
    };
    const down = ev => {
      ev.preventDefault();
      const p = getPt(ev);
      this._onDown(p);
    };
    const move = ev => {
      if (!this._drawing) return;
      ev.preventDefault();
      const p = getPt(ev);
      this._onMove(p);
    };
    const up = ev => {
      if (!this._drawing) return;
      ev.preventDefault();
      const p = ev.changedTouches ? getPt({ touches: ev.changedTouches }) : getPt(ev);
      this._onUp(p);
    };
    c.addEventListener('mousedown', down);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    c.addEventListener('touchstart', down, { passive: false });
    c.addEventListener('touchmove',  move, { passive: false });
    c.addEventListener('touchend',   up,   { passive: false });
    // Clique único para texto
    c.addEventListener('click', ev => {
      if (this._tool !== 'text' || this._drawing) return;
      const p = getPt(ev);
      this._promptText(p);
    });
  }

  _onDown(p) {
    if (this._tool === 'select' || this._tool === 'text') return;
    this._drawing = true;
    this._current = this._newShape(p);
  }
  _onMove(p) {
    if (!this._current) return;
    if (this._current.kind === 'pen') {
      this._current.points.push(p);
    } else {
      this._current.x2 = p.x; this._current.y2 = p.y;
    }
    this._render();
  }
  _onUp(p) {
    if (!this._current) { this._drawing = false; return; }
    if (this._current.kind === 'pen') {
      this._current.points.push(p);
    } else {
      this._current.x2 = p.x; this._current.y2 = p.y;
    }
    this._drawing = false;

    if (this._tool === 'crop') {
      // Não commita; guarda como crop pending
      this._cropRect = this._current;
      this._current  = null;
      this._render();
      this._askApplyCrop();
    } else {
      this._pushHistory();
      this._shapes.push(this._current);
      this._current = null;
      this._render();
      this._updateInfo();
    }
  }

  _newShape(p) {
    const base = {
      color: this._color, thickness: this._thickness,
      filled: this._filled, dashed: this._dashed,
      x1: p.x, y1: p.y, x2: p.x, y2: p.y,
    };
    if (this._tool === 'pen') return { kind: 'pen', color: this._color, thickness: this._thickness, points: [p] };
    return { ...base, kind: this._tool };
  }

  /* ── Texto ──────────────────────────────────────────────────── */
  _promptText(p) {
    const wrap = this._ov.querySelector('#annot-wrap');
    const r = this._canvas.getBoundingClientRect();
    const wrapR = wrap.getBoundingClientRect();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'annot-textbox';
    input.style.left = ((r.left - wrapR.left) + p.x * this._displayScale) + 'px';
    input.style.top  = ((r.top  - wrapR.top)  + p.y * this._displayScale) + 'px';
    input.style.color = this._color;
    input.style.fontSize = Math.max(14, this._thickness * 8) + 'px';
    input.style.fontWeight = '700';
    wrap.appendChild(input);
    input.focus();

    const commit = (accept) => {
      const text = input.value.trim();
      input.remove();
      if (!accept || !text) return;
      this._pushHistory();
      this._shapes.push({
        kind: 'text', x1: p.x, y1: p.y,
        color: this._color,
        thickness: this._thickness,
        text,
      });
      this._render(); this._updateInfo();
    };
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Enter')  commit(true);
      if (ev.key === 'Escape') commit(false);
    });
    input.addEventListener('blur', () => commit(true));
  }

  /* ── Crop ───────────────────────────────────────────────────── */
  _askApplyCrop() {
    if (!this._cropRect) return;
    const w = Math.abs(this._cropRect.x2 - this._cropRect.x1);
    const h = Math.abs(this._cropRect.y2 - this._cropRect.y1);
    if (w < 5 || h < 5) { this._cropRect = null; this._render(); return; }
    if (!confirm(`Cortar imagem para ${Math.round(w)}×${Math.round(h)} px?`)) {
      this._cropRect = null; this._render(); return;
    }
    this._applyCrop();
  }
  _applyCrop() {
    const r = this._cropRect;
    const x = Math.round(Math.min(r.x1, r.x2));
    const y = Math.round(Math.min(r.y1, r.y2));
    const w = Math.round(Math.abs(r.x2 - r.x1));
    const h = Math.round(Math.abs(r.y2 - r.y1));
    // Rasteriza tudo primeiro para nao perder marcacoes ja feitas
    const flat = this._flatten();
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(flat, x, y, w, h, 0, 0, w, h);
    const newImg = new Image();
    // Snapshot ANTES de trocar a imagem, para undo funcionar
    this._pushHistory();
    newImg.onload = () => {
      this._img = newImg;
      this._shapes = [];
      this._cropRect = null;
      this._canvas.width  = w;
      this._canvas.height = h;
      this._refitCanvas();
      this._render();
      this._updateInfo();
    };
    newImg.src = tmp.toDataURL('image/png');
  }

  /* ── Undo / Clear ───────────────────────────────────────────── */
  _pushHistory() {
    // Snapshot completo (inclui a imagem base — permite desfazer crop)
    const cvs = document.createElement('canvas');
    cvs.width = this._canvas.width; cvs.height = this._canvas.height;
    cvs.getContext('2d').drawImage(this._img, 0, 0, cvs.width, cvs.height);
    this._history.push({
      shapes: JSON.stringify(this._shapes),
      imgUrl: cvs.toDataURL('image/png'),
      w: this._canvas.width,
      h: this._canvas.height,
    });
    if (this._history.length > 50) this._history.shift();
  }

  _undo() {
    const prev = this._history.pop();
    if (!prev) return;
    try { this._shapes = JSON.parse(prev.shapes); } catch { this._shapes = []; }
    const needImage = prev.w !== this._canvas.width || prev.h !== this._canvas.height;
    if (needImage) {
      const img = new Image();
      img.onload = () => {
        this._img = img;
        this._canvas.width  = prev.w;
        this._canvas.height = prev.h;
        this._refitCanvas();
        this._render(); this._updateInfo();
      };
      img.src = prev.imgUrl;
    } else {
      const img = new Image();
      img.onload = () => { this._img = img; this._render(); this._updateInfo(); };
      img.src = prev.imgUrl;
    }
  }

  _refitCanvas() {
    const wrap = this._ov.querySelector('#annot-wrap');
    const maxW = wrap.clientWidth  - 32;
    const maxH = wrap.clientHeight - 32;
    const sc = Math.min(1, maxW / this._canvas.width, maxH / this._canvas.height);
    this._canvas.style.width  = Math.round(this._canvas.width  * sc) + 'px';
    this._canvas.style.height = Math.round(this._canvas.height * sc) + 'px';
    this._displayScale = sc;
  }
  _clear() {
    if (!this._shapes.length && !this._cropRect) return;
    if (!confirm('Remover todas as marcações?')) return;
    this._pushHistory();
    this._shapes = []; this._cropRect = null;
    this._render(); this._updateInfo();
  }

  /* ── Render ─────────────────────────────────────────────────── */
  _render() {
    const c = this._ctx;
    c.clearRect(0, 0, this._canvas.width, this._canvas.height);
    c.drawImage(this._img, 0, 0, this._canvas.width, this._canvas.height);
    for (const s of this._shapes) this._drawShape(c, s);
    // Preview do shape sendo desenhado: crop tem overlay proprio
    if (this._current) {
      if (this._current.kind === 'crop') this._drawCropOverlay(c, this._current);
      else this._drawShape(c, this._current);
    }
    if (this._cropRect) this._drawCropOverlay(c, this._cropRect);
  }
  _drawShape(c, s) {
    c.save();
    c.strokeStyle = s.color;
    c.fillStyle   = s.color;
    c.lineWidth   = s.thickness || 2;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (s.dashed) c.setLineDash([s.thickness*3, s.thickness*3]);
    switch (s.kind) {
      case 'rect': {
        const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2);
        const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
        if (s.filled) c.fillRect(x, y, w, h);
        else          c.strokeRect(x, y, w, h);
        break;
      }
      case 'ellipse': {
        const cx = (s.x1 + s.x2) / 2, cy = (s.y1 + s.y2) / 2;
        const rx = Math.abs(s.x2 - s.x1) / 2, ry = Math.abs(s.y2 - s.y1) / 2;
        c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (s.filled) c.fill(); else c.stroke();
        break;
      }
      case 'line': {
        c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
        break;
      }
      case 'arrow': {
        c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke();
        // Cabeça da seta
        const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
        const head = Math.max(10, s.thickness * 4);
        c.setLineDash([]);
        c.beginPath();
        c.moveTo(s.x2, s.y2);
        c.lineTo(s.x2 - head * Math.cos(ang - Math.PI/7), s.y2 - head * Math.sin(ang - Math.PI/7));
        c.lineTo(s.x2 - head * Math.cos(ang + Math.PI/7), s.y2 - head * Math.sin(ang + Math.PI/7));
        c.closePath(); c.fill();
        break;
      }
      case 'pen': {
        c.beginPath();
        s.points.forEach((p, i) => i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y));
        c.stroke();
        break;
      }
      case 'text': {
        const size = Math.max(14, s.thickness * 8);
        c.font = `bold ${size}px sans-serif`;
        c.textBaseline = 'top';
        // Contorno preto/branco para legibilidade
        c.setLineDash([]);
        c.lineWidth = Math.max(2, s.thickness);
        c.strokeStyle = s.color === '#ffffff' ? '#000000' : '#ffffff';
        c.strokeText(s.text, s.x1, s.y1);
        c.fillStyle = s.color;
        c.fillText(s.text, s.x1, s.y1);
        break;
      }
      case 'crop': break;
    }
    c.restore();
  }
  _drawCropOverlay(c, s) {
    const x = Math.min(s.x1, s.x2), y = Math.min(s.y1, s.y2);
    const w = Math.abs(s.x2 - s.x1), h = Math.abs(s.y2 - s.y1);
    c.save();
    c.fillStyle = 'rgba(0,0,0,.45)';
    c.fillRect(0, 0, this._canvas.width, this._canvas.height);
    c.clearRect(x, y, w, h);
    c.drawImage(this._img, x, y, w, h, x, y, w, h);
    c.strokeStyle = '#4ea3ff'; c.lineWidth = 2; c.setLineDash([6, 6]);
    c.strokeRect(x, y, w, h);
    c.restore();
  }

  /* ── Flatten / Save ─────────────────────────────────────────── */
  _flatten() {
    // Renderiza imagem + shapes num canvas offscreen do tamanho da imagem original
    const tmp = document.createElement('canvas');
    tmp.width = this._canvas.width; tmp.height = this._canvas.height;
    const c = tmp.getContext('2d');
    c.drawImage(this._img, 0, 0, tmp.width, tmp.height);
    for (const s of this._shapes) this._drawShape(c, s);
    return tmp;
  }
  _save() {
    const tmp = this._flatten();
    // JPEG comprimido para arquivos menores; se tiver transparência, PNG seria melhor
    const url = tmp.toDataURL('image/jpeg', 0.9);
    this._close(true, url);
  }

  _close(ok, url) {
    document.removeEventListener('keydown', this._keyHandler);
    this._ov.remove();
    this._callback?.(ok ? url : null, !ok);
  }

  _updateInfo() {
    const info = this._ov.querySelector('#annot-info');
    if (info) info.textContent = `${this._canvas.width}×${this._canvas.height} · ${this._shapes.length} marcação(ões) · Undo com Ctrl+Z · Esc cancela`;
  }
}
