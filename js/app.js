/**
 * app.js — Orquestrador Principal
 * Dashboard Metrologia — Painel de Controle
 */

import { EventBus, logger, adminFetch } from './utils.js';
import { getTheme, saveTheme } from './storage.js';
import { dataService }         from './api.js';

import { Sidebar }                from '../components/Sidebar.js';
import { Header }                 from '../components/Header.js';
import { Ticker }                 from '../components/Ticker.js';
import { KpiGrid }                from '../components/KpiGrid.js';
import { ChartPanel }             from '../components/ChartPanel.js';
import { EditDrawer, _buildMailto } from '../components/EditDrawer.js';
import { AnalisePeriodicaPage }   from '../components/AnalisePeriodicaPage.js';
import { AnaliseExtraModal }      from '../components/AnaliseExtraModal.js';
import { CronogramaPage }         from '../components/CronogramaPage.js';
import { NormasPage }             from '../components/NormasPage.js';
import { HinpyouPage }           from '../components/HinpyouPage.js';
import { DesenhosPage }          from '../components/DesenhosPage.js';
import { HistoricoPeriodicaPage } from '../components/HistoricoPeriodicaPage.js';
import { PlaceholderPage }        from '../components/PlaceholderPage.js';
import { initAnaliseExtraHistory } from './initAnaliseExtra.js';

/* ==========================================================================
   HELPERS DE MÊS — conversão dinâmica entre rótulo e período
   Substituem os mapas fixos (MES_MAP / PERIODO_TO_MES), permitindo
   reconhecer qualquer mês novo automaticamente (jun/26, jul/26, ...).
   ========================================================================== */
const MESES_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/** '2026-06' → 'Jun/26' */
function periodoToLabel(periodo) {
  if (!periodo) return periodo;
  const [y, m] = String(periodo).split('-');
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return periodo;
  return `${MESES_ABBR[idx]}/${String(y).slice(2)}`;
}

/** 'Jun/26' → '2026-06' (null se rótulo inválido) */
function labelToPeriodo(label) {
  if (!label) return null;
  const [mon, yy] = String(label).split('/');
  const idx = MESES_ABBR.indexOf(mon);
  if (idx < 0 || !yy) return null;
  return `20${yy}-${String(idx + 1).padStart(2, '0')}`;
}

/* ==========================================================================
   APP
   ========================================================================== */

class App {
  constructor() {
    this._bus     = new EventBus();
    this._cfg     = null;
    this._data      = null;
    this._cronoData = null; // cache do cronograma para integração
    this._theme   = 'dark';
    this._refreshTimer = null;

    this._sidebar   = null;
    this._header    = null;
    this._ticker    = null;
    this._kpiGrid   = null;
    this._charts    = null;
    this._drawer    = null;
    this._analisePage       = null;
    this._analiseExtraModal = null;
    this._cronogramaPage    = null;

  }

  /* ---------------------------------------------------------------------- */
  /* INIT                                                                     */
  /* ---------------------------------------------------------------------- */

