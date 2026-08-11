/**
 * api.js — Camada de Dados e API REST
 * Dashboard Operacional Metrologia v2.0
 *
 * Abstrai todas as chamadas de dados.
 * Suporta: Mock local, API REST, Microsoft Graph API.
 * Inclui retry, timeout, cache e tratamento de erros.
 */

import { cache } from './storage.js';
import { logger, isOffline } from './utils.js';

/* ==========================================================================
   CONSTANTES
   ========================================================================== */
const DEFAULT_TIMEOUT   = 15000;  // 15s
const DEFAULT_RETRIES   = 3;
const RETRY_DELAY       = 1000;   // 1s entre retries
const MOCK_DELAY        = 200;    // simula latência do mock

/* ==========================================================================
   1. HTTP CLIENT BASE
   ========================================================================== */

class HttpError extends Error {
  constructor(status, statusText, url) {
    super(`HTTP ${status} — ${statusText} — ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
  }
}

/**
 * Fetch com timeout
 * @param {string} url
 * @param {Object} opts
 * @param {number} timeout ms
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, opts = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error(`Timeout após ${timeout}ms: ${url}`);
    throw err;
  }
}

/**
 * Fetch com retry exponencial
 * @param {string} url
 * @param {Object} opts
 * @param {number} retries
 * @returns {Promise<any>}
 */
async function fetchWithRetry(url, opts = {}, retries = DEFAULT_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, opts);
      if (!res.ok) throw new HttpError(res.status, res.statusText, url);
      return res.json();
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) throw err;
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      logger.warn(`[API] Retry ${attempt + 1}/${retries} após ${delay}ms para: ${url}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/* ==========================================================================
   2. MOCK DATA PROVIDER
   ========================================================================== */

/** Dados embutidos — fallback quando fetch() não funciona (file://, SharePoint restrito) */
const INLINE_MOCK = {
  kpis: {
    totalEquipamentos: 1247, vencidos: 89, proximoVencimento: 143,
    conformes: 1015, slaConformidade: 81.4, pendenciaCritica: 23,
    tempoMedioCalibracao: 4.2, riscoOperacional: 12,
    deltas: {
      totalEquipamentos: { value: 12,  dir: 'up'   },
      vencidos:          { value: 8,   dir: 'down'  },
      proximoVencimento: { value: 5,   dir: 'up'   },
      conformes:         { value: 22,  dir: 'up'   },
      slaConformidade:   { value: 2.3, dir: 'up'   },
    },
  },
  tendenciaMensal: [
    { mes: 'Jan', falhas: 18, calibracoes: 52, conformidade: 74 },
    { mes: 'Fev', falhas: 22, calibracoes: 61, conformidade: 71 },
    { mes: 'Mar', falhas: 15, calibracoes: 55, conformidade: 79 },
    { mes: 'Abr', falhas: 28, calibracoes: 48, conformidade: 68 },
    { mes: 'Mai', falhas: 12, calibracoes: 70, conformidade: 84 },
    { mes: 'Jun', falhas: 19, calibracoes: 63, conformidade: 77 },
    { mes: 'Jul', falhas: 31, calibracoes: 44, conformidade: 65 },
    { mes: 'Ago', falhas: 14, calibracoes: 68, conformidade: 82 },
    { mes: 'Set', falhas: 10, calibracoes: 74, conformidade: 87 },
    { mes: 'Out', falhas: 17, calibracoes: 59, conformidade: 76 },
    { mes: 'Nov', falhas: 21, calibracoes: 57, conformidade: 73 },
    { mes: 'Dez', falhas: 9,  calibracoes: 79, conformidade: 89 },
  ],
  distribuicaoStatus: [
    { label: 'Conformes',        value: 1015, color: '#22c55e' },
    { label: 'Próx. Vencimento', value: 143,  color: '#ffb547' },
    { label: 'Vencidos',         value: 89,   color: '#ef4757' },
  ],
  topEquipamentosAtraso: [
    { id: 'MAN-001', equipamento: 'Manômetros',          setor: 'Produção',    diasAtraso: 24, proximaCalib: '2026-04-24', responsavel: 'João Silva',  status: 'Vencido'  },
    { id: 'BAL-002', equipamento: 'Balanças Analíticas', setor: 'Laboratório', diasAtraso: 18, proximaCalib: '2026-04-30', responsavel: 'Maria Santos',status: 'Vencido'  },
    { id: 'TER-003', equipamento: 'Termômetros',         setor: 'Qualidade',   diasAtraso: 15, proximaCalib: '2026-05-03', responsavel: 'Carlos Lima', status: 'Vencido'  },
    { id: 'PAQ-004', equipamento: 'Paquímetros',         setor: 'Manutenção',  diasAtraso: 12, proximaCalib: '2026-05-06', responsavel: 'João Silva',  status: 'Vencido'  },
    { id: 'MIC-005', equipamento: 'Micrômetros',         setor: 'Engenharia',  diasAtraso: 8,  proximaCalib: '2026-05-10', responsavel: 'Maria Santos',status: 'Pendente' },
    { id: 'MUL-006', equipamento: 'Multímetros',         setor: 'Expedição',   diasAtraso: 7,  proximaCalib: '2026-05-11', responsavel: 'Carlos Lima', status: 'Pendente' },
  ],
  slasPorSetor: [
    { setor: 'Produção',    sla: 88, meta: 90 },
    { setor: 'Manutenção',  sla: 76, meta: 85 },
    { setor: 'Qualidade',   sla: 94, meta: 95 },
    { setor: 'Laboratório', sla: 82, meta: 90 },
    { setor: 'Engenharia',  sla: 71, meta: 85 },
    { setor: 'Expedição',   sla: 68, meta: 80 },
  ],
  calibracoesMes: [
    { tipo: 'Dimensional', qtd: 312, concluidas: 298, pendentes: 14 },
    { tipo: 'Elétrica',    qtd: 187, concluidas: 172, pendentes: 15 },
    { tipo: 'Pressão',     qtd: 243, concluidas: 231, pendentes: 12 },
    { tipo: 'Temperatura', qtd: 198, concluidas: 189, pendentes:  9 },
    { tipo: 'Massa/Força', qtd: 143, concluidas: 125, pendentes: 18 },
    { tipo: 'Outros',      qtd: 164, concluidas: 150, pendentes: 14 },
  ],
  alertas: [
    { id: 1, tipo: 'critico', msg: '23 equipamentos críticos sem calibração há mais de 90 dias', ts: '2026-05-18T08:00:00Z' },
    { id: 2, tipo: 'alerta',  msg: 'Setor Expedição com SLA abaixo de 70% no mês',               ts: '2026-05-18T07:30:00Z' },
    { id: 3, tipo: 'alerta',  msg: '143 equipamentos com vencimento em até 30 dias',              ts: '2026-05-18T07:00:00Z' },
    { id: 4, tipo: 'info',    msg: 'Sincronização Excel concluída com sucesso',                   ts: '2026-05-18T06:00:00Z' },
    { id: 5, tipo: 'critico', msg: 'Manômetros: 24 unidades vencidas aguardando laboratório',    ts: '2026-05-17T16:00:00Z' },
  ],
  ticker: [
    { label: 'MANÔMETROS VENCIDOS', value: 24,     variant: 'danger' },
    { label: 'SLA PRODUÇÃO',        value: '88%',  variant: 'ok'     },
    { label: 'BALANÇAS PENDENTES',  value: 18,     variant: 'danger' },
    { label: 'SLA QUALIDADE',       value: '94%',  variant: 'ok'     },
    { label: 'CRÍTICOS TOTAL',      value: 23,     variant: 'danger' },
    { label: 'CALIBRAÇÕES/MÊS',    value: 247,    variant: 'warn'   },
    { label: 'CONFORMIDADE',        value: '81.4%',variant: 'warn'   },
    { label: 'EXPEDIÇÃO SLA',       value: '68%',  variant: 'danger' },
  ],
  filtros: {
    setor:       ['Produção', 'Manutenção', 'Qualidade', 'Laboratório', 'Engenharia', 'Expedição'],
    tipo:        ['Dimensional', 'Elétrica', 'Pressão', 'Temperatura', 'Massa/Força'],
    status:      ['Conforme', 'Próx. Vencimento', 'Vencido', 'Crítico'],
    periodo:     ['Este Mês', 'Últimos 3 Meses', 'Últimos 6 Meses', 'Este Ano'],
    criticidade: ['Baixa', 'Média', 'Alta', 'Crítica'],
    laboratorio: ['Lab. Interno', 'Lab. Externo A', 'Lab. Externo B'],
    contrato:    ['Contrato A', 'Contrato B', 'Sem Contrato'],
    responsavel: ['João Silva', 'Maria Santos', 'Carlos Lima'],
    planta:      ['Planta 1', 'Planta 2', 'Planta 3'],
    categoria:   ['Categoria A', 'Categoria B', 'Categoria C'],
  },
};

class MockProvider {
  constructor(baseUrl = '') {
    this._baseUrl = baseUrl || './data/mock.json';
    this._cache   = null;
  }

  async load() {
    if (this._cache && this._cache !== INLINE_MOCK) return this._cache;
    try {
      const res = await fetchWithTimeout(this._baseUrl);
      if (!res.ok) throw new HttpError(res.status, res.statusText, this._baseUrl);
      this._cache = await res.json();
      logger.info('[MockProvider] Dados carregados do arquivo mock.json');
    } catch (err) {
      // Fallback para dados embutidos (funciona com file://, SharePoint restrito, etc.)
      logger.warn('[MockProvider] fetch falhou, usando dados embutidos:', err.message);
      this._cache = INLINE_MOCK;
    }
    return this._cache;
  }

  async getKPIs(filters = {}) {
    await this._delay();
    const data = await this.load();
    return data.kpis;
  }

  async getTendenciaMensal(filters = {}) {
    await this._delay();
    const data = await this.load();
    return data.tendenciaMensal;
  }

  async getDistribuicaoStatus() {
    await this._delay();
    const data = await this.load();
    return data.distribuicaoStatus;
  }

  async getTopEquipamentosAtraso() {
    await this._delay();
    const data = await this.load();
    return data.topEquipamentosAtraso;
  }

  async getSlasPorSetor() {
    await this._delay();
    const data = await this.load();
    return data.slasPorSetor;
  }

  async getCalibracosMes() {
    await this._delay();
    const data = await this.load();
    return data.calibracoesMes;
  }

  async getAlertas() {
    await this._delay();
    const data = await this.load();
    return data.alertas;
  }

  async getTicker() {
    await this._delay();
    const data = await this.load();
    return data.ticker;
  }

  async getFiltros() {
    await this._delay();
    const data = await this.load();
    return data.filtros;
  }

  async getMedicoesPorMes() {
    await this._delay();
    const data = await this.load();
    return data.medicoesPorMes ?? [];
  }

  async getMedicoesPorEquipamento() {
    await this._delay();
    const data = await this.load();
    return data.medicoesPorEquipamento ?? [];
  }

  async getOsPorProblema() {
    await this._delay();
    const data = await this.load();
    return data.osPorProblema ?? [];
  }

  async getOsPorOcorrencia() {
    await this._delay();
    const data = await this.load();
    return data.osPorOcorrencia ?? [];
  }

  async getAtividadesPorMes() {
    await this._delay();
    const data = await this.load();
    return data.atividadesPorMes ?? [];
  }

  async getHistorico() {
    if (this._historicoCache) return this._historicoCache;
    try {
      const res = await fetchWithTimeout('./data/historico_medicoes.json');
      if (!res.ok) return null;
      this._historicoCache = await res.json();
    } catch {
      this._historicoCache = null;
    }
    return this._historicoCache;
  }

  /** Simula latência de rede */
  _delay() {
    return new Promise(r => setTimeout(r, MOCK_DELAY));
  }
}

/* ==========================================================================
   3. REST API PROVIDER
   ========================================================================== */

class RestApiProvider {
  constructor(baseUrl, token = null) {
    this._baseUrl = baseUrl.replace(/\/$/, '');
    this._token   = token;
    this._headers = {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  _url(path) { return `${this._baseUrl}${path}`; }

  async _get(path, ttl = 60000) {
    const cacheKey = `api_${path}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const data = await fetchWithRetry(this._url(path), { headers: this._headers });
    cache.set(cacheKey, data, ttl);
    return data;
  }

  async getKPIs(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    return this._get(`/kpis${q ? '?' + q : ''}`, 60000);
  }

  async getTendenciaMensal(filters = {}) {
    return this._get('/tendencia-mensal', 120000);
  }

  async getDistribuicaoStatus() {
    return this._get('/distribuicao-status', 60000);
  }

  async getTopEquipamentosAtraso() {
    return this._get('/equipamentos/atraso', 120000);
  }

  async getSlasPorSetor() {
    return this._get('/sla/setor', 120000);
  }

  async getCalibracosMes() {
    return this._get('/calibracoes/mes', 120000);
  }

  async getAlertas() {
    return this._get('/alertas', 30000);
  }

  async getTicker() {
    return this._get('/ticker', 30000);
  }

  async getFiltros() {
    return this._get('/filtros', 3600000); // 1 hora (dados estáticos)
  }
}

/* ==========================================================================
   4. MICROSOFT GRAPH API PROVIDER
   ========================================================================== */

class GraphApiProvider {
  constructor(accessToken, siteUrl = '') {
    this._token   = accessToken;
    this._siteUrl = siteUrl;
    this._base    = 'https://graph.microsoft.com/v1.0';
    this._headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept':        'application/json',
    };
  }

  /**
   * Busca arquivo Excel do SharePoint/OneDrive
   * @param {string} driveId
   * @param {string} fileId
   * @returns {Promise<ArrayBuffer>}
   */
  async getExcelFile(driveId, fileId) {
    const url = `${this._base}/drives/${driveId}/items/${fileId}/content`;
    const res = await fetchWithTimeout(url, {
      headers: this._headers,
    });
    if (!res.ok) throw new HttpError(res.status, res.statusText, url);
    return res.arrayBuffer();
  }

  /**
   * Lista arquivos em pasta do OneDrive
   * @param {string} driveId
   * @param {string} folderId
   * @returns {Promise<Object[]>}
   */
  async listFiles(driveId, folderId = 'root') {
    return fetchWithRetry(
      `${this._base}/drives/${driveId}/items/${folderId}/children`,
      { headers: this._headers }
    );
  }

  /**
   * Lê workbook do SharePoint via Graph
   * @param {string} siteId
   * @param {string} driveId
   * @param {string} itemId
   * @param {string} worksheet
   * @returns {Promise<Object>}
   */
  async readWorksheet(siteId, driveId, itemId, worksheet = 'Sheet1') {
    const url = `${this._base}/sites/${siteId}/drives/${driveId}/items/${itemId}/workbook/worksheets/${worksheet}/usedRange`;
    return fetchWithRetry(url, { headers: this._headers });
  }
}

/* ==========================================================================
   5. DATA SERVICE (Facade)
   ========================================================================== */

/**
 * DataService — ponto central de acesso a dados
 * Escolhe automaticamente o provider baseado na configuração
 */
class DataService {
  constructor(config = {}) {
    this._config   = config;
    this._provider = null;
    this._offline  = false;
    this._listeners = [];
  }

  /**
   * Inicializa o provider de dados
   * @param {Object} cfg app config
   */
  init(cfg) {
    this._config = cfg;
    // Aceita tanto cfg completo (com .api) quanto cfg.api diretamente
    const apiCfg = cfg.api ?? cfg ?? {};

    if (apiCfg.useMock || !apiCfg.baseUrl) {
      logger.info('[API] Usando MockProvider');
      this._provider = new MockProvider();
    } else {
      logger.info('[API] Usando RestApiProvider:', apiCfg.baseUrl);
      this._provider = new RestApiProvider(apiCfg.baseUrl, apiCfg.token);
    }

    // Monitora conectividade
    window.addEventListener('online',  () => { this._offline = false; this._emit('online'); });
    window.addEventListener('offline', () => { this._offline = true;  this._emit('offline'); });
  }

  /** Carrega todos os dados do dashboard */
  async loadAll(filters = {}) {
    const [kpis, tendencia, distribuicao, atraso, slas, calibracoes, alertas, ticker, filtros,
           medicoesPorMes, medicoesPorEquipamento, osPorProblema, osPorOcorrencia, historico,
           atividadesPorMes] =
      await Promise.allSettled([
        this._provider.getKPIs(filters),
        this._provider.getTendenciaMensal(filters),
        this._provider.getDistribuicaoStatus(),
        this._provider.getTopEquipamentosAtraso(),
        this._provider.getSlasPorSetor(),
        this._provider.getCalibracosMes(),
        this._provider.getAlertas(),
        this._provider.getTicker(),
        this._provider.getFiltros(),
        this._provider.getMedicoesPorMes         ? this._provider.getMedicoesPorMes()         : Promise.resolve([]),
        this._provider.getMedicoesPorEquipamento ? this._provider.getMedicoesPorEquipamento() : Promise.resolve([]),
        this._provider.getOsPorProblema          ? this._provider.getOsPorProblema()          : Promise.resolve([]),
        this._provider.getOsPorOcorrencia        ? this._provider.getOsPorOcorrencia()        : Promise.resolve([]),
        this._provider.getHistorico              ? this._provider.getHistorico()              : Promise.resolve(null),
        this._provider.getAtividadesPorMes       ? this._provider.getAtividadesPorMes()       : Promise.resolve([]),
      ]);

    return {
      kpis:                    this._settle(kpis),
      tendenciaMensal:         this._settle(tendencia),
      distribuicaoStatus:      this._settle(distribuicao),
      topEquipamentosAtraso:   this._settle(atraso),
      slasPorSetor:            this._settle(slas),
      calibracoesMes:          this._settle(calibracoes),
      alertas:                 this._settle(alertas),
      ticker:                  this._settle(ticker),
      filtros:                 this._settle(filtros),
      medicoesPorMes:          this._settle(medicoesPorMes)          ?? [],
      medicoesPorEquipamento:  this._settle(medicoesPorEquipamento)  ?? [],
      osPorProblema:           this._settle(osPorProblema)           ?? [],
      osPorOcorrencia:         this._settle(osPorOcorrencia)         ?? [],
      historico:               this._settle(historico),
      atividadesPorMes:        this._settle(atividadesPorMes)        ?? [],
      timestamp:               Date.now(),
    };
  }

  async getKPIs(filters)           { return this._provider.getKPIs(filters); }
  async getTendencia(filters)      { return this._provider.getTendenciaMensal(filters); }
  async getDistribuicao()          { return this._provider.getDistribuicaoStatus(); }
  async getAtraso()                { return this._provider.getTopEquipamentosAtraso(); }
  async getSlas()                  { return this._provider.getSlasPorSetor(); }
  async getCalibracosMes()         { return this._provider.getCalibracosMes(); }
  async getAlertas()               { return this._provider.getAlertas(); }
  async getTicker()                { return this._provider.getTicker(); }
  async getFiltros()               { return this._provider.getFiltros(); }

  /** Extrai valor de PromiseSettledResult */
  _settle(result) {
    if (result.status === 'fulfilled') return result.value;
    logger.warn('[API] Promise rejeitada:', result.reason?.message);
    return null;
  }

  _hasCachedData() { return cache.has('api_/kpis') || cache.has('mock_data'); }

  on(event, fn) { this._listeners.push({ event, fn }); }
  _emit(event) { this._listeners.filter(l => l.event === event).forEach(l => l.fn()); }
}

/* ==========================================================================
   6. INSTÂNCIA SINGLETON
   ========================================================================== */
export const dataService = new DataService();

/* Exporta providers para uso avançado */
export { MockProvider, RestApiProvider, GraphApiProvider, HttpError };
