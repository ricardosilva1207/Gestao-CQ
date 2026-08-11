/**
 * utils.js — Funções Utilitárias
 * Dashboard Operacional Metrologia v2.0
 *
 * Funções puras e helpers reutilizáveis em todo o sistema.
 * Sem dependências externas.
 */

/* ==========================================================================
   1. THROTTLE & DEBOUNCE
   ========================================================================== */

/**
 * Debounce — executa fn após delay ms desde o último chamado
 * @param {Function} fn
 * @param {number} delay ms
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle — executa fn no máximo 1x a cada limit ms
 * @param {Function} fn
 * @param {number} limit ms
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

/* ==========================================================================
   2. FORMATAÇÃO
   ========================================================================== */

/**
 * Formata número com separadores de milhar (pt-BR)
 * @param {number} n
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata percentual
 * @param {number} n valor entre 0 e 100
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(n, decimals = 1) {
  if (n == null || isNaN(n)) return '—';
  return `${formatNumber(n, decimals)}%`;
}

/**
 * Formata data/hora em pt-BR
 * @param {Date|string} date
 * @param {Object} opts Intl options
 * @returns {string}
 */
export function formatDate(date, opts = {}) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '—';
  const defaults = {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return d.toLocaleString('pt-BR', { ...defaults, ...opts });
}

/**
 * Formata data relativa ("há 5 min", "ontem")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60)  return 'agora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `há ${diffMin}min`;
  const diffH   = Math.floor(diffMin / 60);
  if (diffH   < 24)  return `há ${diffH}h`;
  const diffD   = Math.floor(diffH   / 24);
  if (diffD   < 30)  return `há ${diffD} dias`;
  return formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formata valor por tipo (number, percent, currency, text)
 * @param {*} value
 * @param {string} type
 * @returns {string}
 */
export function formatValue(value, type = 'number') {
  switch (type) {
    case 'percent':  return formatPercent(value);
    case 'currency': return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—';
    case 'text':     return String(value ?? '—');
    default:         return formatNumber(value);
  }
}

/* ==========================================================================
   3. DOM HELPERS
   ========================================================================== */

/**
 * Query selector helper
 * @param {string} selector
 * @param {Element} ctx
 * @returns {Element|null}
 */
export const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Query selector all helper
 * @param {string} selector
 * @param {Element} ctx
 * @returns {Element[]}
 */
export const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Cria elemento com atributos e filhos
 * @param {string} tag
 * @param {Object} attrs
 * @param {...string|Element} children
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') el.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else if (key.startsWith('on') && typeof val === 'function') el.addEventListener(key.slice(2).toLowerCase(), val);
    else if (val !== null && val !== undefined) el.setAttribute(key, val);
  }
  for (const child of children) {
    if (child == null) continue;
    el.append(typeof child === 'string' ? child : child);
  }
  return el;
}

/**
 * Renderiza HTML string de forma segura (sem eval)
 * @param {Element} container
 * @param {string} html
 */
export function safeSetHTML(container, html) {
  // Usa textContent para texto puro ou innerHTML controlado para templates do sistema
  container.innerHTML = html;
}

/**
 * Remove todos os filhos de um elemento
 * @param {Element} el
 */
export function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Toggle de classe com estado
 * @param {Element} el
 * @param {string} cls
 * @param {boolean} force
 */
export function toggleClass(el, cls, force) {
  if (el) el.classList.toggle(cls, force);
}

/* ==========================================================================
   4. EVENT SYSTEM (Pub/Sub)
   ========================================================================== */

/**
 * EventBus simples para comunicação desacoplada entre módulos
 */
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /** Registra listener */
  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn); // retorna unsubscribe
  }

  /** Remove listener */
  off(event, fn) {
    this._listeners.get(event)?.delete(fn);
  }

  /** Emite evento */
  emit(event, data) {
    this._listeners.get(event)?.forEach(fn => {
      try { fn(data); }
      catch (err) { console.error(`[EventBus] Error in "${event}" listener:`, err); }
    });
  }

  /** Limpa todos os listeners */
  clear() { this._listeners.clear(); }
}

/* ==========================================================================
   5. UTILITÁRIOS DE DADOS
   ========================================================================== */

/**
 * Deep clone de objeto (sem referência)
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); }
  catch { return structuredClone?.(obj) ?? obj; }
}

/**
 * Merge profundo de objetos
 * @param {Object} target
 * @param {...Object} sources
 * @returns {Object}
 */