  async init() {
    try {
      logger.info('[App] Iniciando Gerenciamento de Atividade CQ...');

      this._cfg = await this._loadConfig();
      this._theme = getTheme() ?? this._cfg?.theme?.default ?? 'dark';
      this._applyTheme(this._theme);

      this._mountComponents();
      this._bindEvents();
      await initAnaliseExtraHistory();   // pré-carrega histórico de análises extras
      await this._loadData(true);
      this._scheduleRefresh();
      this._pollSolicitacoes();   // ← alertas de análise extra
      this._updateCronograma();   // ← badge + ticker do cronograma

      this._setLoading(false);
      logger.info('[App] Pronto.');
    } catch (err) {
      logger.error('[App] Erro:', err);
      this._showError(err);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* CONFIG                                                                   */
  /* ---------------------------------------------------------------------- */

  async _loadConfig() {
    try {
      const res = await fetch('./data/config.json');
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } catch {
      return this._defaultConfig();
    }
  }

  _defaultConfig() {
    return {
      app: { name: 'Gerenciamento de Atividade CQ', subtitle: 'Painel de Controle' },
      api: { useMock: true },
      theme: { default: 'dark', allowToggle: true },
      features: { ticker: true, editDrawer: true },
      kpis: [
        { id: 'qtdPecasMedidas', label: 'Qtd Peças Medidas', format: 'number',  colorClass: 'accent' },
        { id: 'qtdNaoConformes', label: 'Qtd Não Conformes', format: 'number',  colorClass: 'danger' },
        { id: 'cronPlanejadas',  label: 'Planejadas no Mês',  format: 'number',  colorClass: 'amber'  },
        { id: 'cronRealiz',      label: 'Realizados',         format: 'number',  colorClass: 'ok'     },
        { id: 'cronNaoRealiz',   label: 'Não Realizados',     format: 'number',  colorClass: 'danger' },
        { id: 'cronCumprimento', label: 'Cumprimento',        format: 'percent', colorClass: 'info'   },
      ],
      navItems: [
        { id: 'analise-periodica', label: 'Análise Periódica',       icon: 'chart',    badge: 0, page: 'analise-periodica' },
        { id: 'analise-extra',     label: 'Análise Extra',           icon: 'plus',     badge: 0, page: 'analise-extra' },
        { id: 'auditorias',        label: 'Auditorias',              icon: 'clipboard',badge: 0, page: 'auditorias' },
        { id: 'sala-motor',        label: 'Sala do Motor',           icon: 'engine',   badge: 0, page: 'sala-motor' },
        { id: 'cronograma',        label: 'Cronograma de Atividade', icon: 'calendar', badge: 0,  page: 'cronograma'    },
        { id: 'normas',            label: 'Normas CQ',               icon: 'file',     badge: 0,  page: 'normas'        },
        { id: 'hinpyou',           label: 'Hinpyou',                 icon: 'bell',     badge: 0,  page: 'hinpyou'       },
        { id: 'desenhos',          label: 'Desenhos',                icon: 'pen',      badge: 0,  page: 'desenhos'      },
        { id: 'configuracoes',     label: 'Configurações',           icon: 'cog',      badge: 0,  action: 'openConfig'  },
      ],
      projetos: ['NEXTB', 'M20A', 'SHAFT'],
    };
  }

  /* ---------------------------------------------------------------------- */
  /* COMPONENTES                                                              */
  /* ---------------------------------------------------------------------- */

  _mountComponents() {
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
      this._sidebar = new Sidebar(sidebarEl, this._cfg, this._bus);
      this._sidebar.render();
      this._sidebar.setTheme(this._theme);
    }

    const headerEl = document.getElementById('header');
    if (headerEl) {
      this._header = new Header(headerEl, this._cfg, this._bus);
      this._header.render();
    }

    const tickerEl = document.getElementById('ticker');
    if (tickerEl) {
      this._ticker = new Ticker(tickerEl, this._cfg, this._bus);
      this._ticker.render();
    }

    const kpiEl = document.getElementById('kpi-grid');
    if (kpiEl) {
      this._kpiGrid = new KpiGrid(kpiEl, this._cfg, this._bus);
    }

    const contentEl = document.getElementById('content');
    if (contentEl) {
      this._charts = new ChartPanel(contentEl, this._cfg, this._bus);
    }

    const cronoEl = document.getElementById('crono-page');
    if (cronoEl) {
      this._cronogramaPage = new CronogramaPage(cronoEl, this._cfg, this._bus);
    }

    const drawerEl = document.getElementById('drawer');
    if (drawerEl) {
      this._drawer = new EditDrawer(drawerEl, this._cfg, this._bus);
      this._drawer.render();
    }

    // Páginas de análise
    this._analisePage       = new AnalisePeriodicaPage(this._cfg, this._bus);
    this._analiseExtraModal = new AnaliseExtraModal(this._cfg, this._bus);
    this._normasPage        = new NormasPage(this._cfg, this._bus);
    this._hinpyouPage       = new HinpyouPage(this._cfg, this._bus);
    this._desenhosPage      = new DesenhosPage(this._cfg, this._bus);
    this._histPeriodicaPage = new HistoricoPeriodicaPage(this._cfg, this._bus);

    // Módulos placeholder (a serem especificados)
    this._salaMotorPage = new PlaceholderPage({
      id: 'sala-motor',
      title: 'Sala do Motor',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2.5 L3.5 6 L4.5 9.5 L8 10.5 L10.5 8 L9.5 4.5 Z"/><line x1="9" y1="9" x2="15" y2="15"/><path d="M17 21.5 L20.5 18 L19.5 14.5 L16 13.5 L13.5 16 L14.5 19.5 Z"/></svg>`,
      subtitle: 'Módulo em desenvolvimento.',
      bus: this._bus,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* EVENTOS                                                                  */
  /* ---------------------------------------------------------------------- */

  _bindEvents() {
    const bus = this._bus;

    // Navegação
    bus.on('nav:change', ({ page }) => this._navigateTo(page));

    // Ações especiais (legado — mantido por compatibilidade)
    bus.on('nav:action', ({ action }) => {
      if (action === 'openConfig') { this._drawer?.open(); return; }
      if (this._analiseExtraModal?._page?.style.display !== 'none') {
        this._analiseExtraModal.close();
      }
      if (action === 'openAnaliseExtra') this._analiseExtraModal.open();
    });

    // Atualiza badge, ticker e widget do cronograma após edição
    bus.on('cronograma:saved', async () => {
      this._cronoData = null; // invalida cache — próximo fetch busca dado fresco
      await this._updateCronograma();    // aguarda fetch + KPIs computados
      this._charts?.refreshCronograma(); // widget do dashboard (cache: no-store)
      this._onFilterChange();            // KPIs principais com dados já atualizados
    });

    // Tema
    bus.on('theme:toggle', () => this._toggleTheme());

    // Dados
    bus.on('data:refresh', () => this._loadData(false));

    // Drawer
    bus.on('drawer:toggle', () => this._drawer?.toggle());
    bus.on('prefs:change',  prefs => this._applyPrefs(prefs));
    bus.on('prefs:save',    ()    => {});

    // Solicitação concluída → re-policia imediatamente
    bus.on('solicitacoes:refresh', () => {
      fetch('/api/solicitacoes')
        .then(r => r.json())
        .then(lst => this._updateSolicitacoes(lst))
        .catch(() => {});
    });

    // Análise Periódica submetida → baixa no cronograma + atualiza gráficos
    bus.on('analise-periodica:submit', data => {
      logger.info('[App] Análise Periódica registrada:', data);
      this._onAnalisePeriodica(data);
    });

    // Análise Extra submetida → contabiliza no gráfico de Análises Dimensionais
    bus.on('analise-extra:submit', data => {
      logger.info('[App] Análise Extra registrada:', data);
      const status = data.avaliacao === 'APROVADO'  ? 'Conforme'
                   : data.avaliacao === 'REPROVADO' ? 'Não Conforme'
                   : null; // INFORMATIVO não conta como conforme nem não conforme
      if (!status) return;
      const mapped = {
        ...data,
        status,
        tipo:     data.processo ?? data.linha ?? 'Extra',
        operacao: data.linha ?? '',
      };
      this._atualizarDashboard(mapped);
    });

    // Filtros — aplicar ao mudar qualquer select
    document.addEventListener('change', e => {
      if (e.target.matches('#filters-bar select')) {
        this._onFilterChange();
      }
    });

    // Keyboard F5
    document.addEventListener('keydown', e => {
      if (e.key === 'F5') { e.preventDefault(); this._loadData(false); }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* DADOS                                                                    */
  /* ---------------------------------------------------------------------- */

  async _loadData(initial = false) {
    try {
      this._header?.setRefreshing(true);

      dataService.init(this._cfg ?? {});
      const raw = await dataService.loadAll({});

      // Carrega histórico de análises extras diretamente do JSON
      // (fonte primária, independente do localStorage)
      try {
        const res = await fetch('./data/analise_extra_hist.json');
        if (res.ok) {
          const hist = await res.json();
          if (Array.isArray(hist)) raw.analiseExtraHist = hist;
        }
      } catch { /* sem dados extras — ok */ }

      // Carrega histórico Camshaft (Fornecedor / Análise Periódica)
      try {
        const resCh = await fetch('./data/camshaft_hist.json');
        if (resCh.ok) {
          const hist = await resCh.json();
          if (Array.isArray(hist)) raw.camshaftHist = hist;
        }
      } catch { /* sem dados camshaft — ok */ }

      // Carrega histórico de análises periódicas do servidor (persiste ao transferir pasta)
      try {
        const resPer = await fetch('/api/periodica');
        if (resPer.ok) {
          const arr = await resPer.json();
          if (Array.isArray(arr)) raw.periodicaHist = arr;
        }
      } catch { /* servidor não disponível — usa localStorage */ }

      // Pré-carrega cronograma para que os KPIs estejam prontos antes do primeiro render
      try {
        const resCrono = await fetch('data/cronograma.json');
        if (resCrono.ok) {
          const crono = await resCrono.json();
          this._cronoData = crono;
          this._computeCronoKpis(crono);
        }
      } catch { /* silencioso */ }

      this._data = raw;
      this._renderAll(raw, initial);

      this._header?.setRefreshing(false);
    } catch (err) {
      logger.error('[App] Erro ao carregar dados:', err);
      this._header?.setRefreshing(false);
      if (initial) this._showError(err);
    }
  }

  _renderAll(data, initial) {
    // Computa medicoesPorEquipamento a partir dos check sheets (periódicas + extras)
    data.medicoesPorEquipamento = this._computeEquipamento(data);

    // Snapshot da base do mock ANTES de aplicar o histórico — usado pelo modal
    // "Editar" para não regravar histórico+extras por cima (evita dobrar contagem)
    this._medicoesBase = JSON.parse(JSON.stringify(data.medicoesPorMes ?? []));

    // Aplica histórico persistido de análises periódicas (localStorage)
    // — garante que KPIs e gráficos sobrevivam ao refresh da página
    this._applyPeriodicaHistory(data);

    // Ticker — só informações reais (cronograma do dia + solicitações);
    // sem dados mostra mensagem neutra (não usa mock de demonstração).
    if (this._ticker && !this._tickerCrono?.length && !this._tickerSolicit?.length) {
      this._refreshTicker();
    }

    // Filtros — meses gerados dinamicamente (inclui meses novos: jun, jul...)
    const filtros = { ...(data.filtros ?? {}) };
    filtros.mes = this._computeAllMonths(data);
    this._renderFilters(filtros);

    // KPIs + Gráficos via _onFilterChange — computa os totais corretos já
    // incluindo camshaft + extras, sem pré-renderizar com o valor bruto do mock.
    // KpiGrid.update() faz fallback para render() quando ainda não foi inicializado.
    this._onFilterChange();
  }

  /* ---------------------------------------------------------------------- */
  /* FILTROS                                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Lista de meses para o filtro — derivada de todas as fontes de dados,
   * incluindo meses novos (jun/26, jul/26...). Ordenada cronologicamente.
   */
  _computeAllMonths(data) {
    const periodos = new Set();

    // Periódicas (mock + histórico já aplicado em medicoesPorMes)
    (data.medicoesPorMes ?? []).forEach(m => m.periodo && periodos.add(m.periodo));
    // Camshaft (Fornecedor)
    (data.camshaftHist ?? []).forEach(r => r.periodo && periodos.add(r.periodo));
    // Análises Extras (JSON)
    (data.analiseExtraHist ?? []).forEach(r => {
      const p = (r.data ?? '').slice(0, 7); if (p) periodos.add(p);
    });
    // Análises Extras (localStorage, sessão atual)
    try {
      JSON.parse(localStorage.getItem('metrologia_analise_extra_index') ?? '[]')
        .forEach(r => { const p = (r.data ?? '').slice(0, 7); if (p) periodos.add(p); });
    } catch { /* silencioso */ }
    // Histórico periódico do servidor (por garantia)
    (data.periodicaHist ?? []).forEach(e => {
      const d = new Date(e.ts);
      if (!isNaN(d.getTime())) periodos.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });

    return [...periodos]
      .filter(p => /^\d{4}-\d{2}$/.test(p))
      .sort()
      .map(periodoToLabel);
  }

  _renderFilters(opts) {
    const bar = document.getElementById('filters-bar');
    if (!bar) return;
    bar.innerHTML = '';

    /* ── Selects de filtro — Tipo de Análise + restantes ── */
    const defs = this._cfg?.filters ?? [
      { key: 'analise',  label: 'Análise',  options: ['Periódica', 'Extra'] },
      { key: 'projeto',  label: 'Projeto',  options: ['NEXTB', 'M20A', 'SHAFT'] },
      { key: 'turno',    label: 'Turno'    },
      { key: 'ano',      label: 'Ano'      },
      { key: 'mes',      label: 'Mês'      },
      { key: 'peca',     label: 'Peça',     options: ['CHS (Camhousing)', 'HEAD', 'Fornecedor'] },
      { key: 'atividade',label: 'Atividade'},
    ];

    defs.forEach(def => {
      const wrap = document.createElement('div');
      wrap.className = 'filter';

      const lbl = document.createElement('label');
      lbl.className   = 'filter__label';
      lbl.textContent = def.label;

      const sel = document.createElement('select');
      sel.className   = 'filter__select select';
      sel.dataset.key = def.key;

      const optTodos = document.createElement('option');
      optTodos.value = optTodos.text = def.default ?? 'Todos';
      sel.appendChild(optTodos);

      // Usa opções fixas do def (se definidas) ou as que vêm do servidor
      (def.options ?? opts[def.key] ?? []).forEach(opt => {
        const o = document.createElement('option');
        o.value = o.text = opt;
        sel.appendChild(o);
      });

      wrap.appendChild(lbl);
      wrap.appendChild(sel);
      bar.appendChild(wrap);
    });
  }

  _onFilterChange() {
    if (!this._data) return;

    /* ── 1. Lê filtros ativos ── */
    const bar = document.getElementById('filters-bar');
    const sel = {};
    if (bar) {
      bar.querySelectorAll('select[data-key]').forEach(s => {
        const v = s.value;
        if (v && v !== 'Todos') sel[s.dataset.key] = v;
      });
    }

    /* ── 2. Constantes de mapeamento ── */
    // Mês ⇄ período agora são dinâmicos (helpers labelToPeriodo / periodoToLabel)
    const selMesPeriodo = sel.mes ? labelToPeriodo(sel.mes) : null;
    const CHS_ACTS = new Set([
      'CAMHOUSING RUGOSIMETRO','CAMHOUSING LAVAGEM','CMM TRIDIMENSIONAL','CILINDROMETRO CHS',
    ]);
    const HEAD_ACTS = new Set([
      'HEAD RUGOSIMETRO','HEAD RUGOSIDADE','HEAD LAVAGEM','HEAD AREIA','CHAMBER VOLUME',
      'CONTRACER','HATSUMONO','CILINDROMETRO HEAD',
    ]);
    const ATIV_MAP = {
      'Residual de Areia':             'HEAD AREIA',
      'Rugosimetro - Head':            'HEAD RUGOSIMETRO',
      'Cilindrometro (CNC) - Head':    'CILINDROMETRO HEAD',
      'Chamber Volume':                'CHAMBER VOLUME',
      'Lavadora - Head':               'HEAD LAVAGEM',
      'Contracer (Hatsumono)':         'CONTRACER',
      'Rugosimetro - CHS':             'CAMHOUSING RUGOSIMETRO',
      'Cilindrometro (CNC) - CHS':     'CILINDROMETRO CHS',
      'CMM (Tridimensional) - CHS':    'CMM TRIDIMENSIONAL',
      'Lavadora - CHS':                'CAMHOUSING LAVAGEM',
    };

    /* ── 3. Fator de projeto (proporção fixa de cada projeto no total) ── */
    // 2026: todos os dados são NEXTB → proporção sempre 1.0 (sem escala artificial)
    const propProj = sel.projeto
      ? (this._data.proporcaoProjeto?.[sel.projeto] ?? 1.0)
      : 1;

    /* ── 4a. Análises Extras (JSON carregado + localStorage) ── */
    // Fonte 1: JSON carregado em _loadData (histórico fixo)
    const extraHist = this._data.analiseExtraHist ?? [];
    // Fonte 2: localStorage (análises novas registradas nesta sessão)
    const extraLocal = (() => {
      try { return JSON.parse(localStorage.getItem('metrologia_analise_extra_index') ?? '[]'); }
      catch { return []; }
    })();
    // Merge: JSON base + localStorage, deduplica por relNo
    const relNosHist = new Set(extraHist.map(r => r.relNo).filter(Boolean));
    const extraIdx = [
      ...extraHist,
      ...extraLocal.filter(r => !r.fonte && !relNosHist.has(r.relNo)),
    ];

    const extraByPeriodo = {};
    extraIdx.forEach(r => {
      const periodo = (r.data ?? '').slice(0, 7);
      if (!periodo) return;
      if (sel.projeto && r.projeto !== sel.projeto) return;
      if (selMesPeriodo && selMesPeriodo !== periodo) return;
      if (!extraByPeriodo[periodo]) {
        extraByPeriodo[periodo] = {
          periodo, mes: periodoToLabel(periodo),
          conformes: 0, naoConformes: 0, total: 0,
          chs:  { total: 0, conformes: 0, naoConformes: 0 },
          head: { total: 0, conformes: 0, naoConformes: 0 },
          t1: 0, t2: 0, diasAtivos: 0, tempoTotal: 0,
        };
      }
      const em = extraByPeriodo[periodo];
      if (r.avaliacao === 'APROVADO')       { em.conformes++;    em.total++; }
      else if (r.avaliacao === 'REPROVADO') { em.naoConformes++; em.total++; }
    });
    const mesesExtra = Object.values(extraByPeriodo)
      .sort((a, b) => a.periodo.localeCompare(b.periodo));

    /* ── 4c. Histórico Camshaft (Fornecedor / Análise Periódica) ── */
    const camshaftHist = this._data.camshaftHist ?? [];
    const camshaftByPeriodo = {};
    if (sel.analise !== 'Extra') {
      camshaftHist.forEach(r => {
        if (selMesPeriodo && selMesPeriodo !== r.periodo) return;
        camshaftByPeriodo[r.periodo] = {
          conformes:    r.conformes    ?? 0,
          naoConformes: r.naoConformes ?? 0,
          total:        r.total        ?? 0,
        };
      });
    }

    /* ── Filtro "Extra" → renderiza dados extras e retorna ── */
    if (sel.analise === 'Extra') {
      const totalConf = mesesExtra.reduce((s, m) => s + m.conformes, 0);
      const totalNg   = mesesExtra.reduce((s, m) => s + m.naoConformes, 0);
      const kpisEx = {
        ...(this._data.kpis ?? {}),
        qtdPecasMedidas: totalConf + totalNg,
        qtdNaoConformes: totalNg,
      };
      this._kpiGrid?.update(kpisEx);
      this._charts?.render({ ...this._data, medicoesPorMes: mesesExtra, kpis: kpisEx });
      return;
    }

    /* ── 4. Fonte de verdade: mock.json medicoesPorMes ── */
    // mock.json só tem dados NEXTB — outros projetos partem do zero
    const projetoComDadosHistoricos = !sel.projeto || sel.projeto === 'NEXTB';
    let meses = projetoComDadosHistoricos
      ? [...(this._data.medicoesPorMes ?? [])]
      : (this._data.medicoesPorMes ?? []).map(m => ({
          ...m, conformes: 0, naoConformes: 0, total: 0,
          chs: { conformes: 0, naoConformes: 0, total: 0 },
          head: { conformes: 0, naoConformes: 0, total: 0 },
          t1: 0, t2: 0,
        }));

    // Filtro de mês → reduz lista a um único mês
    if (selMesPeriodo) {
      meses = meses.filter(m => m.periodo === selMesPeriodo);
    }

    /* ── Inclui meses NOVOS que só existem em Extra/Camshaft ──
       (ex.: junho com apenas Análise Extra, sem periódica no mock) ── */
    const ensureMes = (periodo) => {
      if (!periodo) return;
      if (selMesPeriodo && selMesPeriodo !== periodo) return; // respeita filtro de mês
      if (meses.some(m => m.periodo === periodo)) return;
      meses.push({
        mes: periodoToLabel(periodo), periodo,
        total: 0, conformes: 0, naoConformes: 0, t1: 0, t2: 0, diasAtivos: 0, tempoTotal: 0,
        chs:  { total: 0, conformes: 0, naoConformes: 0 },
        head: { total: 0, conformes: 0, naoConformes: 0 },
      });
    };
    // Camshaft (Fornecedor) entra em "Todos" e "Periódica" (quando peça permite)
    if (sel.analise !== 'Extra' && (!sel.peca || sel.peca === 'Fornecedor')) {
      Object.keys(camshaftByPeriodo).forEach(ensureMes);
    }
    // Análises Extras entram apenas em "Todos"
    if (!sel.analise) {
      Object.keys(extraByPeriodo).forEach(ensureMes);
    }
    // Reordena cronologicamente (meses novos vão para o lugar certo)
    meses.sort((a, b) => (a.periodo ?? '').localeCompare(b.periodo ?? ''));

    // "Todos" → soma extra + camshaft às periódicas por mês
    if (!sel.analise) {
      meses = meses.map(m => {
        const ex = extraByPeriodo[m.periodo];
        // Camshaft (Fornecedor) só entra se peca não filtra CHS/HEAD
        const ch = (!sel.peca || sel.peca === 'Fornecedor') ? camshaftByPeriodo[m.periodo] : null;
        if (!ex && !ch) return m;
        return { ...m,
          conformes:    m.conformes    + (ex?.conformes    ?? 0) + (ch?.conformes    ?? 0),
          naoConformes: m.naoConformes + (ex?.naoConformes ?? 0) + (ch?.naoConformes ?? 0),
          total:        m.total        + (ex?.total        ?? 0) + (ch?.total        ?? 0),
        };
      });
    } else if (sel.analise === 'Periódica' && (!sel.peca || sel.peca === 'Fornecedor')) {
      // "Periódica" → inclui camshaft (Fornecedor) no total
      meses = meses.map(m => {
        const ch = camshaftByPeriodo[m.periodo];
        if (!ch) return m;
        return { ...m,
          conformes:    m.conformes    + ch.conformes,
          naoConformes: m.naoConformes + ch.naoConformes,
          total:        m.total        + ch.total,
        };
      });
    }

    /* ── 4b. Historico apenas para calcular proporções de Atividade ── */
    // Usado exclusivamente quando o filtro "Atividade" está ativo
    const regsHist = (this._data.historico?.registros ?? []).filter(r => {
      const t = r.tipoAnalise ?? 'Periódica';
      return !sel.analise || t === sel.analise;
    });

    /* ── 5. Aplica filtros em cada mês, usando mock.json como base ── */
    const medicoesPorMes = meses.map(m => {
      const ym = m.periodo;

      // Base: total do mês (sem filtros adicionais)
      let conf = m.conformes ?? 0;
      let ng   = m.naoConformes ?? 0;

      // Filtro de Turno → usa t1/t2 do mock.json
      if (sel.turno === '1º Turno') {
        conf = m.t1 ?? Math.round(m.conformes * 0.5);
        ng   = 0;
      } else if (sel.turno === '2º Turno') {
        conf = m.t2 ?? Math.round(m.conformes * 0.5);
        ng   = 0;
      }

      // Filtro de Peça (CHS / HEAD / Fornecedor) → usa campos chs/head do mock.json ou camshaft
      // Se turno também estiver ativo, escala proporcional via historico
      if (sel.peca) {
        if (sel.peca === 'Fornecedor') {
          // Apenas dados Camshaft (Fornecedor)
          const ch = camshaftByPeriodo[ym] ?? { conformes: 0, naoConformes: 0 };
          conf = ch.conformes;
          ng   = ch.naoConformes;
        } else {
          const isCHS = sel.peca.includes('CHS');
          if (sel.turno) {
            // Proporção: quantos registros do historico (turno+mês) são CHS ou HEAD
            const turnoNum = sel.turno === '1º Turno' ? 1 : 2;
            const regsM = regsHist.filter(r => r.data?.startsWith(ym) && r.turno === turnoNum);
            const den   = regsM.length || 1;
            const num   = regsM.filter(r => {
              const acts = r.atividades ?? [];
              return isCHS ? acts.some(a => CHS_ACTS.has(a)) : acts.some(a => HEAD_ACTS.has(a));
            }).length;
            conf = Math.round(conf * (num / den));
            ng   = 0;
          } else {
            conf = isCHS ? (m.chs?.conformes ?? Math.round(m.conformes * 0.4))
                         : (m.head?.conformes ?? Math.round(m.conformes * 0.6));
            ng   = isCHS ? (m.chs?.naoConformes ?? 0) : (m.head?.naoConformes ?? 0);
          }
        }
      }

      // Filtro de Atividade → lookup direto em atividadesPorMes (dados exatos por turno)
      if (sel.atividade) {
        const atividadesLookup = this._data.atividadesPorMes ?? [];
        const mesAtiv = atividadesLookup.find(a => a.periodo === ym);
        if (mesAtiv) {
          if (sel.turno === '1º Turno') {
            conf = mesAtiv.t1?.[sel.atividade] ?? 0;
          } else if (sel.turno === '2º Turno') {
            conf = mesAtiv.t2?.[sel.atividade] ?? 0;
          } else {
            conf = (mesAtiv.t1?.[sel.atividade] ?? 0) + (mesAtiv.t2?.[sel.atividade] ?? 0);
          }
          ng = 0;
        } else {
          conf = 0;
          ng   = 0;
        }
      }

      // Filtro de Projeto → escala proporcional pelo peso do projeto no total
      if (propProj < 1) {
        conf = Math.round(conf * propProj);
        ng   = Math.round(ng   * propProj);
      }

      /* ── Recalcula chs/head para que o toggle interno do gráfico
             mostre valores coerentes com os filtros ativos ── */
      let newChs  = m.chs  ? { ...m.chs  } : { total: 0, conformes: 0, naoConformes: 0 };
      let newHead = m.head ? { ...m.head } : { total: 0, conformes: 0, naoConformes: 0 };

      if (sel.peca === 'Fornecedor') {
        // Só Camshaft (Fornecedor) é relevante; CHS e HEAD zeram
        newChs  = { total: 0, conformes: 0, naoConformes: 0 };
        newHead = { total: 0, conformes: 0, naoConformes: 0 };
      } else if (sel.peca?.includes('CHS')) {
        // Só CHS é relevante; HEAD zera
        newChs  = { ...newChs,  conformes: conf, naoConformes: ng, total: conf + ng };
        newHead = { total: 0, conformes: 0, naoConformes: 0 };
      } else if (sel.peca?.includes('HEAD')) {
        // Só HEAD é relevante; CHS zera
        newHead = { ...newHead, conformes: conf, naoConformes: ng, total: conf + ng };
        newChs  = { total: 0, conformes: 0, naoConformes: 0 };
      } else if (sel.turno || sel.atividade || sel.projeto) {
        // Escala CHS e HEAD proporcionalmente ao filtro aplicado no total
        const ratio = (m.conformes + m.naoConformes) > 0
          ? (conf + ng) / (m.conformes + m.naoConformes) : 0;
        newChs  = { conformes: Math.round(newChs.conformes  * ratio), naoConformes: Math.round(newChs.naoConformes  * ratio), total: 0 };
        newHead = { conformes: Math.round(newHead.conformes * ratio), naoConformes: Math.round(newHead.naoConformes * ratio), total: 0 };
        newChs.total  = newChs.conformes  + newChs.naoConformes;
        newHead.total = newHead.conformes + newHead.naoConformes;
        // Garante HEAD > CHS mesmo após escala
        if (newChs.conformes > 0 && newHead.conformes <= newChs.conformes) {
          newHead.conformes = newChs.conformes + 1;
          newHead.total = newHead.conformes + newHead.naoConformes;
        }
      }

      return { ...m, conformes: conf, naoConformes: ng, total: conf + ng, chs: newChs, head: newHead };
    });

    /* ── 6. Atualiza KPIs com os totais filtrados ── */
    const totalConf = medicoesPorMes.reduce((s, m) => s + m.conformes, 0);
    const totalNg   = medicoesPorMes.reduce((s, m) => s + m.naoConformes, 0);
    const kpis = {
      ...(this._data.kpis ?? {}),
      ...(this._cronoKpis ?? {}),
      qtdPecasMedidas: totalConf + totalNg,
      qtdNaoConformes: totalNg,
    };

    this._kpiGrid?.update(kpis);
    this._charts?.render({ ...this._data, medicoesPorMes, medicoesBase: this._medicoesBase, kpis });
  }

  /* ---------------------------------------------------------------------- */
  /* NAVEGAÇÃO                                                                */
  /* ---------------------------------------------------------------------- */

  _navigateTo(page) {
    logger.info('[App] Navegando para:', page);

    // Fecha páginas/modais abertos antes de navegar
    if (this._analiseExtraModal?._page?.style.display !== 'none') {
      this._analiseExtraModal.close();
    }
    if (this._analisePage?._page?.style.display !== 'none') {
      this._analisePage.close();
    }
    if (this._normasPage?._page?.style.display !== 'none') {
      this._normasPage.hide();
    }
    if (this._hinpyouPage?._page?.style.display !== 'none') {
      this._hinpyouPage.hide();
    }
    if (this._desenhosPage?._page?.style.display !== 'none') {
      this._desenhosPage.hide();
    }
    if (this._histPeriodicaPage?._page?.style.display !== 'none') {
      this._histPeriodicaPage.hide();
    }
    if (this._salaMotorPage?._page?.style.display !== 'none') {
      this._salaMotorPage.hide();
    }

    if (page === 'hist-periodica') {
      this._histPeriodicaPage?.show();
      this._sidebar?.setActivePage('hist-periodica');
      return;
    }

    if (page === 'analise-periodica') {
      // Passa histórico do servidor para o componente usar no painel Fornecedor
      if (this._analisePage && this._data?.periodicaHist) {
        this._analisePage._periodicaHistServer = this._data.periodicaHist;
      }
      this._analisePage.open();
      this._sidebar?.setActivePage('analise-periodica');
      return;
    }

    if (page === 'analise-extra') {
      this._analiseExtraModal.open();
      return;
    }

    if (page === 'cronograma') {
      document.getElementById('content')?.style.setProperty('display', 'none');
      document.getElementById('crono-page')?.style.setProperty('display', '');
      this._sidebar?.setActivePage('cronograma');
      this._cronogramaPage?.show();
      return;
    }

    if (page === 'normas') {
      this._normasPage?.show();
      this._sidebar?.setActivePage('normas');
      return;
    }

    if (page === 'hinpyou') {
      this._hinpyouPage?.show();
      this._sidebar?.setActivePage('hinpyou');
      return;
    }

    if (page === 'desenhos') {
      this._desenhosPage?.show();
      this._sidebar?.setActivePage('desenhos');
      return;
    }

    if (page === 'auditorias') {
      // Abre o TOYINPS Auditoria (servidor secundario, porta 3001) em nova aba.
      // Usa o mesmo host desta pagina, so troca a porta.
      const host = window.location.hostname || 'localhost';
      const url  = `http://${host}:3001/`;
      const win  = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        alert('Nao foi possivel abrir a Auditoria em nova aba (pop-up bloqueado).\n\nAcesse manualmente: ' + url);
      }
      // Nao muda a pagina ativa — permanece no dashboard atual
      return;
    }

    if (page === 'sala-motor') {
      this._salaMotorPage?.show();
      this._sidebar?.setActivePage('sala-motor');
      return;
    }

    // Voltar ao dashboard principal
    this._cronogramaPage?.hide();
    this._normasPage?.hide();
    this._hinpyouPage?.hide();
    this._desenhosPage?.hide();
    this._histPeriodicaPage?.hide();
    this._salaMotorPage?.hide();
    document.getElementById('crono-page')?.style.setProperty('display', 'none');
    document.getElementById('content')?.style.setProperty('display', '');
    this._sidebar?.setActivePage('analise-periodica');

    // Atualiza KPIs e gráficos ao voltar ao dashboard
    this._updateCronograma();
    setTimeout(() => this._onFilterChange(), 400);
  }

  /* ---------------------------------------------------------------------- */
  /* TEMA                                                                     */
  /* ---------------------------------------------------------------------- */

  _toggleTheme() {
    this._theme = this._theme === 'dark' ? 'light' : 'dark';
    this._applyTheme(this._theme);
    this._sidebar?.setTheme(this._theme);
    saveTheme(this._theme);
  }

  _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  _applyPrefs(prefs) {
    if (prefs.theme) {
      this._theme = prefs.theme;
      this._applyTheme(prefs.theme);
      this._sidebar?.setTheme(prefs.theme);
      saveTheme(prefs.theme);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* SOLICITAÇÕES DE ANÁLISE EXTRA (poll a cada 30 s)                        */
  /* ---------------------------------------------------------------------- */

  _pollSolicitacoes() {
    const check = async () => {
      try {
        const res = await fetch('/api/solicitacoes');
        if (!res.ok) return;               // servidor sem suporte (http.server antigo)
        const lista = await res.json();
        this._updateSolicitacoes(lista);
      } catch { /* sem servidor personalizado — silencioso */ }
    };
    check();
    setInterval(check, 30_000);

    // Atualiza ticker do cronograma a cada 5 min (mudança de dia, novas atividades)
    setInterval(() => this._updateCronograma(), 5 * 60_000);
  }

  /* ── Cronograma: badge + ticker ── */
  async _updateCronograma() {
    try {
      const res = await fetch('data/cronograma.json', { cache: 'no-store' });
      if (!res.ok) return;
      const crono = await res.json();
      this._cronoData = crono; // cache para integração com análise periódica

      const now      = new Date();
      const nowY     = now.getFullYear();
      const nowM     = now.getMonth() + 1;
      const nowD     = now.getDate();
      const cronAno  = crono.ano    ?? nowY;
      const cronMes  = crono.mesNum ?? nowM;

      let faltam = 0;
      let totalOk = 0, totalNok = 0, totalPend = 0, totalJust = 0;
      const atrasados = [];
      const deHoje    = [];

      // Conjunto de justificados
      const justSet = new Set();
      (crono.diario ?? []).forEach(entry => {
        if (!entry.data) return;
        const day = parseInt(entry.data.split('/')[0], 10);
        String(entry.item).split(/[\s,eE&]+/).forEach(part => {
          const n = part.trim(); if (n) justSet.add(`${n}_${day}`);
        });
      });

      (crono.items ?? []).forEach(it => {
        const nome   = it.dimensional ?? it.nome ?? `Item ${it.item}`;
        const turnos = it.turnos ?? [{ turno: 1, dias: it.dias ?? {} }];

        turnos.forEach(turnoObj => {
          const tLabel = turnoObj.turno ? ` T${turnoObj.turno}` : '';
          const graySet = new Set(turnoObj.grayDias ?? []); // dias N/A (cinza)

          Object.entries(turnoObj.dias ?? {}).forEach(([dayStr, v]) => {
            if (v === undefined || v === null) return;
            if (graySet.has(dayStr)) return; // dia N/A — não conta nem alerta
            const day   = Number(dayStr);
            const mesOk = cronAno === nowY && cronMes === nowM;
            const isPast  = cronAno < nowY || cronMes < nowM || (mesOk && day < nowD);
            const isToday = mesOk && day === nowD;

            // v===4 → realizado; v===0 → não realizado/pendente
            const realizado  = v === 4;
            const naoFeito   = v === 0;
            const justificado = naoFeito && justSet.has(`${it.item}_${dayStr}`);

            // Contagem para KPIs do cronograma
            if      (realizado)                         totalOk++;
            else if (justificado)                       totalJust++;
            else if (naoFeito && (isPast || isToday))   totalNok++;
            else if (naoFeito)                          totalPend++;

            // "Faltam" (badge de alerta) só conta o que precisa de atenção AGORA:
            // dias do mês corrente, vencidos ou de hoje, ainda não justificados.
            if (mesOk && naoFeito && !justificado && (isPast || isToday)) faltam++;

            if (isToday) {
              if (realizado) {
                deHoje.push({
                  label:   `✓ Item ${it.item}${tLabel} — ${nome}`,
                  value:   'REALIZADO',
                  variant: 'ok',
                  kind:    'ok',
                });
              } else if (justificado) {
                deHoje.push({
                  label:   `📋 Item ${it.item}${tLabel} — ${nome}`,
                  value:   'JUSTIFICADO',
                  variant: 'warn',
                  kind:    'hoje',
                });
              } else if (naoFeito) {
                deHoje.push({
                  label:   `⏳ Item ${it.item}${tLabel} — ${nome}`,
                  value:   'PENDENTE HOJE',
                  variant: 'warn',
                  kind:    'hoje',
                });
              }
            } else if (mesOk && isPast && naoFeito && !justificado) {
              // Só alerta atraso de dias do MÊS CORRENTE anteriores a hoje —
              // evita inundar o ticker com um cronograma de mês já fechado.
              atrasados.push({
                label:   `⚠ Item ${it.item}${tLabel} — ${nome}`,
                value:   `ATRASADO DIA ${day}`,
                variant: 'danger',
                kind:    'atraso',
              });
            }
          });
        });
      });

      // KPIs do cronograma → Realizados / Não Realizados / Cumprimento
      const totalSched = totalOk + totalNok + totalJust + totalPend;
      const pct = totalSched ? Math.round(((totalOk + totalJust) / totalSched) * 100) : 0;
      this._computeCronoKpisFromTotals(totalSched, totalOk, totalNok, totalPend, totalJust, pct);
      if (this._kpiGrid?._data) {
        this._kpiGrid.update({ ...this._kpiGrid._data, ...this._cronoKpis });
      }

      this._sidebar?.setBadge('cronograma', faltam, faltam > 0);

      // Salva itens do cronograma para o ticker
      this._tickerCrono = [...atrasados, ...deHoje];
      this._refreshTicker();
    } catch { /* silencioso */ }
  }

  /* ── Calcula KPIs do cronograma a partir do objeto crono completo ── */
  _computeCronoKpis(crono) {
    const now   = new Date();
    const nowY  = now.getFullYear(), nowM = now.getMonth() + 1, nowD = now.getDate();
    const cronAno = crono.ano ?? nowY, cronMes = crono.mesNum ?? nowM;
    const justSet = new Set();
    (crono.diario ?? []).forEach(entry => {
      if (!entry.data) return;
      const day = parseInt(entry.data.split('/')[0], 10);
      String(entry.item).split(/[\s,eE&]+/).forEach(p => { const n = p.trim(); if (n) justSet.add(`${n}_${day}`); });
    });
    let totalOk = 0, totalNok = 0, totalPend = 0, totalJust = 0;
    (crono.items ?? []).forEach(it => {
      (it.turnos ?? [{ turno: 1, dias: it.dias ?? {} }]).forEach(turnoObj => {
        Object.entries(turnoObj.dias ?? {}).forEach(([dayStr, v]) => {
          if (v === undefined || v === null) return;
          const day = Number(dayStr);
          const mesOk = cronAno === nowY && cronMes === nowM;
          const isPast  = cronAno < nowY || cronMes < nowM || (mesOk && day < nowD);
          const isToday = mesOk && day === nowD;
          const realizado   = v === 4;
          const naoFeito    = v === 0;
          const justificado = naoFeito && justSet.has(`${it.item}_${dayStr}`);
          if      (realizado)                       totalOk++;
          else if (justificado)                     totalJust++;
          else if (naoFeito && (isPast || isToday)) totalNok++;
          else if (naoFeito)                        totalPend++;
        });
      });
    });
    const totalSched = totalOk + totalNok + totalJust + totalPend;
    const pct = totalSched ? Math.round(((totalOk + totalJust) / totalSched) * 100) : 0;
    this._computeCronoKpisFromTotals(totalSched, totalOk, totalNok, totalPend, totalJust, pct);
  }

  _computeCronoKpisFromTotals(totalSched, totalOk, totalNok, totalPend, totalJust, pct) {
    this._cronoKpis = {
      cronPlanejadas:  totalSched,
      cronRealiz:      totalOk,
      cronNaoRealiz:   totalNok + totalPend,
      cronCumprimento: pct,
    };
  }

  /* ── Monta o ticker mesclando todas as fontes ── */
  _refreshTicker() {
    const solicit = this._tickerSolicit ?? [];
    const crono   = this._tickerCrono  ?? [];

    // Apenas informações REAIS: solicitações de Análise Extra + cronograma do dia
    // (atrasados/hoje). Sem dados → mensagem neutra (não usa mock de demonstração).
    const all = [...solicit, ...crono];
    this._ticker?.setItems(all.length > 0 ? all : [{
      label:   'Sem atividades pendentes para hoje',
      value:   '',
      variant: 'neutral',
    }]);
  }

  _updateSolicitacoes(lista) {
    const count     = lista.length;
    const prevCount = this._prevSolicitCount ?? 0;
    this._prevSolicitCount = count;

    // Badge pulsante
    this._sidebar?.setBadge('analise-extra', count, count > 0);

    // Monta itens de análise extra para o ticker
    this._tickerSolicit = lista.map(s => {
      const urgente = s.urgencia === 'urgente';
      const partes  = [s.projeto, s.linha, s.partNo, s.titulo].filter(Boolean).join(' · ');
      return {
        label:   `${urgente ? '🚨' : '🔔'} ANÁLISE EXTRA — ${s.solicitante ?? 'Operador'} · ${partes}`,
        value:   urgente ? '⚠ URGENTE' : 'PENDENTE',
        variant: urgente ? 'danger' : 'info',
        kind:    'extra',
      };
    });
    this._refreshTicker();

    // Novas solicitações desde o último poll → mostra toast
    if (count > prevCount) {
      const novas = lista.slice(lista.length - (count - prevCount));
      novas.forEach(s => this._showSolicitacaoToast(s));
    }
  }

  _showSolicitacaoToast(sol) {
    // Lê lista de destinatários do localStorage
    let emailCfg = { recipients: [] };
    try { emailCfg = JSON.parse(localStorage.getItem('metrologia_email_cfg') ?? '{"recipients":[]}'); } catch {}

    const urgente = sol.urgencia === 'urgente';
    const cor     = urgente ? 'var(--danger,#ef4757)' : 'var(--accent,#4ea3ff)';

    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:var(--surface,#111c2e); border:1.5px solid ${cor};
      border-radius:12px; padding:14px 16px; max-width:340px;
      box-shadow:0 8px 32px rgba(0,0,0,.4); font-size:12px;
      animation: slideInRight .3s ease;
    `;

    const title = document.createElement('div');
    title.style.cssText = `font-size:13px;font-weight:700;color:${cor};margin-bottom:6px;display:flex;align-items:center;gap:6px;`;
    title.innerHTML = `${urgente ? '🚨' : '🔔'} Nova Solicitação de Análise Extra`;

    const info = document.createElement('div');
    info.style.cssText = 'color:var(--text);margin-bottom:10px;line-height:1.5;';
    info.innerHTML = `
      <strong>${sol.titulo ?? '—'}</strong><br>
      <span style="color:var(--text-mute);">${[sol.projeto, sol.linha, sol.partNo].filter(Boolean).join(' · ')}</span><br>
      <span style="color:var(--text-mute);">Por: ${sol.solicitante ?? '—'}</span>
    `;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    // Botão Outlook
    const outlookBtn = document.createElement('button');
    outlookBtn.style.cssText = `
      flex:1; padding:7px 10px; background:${cor}; color:#fff;
      border:none; border-radius:7px; font-size:11px; font-weight:700;
      cursor:pointer; display:flex; align-items:center; justify-content:center; gap:5px;
    `;
    outlookBtn.innerHTML = '📧 Notificar por Outlook';
    outlookBtn.addEventListener('click', () => {
      const href = _buildMailto(sol, emailCfg.recipients ?? []);
      window.location.href = href;
    });

    // Botão Atender
    const atenderBtn = document.createElement('button');
    atenderBtn.style.cssText = `
      padding:7px 10px; background:none; border:1px solid var(--border);
      border-radius:7px; color:var(--text); font-size:11px; cursor:pointer;
    `;
    atenderBtn.textContent = 'Atender →';
    atenderBtn.addEventListener('click', () => {
      toast.remove();
      this._analiseExtraModal?.open();
    });

    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:16px;';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => toast.remove());

    btnRow.appendChild(outlookBtn);
    btnRow.appendChild(atenderBtn);
    toast.appendChild(closeBtn);
    toast.appendChild(title);
    toast.appendChild(info);
    toast.appendChild(btnRow);
    toast.style.position = 'fixed';
    document.body.appendChild(toast);

    // Auto-fecha em 30s (urgente não fecha automaticamente)
    if (!urgente) setTimeout(() => toast.remove(), 30000);
  }

  /* ---------------------------------------------------------------------- */
  /* AUTO-REFRESH                                                             */
  /* ---------------------------------------------------------------------- */

  _scheduleRefresh() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    const ms = this._cfg?.refresh?.intervalMs ?? 300000;
    if (ms > 0) {
      this._refreshTimer = setInterval(() => this._loadData(false), ms);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* UI HELPERS                                                               */
  /* ---------------------------------------------------------------------- */

  _setLoading(val) {
    const el = document.getElementById('loading');
    if (el) el.style.display = val ? 'flex' : 'none';
  }

  _showError(err) {
    this._setLoading(false);
    const c = document.getElementById('content');
    if (!c) return;
    c.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:1rem">
        <span style="font-size:3rem">⚠️</span>
        <h2 style="color:var(--danger)">Erro ao carregar</h2>
        <p style="color:var(--muted)">${err?.message ?? 'Erro desconhecido'}</p>
        <button class="btn btn--primary" onclick="location.reload()">Tentar novamente</button>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTEGRAÇÃO: Análise Periódica → Cronograma + Gráficos
     ══════════════════════════════════════════════════════════════════════════ */

  /**
   * Mapa: tipo de medição da análise periódica → critério de busca no cronograma
   * peca: substring de it.peca (case insensitive)
   * dim:  substring de it.dimensional (case insensitive)
   */
  static get _TIPO_CRONO_MAP() {
    return {
      'Rugosimetro':               { peca: 'HEAD',        dim: 'RUGOSIDADE'    },
      'Cilindrômetro':             { peca: 'HEAD',        dim: 'CILINDROMETRO' },
      'Chamber Volume':            { peca: 'HEAD',        dim: 'CHAMBER'       },
      'Lavagem':                   { peca: 'HEAD',        dim: 'LAVAGEM'       },
      // Contracer (periódica) dá baixa no item HATSUMONO do cronograma (HEAD)
      'Contracer':                 { peca: 'HEAD',        dim: 'HATSUMONO'     },
      'Análise de Areia Residual': { peca: 'HEAD',        dim: 'AREIA'         },
      'Rugosimetro CHS':           { peca: 'CAM HOUSING', dim: 'RUGOSIDADE'    },
      'Cilindrômetro CHS':         { peca: 'CAM HOUSING', dim: 'CILINDROMETRO' },
      'Lavagem CHS':               { peca: 'CAM HOUSING', dim: 'LAVAGEM'       },
      'CMM CHS':                   { peca: 'CAM HOUSING', dim: 'TRIDIMENSIONAL'},
    };
  }

  /** Ponto de entrada: chamado ao submeter uma análise periódica */
  async _onAnalisePeriodica(analiseData) {
    await this._baixarCronograma(analiseData);
    this._savePeriodicaLocal(analiseData);  // persiste no localStorage
    this._atualizarDashboard(analiseData);
  }

  /** Salva dados essenciais da análise periódica — servidor (persiste) + localStorage (fallback) */
  _savePeriodicaLocal(data) {
    const entry = {
      ts:             data.dataAnalise ? new Date(data.dataAnalise + 'T12:00:00').toISOString() : (data.timestamp ?? new Date().toISOString()),
      status:         data.status                 ?? '',
      turno:          data.turno                  ?? 1,
      tipo:           data.tipo                   ?? '',
      operacao:       data.operacao               ?? '',
      projeto:        data.projeto                ?? '',
      linha:          data.linha                  ?? '',
      pecaNome:       data.pecaFornecedor?.nome   ?? '',
      nrOrder:        data.nrOrder                ?? '',
      operador:       data.operador               ?? '',
      dataAnalise:    data.dataAnalise             ?? '',
    };
    // 1. Servidor — persiste no arquivo periodica_hist.json (vai junto com a pasta)
    adminFetch('/api/periodica', {
      method: 'POST',
      body:   JSON.stringify(entry),
    }).catch(() => {});
    // 2. localStorage — backup para modo offline / servidor fora do ar
    try {
      const hist = JSON.parse(localStorage.getItem('metrologia_periodica_hist') ?? '[]');
      hist.push(entry);
      localStorage.setItem('metrologia_periodica_hist', JSON.stringify(hist));
    } catch { /* silencioso */ }
  }

  /**
   * Re-aplica o histórico de análises periódicas em medicoesPorMes.
   * Fonte 1: servidor (data.periodicaHist — persiste ao transferir pasta)
   * Fonte 2: localStorage (fallback offline, deduplica por timestamp)
   */
  _applyPeriodicaHistory(data) {
    // Merge servidor + localStorage, deduplica por timestamp
    const serverHist = Array.isArray(data.periodicaHist) ? data.periodicaHist : [];
    let localHist = [];
    try { localHist = JSON.parse(localStorage.getItem('metrologia_periodica_hist') ?? '[]'); }
    catch { /* silencioso */ }

    const serverTs = new Set(serverHist.map(e => e.ts));
    const hist = [...serverHist, ...localHist.filter(e => !serverTs.has(e.ts))];
    if (!hist.length) return;

    const MESES   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const mesList = data.medicoesPorMes ?? [];

    hist.forEach(entry => {
      const d = new Date(entry.ts);
      if (isNaN(d.getTime())) return;

      const mesLabel = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const periodo  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const conforme    = entry.status === 'Conforme';
      const naoConforme = entry.status === 'Não Conforme';

      let m = mesList.find(x => x.periodo === periodo);
      if (!m) {
        m = {
          mes: mesLabel, periodo,
          total: 0, conformes: 0, naoConformes: 0,
          t1: 0, t2: 0, diasAtivos: 0, tempoTotal: 0,
          chs:  { total: 0, conformes: 0, naoConformes: 0 },
          head: { total: 0, conformes: 0, naoConformes: 0 },
        };
        mesList.push(m);
      }

      m.total++;
      if (conforme)    m.conformes++;
      if (naoConforme) m.naoConformes++;

      const turno = Number(entry.turno ?? 1);
      if (turno === 1) m.t1 = (m.t1 ?? 0) + 1;
      else             m.t2 = (m.t2 ?? 0) + 1;

      // Quebra CHS / HEAD — para o filtro de Peça funcionar após recarregar
      const tipo  = entry.tipo ?? '';
      const isCHS = tipo.includes('CHS');
      const isHEAD = !isCHS && (
        entry.operacao === 'HEAD' ||
        ['Rugosimetro','Cilindrômetro','Chamber Volume','Lavagem','Contracer','Análise de Areia Residual'].includes(tipo)
      );
      m.chs  = m.chs  ?? { total: 0, conformes: 0, naoConformes: 0 };
      m.head = m.head ?? { total: 0, conformes: 0, naoConformes: 0 };
      const alvo = isCHS ? m.chs : (isHEAD ? m.head : null);
      if (alvo) {
        alvo.total++;
        if (conforme)    alvo.conformes++;
        if (naoConforme) alvo.naoConformes++;
      }
    });

    data.medicoesPorMes = mesList;
  }

  /** Marca o dia de hoje como realizado (4) no item correspondente do cronograma */
  async _baixarCronograma(analiseData) {
    console.log('[Cronograma] Baixa automática:', { tipo: analiseData.tipo, turno: analiseData.turno, data: analiseData.dataAnalise });
    const match = App._TIPO_CRONO_MAP[analiseData.tipo];
    if (!match) { console.log('[Cronograma] Tipo sem correspondência no mapa:', analiseData.tipo); return; }

    // Sempre busca dados frescos do servidor para não sobrescrever marcações manuais
    try {
      const res = await fetch('data/cronograma.json', { cache: 'no-store' });
      if (!res.ok) return;
      this._cronoData = await res.json();
    } catch { return; }

    const crono = this._cronoData;

    // Usa a data da análise se informada, senão usa hoje
    const dataRef = analiseData.dataAnalise ? new Date(analiseData.dataAnalise + 'T12:00:00') : new Date();
    const nowY  = dataRef.getFullYear();
    const nowM  = dataRef.getMonth() + 1;
    const nowD  = String(dataRef.getDate());

    // Só atualiza se o cronograma é do mesmo mês/ano da análise
    if (crono.ano !== nowY || crono.mesNum !== nowM) return;

    // Encontra o item correspondente
    const item = (crono.items ?? []).find(it =>
      it.peca?.toUpperCase().includes(match.peca) &&
      it.dimensional?.toUpperCase().includes(match.dim)
    );
    if (!item) { console.log('[Cronograma] Item não encontrado para:', match); return; }

    // Determina turno (se análise tem turno, usa; senão marca T1)
    const turnoNum = analiseData.turno ? Number(analiseData.turno) : 1;
    const turnos   = item.turnos ?? [{ turno: 1, dias: item.dias ?? {} }];
    const turnoObj = turnos.find(t => t.turno === turnoNum) ?? turnos[0];

    // Marca o dia como realizado
    turnoObj.dias = turnoObj.dias ?? {};
    turnoObj.dias[nowD] = 4;
    console.log(`[Cronograma] Marcando item ${item.item} T${turnoObj.turno} dia ${nowD} como realizado`);

    // Persiste no servidor
    try {
      const res = await adminFetch('/api/cronograma', {
        method: 'POST',
        body: JSON.stringify(crono),
      });
      if (res.ok) {
        console.log('[Cronograma] Salvo com sucesso no servidor');
        // Dispara atualização de badge + ticker + widget
        this._bus.emit('cronograma:saved');
        // Se o cronograma estiver visível, re-renderiza
        this._cronogramaPage?._data && (this._cronogramaPage._data = crono) && this._cronogramaPage._render?.();
      }
    } catch { /* servidor não disponível em modo estático */ }
  }

  /* ---------------------------------------------------------------------- */
  /* EQUIPAMENTO — computa contagens a partir dos check sheets               */
  /* ---------------------------------------------------------------------- */

  /**
   * Mapeamento: tipo de análise periódica → nome do equipamento (campo maq.)
   * Espelha os valores do campo `maq` definidos em RASTREABILIDADE
   * (AnalisePeriodicaPage.js).
   */
  static _TIPO_EQUIP_MAP = {
    'Rugosimetro':               'RUGOSIMETRO',
    'Rugosimetro CHS':           'RUGOSIMETRO',
    'Chamber Volume':            'CHAMBER VOLUME',
    'Cilindrômetro':             'CILINDROMETRO',
    'Cilindrômetro CHS':         'CILINDROMETRO',
    'Lavagem':                   'LAVAGEM',
    'Lavagem CHS':               'LAVAGEM',
    'Contracer':                 'CONTRACER',
    'CMM CHS':                   'CMM (TRIDIMENSIONAL)',
    'Análise de Areia Residual': 'HEAD AREIA',
  };

  /**
   * Constrói medicoesPorEquipamento combinando:
   *  1) Baseline do mock.json (dados históricos periódicos)
   *  2) Medições extras salvas em localStorage (campo maq dos medicaoItems)
   *  3) Sessão atual (incrementos via _atualizarDashboard)
   */
  _computeEquipamento(data) {
    // 1. Baseline periódica (mock.json)
    const counts = {};
    (data.medicoesPorEquipamento ?? []).forEach(e => {
      const nome = (e.equipamento ?? '').trim().toUpperCase();
      if (nome) counts[nome] = (counts[nome] ?? 0) + (e.count ?? e.qtd ?? 0);
    });

    // 2. Extras — campo maq dos medicaoItems (localStorage, análises com itens preenchidos)
    try {
      const extraLocal = JSON.parse(localStorage.getItem('metrologia_analise_extra_index') ?? '[]');
      extraLocal.forEach(r => {
        (r.medicaoItems ?? []).forEach(it => {
          const maq = (it.maq ?? '').trim().toUpperCase();
          if (maq) counts[maq] = (counts[maq] ?? 0) + 1;
        });
      });
    } catch { /* sem dados */ }

    // 3. Converte para array e ordena desc
    return Object.entries(counts)
      .map(([equipamento, count]) => ({ equipamento, count }))
      .sort((a, b) => b.count - a.count);
  }

  /** Incrementa KPIs e gráficos em memória + re-renderiza */
  _atualizarDashboard(analiseData) {
    if (!this._data) return;

    const naoConforme = analiseData.status === 'Não Conforme';
    // Tudo que não é explicitamente NOK conta como conforme no gráfico
    const conforme = !naoConforme && (analiseData.status ?? '') !== '';

    // Conta itens efetivamente medidos no check sheet (ou usa 1 como fallback)
    let qtdMedicoes = 1;
    if (analiseData.tipo && typeof analiseData === 'object') {
      // Conta chaves r0_*, r1_*, etc. que têm valor preenchido
      const keys = Object.keys(analiseData).filter(k => /^r\d+_/.test(k) && analiseData[k] !== null && analiseData[k] !== undefined && analiseData[k] !== '');
      if (keys.length > 0) qtdMedicoes = keys.length;
    }

    // ── 1. KPIs ──────────────────────────────────────────────────────────────
    const kpis = this._data.kpis ?? {};
    kpis.qtdPecasMedidas  = (kpis.qtdPecasMedidas  ?? 0) + qtdMedicoes;
    if (naoConforme) kpis.qtdNaoConformes = (kpis.qtdNaoConformes ?? 0) + 1;
    this._kpiGrid?.update(kpis);

    // ── 2. medicoesPorMes — usa data da análise, não today ────────────────
    const MESES  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const refDate = analiseData.dataAnalise
      ? new Date(analiseData.dataAnalise + 'T12:00:00')
      : new Date();
    const mesAtual = `${MESES[refDate.getMonth()]}/${String(refDate.getFullYear()).slice(2)}`;
    const periodo  = `${refDate.getFullYear()}-${String(refDate.getMonth()+1).padStart(2,'0')}`;

    const mesList = this._data.medicoesPorMes ?? [];
    let mesEntry  = mesList.find(m => m.mes === mesAtual || m.periodo === periodo);

    if (!mesEntry) {
      mesEntry = {
        mes: mesAtual, periodo,
        total: 0, conformes: 0, naoConformes: 0, diasAtivos: 0, tempoTotal: 0,
        t1: 0, t2: 0,
        chs:  { total: 0, conformes: 0, naoConformes: 0 },
        head: { total: 0, conformes: 0, naoConformes: 0 },
      };
      mesList.push(mesEntry);
      this._data.medicoesPorMes = mesList;
    }

    mesEntry.total      += qtdMedicoes;
    mesEntry.conformes  += conforme    ? qtdMedicoes : 0;
    mesEntry.naoConformes += naoConforme ? 1 : 0;

    // Turno
    const turno = analiseData.turno ? Number(analiseData.turno) : 1;
    if (turno === 1) mesEntry.t1 = (mesEntry.t1 ?? 0) + qtdMedicoes;
    else             mesEntry.t2 = (mesEntry.t2 ?? 0) + qtdMedicoes;

    // Peça: HEAD ou CHS
    const tipo   = analiseData.tipo ?? '';
    const isCHS  = tipo.includes('CHS');
    const isHEAD = !isCHS && (
      analiseData.operacao === 'HEAD' ||
      ['Rugosimetro','Cilindrômetro','Chamber Volume','Lavagem','Contracer','Análise de Areia Residual'].includes(tipo)
    );

    if (isHEAD) {
      mesEntry.head.total      += qtdMedicoes;
      mesEntry.head.conformes  += conforme    ? qtdMedicoes : 0;
      mesEntry.head.naoConformes += naoConforme ? 1 : 0;
    } else if (isCHS) {
      mesEntry.chs.total       += qtdMedicoes;
      mesEntry.chs.conformes   += conforme    ? qtdMedicoes : 0;
      mesEntry.chs.naoConformes += naoConforme ? 1 : 0;
    }

    // ── 3. medicoesPorEquipamento (análise periódica) ──────────────────────
    const equipNome = App._TIPO_EQUIP_MAP[analiseData.tipo ?? ''];
    if (equipNome) {
      this._data.medicoesPorEquipamento = this._data.medicoesPorEquipamento ?? [];
      let eq = this._data.medicoesPorEquipamento.find(e => e.equipamento === equipNome);
      if (!eq) {
        eq = { equipamento: equipNome, count: 0 };
        this._data.medicoesPorEquipamento.push(eq);
      }
      eq.count++;
      // Re-ordena desc
      this._data.medicoesPorEquipamento.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    }

    // ── 4. osPorStatus ─────────────────────────────────────────────────────
    const statusList = this._data.osPorStatus ?? [];
    const sConf    = statusList.find(s => s.status === 'Conformes');
    const sNConf   = statusList.find(s => s.status === 'Não Conformes');
    if (conforme    && sConf)  sConf.count++;
    if (naoConforme && sNConf) sNConf.count++;

    // ── 5. Re-renderiza gráficos respeitando os filtros ativos ───────────
    // Usa _onFilterChange() para garantir que qualquer filtro ativo (ex: Projeto NEXTB)
    // seja re-aplicado após o incremento, evitando que o gráfico mostre valores brutos.
    this._onFilterChange();

    // Toast de confirmação com status
    const color = conforme ? '#22c55e' : naoConforme ? '#ef4444' : '#f59e0b';
    const icon  = conforme ? '✓' : '⚠';
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; bottom:80px; right:24px; z-index:9999;
      background:var(--panel,#111c2e); border:1.5px solid ${color};
      border-radius:10px; padding:12px 16px; min-width:260px; max-width:320px;
      box-shadow:0 8px 32px rgba(0,0,0,.4); font-size:12px; line-height:1.5;
      animation:slideInRight .3s ease;
    `;
    toast.innerHTML = `
      <div style="font-weight:700;color:${color};margin-bottom:4px;">
        ${icon} Cronograma atualizado
      </div>
      <div style="color:var(--text,#e5e7eb);">
        ${[analiseData.projeto, analiseData.operacao, analiseData.tipo].filter(Boolean).join(' / ')}
      </div>
      <div style="color:var(--text-mute,#6b7280);font-size:11px;margin-top:2px;">
        Status: <strong style="color:${color};">${analiseData.status ?? '—'}</strong>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 4000);
  }
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */

const app = new App();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
