/**
 * initAnaliseExtra.js
 * Inicializa o histórico de Análises Extras a partir do JSON pré-carregado
 * (data/analise_extra_hist.json), populando o localStorage na primeira carga.
 *
 * Lógica:
 *  - Se localStorage já tem entradas com 'fonte: historico_importado', não re-importa.
 *  - Caso contrário, busca o JSON e popula o índice + contadores.
 */

const INDEX_KEY    = 'metrologia_analise_extra_index';
const CONTROLE_KEY = 'metrologia_controle_no';
const RELNO_KEY    = 'metrologia_relno_counter';

/**
 * Executa a inicialização do histórico de Análise Extra.
 * Seguro para chamar múltiplas vezes (idempotente).
 */
export async function initAnaliseExtraHistory() {
  try {
    // Verifica se já existe histórico importado
    const existing = _loadIndex();
    const hasImported = existing.some(e => e.fonte === 'historico_importado');
    if (hasImported) return; // já inicializado

    // Busca o JSON de histórico
    const res = await fetch('./data/analise_extra_hist.json');
    if (!res.ok) return;
    const records = await res.json();
    if (!Array.isArray(records) || !records.length) return;

    // Merge: mantém entradas existentes (manuais) + adiciona histórico
    const newIndex = [...records, ...existing];
    localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));

    // Inicializa contadores se não existirem
    const maxControle = Math.max(...records.map(r => r.controleNo ?? 0));
    const maxRelNum   = _maxRelNum(records);

    const existingControle = _loadControle();
    if (existingControle.seq < maxControle) {
      localStorage.setItem(CONTROLE_KEY, JSON.stringify({ seq: maxControle }));
    }

    const existingRel = _loadRelCounter();
    if (existingRel.seq < maxRelNum) {
      localStorage.setItem(RELNO_KEY, JSON.stringify({
        seq:  maxRelNum,
        year: new Date().getFullYear(),
      }));
    }

    console.info(`[AnaliseExtra] Histórico importado: ${records.length} registros. Próximo controle: ${maxControle + 1}`);
  } catch (err) {
    console.warn('[AnaliseExtra] Falha ao importar histórico:', err);
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function _loadIndex() {
  try { return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]'); }
  catch { return []; }
}

function _loadControle() {
  try {
    const raw = localStorage.getItem(CONTROLE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (typeof c.seq === 'number') return c;
    }
  } catch {}
  return { seq: 345 };
}

function _loadRelCounter() {
  try {
    const raw = localStorage.getItem(RELNO_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (typeof c.seq === 'number') return c;
    }
  } catch {}
  return { seq: 0, year: new Date().getFullYear() };
}

function _maxRelNum(records) {
  let max = 0;
  for (const r of records) {
    // relNo format: "037/2026" or "026b/2026"
    const m = (r.relNo ?? '').match(/^(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}
