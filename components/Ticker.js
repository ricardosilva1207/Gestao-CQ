/**
 * Ticker.js — LED Ticker / Fita de Status
 * Dashboard Metrologia — Painel de Controle
 *
 * Layout: [● STATUS] [16:03:52] | item ◆ item ◆ item →→→
 * Fontes: cronograma do dia, atrasados, análise extra pendente
 */

export class Ticker {
  constructor(container, cfg, bus) {
    this._el       = container;
    this._cfg      = cfg;
    this._bus      = bus;
    this._items    = [];
    this._clockEl  = null;
    this._trackEl  = null;
    this._labelEl  = null;
    this._interval = null;
  }

  render() {
    this._el.className = 'ticker';
    this._el.innerHTML = '';

    // Label dinâmico
    const label = document.createElement('div');
    label.className = 'ticker__label';
    label.innerHTML = '● ATIVIDADES DO DIA';
    this._labelEl = label;
    this._el.appendChild(label);

    // Relógio
    const clock = document.createElement('div');
    clock.className = 'ticker__time';
    this._clockEl = clock;
    this._el.appendChild(clock);

    // Separador
    const sep = document.createElement('span');
    sep.className = 'ticker__sep';
    this._el.appendChild(sep);

    // Viewport + track
    const viewport = document.createElement('div');
    viewport.className = 'ticker__viewport';

    const track = document.createElement('div');
    track.className = 'ticker__track';
    this._trackEl   = track;
    viewport.appendChild(track);
    this._el.appendChild(viewport);

    this._startClock();
    this._renderItems();
  }

  setItems(items) {
    this._items = items ?? [];
    this._renderItems();
  }

  destroy() {
    if (this._interval) clearInterval(this._interval);
  }

  /* ------------------------------------------------------------------ */

  _renderItems() {
    if (!this._trackEl) return;
    this._trackEl.innerHTML = '';

    if (!this._items.length) {
      const span = document.createElement('span');
      span.className   = 'ticker__item ticker__item--warn';
      span.textContent = 'Carregando atividades do dia...';
      this._trackEl.appendChild(span);
      this._updateLabel([]);
      return;
    }

    this._updateLabel(this._items);

    // Calcula quantas repetições precisamos para preencher bem o scroll
    const reps = Math.max(2, Math.ceil(8 / this._items.length));
    const repeated = [];
    for (let r = 0; r < reps; r++) repeated.push(...this._items);

    repeated.forEach((item, i) => {
      if (i > 0) {
        const dot = document.createElement('span');
        dot.className   = 'ticker__item';
        dot.style.cssText = 'opacity:.35; font-size:14px;';
        dot.textContent = '  ◆  ';
        this._trackEl.appendChild(dot);
      }

      const span = document.createElement('span');
      span.className = `ticker__item ticker__item--${item.variant ?? 'warn'}`;

      const labelTxt = item.label ?? '';
      const valueTxt = item.value ? `  [${item.value}]` : '';
      span.textContent = labelTxt + valueTxt;

      this._trackEl.appendChild(span);
    });

    // Velocidade adaptativa: ~80px/s — mais itens = mais tempo
    const totalLen = this._items.reduce((s, it) => s + (it.label ?? '').length + (it.value ?? '').length, 0);
    const duration = Math.max(25, Math.min(150, totalLen * 0.6));

    this._trackEl.style.animation = 'none';
    void this._trackEl.offsetHeight;
    this._trackEl.style.animation = `ticker-scroll ${duration}s linear infinite`;
  }

  /* ── Atualiza label com resumo de status ──
     Usa a categoria real do item (kind) para rotular corretamente —
     evita marcar uma Análise Extra urgente como "ATRASADO" só por ser danger. */
  _updateLabel(items) {
    if (!this._labelEl) return;

    const styleFor = css => this._labelEl.style.cssText = css;
    const DANGER = 'background:#3a0808;border:1px solid #8b1a1a;color:#ff4d4d;font-size:10px;font-weight:800;letter-spacing:.18em;padding:5px 10px;border-radius:4px;text-transform:uppercase;position:relative;z-index:2;flex-shrink:0;text-shadow:0 0 8px rgba(255,77,77,.7);';
    const INFO   = 'background:#0a1a2e;border:1px solid #1a4a8b;color:#4ea3ff;font-size:10px;font-weight:800;letter-spacing:.18em;padding:5px 10px;border-radius:4px;text-transform:uppercase;position:relative;z-index:2;flex-shrink:0;text-shadow:0 0 8px rgba(78,163,255,.7);';
    const WARN   = 'background:#1a0c0c;border:1px solid #4a3a14;color:#ffb547;font-size:10px;font-weight:800;letter-spacing:.18em;padding:5px 10px;border-radius:4px;text-transform:uppercase;position:relative;z-index:2;flex-shrink:0;text-shadow:0 0 8px rgba(255,181,71,.6);';
    const OK     = 'background:#061a06;border:1px solid #1a4a1a;color:#6dff6d;font-size:10px;font-weight:800;letter-spacing:.18em;padding:5px 10px;border-radius:4px;text-transform:uppercase;position:relative;z-index:2;flex-shrink:0;text-shadow:0 0 8px rgba(110,255,110,.6);';
    const NEUTRAL = 'background:#14110a;border:1px solid #3a3320;color:#cbb765;font-size:10px;font-weight:800;letter-spacing:.18em;padding:5px 10px;border-radius:4px;text-transform:uppercase;position:relative;z-index:2;flex-shrink:0;';

    const byKind = k => items.filter(i => i.kind === k).length;
    const nAtraso = byKind('atraso');
    const nExtra  = byKind('extra');
    const nHoje   = byKind('hoje');
    const nOkK    = byKind('ok');
    const hasKind = items.some(i => i.kind);

    if (hasKind) {
      // Rotulagem precisa por categoria (prioridade: atraso → extra → hoje → ok)
      if (nAtraso > 0)      { styleFor(DANGER); this._labelEl.innerHTML = `● ${nAtraso} ATRASADO${nAtraso > 1 ? 'S' : ''}`; }
      else if (nExtra > 0)  { styleFor(INFO);   this._labelEl.innerHTML = `● ${nExtra} ANÁLISE${nExtra > 1 ? 'S' : ''} EXTRA`; }
      else if (nHoje > 0)   { styleFor(WARN);   this._labelEl.innerHTML = `● ${nHoje} PENDENTE${nHoje > 1 ? 'S' : ''} HOJE`; }
      else if (nOkK > 0)    { styleFor(OK);     this._labelEl.innerHTML = `● ${nOkK} REALIZADO${nOkK > 1 ? 'S' : ''}`; }
      else                  { styleFor(NEUTRAL); this._labelEl.innerHTML = '● ATIVIDADES DO DIA'; }
      return;
    }

    // Fallback (itens sem kind) — comportamento neutro
    styleFor(NEUTRAL);
    this._labelEl.innerHTML = '● ATIVIDADES DO DIA';
  }

  _startClock() {
    const tick = () => {
      if (!this._clockEl) return;
      const n = new Date();
      const h = String(n.getHours()).padStart(2, '0');
      const m = String(n.getMinutes()).padStart(2, '0');
      const s = String(n.getSeconds()).padStart(2, '0');
      this._clockEl.textContent = `${h}:${m}:${s}`;
    };
    tick();
    this._interval = setInterval(tick, 1000);
  }
}
