/**
 * storage.js — Cache Local, Persistência, Estado
 * Dashboard Operacional Metrologia v2.0
 *
 * Gerencia localStorage, sessionStorage e cache em memória.
 * Inclui TTL (time-to-live) para dados, compressão leve e fallback.
 */

import { logger } from './utils.js';

/* ==========================================================================
   CONSTANTES
   ========================================================================== */
const NAMESPACE    = 'metrologia_';
const CACHE_KEY    = NAMESPACE + 'cache';
const FILTERS_KEY  = NAMESPACE + 'filters';
const THEME_KEY    = NAMESPACE + 'theme';
const PREFS_KEY    = NAMESPACE + 'prefs';
const DEFAULT_TTL  = 5 * 60 * 1000; // 5 minutos

/* ==========================================================================
   1. STORAGE SEGURO (com fallback)
   ========================================================================== */

/**
 * Wrapper seguro para localStorage (evita erros em ambientes restritivos)
 */
class SafeStorage {
  constructor(type = 'localStorage') {
    this._type = type;
    this._mem  = new Map(); // fallback em memória
    this._available = this._test();
  }

  _test() {
    try {
      const k = '__test__';
      window[this._type].setItem(k, '1');
      window[this._type].removeItem(k);
      return true;
    } catch { return false; }
  }

  get(key) {
    try {
      if (this._available) {
        const raw = window[this._type].getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
      return this._mem.get(key) ?? null;
    } catch (err) {
      logger.warn('Storage.get error:', err);
      return null;
    }
  }

  set(key, value) {
    try {
      const str = JSON.stringify(value);
      if (this._available) window[this._type].setItem(key, str);
      else this._mem.set(key, value);
      return true;
    } catch (err) {
      logger.warn('Storage.set error:', err);
      // Tenta limpar e regravar
      if (err.name === 'QuotaExceededError') this._evict();
      return false;
    }
  }

  remove(key) {
    try {
      if (this._available) window[this._type].removeItem(key);
      else this._mem.delete(key);
    } catch (err) { logger.warn('Storage.remove error:', err); }
  }

  clear(prefix = NAMESPACE) {
    try {
      if (this._available) {
        const keys = Object.keys(window[this._type])
          .filter(k => k.startsWith(prefix));
        keys.forEach(k => window[this._type].removeItem(k));
      } else {
        this._mem.forEach((_, k) => { if (k.startsWith(prefix)) this._mem.delete(k); });
      }
    } catch (err) { logger.warn('Storage.clear error:', err); }
  }

  /** Evicta entradas mais antigas para liberar espaço */
  _evict() {
    try {
      const keys = Object.keys(window[this._type])
        .filter(k => k.startsWith(NAMESPACE))
        .sort();
      // Remove 30% das entradas mais antigas
      const toRemove = Math.max(1, Math.floor(keys.length * 0.3));
      keys.slice(0, toRemove).forEach(k => window[this._type].removeItem(k));
    } catch { /* silencioso */ }
  }
}

const localStore   = new SafeStorage('localStorage');
const sessionStore = new SafeStorage('sessionStorage');

/* ==========================================================================
   2. CACHE COM TTL
   ========================================================================== */

/**
 * CacheManager — cache em memória com TTL e persistência opcional
 */
class CacheManager {
  constructor() {
    this._store = new Map();
    this._load();
  }

  /**
   * Armazena dado com TTL
   * @param {string} key
   * @param {*} data
   * @param {number} ttl ms (default 5min)
   * @param {boolean} persist salva no localStorage
   */
  set(key, data, ttl = DEFAULT_TTL, persist = false) {
    const entry = {
      data,
      expiresAt: Date.now() + ttl,
      ts: Date.now(),
    };
    this._store.set(key, entry);
    if (persist) {
      const cache = localStore.get(CACHE_KEY) ?? {};
      cache[key] = entry;
      localStore.set(CACHE_KEY, cache);
    }
    return this;
  }