export function deepMerge(target, ...sources) {
  for (const source of sources) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

/**
 * Agrupa array por chave
 * @param {Array} arr
 * @param {string|Function} key
 * @returns {Object}
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Ordena array por chave
 * @param {Array} arr
 * @param {string} key
 * @param {string} dir 'asc'|'desc'
 * @returns {Array}
 */
export function sortBy(arr, key, dir = 'asc') {
  return [...arr].sort((a, b) => {
    const v1 = a[key], v2 = b[key];
    if (v1 < v2) return dir === 'asc' ? -1 : 1;
    if (v1 > v2) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

/**
 * Filtra array por múltiplos critérios
 * @param {Array} arr
 * @param {Object} filters { chave: valor } (valor "Todos"/"Todas" = sem filtro)
 * @returns {Array}
 */
export function filterData(arr, filters) {
  return arr.filter(item =>
    Object.entries(filters).every(([key, val]) => {
      if (!val || val === 'Todos' || val === 'Todas' || val === 'Todas') return true;
      return String(item[key]).toLowerCase() === String(val).toLowerCase();
    })
  );
}

/* ==========================================================================
   6. CLOCK & TIME
   ========================================================================== */

/**
 * Hora atual formatada (HH:MM:SS)
 * @returns {string}
 */
export function getTimeString() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

/**
 * Data atual formatada
 * @returns {string}
 */
export function getDateString() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ==========================================================================
   7. CORES & VISUAL
   ========================================================================== */

/**
 * Retorna cor CSS baseada em porcentagem
 * @param {number} pct 0-100
 * @param {number} okThreshold
 * @param {number} warnThreshold
 * @returns {string} CSS var
 */
export function colorByPercent(pct, okThreshold = 80, warnThreshold = 60) {
  if (pct >= okThreshold)   return 'var(--ok)';
  if (pct >= warnThreshold) return 'var(--warn)';
  return 'var(--danger)';
}

/**
 * Interpolação linear de cor hex
 * @param {string} c1 hex color
 * @param {string} c2 hex color
 * @param {number} t 0-1
 * @returns {string}
 */
export function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t).toString(16).padStart(2, '0');
  const g = Math.round(g1 + (g2 - g1) * t).toString(16).padStart(2, '0');
  const b = Math.round(b1 + (b2 - b1) * t).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/* ==========================================================================
   8. DETECÇÃO DE AMBIENTE
   ========================================================================== */

/** Detecta se está em SharePoint */
export function isSharePoint() {
  return !!(window._spPageContextInfo || document.getElementById('suitableBox'));
}

/** Detecta se está em modo offline */
export function isOffline() {
  return !navigator.onLine;
}

/** Detecta dispositivo touch */
export function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/** Detecta resolução TV (>= 1920px) */
export function isTVResolution() {
  return window.innerWidth >= 1920 && window.innerHeight >= 1080;
}

/* ==========================================================================
   9. SANITIZAÇÃO
   ========================================================================== */

/**
 * Escapa HTML para evitar XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/**
 * Remove tags HTML de uma string
 * @param {string} str
 * @returns {string}
 */
export function stripHtml(str) {
  return String(str ?? '').replace(/<[^>]*>/g, '');
}

/* ==========================================================================
   10. PERFORMANCE
   ========================================================================== */

/**
 * RequestAnimationFrame wrapper para updates de UI
 * @param {Function} fn
 * @returns {number} frameId
 */
export function scheduleRender(fn) {
  return requestAnimationFrame(fn);
}

/**
 * Idle callback para tarefas não-críticas
 * @param {Function} fn
 * @param {Object} opts
 */
export function scheduleIdle(fn, opts = { timeout: 2000 }) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, opts);
  } else {
    setTimeout(fn, 100);
  }
}

/**
 * Mede tempo de execução (dev tool)
 * @param {string} label
 * @param {Function} fn
 * @returns {*}
 */
export function measure(label, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  console.debug(`[Perf] ${label}: ${(t1 - t0).toFixed(2)}ms`);
  return result;
}

/* ==========================================================================
   11. LOGGER
   ========================================================================== */
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = import.meta?.env?.DEV ? 'debug' : 'warn';

export const logger = {
  debug: (...a) => LOG_LEVELS.debug >= LOG_LEVELS[CURRENT_LEVEL] && console.debug('[DBD]', ...a),
  info:  (...a) => LOG_LEVELS.info  >= LOG_LEVELS[CURRENT_LEVEL] && console.info('[DBD]',  ...a),
  warn:  (...a) => LOG_LEVELS.warn  >= LOG_LEVELS[CURRENT_LEVEL] && console.warn('[DBD]',  ...a),
  error: (...a) => console.error('[DBD]', ...a),
};

/* ==========================================================================
   12. ADMIN FETCH — inclui X-Admin-Token nos endpoints protegidos
   ========================================================================== */

/** Cache do token lido do servidor */
let _adminToken = null;

/**
 * Carrega o token de admin do servidor (apenas 1x por sessão)
 * O servidor expoe o token apenas para localhost via /api/admin-token
 */
async function _loadAdminToken() {
  if (_adminToken) return _adminToken;
  try {
    const res = await fetch('/api/admin-token');
    if (res.ok) {
      const d = await res.json();
      _adminToken = d.token ?? '';
    }
  } catch { _adminToken = ''; }
  return _adminToken;
}

/**
 * fetch() com X-Admin-Token automático para endpoints protegidos
 * Uso: adminFetch('/api/cronograma', { method:'POST', body:... })
 */
export async function adminFetch(url, opts = {}) {
  const token = await _loadAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
    ...(token ? { 'X-Admin-Token': token } : {}),
  };
  return fetch(url, { ...opts, headers });
}
