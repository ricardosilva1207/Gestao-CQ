/**
 * KpiGrid.js — Componente do Grid de KPIs
 * Dashboard Operacional Metrologia v2.0
 *
 * Orquestra renderização e atualização dos cartões de KPI,
 * com suporte a animação de contagem, sparklines e deltas.
 */

import { formatValue, formatNumber, scheduleRender } from '../js/utils.js';

/* ==========================================================================
   KPI GRID COMPONENT
   ========================================================================== */

export class KpiGrid {
  /**
   * @param {Element} container
   * @param {Object} cfg app config
   * @param {EventBus} bus
   */
  constructor(container, cfg, bus) {
    this._el   = container;
    this._cfg  = cfg;
    this._bus  = bus;
    this._defs = cfg?.kpis ?? [];
    this._data = null;
    this._cards = new Map(); // id → { card, valueEl, deltaEl, progressFill }
  }

  /**
   * Renderiza o grid pela primeira vez
   * @param {Object} kpiData
   */
  render(kpiData) {
    this._data = kpiData;
    this._el.className = 'kpis';
    this._el.innerHTML = '';
    this._cards.clear();

    const colorClasses = ['accent', 'danger', 'amber', 'ok', 'info', 'warn'];

    this._defs.forEach((def, i) => {
      const colorClass = def.colorClass ?? colorClasses[i % colorClasses.length];
      const { card, refs } = this._buildCard(def, kpiData, colorClass);
      this._cards.set(def.id, refs);
      this._el.appendChild(card);
    });

    // Anima valores na primeira carga
    scheduleRender(() => this._animateValues());
  }

  /**
   * Atualiza valores sem re-renderizar
   * @param {Object} kpiData
   */
  update(kpiData) {
    if (!this._data) { this.render(kpiData); return; }
    this._data = kpiData;

    this._defs.forEach(def => {
      const refs = this._cards.get(def.id);
      if (!refs) return;

      const value = kpiData[def.id];
      if (refs.valueEl) {
        refs.valueEl.textContent = formatValue(value, def.format ?? 'number');
        refs.valueEl.dataset.raw = String(value ?? 0);
      }

      const delta = kpiData.deltas?.[def.id];
      if (refs.deltaEl && delta) {
        const isUp = delta.dir === 'up';
        refs.deltaEl.className = `kpi__delta kpi__delta--${isUp ? 'up' : 'down'}`;
        const arrow = refs.deltaEl.querySelector('.kpi__delta-arrow');
        const txt   = refs.deltaEl.querySelector('.kpi__delta-txt');
        if (arrow) arrow.textContent = isUp ? '▲' : '▼';
        if (txt)   txt.textContent   = `${formatValue(Math.abs(delta.value), def.format ?? 'number')} vs 5 meses`;
      }

      if (refs.progressFill && typeof kpiData[`${def.id}Pct`] === 'number') {
        const pct = Math.max(0, Math.min(100, kpiData[`${def.id}Pct`]));
        refs.progressFill.style.width = `${pct}%`;
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* PRIVATE                                                                   */
  /* ---------------------------------------------------------------------- */

  _buildCard(def, kpiData, colorClass) {
    const value = kpiData?.[def.id];
    const delta = kpiData?.deltas?.[def.id];
    const progress = kpiData?.[`${def.id}Pct`];

    const card = document.createElement('div');
    card.className   = `kpi kpi--${colorClass}`;
    card.dataset.kpi = def.id;
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', def.label);

    // Acento de cor via CSS var (se definido)
    if (def.colorVar) {
      card.style.setProperty('--kpi-accent', `var(${def.colorVar})`);
    }

    // Ícone decorativo
    if (def.icon) {
      const iconEl = document.createElement('span');
      iconEl.className   = 'kpi__icon';
      iconEl.textContent = def.icon;
      iconEl.setAttribute('aria-hidden', 'true');
      card.appendChild(iconEl);
    }

    // Label
    const labelEl = document.createElement('div');
    labelEl.className   = 'kpi__label';
    labelEl.textContent = def.label;
    card.appendChild(labelEl);

    // Valor principal
    const valueEl = document.createElement('div');
    valueEl.className    = 'kpi__value';
    valueEl.textContent  = formatValue(value, def.format ?? 'number');
    valueEl.dataset.raw  = String(value ?? 0);
    valueEl.dataset.fmt  = def.format ?? 'number';
    card.appendChild(valueEl);

    // Delta
    let deltaEl = null;
    if (delta) {
      deltaEl = document.createElement('div');
      const isUp = delta.dir === 'up';
      deltaEl.className = `kpi__delta kpi__delta--${isUp ? 'up' : 'down'}`;

      const arrow = document.createElement('span');
      arrow.className   = 'kpi__delta-arrow';
      arrow.textContent = isUp ? '▲' : '▼';

      const txt = document.createElement('span');
      txt.className   = 'kpi__delta-txt';
      txt.textContent = `${formatValue(Math.abs(delta.value), def.format ?? 'number')} vs 5 meses`;

      deltaEl.appendChild(arrow);
      deltaEl.appendChild(txt);
      card.appendChild(deltaEl);
    }

    // Progress bar (opcional)
    let progressFill = null;
    if (typeof progress === 'number' || def.showProgress) {
      const prog = document.createElement('div');
      prog.className = 'kpi__progress';
      prog.setAttribute('role', 'progressbar');
      prog.setAttribute('aria-valuemin', '0');
      prog.setAttribute('aria-valuemax', '100');

      progressFill = document.createElement('div');
      progressFill.className  = 'kpi__progress-fill';
      progressFill.style.width = '0%';

      prog.appendChild(progressFill);
      card.appendChild(prog);

      // Anima após render
      if (typeof progress === 'number') {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const pct = Math.max(0, Math.min(100, progress));
            progressFill.style.width = `${pct}%`;
            prog.setAttribute('aria-valuenow', String(pct));
          }, 80);
        });
      }
    }

    // Clique → emite evento de drill-down
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      this._bus.emit('kpi:click', { id: def.id, label: def.label, value });
    });

    return {
      card,
      refs: { valueEl, deltaEl, progressFill },
    };
  }

  /** Animação suave de contagem nos valores numéricos */
  _animateValues() {
    this._el.querySelectorAll('.kpi__value').forEach(el => {
      const raw = parseFloat(el.dataset.raw);
      const fmt = el.dataset.fmt ?? 'number';
      if (isNaN(raw) || fmt === 'text') return;

      const duration = 800; // ms
      const start    = performance.now();
      const from     = 0;
      const to       = raw;

      const tick = now => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = from + (to - from) * eased;
        el.textContent = formatValue(current, fmt);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = formatValue(to, fmt);
      };

      requestAnimationFrame(tick);
    });
  }
}