  /**
   * Recupera dado do cache se válido
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    let entry = this._store.get(key);
    if (!entry) {
      // Tenta localStorage
      const cache = localStore.get(CACHE_KEY) ?? {};
      entry = cache[key];
      if (entry) this._store.set(key, entry);
    }
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Verifica se chave existe e é válida
   * @param {string} key
   * @returns {boolean}
   */
  has(key) { return this.get(key) !== null; }

  /**
   * Remove entrada do cache
   * @param {string} key
   */
  delete(key) {
    this._store.delete(key);
    const cache = localStore.get(CACHE_KEY) ?? {};
    if (cache[key]) {
      delete cache[key];
      localStore.set(CACHE_KEY, cache);
    }
  }

  /**
   * Limpa entradas expiradas
   */
  purge() {
    const now = Date.now();
    this._store.forEach((entry, key) => {
      if (now > entry.expiresAt) this._store.delete(key);
    });
    const cache = localStore.get(CACHE_KEY) ?? {};
    let changed = false;
    Object.entries(cache).forEach(([key, entry]) => {
      if (now > entry.expiresAt) { delete cache[key]; changed = true; }
    });
    if (changed) localStore.set(CACHE_KEY, cache);
  }

  /** Limpa tudo */
  clear() {
    this._store.clear();
    localStore.remove(CACHE_KEY);
  }

  /** Carrega cache do localStorage */
  _load() {
    const cache = localStore.get(CACHE_KEY);
    if (cache) {
      Object.entries(cache).forEach(([key, entry]) => {
        if (Date.now() < entry.expiresAt) this._store.set(key, entry);
      });
    }
  }

  /** Estatísticas do cache */
  stats() {
    return {
      entries: this._store.size,
      keys: [...this._store.keys()],
    };
  }
}

/* ==========================================================================
   3. FILTROS PERSISTENTES
   ========================================================================== */

/**
 * FiltersStorage — persiste estado dos filtros entre sessões
 */
class FiltersStorage {
  constructor() {
    this._key = FILTERS_KEY;
  }

  save(filters) {
    return localStore.set(this._key, filters);
  }

  load() {
    return localStore.get(this._key) ?? {};
  }

  clear() {
    localStore.remove(this._key);
  }
}

/* ==========================================================================
   4. PREFERÊNCIAS DO USUÁRIO
   ========================================================================== */

/**
 * PrefsStorage — tema, layout, preferências
 */
class PrefsStorage {
  constructor() {
    this._key = PREFS_KEY;
  }

  get(key, defaultVal = null) {
    const prefs = localStore.get(this._key) ?? {};
    return key in prefs ? prefs[key] : defaultVal;
  }

  set(key, value) {
    const prefs = localStore.get(this._key) ?? {};
    prefs[key] = value;
    return localStore.set(this._key, prefs);
  }

  getAll() {
    return localStore.get(this._key) ?? {};
  }

  clear() {
    localStore.remove(this._key);
  }
}

/* ==========================================================================
   5. TEMA
   ========================================================================== */

export function getTheme() {
  return localStore.get(THEME_KEY) ?? 'dark';
}

export function saveTheme(theme) {
  localStore.set(THEME_KEY, theme);
}

/* ==========================================================================
   6. EXPORTAÇÕES SINGLETON
   ========================================================================== */

export const cache   = new CacheManager();
export const filters = new FiltersStorage();
export const prefs   = new PrefsStorage();

// Purge automático a cada 10 minutos
setInterval(() => cache.purge(), 10 * 60 * 1000);

// Limpar ao fechar
window.addEventListener('unload', () => cache.purge());

/* ==========================================================================
   7. UTILITÁRIOS EXTRAS
   ========================================================================== */

/**
 * Memoize simples (cache em memória, sem TTL)
 * @param {Function} fn
 * @returns {Function}
 */
export function memoize(fn) {
  const memo = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (memo.has(key)) return memo.get(key);
    const result = fn.apply(this, args);
    memo.set(key, result);
    return result;
  };
}
