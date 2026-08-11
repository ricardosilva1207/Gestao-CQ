/**
 * AnalisePeriodicaPage.js — Página Full-Screen de Análise Periódica
 * Dashboard Metrologia — Painel de Controle
 * Padronizado com AnaliseExtraModal (full-page, left: sidebar-w)
 */

/* ═══════════════════════════════════════════════════════════════
   HIERARQUIA
   ═══════════════════════════════════════════════════════════════ */
export const HIERARQUIA = {
  projetos: ['NEXTB', 'M20A', 'SHAFT'],
  linhas: {
    NEXTB:  ['Fundição', 'Usinagem', 'Fornecedor'],
    M20A:   ['Fundição', 'Usinagem', 'Fornecedor'],
    SHAFT:  ['Forjaria', 'Cold', 'Usinagem'],
  },
  operacoes: {
    NEXTB: { Fundição:['LP','DC'], Usinagem:['HEAD','CAMHOUSING','CRANK','BLOCO','CONROD'], Fornecedor:[] },
    M20A:  { Fundição:['LP','DC'], Usinagem:['HEAD','CAMHOUSING','CRANK','BLOCO','CONROD'], Fornecedor:[] },
    SHAFT: { Forjaria:[], Cold:[], Usinagem:[] },
  },
  medicoes: {
    'NEXTB|Fundição|LP':         ['Análise de Areia Residual'],
    'NEXTB|Fundição|DC':         ['Análise de Areia Residual'],
    'NEXTB|Usinagem|HEAD':       ['Rugosimetro','Cilindrômetro','Chamber Volume','Lavagem','Contracer'],
    'NEXTB|Usinagem|CAMHOUSING': ['Rugosimetro CHS','Cilindrômetro CHS','CMM CHS','Lavagem CHS'],
    'NEXTB|Usinagem|CRANK':      ['Rugosimetro','Cilindrômetro','Lavagem'],
    'NEXTB|Usinagem|BLOCO':      ['Rugosimetro','Cilindrômetro','Lavagem'],
    'NEXTB|Usinagem|CONROD':     ['Rugosimetro','Cilindrômetro','Lavagem'],
    'M20A|Fundição|LP':          ['Análise de Areia Residual'],
    'M20A|Fundição|DC':          ['Análise de Areia Residual'],
    'M20A|Usinagem|HEAD':        ['Rugosimetro','Cilindrômetro','Chamber Volume','Lavagem','Contracer'],
    'M20A|Usinagem|CAMHOUSING':  ['Rugosimetro CHS','Cilindrômetro CHS','CMM CHS','Lavagem CHS'],
    'M20A|Usinagem|CRANK':       ['Rugosimetro','Cilindrômetro','Lavagem'],
    'M20A|Usinagem|BLOCO':       ['Rugosimetro','Cilindrômetro','Lavagem'],
    'M20A|Usinagem|CONROD':      ['Rugosimetro','Cilindrômetro','Lavagem'],
  },
};

/* ═══════════════════════════════════════════════════════════════
   RASTREABILIDADE
   ═══════════════════════════════════════════════════════════════ */
export const RASTREABILIDADE = {
  'Análise de Areia Residual': {
    titulo: 'RASTREABILIDADE HEAD AREIA',
    colsResult: [
      { key:'res_IN', label:'RESULTADO\nLado Admissão (#IN)' },
      { key:'res_EX', label:'RESULTADO\nLado Exaustão (#EX)' },
    ],
    itens: [
      { no:1, desc:'Qtde areia residual', esp:'Max. 8', maq:'BALANÇA / MICROSC.', ponto:'Ports In/Ex', unid:'Mg', spec:{t:'max',v:8} },
    ],
  },
  'Rugosimetro': {
    titulo: 'RASTREABILIDADE HEAD RUGOSÍMETRO',
    colsResult: [
      { key:'r_A1', label:'LINHA A\n#1' }, { key:'r_A8', label:'LINHA A\n#8' },
      { key:'r_B1', label:'LINHA B\n#1' }, { key:'r_B8', label:'LINHA B\n#8' },
    ],
    itens: [
      { no:1,  desc:'Rugosidade #IN8 UPPER',    esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rugosidade #IN8 CENTER',   esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rugosidade #IN8 LOWER',    esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #IN8 UPPER',   esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #IN8 CENTER',  esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #IN8 LOWER',   esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula IN', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:2,  desc:'Rugosidade #EX8 UPPER',    esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rugosidade #EX8 CENTER',   esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rugosidade #EX8 LOWER',    esp:'Ra ≤ 2,5',  maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #EX8 UPPER',   esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #EX8 CENTER',  esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:'', desc:'Rdc (0-50%) #EX8 LOWER',   esp:'≤ 2,5',     maq:'RUGOS.', ponto:'Guia válvula EX', unid:'µm', spec:{t:'max',v:2.5}  },
      { no:3,  desc:'Rugosidade IN (HLA)',       esp:'Ra ≤ 1,25', maq:'RUGOS.', ponto:'HLA',             unid:'µm', spec:{t:'max',v:1.25} },
      { no:'', desc:'Rugosidade EX (HLA)',       esp:'Ra ≤ 1,25', maq:'RUGOS.', ponto:'HLA',             unid:'µm', spec:{t:'max',v:1.25} },
      { no:4,  desc:'Rugosidade Face Inferior',  esp:'Ra ≤ 1,6',  maq:'RUGOS.', ponto:'Assento 45°',     unid:'µm', spec:{t:'max',v:1.6}  },
      { no:'', desc:'Rz Face Inferior',          esp:'Rz ≤ 11',   maq:'RUGOS.', ponto:'Assento 45°',     unid:'µm', spec:{t:'max',v:11}   },
      { no:'', desc:'Ondulação',                 esp:'15PT/25mm', maq:'RUGOS.', ponto:'Face Inferior',   unid:'PT', spec:null              },
      { no:5,  desc:'Rugosidade Assento 45° IN', esp:'Ra ≤ 1,6',  maq:'RUGOS.', ponto:'Assento IN',      unid:'µm', spec:{t:'max',v:1.6}  },
      { no:6,  desc:'Rugosidade Assento 45° EX', esp:'Ra ≤ 1,6',  maq:'RUGOS.', ponto:'Assento EX',      unid:'µm', spec:{t:'max',v:1.6}  },
    ],
  },
  'Chamber Volume': {
    titulo: 'RASTREABILIDADE HEAD CHAMBER VOLUME',
    colsResult: [
      { key:'cv_1',label:'#1' },{ key:'cv_2',label:'#2' },{ key:'cv_3',label:'#3' },{ key:'cv_4',label:'#4' },
    ],
    itens: [
      { no:7,  desc:'Volumetria',              esp:'25,5 ± 0,6', maq:'CHAMB. VOL.', ponto:'Câmara de combustão', unid:'CC', spec:{t:'range',v:25.5,tol:0.6} },
      { no:'', desc:'Diferença entre câmaras', esp:'Máx. 0,6',   maq:'CHAMB. VOL.', ponto:'Câmaras 1–4',        unid:'CC', spec:{t:'max',v:0.6}, singleResult:true },
    ],
  },
  'Cilindrômetro': {
    titulo: 'RASTREABILIDADE HEAD CILINDRÔMETRO',
    colsResult: [
      { key:'ci_A1',label:'LINHA A\n#1' },{ key:'ci_A8',label:'LINHA A\n#8' },
      { key:'ci_B1',label:'LINHA B\n#1' },{ key:'ci_B8',label:'LINHA B\n#8' },
    ],
    itens: [
      { no:8,  desc:'Circularidade #IN 10 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Circularidade #IN 20 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Circularidade #IN 30 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #IN 0°',     esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #IN 90°',    esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #IN 180°',   esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #IN 270°',   esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:9,  desc:'Circularidade #EX 10 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Circularidade #EX 20 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Circularidade #EX 30 mm', esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #EX 0°',     esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #EX 90°',    esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #EX 180°',   esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade #EX 270°',   esp:'Máx. 10,0', maq:'CNC', ponto:'Guia válvula', unid:'µm', spec:{t:'max',v:10} },
      { separator: 'HLA — Hydraulic Lash Adjuster' },
      { no:10, desc:'Circularidade HLA IN',    esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade HLA IN 0°',  esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade HLA IN 180°',esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Circularidade HLA EX',    esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade HLA EX 0°',  esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
      { no:'', desc:'Retilinidade HLA EX 180°',esp:'Máx. 10,0', maq:'CNC', ponto:'HLA',          unid:'µm', spec:{t:'max',v:10} },
    ],
  },
  'Lavagem': {
    titulo: 'RASTREABILIDADE HEAD LAVAGEM',
    colsResult: [{ key:'lav_res', label:'RESULTADO' }],
    itens: [
      { no:11, desc:'Lavagem BCW',              esp:'70 MÁX',          maq:'LAVADORA',      ponto:'Water Jacket',      unid:'mg', spec:{t:'max',v:70}              },
      { no:'', desc:'Lavagem MW (óleo VVT)',    esp:'1 MÁX',           maq:'LAVADORA',      ponto:'Passagem óleo VVT', unid:'mg', spec:{t:'max',v:1}               },
      { no:'', desc:'Lavagem MW (HLA IN/EX)',   esp:'5 MÁX',           maq:'LAVADORA',      ponto:'HLA IN/EX',         unid:'mg', spec:{t:'max',v:5}               },
      { no:12, desc:'Aderência — Face Superior',esp:'≥ 0,7',           maq:'FITA NISHIBAN', ponto:'Face Superior',     unid:'N',  spec:{t:'min',v:0.7}             },
      { no:'', desc:'Aderência — Face Frontal', esp:'≥ 0,7',           maq:'FITA NISHIBAN', ponto:'Face Frontal',      unid:'N',  spec:{t:'min',v:0.7}             },
      { no:13, desc:'Molhabilidade — Sup.',     esp:'OK', maq:'NURESHIAKU', ponto:'Face Superior', unid:'—', spec:{t:'bool',ok:'OK',options:['','OK','NG']} },
      { no:'', desc:'Molhabilidade — Frontal',  esp:'OK', maq:'NURESHIAKU', ponto:'Face Frontal',  unid:'—', spec:{t:'bool',ok:'OK',options:['','OK','NG']} },
    ],
  },
  'Contracer': {
    titulo: 'RASTREABILIDADE HEAD CONTRACER',
    colsResult: [
      { key:'ct_1', label:'#1' },
      { key:'ct_8', label:'#8' },
    ],
    itens: [
      { separator: 'OP.140 — Assento Válvula IN' },
      { no:14, desc:'Largura Chanfro IN',     esp:'1,2 ± 0,2',  maq:'CONTR.', ponto:'Assento válvula IN', unid:'mm',    spec:{t:'range',v:1.2,tol:0.2}  },
      { no:15, desc:'Ângulo Chanfro IN 60°',  esp:'60 ± 1,5°',  maq:'CONTR.', ponto:'Assento válvula IN', unid:'graus', spec:{t:'range',v:60,tol:1.5}   },
      { no:'', desc:'Ângulo Chanfro IN 90°',  esp:'90 ± 0,5°',  maq:'CONTR.', ponto:'Assento válvula IN', unid:'graus', spec:{t:'range',v:90,tol:0.5}   },
      { no:'', desc:'Ângulo Chanfro IN 120°', esp:'120 ± 1,5°', maq:'CONTR.', ponto:'Assento válvula IN', unid:'graus', spec:{t:'range',v:120,tol:1.5}  },
      { separator: 'OP.150 — Assento Válvula EX' },
      { no:16, desc:'Largura Chanfro EX',     esp:'1,2 ± 0,2',  maq:'CONTR.', ponto:'Assento válvula EX', unid:'mm',    spec:{t:'range',v:1.2,tol:0.2}  },
      { no:17, desc:'Ângulo Chanfro EX 30°',  esp:'30 ± 1,5°',  maq:'CONTR.', ponto:'Assento válvula EX', unid:'graus', spec:{t:'range',v:30,tol:1.5}   },
      { no:'', desc:'Ângulo Chanfro EX 90°',  esp:'90 ± 0,5°',  maq:'CONTR.', ponto:'Assento válvula EX', unid:'graus', spec:{t:'range',v:90,tol:0.5}   },
      { no:'', desc:'Ângulo Chanfro EX 120°', esp:'120 ± 1,5°', maq:'CONTR.', ponto:'Assento válvula EX', unid:'graus', spec:{t:'range',v:120,tol:1.5}  },
    ],
  },

  /* ── CAMHOUSING ─────────────────────────────────────────────── */
  'Rugosimetro CHS': {
    titulo: 'RASTREABILIDADE CAMHOUSING RUGOSÍMETRO',
    colsResult: [
      { key:'chs_ex', label:'EX' },
      { key:'chs_in', label:'IN' },
    ],
    itens: [
      { no:1,  desc:'Rugosidade Journal #1', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #1', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:'', desc:'Rugosidade Journal #2', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #2', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:'', desc:'Rugosidade Journal #3', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #3', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:'', desc:'Rugosidade Journal #4', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #4', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:'', desc:'Rugosidade Journal #5', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #5', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:'', desc:'Rugosidade Journal #6', esp:'Ra Máx. 0,63', maq:'RUGOS.', ponto:'Journal #6', unid:'Ra', spec:{t:'max',v:0.63} },
      { no:2,  desc:'Face Inferior',         esp:'Visual OK',    maq:'VISUAL', ponto:'Face Inferior', unid:'—', spec:{t:'bool',ok:'OK'}, singleResult:true },
      { no:3,  desc:'Face Superior',         esp:'Visual OK',    maq:'VISUAL', ponto:'Face Superior', unid:'—', spec:{t:'bool',ok:'OK'}, singleResult:true },
      { no:4,  desc:'Face Frontal (Fr)',      esp:'Visual OK',    maq:'VISUAL', ponto:'Face Frontal',  unid:'—', spec:{t:'bool',ok:'OK'}, singleResult:true },
      { no:5,  desc:'Face Traseira (Rr)',     esp:'Visual OK',    maq:'VISUAL', ponto:'Face Traseira', unid:'—', spec:{t:'bool',ok:'OK'}, singleResult:true },
    ],
  },

  'Cilindrômetro CHS': {
    titulo: 'RASTREABILIDADE CAMHOUSING CILINDRÔMETRO OP100',
    colsResult: [
      { key:'chs_ex', label:'EX' },
      { key:'chs_in', label:'IN' },
    ],
    itens: [
      { no:6,  desc:'Circularidade Journal #1', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #1', unid:'µm', spec:{t:'max',v:7} },
      { no:'', desc:'Circularidade Journal #2', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #2', unid:'µm', spec:{t:'max',v:7} },
      { no:'', desc:'Circularidade Journal #3', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #3', unid:'µm', spec:{t:'max',v:7} },
      { no:'', desc:'Circularidade Journal #4', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #4', unid:'µm', spec:{t:'max',v:7} },
      { no:'', desc:'Circularidade Journal #5', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #5', unid:'µm', spec:{t:'max',v:7} },
      { no:'', desc:'Circularidade Journal #6', esp:'Máx. 7 µm',  maq:'CNC', ponto:'Journal #6', unid:'µm', spec:{t:'max',v:7} },
      { no:7,  desc:'Concentricidade Journal #2', esp:'Máx. 15 µm', maq:'CNC', ponto:'Journal #2 (EX e IN)', unid:'µm', spec:{t:'max',v:15} },
      { no:'', desc:'Concentricidade Journal #3', esp:'Máx. 15 µm', maq:'CNC', ponto:'Journal #3 (EX e IN)', unid:'µm', spec:{t:'max',v:15} },
      { no:'', desc:'Concentricidade Journal #4', esp:'Máx. 15 µm', maq:'CNC', ponto:'Journal #4 (EX e IN)', unid:'µm', spec:{t:'max',v:15} },
      { no:'', desc:'Concentricidade Journal #5', esp:'Máx. 15 µm', maq:'CNC', ponto:'Journal #5 (somente EX)', unid:'µm', spec:{t:'max',v:15} },
    ],
  },

  'CMM CHS': {
    titulo: 'RASTREABILIDADE CAMHOUSING CMM OP100',
    colsResult: [{ key:'chs_cmm', label:'RESULTADO' }],
    itens: [
      { no:8, desc:'Posição — Furo óleo bomba vácuo', esp:'⌖ Ø 0,8 M', maq:'CMM', ponto:'Furo de óleo bomba vácuo', unid:'mm', spec:null             },
      { no:9, desc:'Planicidade — Face Inferior',     esp:'Máx. 0,1',   maq:'CMM', ponto:'Face Inferior',           unid:'mm', spec:{t:'max',v:0.1}  },
    ],
  },

  'Lavagem CHS': {
    titulo: 'RASTREABILIDADE CAMHOUSING LAVAGEM / ADERÊNCIA',
    colsResult: [{ key:'chs_lav', label:'RESULTADO' }],
    itens: [
      { no:10, desc:'Aderência — Face Frontal (12 mm)',              esp:'Min. 0,7 N',      maq:'FITA NISHIBAN',   ponto:'Face Frontal',  unid:'N',     spec:{t:'min',v:0.7}           },
      { no:'', desc:'Aderência — Face Inferior (6 mm)',              esp:'Min. 0,35 N',     maq:'FITA NISHIBAN',   ponto:'Face Inferior', unid:'N',     spec:{t:'min',v:0.35}          },
      { no:11, desc:'Impurezas Oil Holes — Partículas (peso)',       esp:'Máx. 1 mg',       maq:'BALANÇA/MICROSC.',ponto:'Oil Holes',     unid:'mg',    spec:{t:'max',v:1}             },
      { no:'', desc:'Impurezas Oil Holes — Partículas (tamanho)',    esp:'Máx. 0,4 mm',     maq:'MICROSC.',        ponto:'Oil Holes',     unid:'mm',    spec:{t:'max',v:0.4}           },
      { no:12, desc:'Molhabilidade — Face Frontal',                  esp:'Deve estar molhada',maq:'NURESHIAKU',    ponto:'Face Frontal',  unid:'Visual',spec:{t:'bool',ok:'Molhado'}  },
      { no:'', desc:'Molhabilidade — Face Inferior',                 esp:'Deve estar molhada',maq:'NURESHIAKU',    ponto:'Face Inferior', unid:'Visual',spec:{t:'bool',ok:'Molhado'}  },
    ],
  },

  /* ── CAMSHAFT (Fornecedor) ──────────────────────────────── */
  'Camshaft': {
    titulo: 'RASTREABILIDADE CAMSHAFT — FORNECEDOR',
    colsResult: [{ key:'res', label:'RESULTADO' }],
    itens: [
      /* ── 1. Rugosidade VVT ── */
      { separator: 'RUGOSIDADE (RUGOSÍMETRO)' },
      { no:1,  desc:'VVT',         esp:'Ra Máx 0,50',   maq:'RUGOS.', ponto:'VVT',     unid:'Ra', spec:{t:'max',v:0.5} },

      /* ── 2. Circularidade Journals ── */
      { separator: 'CIRCULARIDADE JOURNALS (CNC / MICRÔMETRO) — Máx 0,200 mm' },
      { no:2,  desc:'C1 — Ponto 1', esp:'Máx 0,200', maq:'CNC', ponto:'C1 Ponto 1', unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'C1 — Ponto 2', esp:'Máx 0,200', maq:'CNC', ponto:'C1 Ponto 2', unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'C1 — Ponto 3', esp:'Máx 0,200', maq:'CNC', ponto:'C1 Ponto 3', unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'J2',           esp:'Máx 0,200', maq:'CNC', ponto:'Journal 2',  unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'J3',           esp:'Máx 0,200', maq:'CNC', ponto:'Journal 3',  unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'J4',           esp:'Máx 0,200', maq:'CNC', ponto:'Journal 4',  unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'J5',           esp:'Máx 0,200', maq:'CNC', ponto:'Journal 5',  unid:'mm', spec:{t:'max',v:0.2} },
      { no:'', desc:'J6',           esp:'Máx 0,200', maq:'CNC', ponto:'Journal 6',  unid:'mm', spec:{t:'max',v:0.2} },

      /* ── 3. Circularidade Área VVT ── */
      { separator: 'CIRCULARIDADE ÁREA VVT (CNC)' },
      { no:3,  desc:'Área VVT — Circularidade', esp:'Máx 0,005', maq:'CNC', ponto:'Área VVT', unid:'mm', spec:{t:'max',v:0.005} },

      /* ── 4. Diâmetro Flange ── */
      { separator: 'DIÂMETRO FLANGE (MICRÔMETRO)' },
      { no:4,  desc:'Flange', esp:'46,80 ~ 47,00', maq:'MICR.', ponto:'Flange', unid:'mm', spec:{t:'minmax',min:46.80,max:47.00} },

      /* ── 5. Diâmetro Journals — Ponto 3 ── */
      { separator: 'DIÂMETRO JOURNALS — PONTO 3 (MICRÔMETRO): 34,454 ~ 34,470 mm' },
      { no:5,  desc:'Ponto 3 — X', esp:'34,454~34,470', maq:'MICR.', ponto:'Ponto 3 X', unid:'mm', spec:{t:'minmax',min:34.454,max:34.470} },
      { no:'', desc:'Ponto 3 — Y', esp:'34,454~34,470', maq:'MICR.', ponto:'Ponto 3 Y', unid:'mm', spec:{t:'minmax',min:34.454,max:34.470} },

      /* ── 6. Diâmetro Área VVT ── */
      { separator: 'DIÂMETRO ÁREA VVT (MICRÔMETRO): 33,984 ~ 34,000 mm' },
      { no:6,  desc:'Área VVT — X', esp:'33,984~34,000', maq:'MICR.', ponto:'Área VVT X', unid:'mm', spec:{t:'minmax',min:33.984,max:34.000} },
      { no:'', desc:'Área VVT — Y', esp:'33,984~34,000', maq:'MICR.', ponto:'Área VVT Y', unid:'mm', spec:{t:'minmax',min:33.984,max:34.000} },

      /* ── 7. Mismatch CAMI ── */
      { separator: 'MISMATCH (PAQUÍMETRO)' },
      { no:7,  desc:'CAMI', esp:'Máx 1,0', maq:'PAQUIM.', ponto:'CAMI', unid:'mm', spec:{t:'max',v:1.0} },

      /* ── 8. Espessura Flange ── */
      { separator: 'ESPESSURA FLANGE (PAQUÍMETRO)' },
      { no:8,  desc:'Espessura Flange', esp:'2,84 ~ 2,94', maq:'PAQUIM.', ponto:'Flange', unid:'mm', spec:{t:'minmax',min:2.84,max:2.94} },

      /* ── 9. Distância ── */
      { separator: 'DISTÂNCIA (PAQUÍMETRO)' },
      { no:9,  desc:'Distância', esp:'17,8 ± 1,5\n(16,3 ~ 19,3)', maq:'PAQUIM.', ponto:'—', unid:'mm', spec:{t:'range',v:17.8,tol:1.5} },

      /* ── 10. Espessura CAM ── */
      { separator: 'ESPESSURA CAM (12,5 ~ 15,0 mm)' },
      { no:10, desc:'CAM #1', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #1', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #2', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #2', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #3', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #3', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #4', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #4', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #5', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #5', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #6', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #6', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #7', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #7', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
      { no:'', desc:'CAM #8', esp:'12,5 ~ 15,0', maq:'—', ponto:'Cam #8', unid:'mm', spec:{t:'minmax',min:12.5,max:15.0} },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   CLASSE
   ═══════════════════════════════════════════════════════════════ */
export class AnalisePeriodicaPage {
  constructor(cfg, bus) {
    this._cfg           = cfg;
    this._bus           = bus;
    this._data          = {};
    this._steps         = [];
    this._stepIdx       = 0;
    this._page          = null;
    this._topBadge      = null;
    this._progressFill  = null;
    this._stepHdr       = null;
    this._bodyEl        = null;
    this._footEl        = null;
    this._statusEl      = null;
  }

  /* ── API pública ─────────────────────────────────────────── */
  open() {
    this._data    = {};
    this._stepIdx = 0;
    this._steps   = this._buildSteps();
    if (!this._page) this._build();
    this._page.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this._renderStep();
  }

  close() {
    if (this._page) this._page.style.display = 'none';
    document.body.style.overflow = '';
    this._bus.emit('analise-periodica:closed', this._data);
  }

  /* ── Steps ──────────────────────────────────────────────── */
  _buildSteps() {
    return [
      { id:'projeto',        title:'Escolha o projeto',            render:() => this._renderProjeto()         },
      { id:'linha',          title:'Selecione a linha',            render:() => this._renderLinha()           },
      { id:'fornecedor_peca',title:'Peça do Fornecedor',           render:() => this._renderFornecedorPeca()  },
      { id:'operacao',       title:'Selecione a operação',         render:() => this._renderOperacao()        },
      { id:'tipo',           title:'Tipo de medição',              render:() => this._renderTipo()            },
      { id:'dados',          title:'Dados da peça',                render:() => this._renderDados()           },
      { id:'medicao',        title:'Resultado da medição',         render:() => this._renderMedicao()         },
      { id:'confirmar',      title:'Confirmar, Assinaturas e PDF', render:() => this._renderResumo()          },
    ];
  }

  /* ── Avança um passo lidando com todos os skips ──────────── */
  _advanceStep() {
    this._stepIdx++;
    // Pula fornecedor_peca se linha ≠ Fornecedor
    if (this._currentStep?.id === 'fornecedor_peca' && this._data.linha !== 'Fornecedor') {
      this._stepIdx++;
    }
    // Pula operacao se não há operações disponíveis
    if (this._currentStep?.id === 'operacao' && this._getOperacoes().length === 0) {
      this._stepIdx++;
    }
    // Pula tipo se 0 ou 1 opção (ou se peça do fornecedor já define o tipo)
    if (this._currentStep?.id === 'tipo') {
      if (this._data.pecaFornecedor) {
        // tipo já definido pela peça selecionada — apenas pula o step
        this._stepIdx++;
      } else {
        const tipos = this._getMedicoes();
        if      (tipos.length === 0) { this._data.tipo = null;     this._stepIdx++; }
        else if (tipos.length === 1) { this._data.tipo = tipos[0]; this._stepIdx++; }
      }
    }
    this._renderStep();
  }

  get _totalSteps() { return this._steps.length; }
  get _currentStep() { return this._steps[this._stepIdx]; }

  /* ── Build — layout full-page ────────────────────────────── */
  _build() {
    if (!document.getElementById('ap-page-styles')) {
      const s = document.createElement('style');
      s.id = 'ap-page-styles';
      s.textContent = `
        /* ── Página principal ── */
        .ap-page {
          position: fixed; top: 0; right: 0; bottom: 0;
          left: var(--sidebar-w, 240px);
          z-index: 800;
          background: var(--bg, #0b1220);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        /* Topbar */
        .ap-page__topbar {
          display: flex; align-items: center; gap: 12px;
          padding: 0 20px; height: 56px; flex-shrink: 0;
          background: var(--panel, #131c2e);
          border-bottom: 1px solid var(--border);
        }
        .ap-page__back {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid var(--border);
          border-radius: 6px; padding: 6px 12px;
          color: var(--text); font-size: 12px; cursor: pointer;
          transition: all .15s; white-space: nowrap;
        }
        .ap-page__back:hover { border-color: var(--accent,#4ea3ff); color: var(--accent,#4ea3ff); }
        .ap-page__title { font-size: 14px; font-weight: 700; flex: 1; color: var(--text); }
        .ap-page__badge {
          font-size: 11px; color: var(--text-mute);
          background: var(--panel-2, #182338);
          padding: 3px 10px; border-radius: 20px; border: 1px solid var(--border);
          white-space: nowrap;
        }
        /* Barra de progresso */
        .ap-page__progress { height: 3px; background: var(--border); flex-shrink: 0; }
        .ap-page__progress-fill { height: 100%; background: var(--accent,#4ea3ff); transition: width .3s; }
        /* Step header */
        .ap-page__step-hdr {
          padding: 16px 24px 10px; flex-shrink: 0;
          background: var(--bg, #0b1220);
          border-bottom: 1px solid var(--border);
        }
        .ap-page__step-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .14em; color: var(--accent, #4ea3ff);
          display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
        }
        .ap-page__step-title {
          font-size: 20px; font-weight: 700; color: var(--text);
        }
        /* Body scrollável */
        .ap-page__body {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          background: var(--bg, #0b1220);
        }
        .ap-page__inner {
          max-width: 980px; margin: 0 auto; padding: 24px 28px 32px;
        }
        /* Footer */
        .ap-page__foot {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; flex-shrink: 0;
          border-top: 1px solid var(--border);
          background: var(--panel, #131c2e);
        }
        .ap-page__foot-right { display: flex; gap: 10px; align-items: center; }

        /* ── Estilos internos (reutilizados do modal) ── */
        .ap-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: 1px solid var(--border); transition: all .15s;
          font-family: inherit;
        }
        .ap-btn--ghost { background: transparent; color: var(--text-dim); }
        .ap-btn--ghost:hover { background: var(--panel-2); color: var(--text); }
        .ap-btn--primary { background: var(--accent,#4ea3ff); color: #fff; border-color: var(--accent,#4ea3ff); }
        .ap-btn--primary:hover { opacity: .88; }
        .ap-btn--pdf { background: transparent; color: var(--text-dim); border-color: var(--border); }
        .ap-btn--pdf:hover { color: var(--text); border-color: var(--border-strong,#2f3f5e); }

        /* Campo de formulário */
        .ap-field { margin-bottom: 16px; }
        .ap-field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-mute); margin-bottom: 6px; }
        .ap-field input, .ap-field textarea, .ap-field select {
          width: 100%; background: var(--panel, #131c2e);
          border: 1px solid var(--border); border-radius: 6px;
          color: var(--text); font-size: 13px; padding: 9px 12px;
          font-family: inherit; transition: border-color .15s;
        }
        .ap-field input:focus, .ap-field textarea:focus, .ap-field select:focus {
          outline: none; border-color: var(--accent,#4ea3ff);
        }
        .ap-field textarea { resize: vertical; }
        .ap-field select { background: var(--panel, #131c2e); }
        .ap-error { background: rgba(239,71,87,.12); color: var(--danger,#ef4757); border: 1px solid rgba(239,71,87,.3); border-radius: 6px; padding: 8px 12px; font-size: 12px; margin-bottom: 12px; }
        .ap-hint { font-size: 11px; color: var(--text-mute); font-style: italic; text-align: center; padding: 12px 0; }

        /* Opções de seleção */
        .ap-options { display: flex; flex-direction: column; gap: 8px; }
        .ap-option {
          padding: 14px 18px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--panel, #131c2e);
          color: var(--text); font-size: 14px; font-weight: 600;
          cursor: pointer; text-align: left; transition: all .15s;
          font-family: inherit;
        }
        .ap-option:hover { border-color: var(--accent,#4ea3ff); background: var(--panel-2,#182338); }
        .ap-option--selected { border-color: var(--accent,#4ea3ff); background: rgba(78,163,255,.12); color: var(--accent,#4ea3ff); }

        /* Turno selector */
        .ap-turno-wrap { display: flex; gap: 10px; margin-top: 4px; }
        .ap-turno-btn {
          flex: 1; padding: 11px 0; border-radius: 6px;
          border: 1px solid var(--border); background: var(--panel,#131c2e);
          color: var(--text); font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .15s; font-family: inherit;
        }
        .ap-turno-btn--sel { background: var(--accent,#4ea3ff); color: #fff; border-color: var(--accent,#4ea3ff); }

        /* Status bar */
        .ap-status-bar { font-size:12px;font-weight:600;text-align:center;padding:7px 12px;border-radius:6px;margin-bottom:12px; }
        .ap-status-bar--ok     { background:rgba(34,197,94,.15);  color:var(--ok,#22c55e);    }
        .ap-status-bar--atencao{ background:rgba(255,181,71,.15); color:var(--warn,#ffb547);  }
        .ap-status-bar--nok    { background:rgba(239,71,87,.15);  color:var(--danger,#ef4757);}

        /* Tabela rastreabilidade */
        .rast__titulo { font-weight:700;font-size:12px;letter-spacing:.5px;background:#ffc000;color:#1a1a1a;padding:6px 10px;text-transform:uppercase;border-radius:4px 4px 0 0; }
        .rast__wrapper { overflow-x:auto;border:1px solid var(--border);border-radius:0 0 6px 6px;margin-bottom:14px; }
        .rast__table   { width:100%;border-collapse:collapse;font-size:11.5px; }
        .rast__table th { background:#f0b429;color:#1a1a1a;font-weight:700;font-size:11px;text-align:center;padding:5px 8px;border:1px solid #c89000;white-space:pre-line;line-height:1.3; }
        .rast__table td { padding:3px 6px;border:1px solid var(--border);vertical-align:middle; }
        .rast__td-no   { text-align:center;font-weight:600;width:30px; }
        .rast__td-desc { min-width:175px; }
        .rast__td-esp  { text-align:center;white-space:nowrap; }
        .rast__td-maq  { text-align:center;font-size:10.5px;white-space:nowrap; }
        .rast__td-ponto{ font-size:10.5px; }
        .rast__td-unid { text-align:center;font-size:10.5px; }
        .rast__td-res  { background:var(--panel-2);text-align:center;min-width:70px; }
        .rast__td-aval { text-align:center;font-weight:700;font-size:11px;min-width:42px;white-space:nowrap; }
        .rast__td-insp { min-width:88px; }
        .rast__aval--ok     { color:var(--ok,#22c55e);    }
        .rast__aval--atencao{ color:var(--warn,#ffb547);  }
        .rast__aval--nok    { color:var(--danger,#ef4757);}
        .rast__input { width:64px;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11.5px;padding:2px 4px;text-align:center; }
        .rast__input:focus { outline:none;border-color:var(--accent,#4ea3ff); }
        .rast__select { background:var(--bg,#0b1220);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11px;padding:2px 3px;width:100%; }
        .rast__input-ins { width:100%;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11px;padding:2px 4px; }
        .rast__group-sep { border-top:2px solid var(--border-strong,#475569) !important; }
        .rast__row-obs      { display:none; }
        .rast__row-obs.show { display:table-row; }
        .rast__obs-cell         { padding:5px 10px !important; }
        .rast__obs-cell--atencao{ background:rgba(255,181,71,.08);border-left:3px solid var(--warn,#ffb547) !important; }
        .rast__obs-cell--nok    { background:rgba(239,71,87,.08); border-left:3px solid var(--danger,#ef4757) !important; }
        .rast__obs-bar   { display:flex;align-items:center;gap:8px;font-size:11.5px; }
        .rast__obs-lbl   { font-weight:600;white-space:nowrap; }
        .rast__obs-input { flex:1;background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:11.5px;padding:2px 4px; }
        .rast__obs-input:focus { outline:none;border-bottom-color:var(--accent,#4ea3ff); }
        .rast__obs-geral-warn { border-color:var(--warn,#ffb547) !important; }
        /* Tabela genérica — campos editáveis */
        .rast__input--edit { width:100%;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11px;padding:2px 5px;box-sizing:border-box; }
        .rast__input--edit:focus { outline:none;border-color:var(--accent,#4ea3ff);background:var(--panel-2); }
        .rast__td-del { text-align:center;width:26px; }
        .rast__del-btn { background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:13px;padding:2px 6px;border-radius:3px;line-height:1; }
        .rast__del-btn:hover { color:var(--danger,#ef4757); }
        .rast__add-row { display:flex;align-items:center;gap:8px;margin-top:8px; }
        .rast__add-btn { display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px dashed var(--border-strong);border-radius:6px;color:var(--text-dim);font-size:12px;padding:6px 14px;cursor:pointer;transition:all .15s; }
        .rast__add-btn:hover { border-color:var(--accent);color:var(--accent); }

        /* Resumo info grid */
        .ap-info-grid {
          display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;
          background:var(--panel,#131c2e);border-radius:8px;
          padding:14px 16px;margin-bottom:18px;font-size:13px;
          border: 1px solid var(--border);
        }
        .ap-info-row { display:flex;gap:8px; }
        .ap-info-key { font-weight:600;color:var(--text-mute);white-space:nowrap; }

        /* Assinaturas */
        .ap-sig-title { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-mute);margin-bottom:8px; }
        .ap-sig-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
        .ap-sig-card { border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--panel,#131c2e); }
        .ap-sig-role { font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-mute);margin-bottom:8px; }
        .ap-sig-inp  { width:100%;background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:12px;padding:2px 0 4px;margin-bottom:4px; }
        .ap-sig-inp:focus { outline:none;border-bottom-color:var(--accent,#4ea3ff); }
        .ap-sig-date { width:100%;background:transparent;border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:11px;padding:3px 6px;margin-top:4px; }
        .ap-sig-line { border-top:1px solid var(--border);margin-top:14px;padding-top:4px;font-size:9px;color:var(--text-mute);text-align:center; }

        /* Result status badge */
        .ap-result-status { margin-top:10px; }
        .ap-badge { display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700; }
        .ap-badge--ok  { background:rgba(34,197,94,.15);color:var(--ok,#22c55e); }
        .ap-badge--nok { background:rgba(239,71,87,.15);color:var(--danger,#ef4757); }

        /* ── Rascunhos / Em Andamento ── */
        .ap-drafts-section { margin-top: 28px; }
        .ap-drafts-title {
          font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.13em;
          color:var(--text-mute);margin-bottom:10px;
          display:flex;align-items:center;gap:10px;
        }
        .ap-drafts-title::before { content:'';flex:0 0 0; }
        .ap-drafts-title::after  { content:'';flex:1;height:1px;background:var(--border); }
        .ap-draft-card {
          background:var(--panel,#131c2e);border:1px solid var(--border);
          border-radius:8px;padding:13px 16px;margin-bottom:8px;
          transition:border-color .15s;
        }
        .ap-draft-card:hover { border-color:var(--border-strong,#2f3f5e); }
        .ap-draft-card__title { font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px; }
        .ap-draft-card__step  { font-size:11px;color:var(--accent,#4ea3ff);margin-bottom:8px; }
        .ap-draft-card__meta  { font-size:11px;color:var(--text-mute);margin-bottom:10px;line-height:1.5; }
        .ap-draft-card__foot  { display:flex;gap:8px;justify-content:flex-end; }
        .ap-draft-btn {
          padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;
          cursor:pointer;border:1px solid;transition:all .15s;font-family:inherit;
        }
        .ap-draft-btn--resume { background:var(--accent,#4ea3ff);color:#fff;border-color:var(--accent,#4ea3ff); }
        .ap-draft-btn--resume:hover { opacity:.85; }
        .ap-draft-btn--remove { background:transparent;color:var(--danger,#ef4757);border-color:rgba(239,71,87,.3); }
        .ap-draft-btn--remove:hover { background:rgba(239,71,87,.1); }
        .ap-draft-empty { font-size:12px;color:var(--text-mute);text-align:center;padding:16px;font-style:italic; }

        /* Toast simples */
        @keyframes apToastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `;
      document.head.appendChild(s);
    }

    /* Elemento raiz */
    this._page = document.createElement('div');
    this._page.className = 'ap-page';
    this._page.style.display = 'none';

    /* Topbar */
    const topbar = document.createElement('div');
    topbar.className = 'ap-page__topbar';

    const backBtn = document.createElement('button');
    backBtn.className = 'ap-page__back';
    backBtn.innerHTML = '← Voltar ao Dashboard';
    backBtn.addEventListener('click', () => this.close());

    const titleEl = document.createElement('div');
    titleEl.className = 'ap-page__title';
    titleEl.textContent = 'Análise Periódica';

    this._topBadge = document.createElement('div');
    this._topBadge.className = 'ap-page__badge';

    topbar.appendChild(backBtn);
    topbar.appendChild(titleEl);
    topbar.appendChild(this._topBadge);
    this._page.appendChild(topbar);

    /* Barra de progresso */
    const progressBar = document.createElement('div');
    progressBar.className = 'ap-page__progress';
    this._progressFill = document.createElement('div');
    this._progressFill.className = 'ap-page__progress-fill';
    progressBar.appendChild(this._progressFill);
    this._page.appendChild(progressBar);

    /* Step header */
    this._stepHdr = document.createElement('div');
    this._stepHdr.className = 'ap-page__step-hdr';
    this._page.appendChild(this._stepHdr);

    /* Body scrollável */
    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'ap-page__body';
    this._bodyEl = document.createElement('div');
    this._bodyEl.className = 'ap-page__inner';
    bodyWrap.appendChild(this._bodyEl);
    this._page.appendChild(bodyWrap);

    /* Footer */
    this._footEl = document.createElement('div');
    this._footEl.className = 'ap-page__foot';
    this._page.appendChild(this._footEl);

    document.body.appendChild(this._page);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._page?.style.display !== 'none') this.close();
    });
  }

  /* ── Render Step ─────────────────────────────────────────── */
  _renderStep() {
    /* Step header */
    this._stepHdr.innerHTML = '';
    const lbl = document.createElement('div');
    lbl.className = 'ap-page__step-label';
    lbl.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg> PASSO ${this._stepIdx + 1} DE ${this._totalSteps} · ANÁLISE PERIÓDICA`;
    const title = document.createElement('div');
    title.className = 'ap-page__step-title';
    title.textContent = this._currentStep?.title ?? '';
    this._stepHdr.appendChild(lbl);
    this._stepHdr.appendChild(title);

    /* Badge no topbar */
    this._topBadge.textContent = `Passo ${this._stepIdx + 1}/${this._totalSteps}`;

    /* Progresso */
    this._progressFill.style.width = `${((this._stepIdx + 1) / this._totalSteps) * 100}%`;

    /* Body e footer */
    this._bodyEl.innerHTML = '';
    this._footEl.innerHTML = '';
    this._statusEl = null;
    this._currentStep?.render();
    this._renderFoot();
  }

  _renderFoot() {
    const isAutoStep = ['projeto','linha','operacao','tipo'].includes(this._currentStep?.id);
    const isLast     = this._stepIdx === this._totalSteps - 1;

    /* Botão esquerdo */
    const leftBtn = document.createElement('button');
    leftBtn.className   = 'ap-btn ap-btn--ghost';
    leftBtn.textContent = this._stepIdx === 0 ? 'Cancelar' : '← Voltar';
    leftBtn.addEventListener('click', () => {
      if (this._stepIdx === 0) this.close();
      else { this._stepIdx--; this._renderStep(); }
    });
    this._footEl.appendChild(leftBtn);

    /* Direita */
    const right = document.createElement('div');
    right.className = 'ap-page__foot-right';

    if (isAutoStep) {
      if (this._currentStep?.id === 'projeto') {
        const csBtn = document.createElement('button');
        csBtn.className = 'ap-btn ap-btn--ghost';
        csBtn.style.cssText = 'font-size:12px;border-style:dashed;';
        csBtn.textContent = '+ Novo Check Sheet';
        csBtn.addEventListener('click', () => this._openCheckSheetEditor());
        right.appendChild(csBtn);
      } else {
        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:11px;color:var(--text-mute);';
        hint.textContent   = 'Clique numa opção para avançar';
        right.appendChild(hint);
      }
    } else if (isLast) {
      const pdfBtn = document.createElement('button');
      pdfBtn.className = 'ap-btn ap-btn--pdf';
      pdfBtn.innerHTML  = '📄 Gerar PDF';
      pdfBtn.addEventListener('click', () => this._gerarPDF());
      right.appendChild(pdfBtn);

      const gravarBtn = document.createElement('button');
      gravarBtn.className = 'ap-btn ap-btn--ghost';
      gravarBtn.innerHTML = '💾 Gravar';
      gravarBtn.title     = 'Salvar rascunho para finalizar depois';
      gravarBtn.addEventListener('click', () => this._saveDraft());
      right.appendChild(gravarBtn);

      const confirmBtn = document.createElement('button');
      confirmBtn.className   = 'ap-btn ap-btn--primary';
      confirmBtn.textContent = '✓ Confirmar e Enviar';
      confirmBtn.addEventListener('click', () => { this._gerarPDF(); this._submit(); });
      right.appendChild(confirmBtn);
    } else {
      const gravarBtn = document.createElement('button');
      gravarBtn.className = 'ap-btn ap-btn--ghost';
      gravarBtn.innerHTML = '💾 Gravar';
      gravarBtn.title     = 'Salvar rascunho para finalizar depois';
      gravarBtn.addEventListener('click', () => this._saveDraft());
      right.appendChild(gravarBtn);

      const nextBtn = document.createElement('button');
      nextBtn.className   = 'ap-btn ap-btn--primary';
      nextBtn.textContent = 'Avançar →';
      nextBtn.addEventListener('click', () => { if (this._validate()) { this._advanceStep(); } });
      right.appendChild(nextBtn);
    }

    this._footEl.appendChild(right);
  }

  /* ── Passos de seleção ───────────────────────────────────── */
  _renderProjeto() {
    const projetos = this._getHierarquia().projetos;
    this._renderOpcoes(projetos, 'projeto', val => {
      this._data.projeto = val; this._data.linha = null; this._data.operacao = null; this._data.tipo = null;
    });
    this._renderDraftsSection();
  }
  _renderLinha() {
    this._renderOpcoes(this._getLinhas(), 'linha', val => {
      this._data.linha = val; this._data.operacao = null; this._data.tipo = null;
    });
  }
  _renderOperacao() {
    this._renderOpcoes(this._getOperacoes(), 'operacao', val => {
      this._data.operacao = val; this._data.tipo = null;
    });
  }
  _renderTipo() {
    this._renderOpcoes(this._getMedicoes(), 'tipo', val => { this._data.tipo = val; });
  }

  /* ── Fornecedor: helpers localStorage ───────────────────── */
  _loadFornecedorPecas() {
    try {
      const stored = JSON.parse(localStorage.getItem('metrologia_fornecedor_pecas') ?? 'null');
      if (Array.isArray(stored) && stored.length) return stored;
    } catch {}
    return [{ nome: 'Camshaft', codigo: '', back: '' }];
  }
  _saveFornecedorPecas(pecas) {
    localStorage.setItem('metrologia_fornecedor_pecas', JSON.stringify(pecas));
  }

  /* ── Passo fornecedor_peca ───────────────────────────────── */
  _renderFornecedorPeca() {
    const modo = this._data.fornecedorModo;

    /* ── Cartões de modo ─────────────────────────────────── */
    const modeGrid = document.createElement('div');
    modeGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:26px;';

    [
      { id:'selecionar',  icon:'📋', label:'Selecionar Peça',  desc:'Escolher de peças já cadastradas'  },
      { id:'acrescentar', icon:'➕', label:'Acrescentar Peça', desc:'Registrar nova peça para controle' },
    ].forEach(opt => {
      const btn = document.createElement('button');
      btn.className = `ap-option${modo === opt.id ? ' ap-option--selected' : ''}`;
      btn.style.textAlign = 'left';
      btn.innerHTML = `
        <div style="font-size:24px;margin-bottom:10px;">${opt.icon}</div>
        <div style="font-size:14px;font-weight:700;">${opt.label}</div>
        <div style="font-size:11px;color:var(--text-mute);margin-top:5px;font-weight:400;line-height:1.4;">${opt.desc}</div>
      `;
      btn.addEventListener('click', () => {
        if (this._data.fornecedorModo === opt.id) return;
        this._data.fornecedorModo = opt.id;
        this._data.pecaFornecedor = null;
        this._bodyEl.innerHTML = '';
        this._footEl.innerHTML = '';
        this._currentStep.render();
        this._renderFoot();
      });
      modeGrid.appendChild(btn);
    });
    this._bodyEl.appendChild(modeGrid);

    /* ── Modo: Selecionar ────────────────────────────────── */
    if (modo === 'selecionar') {
      const pecas = this._loadFornecedorPecas();

      const secTitle = document.createElement('div');
      secTitle.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-mute);margin-bottom:10px;';
      secTitle.textContent = 'Peças cadastradas';
      this._bodyEl.appendChild(secTitle);

      const opts = document.createElement('div');
      opts.className = 'ap-options';
      pecas.forEach(p => {
        const btn = document.createElement('button');
        btn.className = `ap-option${this._data.pecaFornecedor?.nome === p.nome ? ' ap-option--selected' : ''}`;
        btn.style.cssText = 'text-align:left;display:flex;align-items:baseline;gap:12px;';
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-size:14px;font-weight:700;';
        nameSpan.textContent = p.nome;
        btn.appendChild(nameSpan);
        const details = [p.codigo && `Cód: ${p.codigo}`, p.back && `Back: ${p.back}`].filter(Boolean).join(' · ');
        if (details) {
          const detSpan = document.createElement('span');
          detSpan.style.cssText = 'font-size:11px;color:var(--text-mute);';
          detSpan.textContent = details;
          btn.appendChild(detSpan);
        }
        btn.addEventListener('click', () => {
          this._data.pecaFornecedor = p;
          this._data.tipo = p.nome; // mapeia para RASTREABILIDADE[p.nome]
          setTimeout(() => this._advanceStep(), 180);
        });
        opts.appendChild(btn);
      });
      this._bodyEl.appendChild(opts);
    }

    /* ── Histórico de peças dimensionadas ───────────────── */
    this._renderFornecedorHistorico();

    /* ── Modo: Acrescentar ───────────────────────────────── */
    if (modo === 'acrescentar') {
      const sep = document.createElement('div');
      sep.style.cssText = 'border-top:1px solid var(--border);margin-bottom:20px;';
      this._bodyEl.appendChild(sep);

      const note = document.createElement('p');
      note.style.cssText = 'font-size:12px;color:var(--text-mute);margin-bottom:16px;';
      note.textContent = 'Preencha os dados da nova peça. Ela será salva para uso futuro.';
      this._bodyEl.appendChild(note);

      [
        { key:'_novaFornecedorNome',   label:'Nome da Peça *',  placeholder:'Ex: Camshaft, Crankshaft, Valve…' },
        { key:'_novaFornecedorCodigo', label:'Código da Peça',  placeholder:'Ex: 13502-31010'                   },
        { key:'_novaFornecedorBack',   label:'Back',            placeholder:'Ex: A, B, Rev.02, 00…'             },
      ].forEach(f => {
        const wrap = document.createElement('div'); wrap.className = 'ap-field';
        const lbl  = document.createElement('label'); lbl.textContent = f.label;
        wrap.appendChild(lbl);
        const inp = document.createElement('input');
        inp.type = 'text'; inp.placeholder = f.placeholder;
        inp.value = this._data[f.key] ?? '';
        inp.style.cssText = 'width:100%;';
        inp.addEventListener('input', () => { this._data[f.key] = inp.value; });
        wrap.appendChild(inp);
        this._bodyEl.appendChild(wrap);
      });
    }
  }

  /* ── Histórico de peças dimensionadas (Fornecedor) ─────── */
  _renderFornecedorHistorico() {
    // Carrega histórico do servidor + localStorage
    const serverHist = this._periodicaHistServer ?? [];
    let localHist = [];
    try { localHist = JSON.parse(localStorage.getItem('metrologia_periodica_hist') ?? '[]'); } catch {}

    // Junta e deduplica por ts
    const all = [...serverHist, ...localHist];
    const seen = new Set();
    const hist = all
      .filter(e => {
        if (seen.has(e.ts)) return false;
        seen.add(e.ts);
        return e.linha === 'Fornecedor' || e.pecaNome;
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, 50);

    if (!hist.length) return;

    const sec = document.createElement('div');
    sec.style.cssText = 'margin-top:28px;border-top:1px solid var(--border);padding-top:18px;';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-mute);margin-bottom:12px;display:flex;align-items:center;gap:8px;';
    title.innerHTML = `<span>📋 Histórico de Peças Dimensionadas</span><span style="background:var(--panel-2,#182338);border:1px solid var(--border);border-radius:10px;padding:1px 8px;font-size:10px;">${hist.length}</span>`;
    sec.appendChild(title);

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';

    // Cabeçalho
    const thead = document.createElement('thead');
    const trH = document.createElement('tr');
    trH.style.cssText = 'background:#f5d800;color:#1a1200;';
    ['Data', 'Peça', 'Nº Order', 'Turno', 'Inspetor', 'Status'].forEach(h => {
      const th = document.createElement('th');
      th.style.cssText = 'padding:6px 10px;text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;border:1px solid #c8a000;';
      th.textContent = h;
      trH.appendChild(th);
    });
    thead.appendChild(trH);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    hist.forEach(e => {
      const tr = document.createElement('tr');
      tr.style.cssText = 'border-bottom:1px solid var(--border);transition:background .12s;';
      tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(78,163,255,.06)');
      tr.addEventListener('mouseleave', () => tr.style.background = '');

      const data   = e.ts ? new Date(e.ts).toLocaleDateString('pt-BR') : '—';
      const peca   = e.pecaNome || e.tipo || '—';
      const order  = e.nrOrder  || '—';
      const turno  = e.turno    ? `T${e.turno}` : '—';
      const insp   = e.operador || '—';
      const status = e.status   || '—';

      const statusColor = status === 'Conforme' ? 'var(--ok,#22c55e)'
                        : status === 'Não Conforme' ? 'var(--danger,#ef4757)'
                        : 'var(--text-mute)';

      [data, peca, order, turno, insp].forEach(val => {
        const td = document.createElement('td');
        td.style.cssText = 'padding:7px 10px;color:var(--text);';
        td.textContent = val;
        tr.appendChild(td);
      });

      const tdStatus = document.createElement('td');
      tdStatus.style.cssText = `padding:7px 10px;color:${statusColor};font-weight:700;font-size:11px;`;
      tdStatus.textContent = status;
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    sec.appendChild(table);
    this._bodyEl.appendChild(sec);
  }

  /* ── Passo 5: Dados ─────────────────────────────────────── */
  _renderDados() {
    const isFornecedor = !!this._data.pecaFornecedor;
    const fields = [];

    // Data da análise — usada para dar baixa no cronograma
    const dataWrap = document.createElement('div'); dataWrap.className = 'ap-field';
    const dataLbl  = document.createElement('label'); dataLbl.textContent = 'Data da Análise';
    const dataInp  = document.createElement('input');
    dataInp.type  = 'date';
    dataInp.value = this._data.dataAnalise ?? new Date().toISOString().split('T')[0];
    dataInp.style.cssText = 'width:100%;';
    dataInp.addEventListener('change', () => { this._data.dataAnalise = dataInp.value; });
    this._data.dataAnalise = this._data.dataAnalise ?? dataInp.value;
    dataWrap.appendChild(dataLbl);
    dataWrap.appendChild(dataInp);
    this._bodyEl.appendChild(dataWrap);

    if (!isFornecedor) {
      fields.push({ key:'numeroPeca', label:'Número da Peça', type:'text', placeholder:'Ex: PÇ-001234' });
    }

    // Para Fornecedor: Nº Order e Modelo antes do inspetor
    if (isFornecedor) {
      fields.push({ key:'nrOrder', label:'Nº Order *', type:'text', placeholder:'Ex: 0204, 302…' });
    }

    fields.push({ key:'operador', label:'TM / Inspetor', type:'text', placeholder:'Nome do inspetor' });
    fields.forEach(f => this._addField(f));

    // Foto Order — campo customizado com texto + botão de anexo
    if (isFornecedor) {
      const fotoWrap = document.createElement('div'); fotoWrap.className = 'ap-field';
      const fotoLbl  = document.createElement('label'); fotoLbl.textContent = 'Foto Order';
      fotoWrap.appendChild(fotoLbl);

      // Linha: input texto + botão anexar
      const fotoRow = document.createElement('div');
      fotoRow.style.cssText = 'display:flex;gap:8px;align-items:center;';

      const fotoInp = document.createElement('input');
      fotoInp.type = 'text'; fotoInp.placeholder = 'Ex: F-001';
      fotoInp.value = this._data.fotoOrder ?? '';
      fotoInp.style.cssText = 'flex:1;';
      fotoInp.addEventListener('input', () => { this._data.fotoOrder = fotoInp.value; });

      const fileInput = document.createElement('input');
      fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';

      const attachBtn = document.createElement('button');
      attachBtn.type = 'button';
      attachBtn.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:8px 13px;border-radius:6px;border:1px solid var(--border);background:var(--panel,#131c2e);color:var(--text-dim);font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s;';
      attachBtn.innerHTML = '📎 Anexar foto';
      attachBtn.addEventListener('mouseenter', () => { attachBtn.style.borderColor = 'var(--accent,#4ea3ff)'; attachBtn.style.color = 'var(--accent,#4ea3ff)'; });
      attachBtn.addEventListener('mouseleave', () => { attachBtn.style.borderColor = 'var(--border)'; attachBtn.style.color = 'var(--text-dim)'; });
      attachBtn.addEventListener('click', () => fileInput.click());

      // Preview da imagem
      const preview = document.createElement('div');
      preview.style.cssText = 'margin-top:8px;display:none;';
      const previewImg = document.createElement('img');
      previewImg.style.cssText = 'max-height:120px;max-width:100%;border-radius:6px;border:1px solid var(--border);object-fit:contain;';
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '✕ Remover foto';
      removeBtn.style.cssText = 'display:block;margin-top:5px;background:none;border:none;color:var(--danger,#ef4757);font-size:11px;cursor:pointer;padding:0;';
      preview.appendChild(previewImg);
      preview.appendChild(removeBtn);

      const showPreview = src => {
        previewImg.src = src;
        preview.style.display = 'block';
        attachBtn.innerHTML = '📎 Trocar foto';
      };

      // Restaura preview se já havia imagem salva
      if (this._data.fotoOrderImg) showPreview(this._data.fotoOrderImg);

      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          this._data.fotoOrderImg = e.target.result;
          if (!this._data.fotoOrder) { this._data.fotoOrder = file.name; fotoInp.value = file.name; }
          showPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      });

      removeBtn.addEventListener('click', () => {
        this._data.fotoOrderImg = null;
        fileInput.value = '';
        preview.style.display = 'none';
        previewImg.src = '';
        attachBtn.innerHTML = '📎 Anexar foto';
      });

      fotoRow.appendChild(fotoInp);
      fotoRow.appendChild(fileInput);
      fotoRow.appendChild(attachBtn);
      fotoWrap.appendChild(fotoRow);
      fotoWrap.appendChild(preview);
      this._bodyEl.appendChild(fotoWrap);
    }

    // Modelo — Periódica e Fornecedor: aplicável; Nova Peça: opcional
    {
      const isNovaPeca = this._data.linha === 'Nova Peça';
      const wrap = document.createElement('div'); wrap.className = 'ap-field';

      /* Label + botão editar opções */
      const lblRow = document.createElement('div');
      lblRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;';
      const lbl = document.createElement('label');
      lbl.style.cssText = 'margin-bottom:0;';
      lbl.textContent = isNovaPeca ? 'Modelo (Opcional)' : 'Modelo';
      const editModBtn = document.createElement('button');
      editModBtn.type = 'button';
      editModBtn.title = 'Editar opções de modelo';
      editModBtn.style.cssText = 'background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:4px;display:flex;align-items:center;gap:4px;transition:color .15s;';
      editModBtn.innerHTML = '✎ <span style="font-size:10px;">editar opções</span>';
      editModBtn.addEventListener('mouseenter', () => { editModBtn.style.color = 'var(--accent,#4ea3ff)'; });
      editModBtn.addEventListener('mouseleave', () => { editModBtn.style.color = 'var(--text-mute)'; });
      lblRow.appendChild(lbl); lblRow.appendChild(editModBtn);
      wrap.appendChild(lblRow);

      /* Select de modelos */
      const sel = document.createElement('select');
      sel.style.cssText = 'width:100%;';
      const rebuildSel = () => {
        sel.innerHTML = '';
        const opts = this._loadModeloOpcoes();
        ['', ...opts].forEach(opt => {
          const o = document.createElement('option');
          o.value = opt; o.text = opt || '— Selecione —';
          if (this._data.modelo === opt) o.selected = true;
          sel.appendChild(o);
        });
      };
      rebuildSel();
      sel.addEventListener('change', () => { this._data.modelo = sel.value; });
      wrap.appendChild(sel);
      this._bodyEl.appendChild(wrap);

      /* Botão abre editor de opções */
      editModBtn.addEventListener('click', () => {
        this._openModeloEditor(() => { rebuildSel(); });
      });
    }

    const wrap = document.createElement('div');
    wrap.className = 'ap-field';
    const lbl = document.createElement('label');
    lbl.textContent = 'Turno';
    wrap.appendChild(lbl);

    const btnWrap = document.createElement('div');
    btnWrap.className = 'ap-turno-wrap';
    [1, 2, 3].forEach(t => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `Turno ${t}`;
      btn.className = `ap-turno-btn${this._data.turno === t ? ' ap-turno-btn--sel' : ''}`;
      btn.addEventListener('click', () => {
        this._data.turno = t;
        btnWrap.querySelectorAll('.ap-turno-btn').forEach(b => b.classList.remove('ap-turno-btn--sel'));
        btn.classList.add('ap-turno-btn--sel');
      });
      btnWrap.appendChild(btn);
    });
    wrap.appendChild(btnWrap);
    this._bodyEl.appendChild(wrap);
  }

  /* ── Passo 6: Medição ───────────────────────────────────── */
  _renderMedicao() {
    const rast = this._data.tipo ? this._getEffectiveRast(this._data.tipo) : null;

    if (rast) {
      this._renderMedicaoTabela(rast);
    } else {
      this._renderMedicaoGenerico();
    }

    /* Observações Gerais */
    const hasIssues = this._hasIssues(rast);
    const sep = document.createElement('div');
    sep.style.cssText = 'border-top:1px solid var(--border);margin:12px 0 16px;';
    this._bodyEl.appendChild(sep);

    const obsWrap = document.createElement('div');
    obsWrap.className = 'ap-field';
    const obsLabel = document.createElement('label');
    obsLabel.textContent = hasIssues ? 'Observações Gerais *' : 'Observações Gerais';
    if (hasIssues) obsLabel.style.color = 'var(--warn,#ffb547)';

    const obsNote = document.createElement('small');
    obsNote.style.cssText = 'display:block;font-size:10px;margin-bottom:6px;';
    obsNote.style.color   = hasIssues ? 'var(--warn,#ffb547)' : 'var(--text-mute)';
    obsNote.textContent   = hasIssues
      ? '⚠ Obrigatório — há itens NOK ou em zona de atenção'
      : 'Opcional — recomendado quando há desvios';

    const obsArea = document.createElement('textarea');
    obsArea.className   = 'ap-field';
    obsArea.id          = 'ap-obs-geral-field';
    obsArea.rows        = 3;
    obsArea.style.cssText = 'width:100%;background:var(--panel);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:9px 12px;resize:vertical;font-family:inherit;';
    obsArea.placeholder = hasIssues
      ? 'Descreva os desvios encontrados e as ações tomadas...'
      : 'Observações gerais sobre a análise (opcional)...';
    obsArea.value = this._data.obsGeral ?? '';
    if (hasIssues) obsArea.style.borderColor = 'var(--warn,#ffb547)';
    obsArea.addEventListener('input', () => { this._data.obsGeral = obsArea.value; });
    obsWrap.appendChild(obsLabel);
    obsWrap.appendChild(obsNote);
    obsWrap.appendChild(obsArea);
    this._bodyEl.appendChild(obsWrap);

    this._addField({
      key:'status', label:'Status Geral da Análise', type:'select',
      options:['Conforme','Não Conforme','Ponto de Atenção','Retrabalho'],
    });
  }

  /* ── Tabela Rastreabilidade ─────────────────────────────── */
  _renderMedicaoTabela(rast) {
    const statusBar = document.createElement('div');
    statusBar.className = 'ap-status-bar';
    this._bodyEl.appendChild(statusBar);

    const updateStatusBar = () => {
      let nokCnt = 0, atenCnt = 0;
      rast.itens.forEach((item, ri) => {
        const vals = rast.colsResult.map(c => this._data[`r${ri}_${c.key}`]).filter(v => v !== null && v !== undefined && v !== '');
        if (!vals.length) return;
        const r = this._avalResult(item.spec, vals);
        if (r === 'nok') nokCnt++; else if (r === 'atencao') atenCnt++;
      });
      if (nokCnt > 0) {
        statusBar.className = 'ap-status-bar ap-status-bar--nok';
        statusBar.textContent = `✗ ${nokCnt} item(ns) FORA de especificação${atenCnt > 0 ? ` · ${atenCnt} em atenção` : ''}`;
      } else if (atenCnt > 0) {
        statusBar.className = 'ap-status-bar ap-status-bar--atencao';
        statusBar.textContent = `⚠ ${atenCnt} item(ns) em zona de atenção — preencha a observação`;
      } else {
        statusBar.className = 'ap-status-bar ap-status-bar--ok';
        statusBar.textContent = `✓ Todos os ${rast.itens.length} itens dentro da especificação`;
      }
    };
    updateStatusBar();

    const titulo = document.createElement('div');
    titulo.className = 'rast__titulo';
    titulo.style.cssText = (titulo.style.cssText || '') + 'display:flex;align-items:center;justify-content:space-between;';
    const tituloSpan = document.createElement('span');
    tituloSpan.textContent = rast.titulo;
    const editRastBtn = document.createElement('button');
    editRastBtn.textContent = '✎ Editar';
    editRastBtn.style.cssText = 'padding:3px 10px;border-radius:5px;border:1px solid rgba(0,0,0,.35);background:rgba(0,0,0,.15);color:#1a1200;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;transition:background .15s;';
    editRastBtn.addEventListener('mouseenter', () => editRastBtn.style.background = 'rgba(0,0,0,.3)');
    editRastBtn.addEventListener('mouseleave', () => editRastBtn.style.background = 'rgba(0,0,0,.15)');
    editRastBtn.addEventListener('click', () => this._openRastEditor(this._data.tipo));
    titulo.appendChild(tituloSpan);
    titulo.appendChild(editRastBtn);
    this._bodyEl.appendChild(titulo);
    const wrapper = document.createElement('div'); wrapper.className = 'rast__wrapper';
    const table   = document.createElement('table'); table.className = 'rast__table';

    const thead = document.createElement('thead'); const trH = document.createElement('tr');
    ['No','Descrição','Especificado','Máq.','Ponto medido','Unid',
      ...rast.colsResult.map(c => c.label), 'Aval.', 'Inspetor',
    ].forEach(h => { const th = document.createElement('th'); th.innerHTML = h.replace(/\n/g,'<br>'); trH.appendChild(th); });
    thead.appendChild(trH); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let prevNo   = null;
    const nCols  = 6 + rast.colsResult.length + 2;

    rast.itens.forEach((item, ri) => {
      /* ── Linha separadora amarela ── */
      if (item.separator) {
        const sepTr = document.createElement('tr');
        const sepTd = document.createElement('td');
        sepTd.colSpan = nCols;
        sepTd.textContent = item.separator;
        sepTd.style.cssText = 'background:#ffc000;color:#1a1a1a;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:4px 10px;text-align:center;';
        sepTr.appendChild(sepTd);
        tbody.appendChild(sepTr);
        return;
      }

      const tr = document.createElement('tr');
      if (item.no !== '' && item.no !== prevNo && prevNo !== null) tr.classList.add('rast__group-sep');
      prevNo = item.no !== '' ? item.no : prevNo;

      ['rast__td-no','rast__td-desc','rast__td-esp','rast__td-maq','rast__td-ponto','rast__td-unid']
        .forEach((cls, i) => {
          const td = document.createElement('td'); td.className = cls;
          td.textContent = String([item.no, item.desc, item.esp, item.maq, item.ponto, item.unid][i] ?? '');
          tr.appendChild(td);
        });

      const avalTd = document.createElement('td'); avalTd.className = 'rast__td-aval';

      const obsRow = document.createElement('tr'); obsRow.className = 'rast__row-obs';
      const obsTd  = document.createElement('td'); obsTd.colSpan = nCols;
      const obsBar = document.createElement('div'); obsBar.className = 'rast__obs-bar';
      const obsLbl = document.createElement('span'); obsLbl.className = 'rast__obs-lbl';
      const obsInp = document.createElement('input');
      obsInp.type = 'text'; obsInp.className = 'rast__obs-input';
      obsInp.placeholder = 'Descreva o desvio encontrado...';
      obsInp.value = this._data[`obs${ri}`] ?? '';
      obsInp.addEventListener('input', () => { this._data[`obs${ri}`] = obsInp.value; });
      obsBar.appendChild(obsLbl); obsBar.appendChild(obsInp);
      obsTd.appendChild(obsBar); obsRow.appendChild(obsTd);

      const refresh = () => { this._updateAvalTd(avalTd, item.spec, inputMap, obsRow, obsTd, obsLbl); updateStatusBar(); };

      const inputMap = {};
      if (item.singleResult) {
        /* ── Célula única (span de todas as colunas de resultado) ── */
        const td = document.createElement('td');
        td.className = 'rast__td-res';
        td.colSpan   = rast.colsResult.length;
        const dKey   = `r${ri}_single`;
        let el;
        if (item.spec?.t === 'bool' || item.spec?.options) {
          const opts = item.spec?.options ?? ['', 'OK', 'NOK'];
          el = document.createElement('select'); el.className = 'rast__select';
          el.style.width = '100%';
          opts.forEach(opt => {
            const o = document.createElement('option'); o.value = o.text = opt;
            if (this._data[dKey] === opt) o.selected = true; el.appendChild(o);
          });
          el.addEventListener('change', () => { this._data[dKey] = el.value; refresh(); });
        } else {
          el = document.createElement('input');
          el.type = 'number'; el.className = 'rast__input'; el.step = '0.001';
          el.style.width = '90%';
          if (this._data[dKey] != null) el.value = this._data[dKey];
          el.addEventListener('input', () => { this._data[dKey] = el.value === '' ? null : parseFloat(el.value); refresh(); });
        }
        inputMap['single'] = el; td.appendChild(el); tr.appendChild(td);
      } else {
        rast.colsResult.forEach(col => {
          const td  = document.createElement('td'); td.className = 'rast__td-res';
          const dKey = `r${ri}_${col.key}`;
          if (item.spec?.t === 'bool') {
            const sel = document.createElement('select'); sel.className = 'rast__select';
            (item.spec?.options ?? ['','OK','NG']).forEach(opt => {
              const o = document.createElement('option'); o.value = o.text = opt;
              if (this._data[dKey] === opt) o.selected = true; sel.appendChild(o);
            });
            sel.addEventListener('change', () => { this._data[dKey] = sel.value; refresh(); });
            inputMap[col.key] = sel; td.appendChild(sel);
          } else {
            const inp = document.createElement('input');
            inp.type = 'number'; inp.className = 'rast__input'; inp.step = '0.001';
            if (this._data[dKey] != null) inp.value = this._data[dKey];
            inp.addEventListener('input', () => { this._data[dKey] = inp.value === '' ? null : parseFloat(inp.value); refresh(); });
            inputMap[col.key] = inp; td.appendChild(inp);
          }
          tr.appendChild(td);
        });
      }

      refresh();
      tr.appendChild(avalTd);

      const insTd = document.createElement('td'); insTd.className = 'rast__td-insp';
      const insInp = document.createElement('input'); insInp.type = 'text'; insInp.className = 'rast__input-ins';
      insInp.value = this._data[`ins${ri}`] ?? (this._data.operador ?? '');
      insInp.addEventListener('input', () => { this._data[`ins${ri}`] = insInp.value; });
      insTd.appendChild(insInp); tr.appendChild(insTd);

      tbody.appendChild(tr); tbody.appendChild(obsRow);
    });

    table.appendChild(tbody); wrapper.appendChild(table); this._bodyEl.appendChild(wrapper);
  }

  /* ── Tabela Genérica (Fornecedor / Nova Peça / Periódica sem template) ── */
  _renderMedicaoGenerico() {
    // Título dinâmico
    const isForneced = this._data.linha === 'Fornecedor';
    const isNovaPeca = this._data.linha === 'Nova Peça';
    const analiseLabel = isForneced ? 'FORNECEDOR' : isNovaPeca ? 'NOVA PEÇA' : 'ANÁLISE PERIÓDICA';
    const pecaRef = (
      this._data.pecaFornecedor?.nome ||
      this._data.modelo              ||
      this._data.operacao            ||
      this._data.numeroPeca          ||
      ''
    ).toUpperCase();
    const tituloText = pecaRef
      ? `RASTREABILIDADE ${pecaRef} — ${analiseLabel}`
      : `RASTREABILIDADE — ${analiseLabel}`;

    if (!Array.isArray(this._data.genericRows)) this._data.genericRows = [];

    // Status bar
    const statusBar = document.createElement('div');
    statusBar.className = 'ap-status-bar';
    this._bodyEl.appendChild(statusBar);

    // Cabeçalho amarelo
    const titleEl = document.createElement('div');
    titleEl.className = 'rast__titulo';
    titleEl.textContent = tituloText;
    this._bodyEl.appendChild(titleEl);

    // Wrapper + tabela
    const wrapper = document.createElement('div');
    wrapper.className = 'rast__wrapper';
    const table = document.createElement('table');
    table.className = 'rast__table';
    const thead = document.createElement('thead');
    const trH   = document.createElement('tr');
    ['No','Descrição','Especificado','Máq.','Ponto medido','Unid','RESULTADO','Aval.','Inspetor',''].forEach(h => {
      const th = document.createElement('th'); th.textContent = h; trH.appendChild(th);
    });
    thead.appendChild(trH); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody); wrapper.appendChild(table);
    this._bodyEl.appendChild(wrapper);

    // Atualiza barra de status
    const updateStatus = () => {
      const rows = this._data.genericRows;
      let nokCnt = 0, atenCnt = 0, evalCnt = 0;
      rows.forEach(row => {
        if (row.resultado === null || row.resultado === undefined || row.resultado === '') return;
        const spec = this._parseSpec(row.esp);
        if (!spec) return;
        evalCnt++;
        const r = this._avalResult(spec, [parseFloat(row.resultado)]);
        if (r === 'nok') nokCnt++; else if (r === 'atencao') atenCnt++;
      });
      if (!evalCnt) {
        statusBar.className = 'ap-status-bar';
        statusBar.textContent = 'Preencha os resultados para avaliação automática';
        return;
      }
      if (nokCnt > 0) {
        statusBar.className = 'ap-status-bar ap-status-bar--nok';
        statusBar.textContent = `✗ ${nokCnt} item(ns) FORA de especificação${atenCnt > 0 ? ` · ${atenCnt} em atenção` : ''}`;
      } else if (atenCnt > 0) {
        statusBar.className = 'ap-status-bar ap-status-bar--atencao';
        statusBar.textContent = `⚠ ${atenCnt} item(ns) em zona de atenção — preencha a observação`;
      } else {
        statusBar.className = 'ap-status-bar ap-status-bar--ok';
        statusBar.textContent = `✓ Todos os ${evalCnt} itens dentro da especificação`;
      }
    };

    // Renumera coluna No
    const renumber = () => {
      tbody.querySelectorAll('tr').forEach((tr, i) => {
        const td = tr.querySelector('.rast__td-no');
        if (td) td.textContent = i + 1;
      });
    };

    // Renderiza uma linha da tabela
    const renderRow = (rowData) => {
      const tr = document.createElement('tr');

      const noTd = document.createElement('td');
      noTd.className = 'rast__td-no';
      noTd.textContent = tbody.childElementCount + 1;
      tr.appendChild(noTd);

      // Campos de texto editáveis
      [
        { key:'desc',  cls:'rast__td-desc',  ph:'Descrição do item...'    },
        { key:'esp',   cls:'rast__td-esp',   ph:'Ex: ≤ 8 ou 25,5 ± 0,6'  },
        { key:'maq',   cls:'rast__td-maq',   ph:'Equipamento'             },
        { key:'ponto', cls:'rast__td-ponto', ph:'Ponto de medição'        },
        { key:'unid',  cls:'rast__td-unid',  ph:'mm / µm…'               },
      ].forEach(({ key, cls, ph }) => {
        const td  = document.createElement('td'); td.className = cls;
        const inp = document.createElement('input');
        inp.type = 'text'; inp.className = 'rast__input--edit';
        inp.placeholder = ph; inp.value = rowData[key] ?? '';
        inp.addEventListener('input', () => { rowData[key] = inp.value; if (key === 'esp') updateAval(); });
        td.appendChild(inp); tr.appendChild(td);
      });

      // Resultado (numérico)
      const resTd  = document.createElement('td'); resTd.className = 'rast__td-res';
      const resInp = document.createElement('input');
      resInp.type = 'number'; resInp.className = 'rast__input'; resInp.step = '0.001';
      resInp.style.width = '90%';
      if (rowData.resultado !== null && rowData.resultado !== undefined && rowData.resultado !== '') {
        resInp.value = rowData.resultado;
      }
      resTd.appendChild(resInp); tr.appendChild(resTd);

      // Aval. (auto)
      const avalTd = document.createElement('td'); avalTd.className = 'rast__td-aval';
      tr.appendChild(avalTd);

      // Linha de obs (aparece ao ser NOK/ATEN)
      const obsRow = document.createElement('tr'); obsRow.className = 'rast__row-obs';
      const obsTd  = document.createElement('td'); obsTd.colSpan = 10;
      const obsBar = document.createElement('div'); obsBar.className = 'rast__obs-bar';
      const obsLbl = document.createElement('span'); obsLbl.className = 'rast__obs-lbl';
      const obsInp = document.createElement('input');
      obsInp.type = 'text'; obsInp.className = 'rast__obs-input';
      obsInp.placeholder = 'Descreva o desvio encontrado...';
      obsInp.value = rowData.obs ?? '';
      obsInp.addEventListener('input', () => { rowData.obs = obsInp.value; });
      obsBar.appendChild(obsLbl); obsBar.appendChild(obsInp);
      obsTd.appendChild(obsBar); obsRow.appendChild(obsTd);

      const updateAval = () => {
        const val  = resInp.value === '' ? null : parseFloat(resInp.value);
        rowData.resultado = val;
        const spec = this._parseSpec(rowData.esp);
        if (val === null || !spec) {
          avalTd.textContent = ''; avalTd.className = 'rast__td-aval';
          obsRow.classList.remove('show'); updateStatus(); return;
        }
        const result = this._avalResult(spec, [val]);
        const MAP = {
          ok:      { label:'OK',    cls:'rast__aval--ok',      obsCls:'',                       icon:'' },
          atencao: { label:'ATEN.', cls:'rast__aval--atencao', obsCls:'rast__obs-cell--atencao', icon:'⚠ ' },
          nok:     { label:'NOK',   cls:'rast__aval--nok',     obsCls:'rast__obs-cell--nok',     icon:'✗ ' },
        };
        const m = MAP[result] ?? MAP.ok;
        avalTd.textContent = m.label; avalTd.className = `rast__td-aval ${m.cls}`;
        if (result !== 'ok') {
          obsRow.classList.add('show');
          obsTd.className = `rast__obs-cell ${m.obsCls}`;
          obsLbl.textContent = `${m.icon}Observação:`;
          obsLbl.style.color = result === 'nok' ? 'var(--danger,#ef4757)' : 'var(--warn,#ffb547)';
        } else obsRow.classList.remove('show');
        updateStatus();
      };
      resInp.addEventListener('input', updateAval);

      // Inspetor
      const insTd  = document.createElement('td'); insTd.className = 'rast__td-insp';
      const insInp = document.createElement('input'); insInp.type = 'text'; insInp.className = 'rast__input-ins';
      insInp.value = rowData.ins ?? (this._data.operador ?? '');
      insInp.addEventListener('input', () => { rowData.ins = insInp.value; });
      insTd.appendChild(insInp); tr.appendChild(insTd);

      // Botão excluir
      const delTd  = document.createElement('td'); delTd.className = 'rast__td-del';
      const delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.className = 'rast__del-btn'; delBtn.title = 'Remover linha';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        const idx = this._data.genericRows.indexOf(rowData);
        if (idx > -1) this._data.genericRows.splice(idx, 1);
        tbody.removeChild(tr);
        if (tbody.contains(obsRow)) tbody.removeChild(obsRow);
        renumber(); updateStatus();
      });
      delTd.appendChild(delBtn); tr.appendChild(delTd);

      if (rowData.resultado !== null && rowData.resultado !== undefined && rowData.resultado !== '') updateAval();
      tbody.appendChild(tr);
      tbody.appendChild(obsRow);
    };

    // Renderiza linhas existentes (ex: ao voltar ao passo)
    this._data.genericRows.forEach(row => renderRow(row));

    // Botão "+ Adicionar linha"
    const addDiv = document.createElement('div'); addDiv.className = 'rast__add-row';
    const addBtn = document.createElement('button');
    addBtn.type = 'button'; addBtn.className = 'rast__add-btn';
    addBtn.innerHTML = '＋ Adicionar linha';
    addBtn.addEventListener('click', () => {
      const newRow = { desc:'', esp:'', maq:'', ponto:'', unid:'', resultado:null, ins: this._data.operador ?? '', obs:'' };
      this._data.genericRows.push(newRow);
      renderRow(newRow);
      // Foca no campo Descrição da nova linha
      const lastTr = tbody.lastElementChild?.previousElementSibling ?? tbody.lastElementChild;
      lastTr?.querySelector?.('.rast__td-desc input')?.focus();
      updateStatus();
    });
    addDiv.appendChild(addBtn);
    this._bodyEl.appendChild(addDiv);

    updateStatus();
  }

  /* ── Parser de especificação (texto → spec object) ──────── */
  _parseSpec(esp) {
    if (!esp || typeof esp !== 'string') return null;
    const s = esp.trim().replace(',', '.');
    // Range: "25.5 ± 0.6" ou "25.5 +/- 0.6"
    const rng = s.match(/^([+-]?\d+\.?\d*)\s*(?:[±]|\+\/-)\s*(\d+\.?\d*)$/);
    if (rng) return { t:'range', v:parseFloat(rng[1]), tol:parseFloat(rng[2]) };
    // MinMax: "10 – 20" ou "10 ~ 20" ou "10 a 20"
    const mm = s.match(/^([+-]?\d+\.?\d*)\s*(?:–|-|~|a)\s*([+-]?\d+\.?\d*)$/i);
    if (mm) return { t:'minmax', min:parseFloat(mm[1]), max:parseFloat(mm[2]) };
    // Max: "≤ 8" ou "Max 8" ou "Max. 8" ou "< 8"
    const mx = s.match(/^(?:≤|max\.?|<)\s*([+-]?\d+\.?\d*)$/i);
    if (mx) return { t:'max', v:parseFloat(mx[1]) };
    // Min: "≥ 10" ou "Min 10" ou "Min. 10" ou "> 10"
    const mn = s.match(/^(?:≥|min\.?|>)\s*([+-]?\d+\.?\d*)$/i);
    if (mn) return { t:'min', v:parseFloat(mn[1]) };
    // Número único: trata como exato (tol=0)
    const num = s.match(/^([+-]?\d+\.?\d*)$/);
    if (num) return { t:'range', v:parseFloat(num[1]), tol:0 };
    return null; // texto livre — sem avaliação automática
  }

  /* ── Avaliação ──────────────────────────────────────────── */
  _avalResult(spec, values) {
    if (!spec || values.length === 0) return null;
    const M = 0.20;
    let worst = 'ok';
    for (const v of values) {
      let r = 'ok';
      if      (spec.t === 'max'    && typeof v === 'number') { if (v > spec.v) r = 'nok'; else if (v > spec.v*(1-M)) r = 'atencao'; }
      else if (spec.t === 'min'    && typeof v === 'number') { if (v < spec.v) r = 'nok'; else if (v < spec.v*(1+M)) r = 'atencao'; }
      else if (spec.t === 'range'  && typeof v === 'number') { const d=Math.abs(v-spec.v); if (d>spec.tol) r='nok'; else if (d>spec.tol*(1-M)) r='atencao'; }
      else if (spec.t === 'minmax' && typeof v === 'number') {
        const range = spec.max - spec.min;
        const mg    = range * M;
        if (v < spec.min || v > spec.max) r = 'nok';
        else if (v < spec.min + mg || v > spec.max - mg) r = 'atencao';
      }
      else if (spec.t === 'bool') { if (v !== '' && v !== spec.ok) r = 'nok'; }
      if (r === 'nok') { worst = 'nok'; break; }
      if (r === 'atencao') worst = 'atencao';
    }
    return worst;
  }

  _updateAvalTd(avalTd, spec, inputMap, obsRow, obsTd, obsLbl) {
    const rawVals = Object.values(inputMap)
      .map(el => el.tagName === 'SELECT' ? (el.value || null) : (el.value === '' ? null : parseFloat(el.value)))
      .filter(v => v !== null);
    const result = this._avalResult(spec, rawVals);
    if (result === null) { avalTd.textContent = ''; avalTd.className = 'rast__td-aval'; obsRow?.classList.remove('show'); return; }
    const MAP = {
      ok:      { label:'OK',    cls:'rast__aval--ok',         obsCls:'',                       icon:'',   color:'' },
      atencao: { label:'ATEN.', cls:'rast__aval--atencao',    obsCls:'rast__obs-cell--atencao', icon:'⚠ ', color:'var(--warn,#ffb547)' },
      nok:     { label:'NOK',   cls:'rast__aval--nok',        obsCls:'rast__obs-cell--nok',     icon:'✗ ', color:'var(--danger,#ef4757)' },
    };
    const m = MAP[result];
    avalTd.textContent = m.label; avalTd.className = `rast__td-aval ${m.cls}`;
    if (obsRow) {
      if (result !== 'ok') {
        obsRow.classList.add('show');
        if (obsTd)  obsTd.className = `rast__obs-cell ${m.obsCls}`;
        if (obsLbl) { obsLbl.textContent = `${m.icon}Observação:`; obsLbl.style.color = m.color; }
      } else obsRow.classList.remove('show');
    }
  }

  _hasIssues(rast) {
    if (rast) {
      return rast.itens.some((item, ri) => {
        const vals = rast.colsResult.map(c => this._data[`r${ri}_${c.key}`]).filter(v => v !== null && v !== undefined && v !== '');
        if (!vals.length) return false;
        const r = this._avalResult(item.spec, vals);
        return r === 'nok' || r === 'atencao';
      });
    }
    // Tabela genérica
    return (this._data.genericRows ?? []).some(row => {
      if (row.resultado === null || row.resultado === undefined || row.resultado === '') return false;
      const spec = this._parseSpec(row.esp);
      if (!spec) return false;
      const r = this._avalResult(spec, [parseFloat(row.resultado)]);
      return r === 'nok' || r === 'atencao';
    });
  }

  /* ── Passo 7: Resumo + Assinaturas ─────────────────────── */
  _renderResumo() {
    const infoGrid = document.createElement('div');
    infoGrid.className = 'ap-info-grid';
    const pf = this._data.pecaFornecedor;
    [
      ['Projeto',      this._data.projeto    ?? '—'],
      ['Linha',        this._data.linha      ?? '—'],
      ['Operação / Peça', pf?.nome ?? this._data.operacao ?? 'N/A'],
      ...(pf?.codigo             ? [['Código Peça', pf.codigo]]              : []),
      ...(pf?.back               ? [['Back',        pf.back]]                : []),
      ...(this._data.nrOrder     ? [['Nº Order',    this._data.nrOrder]]     : []),
      ...(this._data.fotoOrder   ? [['Foto Order',  this._data.fotoOrder + (this._data.fotoOrderImg ? ' 📷' : '')]] : []),
      ...(this._data.modelo      ? [['Modelo',      this._data.modelo]]      : []),
      ['Tipo',         this._data.tipo       ?? '—'],
      ...(this._data.numeroPeca  ? [['Nº Peça',     this._data.numeroPeca]]  : []),
      ['TM / Inspetor',this._data.operador   ?? '—'],
      ['Turno',        this._data.turno ? `Turno ${this._data.turno}` : '—'],
      ['Status',       this._data.status     ?? '—'],
    ].forEach(([k, v]) => {
      const row = document.createElement('div'); row.className = 'ap-info-row';
      const key = document.createElement('span'); key.className = 'ap-info-key'; key.textContent = `${k}:`;
      const val = document.createElement('span'); val.textContent = v;
      if (k === 'Status') val.style.color = v === 'Conforme' ? 'var(--ok)' : v === 'Não Conforme' ? 'var(--danger)' : 'var(--warn)';
      row.appendChild(key); row.appendChild(val); infoGrid.appendChild(row);
    });
    this._bodyEl.appendChild(infoGrid);

    // Miniatura da foto Order (se houver)
    if (this._data.fotoOrderImg) {
      const fotoBox = document.createElement('div');
      fotoBox.style.cssText = 'margin-bottom:16px;border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--panel,#131c2e);';
      const fotoTitle = document.createElement('div');
      fotoTitle.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-mute);margin-bottom:8px;';
      fotoTitle.textContent = '📷 Foto Order' + (this._data.fotoOrder ? ' — ' + this._data.fotoOrder : '');
      const fotoImgEl = document.createElement('img');
      fotoImgEl.src = this._data.fotoOrderImg;
      fotoImgEl.style.cssText = 'max-height:150px;max-width:100%;border-radius:6px;object-fit:contain;border:1px solid var(--border);';
      fotoBox.appendChild(fotoTitle);
      fotoBox.appendChild(fotoImgEl);
      this._bodyEl.appendChild(fotoBox);
    }

    const sigTitle = document.createElement('p');
    sigTitle.className   = 'ap-sig-title';
    sigTitle.textContent = 'Assinaturas Eletrônicas';
    this._bodyEl.appendChild(sigTitle);

    const sigGrid = document.createElement('div');
    sigGrid.className = 'ap-sig-grid';

    [
      { key:'sigTM', role:'TM — Técnico de Medição', prefill: this._data.operador ?? '' },
      { key:'sigTL', role:'TL — Team Leader',        prefill:'' },
      { key:'sigGL', role:'GL — Group Leader',       prefill:'' },
      { key:'sigSV', role:'SV — Supervisor',         prefill:'' },
    ].forEach(sig => {
      const card = document.createElement('div'); card.className = 'ap-sig-card';
      const roleEl = document.createElement('div'); roleEl.className = 'ap-sig-role'; roleEl.textContent = sig.role;
      const nameInp = document.createElement('input'); nameInp.type = 'text'; nameInp.className = 'ap-sig-inp';
      nameInp.placeholder = 'Nome completo'; nameInp.value = this._data[sig.key] ?? sig.prefill;
      nameInp.addEventListener('input', () => { this._data[sig.key] = nameInp.value; });
      const dateInp = document.createElement('input'); dateInp.type = 'date'; dateInp.className = 'ap-sig-date';
      dateInp.value = this._data[`${sig.key}_dt`] ?? new Date().toISOString().split('T')[0];
      dateInp.addEventListener('input', () => { this._data[`${sig.key}_dt`] = dateInp.value; });
      const sigLine = document.createElement('div'); sigLine.className = 'ap-sig-line'; sigLine.textContent = 'Assinatura';
      card.appendChild(roleEl); card.appendChild(nameInp); card.appendChild(dateInp); card.appendChild(sigLine);
      sigGrid.appendChild(card);
    });
    this._bodyEl.appendChild(sigGrid);
  }

  /* ── Geração de PDF ────────────────────────────────────── */
  _gerarPDF() {
    const rast    = this._data.tipo ? this._getEffectiveRast(this._data.tipo) : null;
    const d       = this._data;
    const hoje    = new Date().toLocaleDateString('pt-BR');
    const _logoEl = document.getElementById('_toyota_logo');
    const _logo   = _logoEl ? _logoEl.src : '';
    const tabelaHTML = rast ? this._buildTabelaHTML(rast) : this._buildGenericTabelaHTML();

    const obsItensHTML = rast ? rast.itens.map((item, ri) => {
      const obs = d[`obs${ri}`];
      if (!obs) return '';
      const vals = rast.colsResult.map(c => d[`r${ri}_${c.key}`]).filter(v => v !== null && v !== undefined && v !== '');
      const res  = this._avalResult(item.spec, vals);
      const cor  = res === 'nok' ? '#dc2626' : '#d97706';
      return `<div style="font-size:8pt;margin:2px 0;color:${cor};">⚠ <b>${item.desc}:</b> ${obs}</div>`;
    }).join('') : (d.genericRows ?? []).map(row => {
      if (!row.obs) return '';
      const spec = this._parseSpec(row.esp);
      const res  = spec && row.resultado !== null ? this._avalResult(spec, [parseFloat(row.resultado)]) : null;
      const cor  = res === 'nok' ? '#dc2626' : '#d97706';
      return res && res !== 'ok' ? `<div style="font-size:8pt;margin:2px 0;color:${cor};">⚠ <b>${row.desc}:</b> ${row.obs}</div>` : '';
    }).join('');

    const sigs = [
      { role:'TM — Técnico de Medição', name: d.sigTM ?? d.operador ?? '', dt: d.sigTM_dt ?? hoje },
      { role:'TL — Team Leader',        name: d.sigTL ?? '',               dt: d.sigTL_dt ?? ''   },
      { role:'GL — Group Leader',       name: d.sigGL ?? '',               dt: d.sigGL_dt ?? ''   },
      { role:'SV — Supervisor',         name: d.sigSV ?? '',               dt: d.sigSV_dt ?? ''   },
    ];
    const sigHTML = sigs.map(s => `
      <div style="border:1px solid #ccc;border-radius:4px;padding:8px;flex:1;">
        <div style="font-size:7pt;font-weight:700;text-transform:uppercase;color:#888;margin-bottom:6px;">${s.role}</div>
        <div style="font-size:10pt;font-weight:600;min-height:18px;">${s.name}</div>
        <div style="font-size:8pt;color:#555;margin-bottom:18px;">${s.dt}</div>
        <div style="border-top:1px solid #333;margin-bottom:3px;"></div>
        <div style="font-size:7pt;color:#888;text-align:center;">Assinatura</div>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>${[d.projeto,d.linha,d.tipo,d.turno?`Turno ${d.turno}`:''].filter(Boolean).join(' - ')}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 12mm 18mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; background: #fff; margin: 0; }
  .hdr { display:flex;align-items:center;gap:12px;border-bottom:2.5px solid #1a3a6b;padding-bottom:8px;margin-bottom:10px; }
  .logo { width:48px;height:auto;flex-shrink:0; }
  .hdr-text h1 { font-size:13pt;font-weight:700;color:#1a3a6b;margin:0; }
  .hdr-text p  { font-size:8.5pt;color:#555;margin:0; }
  .info-box { display:grid;grid-template-columns:repeat(3,1fr);gap:3px 14px;background:#f4f6f9;border-radius:4px;padding:7px 10px;margin-bottom:10px;font-size:8.5pt; }
  .info-lbl { font-weight:700;color:#555; }
  .rast-titulo { background:#ffc000;color:#1a1a1a;font-size:8.5pt;font-weight:700;padding:4px 8px;text-transform:uppercase;border-radius:3px 3px 0 0;margin-top:6px; }
  .rast-table { width:100%;border-collapse:collapse;font-size:8pt;margin-bottom:10px; }
  .rast-table th { background:#f0b429;color:#1a1a1a;font-weight:700;text-align:center;padding:3px 5px;border:1px solid #c89000;font-size:7.5pt; }
  .rast-table td { padding:2px 5px;border:1px solid #ccc;vertical-align:middle; }
  .tc{text-align:center;} .sm{font-size:7pt;} .obs-col{font-style:italic;font-size:7pt;color:#555;}
  .ok{color:#16a34a;font-weight:700;} .atencao{color:#d97706;font-weight:700;} .nok{color:#dc2626;font-weight:700;}
  .g-sep{border-top:2px solid #888!important;}
  .obs-box{border:1px solid #ccc;border-radius:4px;padding:7px 10px;margin-bottom:10px;}
  .obs-box h3{font-size:8pt;font-weight:700;text-transform:uppercase;color:#555;margin:0 0 5px;}
  .obs-box p{font-size:9pt;margin:0;min-height:20px;}
  .sig-title{font-size:8pt;font-weight:700;text-transform:uppercase;color:#555;margin:8px 0 6px;border-top:1px solid #ccc;padding-top:8px;}
  .sig-grid{display:flex;gap:10px;}
  @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
</style></head><body>
<div class="hdr">
  ${_logo ? `<img class="logo" src="${_logo}" alt="Toyota">` : ''}
  <div class="hdr-text">
    <h1>Relatório de Análise Periódica — ${d.tipo ?? 'Dimensional'}</h1>
    <p>Toyota · Gerenciamento de Atividade CQ · Painel de Controle · Emitido em ${hoje} · ${rast?.titulo ?? ''}</p>
  </div>
</div>
<div class="info-box">
  <div><span class="info-lbl">Projeto:</span> ${d.projeto??'—'}</div>
  <div><span class="info-lbl">Linha:</span> ${d.linha??'—'}</div>
  <div><span class="info-lbl">Operação / Peça:</span> ${d.pecaFornecedor?.nome ?? d.operacao ?? 'N/A'}</div>
  ${d.pecaFornecedor?.codigo ? `<div><span class="info-lbl">Código Peça:</span> ${d.pecaFornecedor.codigo}</div>` : ''}
  ${d.pecaFornecedor?.back   ? `<div><span class="info-lbl">Back:</span> ${d.pecaFornecedor.back}</div>` : ''}
  ${d.nrOrder   ? `<div><span class="info-lbl">Nº Order:</span> ${d.nrOrder}</div>`   : ''}
  ${d.fotoOrder ? `<div><span class="info-lbl">Foto Order:</span> ${d.fotoOrder}${d.fotoOrderImg ? ' ✓' : ''}</div>` : ''}
  ${d.modelo    ? `<div><span class="info-lbl">Modelo:</span> ${d.modelo}</div>`       : ''}
  <div><span class="info-lbl">Tipo Medição:</span> ${d.tipo??'—'}</div>
  ${d.numeroPeca ? `<div><span class="info-lbl">Nº Peça:</span> ${d.numeroPeca}</div>` : ''}
  <div><span class="info-lbl">TM / Inspetor:</span> ${d.operador??'—'}</div>
  <div><span class="info-lbl">Turno:</span> ${d.turno?`Turno ${d.turno}`:'—'}</div>
  <div><span class="info-lbl">Status Geral:</span> ${d.status??'—'}</div>
</div>
${tabelaHTML}
${d.fotoOrderImg ? `
<div class="obs-box" style="page-break-inside:avoid;">
  <h3>Foto Order${d.fotoOrder ? ' — ' + d.fotoOrder : ''}</h3>
  <img src="${d.fotoOrderImg}" style="max-width:100%;max-height:220px;border-radius:4px;border:1px solid #ccc;object-fit:contain;display:block;margin-top:6px;">
</div>` : ''}
<div class="obs-box">
  <h3>Observações Gerais</h3>${obsItensHTML}
  <p>${d.obsGeral?d.obsGeral.replace(/\n/g,'<br>'):'<em style="color:#aaa">Sem observações registradas.</em>'}</p>
</div>
<div class="sig-title">Assinaturas Eletrônicas</div>
<div class="sig-grid">${sigHTML}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { alert('Permita pop-ups para gerar o PDF.'); return; }
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 600);
  }

  _buildTabelaHTML(rast) {
    if (!rast) return '';
    let prevNo = null;
    const headers = ['No','Descrição','Especificado','Máq.','Ponto medido','Unid',
      ...rast.colsResult.map(c => c.label.replace(/\n/g,' ')),
      'Aval.','Obs.','Inspetor'].map(h => `<th>${h}</th>`).join('');
    const rows = rast.itens.map((item, ri) => {
      if (item.separator) {
        const nCols = 6 + rast.colsResult.length + 3;
        return `<tr><td colspan="${nCols}" style="background:#ffc000;color:#1a1a1a;font-weight:700;font-size:9pt;text-align:center;padding:3px 8px;">${item.separator}</td></tr>`;
      }

      const aMap = { ok:'ok', atencao:'atencao', nok:'nok' };
      const aLbl = { ok:'OK', atencao:'ATEN.', nok:'NOK' };
      const obs  = this._data[`obs${ri}`] ?? '';
      const insp = this._data[`ins${ri}`] ?? (this._data.operador ?? '');
      const sep  = (item.no !== '' && item.no !== prevNo && prevNo !== null) ? ' class="g-sep"' : '';
      prevNo = item.no !== '' ? item.no : prevNo;

      let resCells, avalCls, avalText;

      if (item.singleResult) {
        // Valor único (ex: Visual OK) — ocupa todas as colunas de resultado
        const singleVal = this._data[`r${ri}_single`] ?? '';
        const res = this._avalResult(item.spec, singleVal !== '' ? [singleVal] : []);
        avalCls  = res ? (aMap[res] ?? '') : '';
        avalText = res ? (aLbl[res] ?? '—') : '—';
        const displayVal = singleVal !== '' ? singleVal : '—';
        resCells = `<td class="tc" colspan="${rast.colsResult.length}">${displayVal}</td>`;
      } else {
        const vals    = rast.colsResult.map(c => this._data[`r${ri}_${c.key}`] ?? '');
        const numVals = vals.filter(v => v !== null && v !== undefined && v !== '');
        const res     = this._avalResult(item.spec, numVals.map(v => typeof v === 'number' ? v : (parseFloat(v) || v)));
        avalCls  = res ? (aMap[res] ?? '') : '';
        avalText = res ? (aLbl[res] ?? '—') : '—';
        resCells = vals.map(v => {
          const display = (v !== null && v !== undefined && v !== '') ? v : '—';
          return `<td class="tc">${display}</td>`;
        }).join('');
      }

      return `<tr${sep}><td class="tc">${item.no}</td><td>${item.desc}</td><td class="tc">${item.esp}</td><td class="tc sm">${item.maq}</td><td class="sm">${item.ponto}</td><td class="tc">${item.unid}</td>${resCells}<td class="tc ${avalCls}">${avalText}</td><td class="obs-col">${obs}</td><td class="sm">${insp}</td></tr>`;
    }).join('');
    return `<div class="rast-titulo">${rast.titulo}</div><table class="rast-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  /* ── PDF: Tabela genérica ────────────────────────────────── */
  _buildGenericTabelaHTML() {
    const rows = this._data.genericRows ?? [];
    if (!rows.length) return '';
    const isForneced = this._data.linha === 'Fornecedor';
    const isNovaPeca = this._data.linha === 'Nova Peça';
    const analiseLabel = isForneced ? 'FORNECEDOR' : isNovaPeca ? 'NOVA PEÇA' : 'ANÁLISE PERIÓDICA';
    const pecaRef = (this._data.pecaFornecedor?.nome || this._data.modelo || this._data.operacao || this._data.numeroPeca || '').toUpperCase();
    const titulo  = pecaRef ? `RASTREABILIDADE ${pecaRef} — ${analiseLabel}` : `RASTREABILIDADE — ${analiseLabel}`;
    const headers = ['No','Descrição','Especificado','Máq.','Ponto medido','Unid','RESULTADO','Aval.','Obs.','Inspetor'].map(h => `<th>${h}</th>`).join('');
    const aMap = { ok:'ok', atencao:'atencao', nok:'nok' };
    const aLbl = { ok:'OK', atencao:'ATEN.', nok:'NOK' };
    const tableRows = rows.map((row, i) => {
      const spec    = this._parseSpec(row.esp);
      const val     = (row.resultado !== null && row.resultado !== undefined && row.resultado !== '') ? parseFloat(row.resultado) : null;
      const res     = (spec && val !== null) ? this._avalResult(spec, [val]) : null;
      const avalCls = res ? (aMap[res] ?? '') : '';
      const avalTxt = res ? (aLbl[res] ?? '—') : '—';
      return `<tr>
        <td class="tc">${i + 1}</td>
        <td>${row.desc ?? ''}</td>
        <td class="tc">${row.esp ?? ''}</td>
        <td class="tc sm">${row.maq ?? ''}</td>
        <td class="sm">${row.ponto ?? ''}</td>
        <td class="tc">${row.unid ?? ''}</td>
        <td class="tc">${val !== null ? val : ''}</td>
        <td class="tc ${avalCls}">${avalTxt}</td>
        <td class="obs-col">${row.obs ?? ''}</td>
        <td class="sm">${row.ins ?? (this._data.operador ?? '')}</td>
      </tr>`;
    }).join('');
    return `<div class="rast-titulo">${titulo}</div><table class="rast-table"><thead><tr>${headers}</tr></thead><tbody>${tableRows}</tbody></table>`;
  }

  /* ── Helpers ────────────────────────────────────────────── */
  _getLinhas()    { return this._getHierarquia().linhas[this._data.projeto] ?? []; }
  _getOperacoes() { return this._getHierarquia().operacoes?.[this._data.projeto]?.[this._data.linha] ?? []; }
  _getMedicoes()  {
    const { projeto, linha, operacao } = this._data;
    if (!projeto || !linha) return [];
    const key = operacao ? `${projeto}|${linha}|${operacao}` : `${projeto}|${linha}`;
    return this._getHierarquia().medicoes?.[key] ?? [];
  }

  /* ── Opções de Modelo ───────────────────────────────────── */
  _loadModeloOpcoes() {
    try {
      const saved = JSON.parse(localStorage.getItem('metrologia_modelo_opcoes') ?? 'null');
      return Array.isArray(saved) ? saved : ['A2', 'A3', 'E0'];
    } catch { return ['A2', 'A3', 'E0']; }
  }
  _saveModeloOpcoes(arr) {
    localStorage.setItem('metrologia_modelo_opcoes', JSON.stringify(arr));
  }
  _openModeloEditor(onClose) {
    /* Overlay */
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2100;display:flex;align-items:center;justify-content:center;';

    const panel = document.createElement('div');
    panel.style.cssText = 'background:var(--panel-2,#1a243a);border:1px solid var(--border);border-radius:12px;padding:24px;width:360px;max-height:80vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px;';

    /* Título */
    const h = document.createElement('div');
    h.style.cssText = 'font-size:14px;font-weight:700;color:var(--text);';
    h.textContent = 'Opções de Modelo';
    panel.appendChild(h);

    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:11px;color:var(--text-mute);margin-top:-8px;';
    sub.textContent = 'Gerencie as opções disponíveis no campo Modelo.';
    panel.appendChild(sub);

    /* Lista de opções */
    const listEl = document.createElement('div');
    listEl.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

    const render = () => {
      listEl.innerHTML = '';
      const opts = this._loadModeloOpcoes();
      if (!opts.length) {
        const emp = document.createElement('div');
        emp.style.cssText = 'font-size:12px;color:var(--text-mute);padding:8px 0;';
        emp.textContent = 'Nenhuma opção cadastrada.';
        listEl.appendChild(emp);
        return;
      }
      opts.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;background:var(--panel,#131c2e);border:1px solid var(--border);border-radius:6px;padding:7px 10px;';
        const tag = document.createElement('span');
        tag.style.cssText = 'flex:1;font-size:13px;font-weight:600;color:var(--text);letter-spacing:.05em;';
        tag.textContent = opt;
        const del = document.createElement('button');
        del.type = 'button'; del.title = 'Remover opção';
        del.textContent = '✕';
        del.style.cssText = 'background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:13px;padding:2px 6px;border-radius:3px;line-height:1;transition:color .15s;';
        del.addEventListener('mouseenter', () => { del.style.color = 'var(--danger,#ef4757)'; });
        del.addEventListener('mouseleave', () => { del.style.color = 'var(--text-mute)'; });
        del.addEventListener('click', () => {
          const arr = this._loadModeloOpcoes();
          arr.splice(idx, 1);
          this._saveModeloOpcoes(arr);
          render();
        });
        row.appendChild(tag); row.appendChild(del);
        listEl.appendChild(row);
      });
    };
    render();
    panel.appendChild(listEl);

    /* Separador + campo novo */
    const sep = document.createElement('div');
    sep.style.cssText = 'border-top:1px solid var(--border);padding-top:12px;display:flex;gap:8px;';

    const newInp = document.createElement('input');
    newInp.type = 'text';
    newInp.placeholder = 'Nova opção (ex: B1, C4...)';
    newInp.style.cssText = 'flex:1;background:var(--panel,#131c2e);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:8px 10px;box-sizing:border-box;';

    const addBtn = document.createElement('button');
    addBtn.type = 'button'; addBtn.textContent = '+ Adicionar';
    addBtn.style.cssText = 'background:var(--accent,#4ea3ff);border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;padding:8px 14px;cursor:pointer;white-space:nowrap;transition:opacity .15s;';
    addBtn.addEventListener('mouseenter', () => { addBtn.style.opacity = '.85'; });
    addBtn.addEventListener('mouseleave', () => { addBtn.style.opacity = '1'; });

    const doAdd = () => {
      const v = newInp.value.trim().toUpperCase();
      if (!v) { newInp.focus(); return; }
      const arr = this._loadModeloOpcoes();
      if (!arr.includes(v)) { arr.push(v); this._saveModeloOpcoes(arr); }
      newInp.value = '';
      render();
      newInp.focus();
    };
    addBtn.addEventListener('click', doAdd);
    newInp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });

    sep.appendChild(newInp); sep.appendChild(addBtn);
    panel.appendChild(sep);

    /* Botão fechar */
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;justify-content:flex-end;padding-top:4px;';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button'; closeBtn.className = 'ap-btn ap-btn--ghost'; closeBtn.textContent = 'Fechar';
    closeBtn.addEventListener('click', () => { ov.remove(); if (onClose) onClose(); });
    foot.appendChild(closeBtn);
    panel.appendChild(foot);

    ov.appendChild(panel);
    ov.addEventListener('click', e => { if (e.target === ov) { ov.remove(); if (onClose) onClose(); } });
    document.body.appendChild(ov);
    setTimeout(() => newInp.focus(), 80);
  }

  /* ── Check Sheet Custom ─────────────────────────────────── */
  _loadCustom() {
    try { return JSON.parse(localStorage.getItem('metrologia_check_sheets') ?? '[]'); }
    catch { return []; }
  }
  _saveCustom(arr) {
    localStorage.setItem('metrologia_check_sheets', JSON.stringify(arr));
  }
  _getHierarquia() {
    const custom = this._loadCustom();
    if (!custom.length) return HIERARQUIA;
    const cl = a => [...a];
    const h = {
      projetos:  cl(HIERARQUIA.projetos),
      linhas:    Object.fromEntries(Object.entries(HIERARQUIA.linhas).map(([k,v])    => [k, cl(v)])),
      operacoes: Object.fromEntries(Object.entries(HIERARQUIA.operacoes).map(([k,v]) => [k, Object.fromEntries(Object.entries(v).map(([k2,v2]) => [k2, cl(v2)]))])),
      medicoes:  Object.fromEntries(Object.entries(HIERARQUIA.medicoes).map(([k,v])  => [k, cl(v)])),
    };
    for (const cs of custom) {
      if (!h.projetos.includes(cs.projeto))  h.projetos.push(cs.projeto);
      if (!h.linhas[cs.projeto])             h.linhas[cs.projeto] = [];
      if (!h.linhas[cs.projeto].includes(cs.linha)) h.linhas[cs.projeto].push(cs.linha);
      if (!h.operacoes[cs.projeto])           h.operacoes[cs.projeto] = {};
      if (!h.operacoes[cs.projeto][cs.linha]) h.operacoes[cs.projeto][cs.linha] = [];
      if (cs.operacao && !h.operacoes[cs.projeto][cs.linha].includes(cs.operacao))
        h.operacoes[cs.projeto][cs.linha].push(cs.operacao);
      const key = cs.operacao ? `${cs.projeto}|${cs.linha}|${cs.operacao}` : `${cs.projeto}|${cs.linha}`;
      if (!h.medicoes[key]) h.medicoes[key] = [];
      for (const m of (cs.medicoes ?? [])) {
        if (!h.medicoes[key].includes(m)) h.medicoes[key].push(m);
      }
    }
    return h;
  }

  _openCheckSheetEditor(editIdx = null) {
    const existing = editIdx != null ? this._loadCustom()[editIdx] : null;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:var(--bg,#0b1220);border:1px solid var(--border);border-radius:10px;padding:20px 24px;width:min(480px,92vw);max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.6);';

    /* Título */
    const titleRow = document.createElement('div');
    titleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;';
    const titleEl = document.createElement('h3');
    titleEl.style.cssText = 'margin:0;font-size:14px;font-weight:700;';
    titleEl.textContent = editIdx != null ? 'Editar Check Sheet' : 'Novo Check Sheet';
    const closeX = document.createElement('button');
    closeX.innerHTML = '&times;';
    closeX.style.cssText = 'background:none;border:none;color:var(--text-mute);font-size:22px;cursor:pointer;line-height:1;';
    closeX.addEventListener('click', () => ov.remove());
    titleRow.appendChild(titleEl); titleRow.appendChild(closeX);
    panel.appendChild(titleRow);

    const mkWrap = (label, required = false, note = '') => {
      const w = document.createElement('div'); w.style.cssText = 'margin-bottom:14px;';
      const l = document.createElement('label');
      l.style.cssText = 'display:block;font-size:11px;font-weight:600;color:var(--text-mute);text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;';
      l.textContent = label + (required ? ' *' : '');
      w.appendChild(l);
      if (note) { const n = document.createElement('small'); n.style.cssText = 'display:block;font-size:10px;color:var(--text-mute);margin-bottom:5px;'; n.textContent = note; w.appendChild(n); }
      return w;
    };
    const mkInp = (ph, val = '') => {
      const i = document.createElement('input'); i.type = 'text'; i.placeholder = ph; i.value = val;
      i.style.cssText = 'width:100%;background:var(--panel,#131c2e);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:8px 10px;box-sizing:border-box;';
      return i;
    };

    const allCustom = this._loadCustom();
    const allProjs  = [...HIERARQUIA.projetos, ...allCustom.map(c => c.projeto)].filter((v,i,a) => a.indexOf(v)===i);

    /* Projeto */
    const projWrap = mkWrap('Projeto', true);
    const projList = document.createElement('datalist'); projList.id = '_cs_proj';
    allProjs.forEach(p => { const o=document.createElement('option'); o.value=p; projList.appendChild(o); });
    const projInp = mkInp('Ex: NEXTB, M20A ou novo nome...', existing?.projeto ?? '');
    projInp.setAttribute('list','_cs_proj');
    projWrap.appendChild(projList); projWrap.appendChild(projInp);
    panel.appendChild(projWrap);

    /* Linha */
    const linhaWrap = mkWrap('Linha', true);
    const linhaList = document.createElement('datalist'); linhaList.id = '_cs_linha';
    const linhaInp  = mkInp('Ex: Usinagem, Fundição ou nova...', existing?.linha ?? '');
    linhaInp.setAttribute('list','_cs_linha');
    const refreshLinhas = () => {
      linhaList.innerHTML = '';
      (this._getHierarquia().linhas[projInp.value] ?? []).forEach(l => { const o=document.createElement('option'); o.value=l; linhaList.appendChild(o); });
    };
    projInp.addEventListener('input', refreshLinhas); refreshLinhas();
    linhaWrap.appendChild(linhaList); linhaWrap.appendChild(linhaInp);
    panel.appendChild(linhaWrap);

    /* Operação */
    const opWrap = mkWrap('Operação', false, 'Opcional — deixe em branco se não houver operação específica');
    const opList = document.createElement('datalist'); opList.id = '_cs_op';
    const opInp  = mkInp('Ex: HEAD, CAMHOUSING ou nova...', existing?.operacao ?? '');
    opInp.setAttribute('list','_cs_op');
    const refreshOps = () => {
      opList.innerHTML = '';
      (this._getHierarquia().operacoes?.[projInp.value]?.[linhaInp.value] ?? []).forEach(o => { const oo=document.createElement('option'); oo.value=o; opList.appendChild(oo); });
    };
    projInp.addEventListener('input', refreshOps); linhaInp.addEventListener('input', refreshOps); refreshOps();
    opWrap.appendChild(opList); opWrap.appendChild(opInp);
    panel.appendChild(opWrap);

    /* Medições */
    const medWrap = mkWrap('Dados a Preencher', false, 'Tipos de medição disponíveis para esta combinação');
    const medRows = document.createElement('div'); medRows.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const addMedRow = (val = '') => {
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;';
      const inp = mkInp('Ex: Rugosimetro, Cilindrômetro...', val); inp.style.flex = '1';
      const del = document.createElement('button');
      del.textContent = '✕';
      del.style.cssText = 'background:none;border:1px solid var(--border);border-radius:4px;color:var(--danger,#ef4757);width:30px;flex-shrink:0;cursor:pointer;font-size:12px;';
      del.addEventListener('click', () => medRows.removeChild(row));
      row.appendChild(inp); row.appendChild(del); medRows.appendChild(row);
    };
    (existing?.medicoes ?? []).forEach(m => addMedRow(m));
    const addMedBtn = document.createElement('button');
    addMedBtn.style.cssText = 'margin-top:6px;background:none;border:1px dashed var(--border);border-radius:6px;color:var(--text-mute);font-size:12px;padding:7px;width:100%;cursor:pointer;';
    addMedBtn.textContent = '+ Adicionar Medição';
    addMedBtn.addEventListener('click', () => addMedRow(''));
    medWrap.appendChild(medRows); medWrap.appendChild(addMedBtn);
    panel.appendChild(medWrap);

    /* Lista de existentes */
    const existing2 = this._loadCustom();
    if (existing2.length) {
      const listWrap = document.createElement('div');
      listWrap.style.cssText = 'margin-bottom:14px;border-top:1px solid var(--border);padding-top:14px;';
      const lt = document.createElement('p');
      lt.style.cssText = 'font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-mute);margin:0 0 8px;letter-spacing:.4px;';
      lt.textContent = 'Check Sheets Personalizados'; listWrap.appendChild(lt);
      existing2.forEach((cs, idx) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;padding:5px 8px;border-radius:5px;background:var(--panel,#131c2e);margin-bottom:4px;';
        const lbl = document.createElement('span'); lbl.style.flex = '1';
        lbl.textContent = [cs.projeto, cs.linha, cs.operacao].filter(Boolean).join(' › ');
        const editB = document.createElement('button'); editB.textContent = '✎'; editB.title = 'Editar';
        editB.style.cssText = 'background:none;border:none;color:var(--accent,#4ea3ff);cursor:pointer;font-size:13px;padding:0 4px;';
        editB.addEventListener('click', () => { ov.remove(); this._openCheckSheetEditor(idx); });
        const delB = document.createElement('button'); delB.textContent = '✕'; delB.title = 'Excluir';
        delB.style.cssText = 'background:none;border:none;color:var(--danger,#ef4757);cursor:pointer;font-size:12px;padding:0 4px;';
        delB.addEventListener('click', () => { const arr=this._loadCustom(); arr.splice(idx,1); this._saveCustom(arr); ov.remove(); this._renderStep(); });
        row.appendChild(lbl); row.appendChild(editB); row.appendChild(delB); listWrap.appendChild(row);
      });
      panel.appendChild(listWrap);
    }

    /* Footer */
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:20px;padding-top:14px;border-top:1px solid var(--border);';
    const cancelBtn = document.createElement('button'); cancelBtn.className = 'ap-btn ap-btn--ghost'; cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => ov.remove());
    const saveBtn = document.createElement('button'); saveBtn.className = 'ap-btn ap-btn--primary'; saveBtn.textContent = '✓ Salvar';
    saveBtn.addEventListener('click', () => {
      const proj  = projInp.value.trim();
      const linha = linhaInp.value.trim();
      if (!proj)  { projInp.style.borderColor  = 'var(--danger,#ef4757)'; projInp.focus(); return; }
      if (!linha) { linhaInp.style.borderColor = 'var(--danger,#ef4757)'; linhaInp.focus(); return; }
      const meds  = [...medRows.querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean);
      const entry = { projeto: proj, linha, operacao: opInp.value.trim(), medicoes: meds };
      const arr   = this._loadCustom();
      if (editIdx != null) arr[editIdx] = entry; else arr.push(entry);
      this._saveCustom(arr);
      ov.remove();
      this._renderStep();
    });
    foot.appendChild(cancelBtn); foot.appendChild(saveBtn);
    panel.appendChild(foot);
    ov.appendChild(panel);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  _renderOpcoes(items, field, onSelect) {
    if (!items.length) {
      const p = document.createElement('p');
      p.className   = 'ap-hint';
      p.textContent = 'Nenhuma opção disponível para esta combinação.';
      this._bodyEl.appendChild(p); return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'ap-options';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `ap-option${this._data[field] === item ? ' ap-option--selected' : ''}`;
      btn.textContent = item;
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.ap-option').forEach(b => b.classList.remove('ap-option--selected'));
        btn.classList.add('ap-option--selected');
        onSelect(item);
        setTimeout(() => this._advanceStep(), 180);
      });
      wrap.appendChild(btn);
    });
    this._bodyEl.appendChild(wrap);
  }

  _addField({ key, label, type, placeholder = '', step, options }) {
    const wrap = document.createElement('div'); wrap.className = 'ap-field';
    const lbl = document.createElement('label'); lbl.textContent = label; lbl.htmlFor = `apf-${key}`;
    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea'); input.rows = 3;
    } else if (type === 'select') {
      input = document.createElement('select');
      (options ?? []).forEach(o => {
        const opt = document.createElement('option'); opt.value = opt.text = o;
        if (o === this._data[key]) opt.selected = true; input.appendChild(opt);
      });
    } else {
      input = document.createElement('input'); input.type = type;
      if (step) input.step = step;
    }
    input.id = `apf-${key}`;
    if (type !== 'select') input.value = this._data[key] ?? '';
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener('input', () => {
      this._data[key] = type === 'number' ? (parseFloat(input.value) || null) : input.value;
      if (['medidaReal','tolMin','tolMax'].includes(key)) this._updateStatus();
    });
    input.addEventListener('change', () => { this._data[key] = input.value; });
    wrap.appendChild(lbl); wrap.appendChild(input); this._bodyEl.appendChild(wrap);
  }

  _updateStatus() {
    if (!this._statusEl) return;
    const { medidaReal, tolMin, tolMax } = this._data;
    if (medidaReal == null || tolMin == null || tolMax == null) { this._statusEl.innerHTML = ''; return; }
    const ok = medidaReal >= tolMin && medidaReal <= tolMax;
    this._statusEl.innerHTML = ok
      ? `<span class="ap-badge ap-badge--ok">✓ Conforme</span>`
      : `<span class="ap-badge ap-badge--nok">✗ Fora de Tolerância</span>`;
    if (!this._data.status) this._data.status = ok ? 'Conforme' : 'Não Conforme';
  }

  /* ── Rascunhos / Em Andamento ─────────────────────────── */

  _loadDrafts() {
    try { return JSON.parse(localStorage.getItem('metrologia_ap_drafts') ?? '[]'); } catch { return []; }
  }

  _saveDraft() {
    const drafts = this._loadDrafts();
    const id     = this._data._draftId ?? `ap_draft_${Date.now()}`;
    this._data._draftId = id;
    const entry  = { ...this._data, _savedAt: new Date().toISOString(), _stepIdx: this._stepIdx };
    const idx    = drafts.findIndex(d => d._draftId === id);
    if (idx >= 0) drafts[idx] = entry; else drafts.unshift(entry);
    localStorage.setItem('metrologia_ap_drafts', JSON.stringify(drafts));
    this._showToast('💾 Medição salva — pode retomar depois');
  }

  _deleteDraft(id) {
    const drafts = this._loadDrafts().filter(d => d._draftId !== id);
    localStorage.setItem('metrologia_ap_drafts', JSON.stringify(drafts));
  }

  _openDraftData(draft) {
    const { _savedAt, ...data } = draft;
    this._data    = data;
    this._stepIdx = draft._stepIdx ?? 0;
    this._steps   = this._buildSteps();
    if (!this._page) this._build();
    this._page.style.display  = 'flex';
    document.body.style.overflow = 'hidden';
    this._renderStep();
  }

  _renderDraftsSection() {
    const drafts = this._loadDrafts();

    const section = document.createElement('div');
    section.className = 'ap-drafts-section';

    const titleRow = document.createElement('div');
    titleRow.className   = 'ap-drafts-title';
    titleRow.textContent = '📋 Em Andamento — Aguardando Finalização';
    section.appendChild(titleRow);

    const STEP_NAMES = [
      'Escolha o projeto', 'Selecione a linha', 'Peça do Fornecedor',
      'Selecione a operação', 'Tipo de medição', 'Dados da peça',
      'Resultado da medição', 'Confirmar e enviar',
    ];

    if (!drafts.length) {
      const empty = document.createElement('div');
      empty.className   = 'ap-draft-empty';
      empty.textContent = 'Nenhuma medição salva aguardando finalização.';
      section.appendChild(empty);
      this._bodyEl.appendChild(section);
      return;
    }

    drafts.forEach(draft => {
      const card = document.createElement('div');
      card.className = 'ap-draft-card';

      // Cabeçalho
      const parts    = [draft.projeto, draft.linha, draft.operacao, draft.tipo].filter(Boolean);
      const stepIdx  = draft._stepIdx ?? 0;
      const stepName = STEP_NAMES[stepIdx] ?? 'Em andamento';

      const titleEl = document.createElement('div');
      titleEl.className   = 'ap-draft-card__title';
      titleEl.textContent = parts.length ? parts.join(' / ') : 'Nova análise';

      const stepEl = document.createElement('div');
      stepEl.className   = 'ap-draft-card__step';
      stepEl.textContent = `▶ Passo ${stepIdx + 1} — ${stepName}`;

      // Meta
      const savedAt  = draft._savedAt ? new Date(draft._savedAt).toLocaleString('pt-BR') : '—';
      const extras   = [
        draft.numeroPeca ? `Peça: ${draft.numeroPeca}` : '',
        draft.turno      ? `Turno ${draft.turno}`       : '',
        draft.operador   ? `Inspetor: ${draft.operador}` : '',
      ].filter(Boolean);
      const metaEl   = document.createElement('div');
      metaEl.className   = 'ap-draft-card__meta';
      metaEl.textContent = `${extras.length ? extras.join(' · ') + '  ·  ' : ''}Salvo em ${savedAt}`;

      // Botões
      const foot      = document.createElement('div');
      foot.className  = 'ap-draft-card__foot';

      const removeBtn = document.createElement('button');
      removeBtn.className   = 'ap-draft-btn ap-draft-btn--remove';
      removeBtn.textContent = '🗑 Remover medição';
      removeBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm(`Remover o rascunho "${titleEl.textContent}"?\nEssa ação não pode ser desfeita.`)) return;
        this._deleteDraft(draft._draftId);
        card.style.transition = 'opacity .2s,transform .2s';
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(-6px)';
        setTimeout(() => {
          card.remove();
          if (!section.querySelector('.ap-draft-card')) {
            const empty = document.createElement('div');
            empty.className   = 'ap-draft-empty';
            empty.textContent = 'Nenhuma medição salva aguardando finalização.';
            section.appendChild(empty);
          }
        }, 200);
      });

      const resumeBtn = document.createElement('button');
      resumeBtn.className   = 'ap-draft-btn ap-draft-btn--resume';
      resumeBtn.textContent = '▶ Retomar';
      resumeBtn.addEventListener('click', e => {
        e.stopPropagation();
        this._openDraftData(draft);
      });

      foot.appendChild(removeBtn);
      foot.appendChild(resumeBtn);

      card.appendChild(titleEl);
      card.appendChild(stepEl);
      card.appendChild(metaEl);
      card.appendChild(foot);
      section.appendChild(card);
    });

    this._bodyEl.appendChild(section);
  }

  /* ── Rastreabilidade editável (localStorage) ─────────────── */
  _rastKey(tipo) {
    return `metrologia_rast_${(tipo ?? '').replace(/[^a-z0-9]/gi, '_')}`;
  }

  _loadRastCustom(tipo) {
    try { const s = localStorage.getItem(this._rastKey(tipo)); return s ? JSON.parse(s) : null; }
    catch { return null; }
  }

  _saveRastCustom(tipo, data) {
    localStorage.setItem(this._rastKey(tipo), JSON.stringify(data));
  }

  _getEffectiveRast(tipo) {
    const def = RASTREABILIDADE[tipo];
    if (!def) return null;
    const custom = this._loadRastCustom(tipo);
    if (!custom) return def;
    return {
      ...def,
      titulo:     custom.titulo     ?? def.titulo,
      colsResult: custom.colsResult ?? def.colsResult,
      itens:      custom.itens      ?? def.itens,
    };
  }

  _openRastEditor(tipo) {
    const def = RASTREABILIDADE[tipo];
    if (!def) return;
    const cur = this._getEffectiveRast(tipo);

    // Cópia de trabalho
    const working = {
      titulo:     cur.titulo,
      colsResult: cur.colsResult.map(c => ({ ...c })),
      itens:      cur.itens.map(it => ({ ...it })),
    };

    /* Overlay */
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.65);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 20px;';

    const panel = document.createElement('div');
    panel.style.cssText = 'background:var(--surface,#111c2e);border:1px solid var(--border);border-radius:12px;padding:24px;width:860px;max-width:100%;';

    /* Cabeçalho do modal */
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;';
    const hdrTitle = document.createElement('div');
    hdrTitle.style.cssText = 'font-size:15px;font-weight:700;color:var(--text);';
    hdrTitle.textContent = '✎ Editar Check Sheet — ' + tipo;
    const closeX = document.createElement('button');
    closeX.textContent = '✕';
    closeX.style.cssText = 'background:none;border:none;color:var(--text-mute);font-size:18px;cursor:pointer;padding:2px 8px;';
    closeX.addEventListener('click', () => ov.remove());
    hdr.appendChild(hdrTitle); hdr.appendChild(closeX);
    panel.appendChild(hdr);

    const mkLabel = txt => {
      const l = document.createElement('div');
      l.style.cssText = 'font-size:11px;color:var(--text-mute);margin-bottom:5px;margin-top:14px;text-transform:uppercase;letter-spacing:.06em;font-weight:600;';
      l.textContent = txt; return l;
    };
    const mkInp = (val, ph = '') => {
      const i = document.createElement('input');
      i.type = 'text'; i.value = val; i.placeholder = ph;
      i.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg,#0d1521);border:1px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-size:13px;';
      i.addEventListener('focus', () => i.style.borderColor = 'var(--accent,#4ea3ff)');
      i.addEventListener('blur',  () => i.style.borderColor = 'var(--border)');
      return i;
    };

    /* Título */
    panel.appendChild(mkLabel('Título do Check Sheet'));
    const tituloInp = mkInp(working.titulo);
    tituloInp.addEventListener('input', () => { working.titulo = tituloInp.value; });
    panel.appendChild(tituloInp);

    /* Colunas de resultado — editáveis, com adicionar/remover */
    panel.appendChild(mkLabel('Colunas de Resultado'));
    const colsWrap = document.createElement('div');
    colsWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;align-items:center;';

    const renderCols = () => {
      colsWrap.innerHTML = '';
      working.colsResult.forEach((col, ci) => {
        const colBox = document.createElement('div');
        colBox.style.cssText = 'display:flex;align-items:center;gap:6px;background:var(--bg,#0d1521);border:1px solid var(--border);border-radius:6px;padding:5px 9px;';
        const colInp = document.createElement('input');
        colInp.type = 'text'; colInp.value = col.label.replace(/\n/g, ' '); colInp.placeholder = 'Coluna';
        colInp.style.cssText = 'background:none;border:none;color:var(--text);font-size:12px;width:90px;outline:none;';
        colInp.addEventListener('input', () => { working.colsResult[ci].label = colInp.value; });
        colBox.appendChild(colInp);

        const delC = document.createElement('button');
        delC.innerHTML = '✕'; delC.title = 'Remover coluna';
        delC.style.cssText = 'background:none;border:none;color:var(--text-mute);cursor:pointer;font-size:12px;padding:0 2px;line-height:1;';
        delC.addEventListener('mouseenter', () => delC.style.color = 'var(--danger,#ef4757)');
        delC.addEventListener('mouseleave', () => delC.style.color = 'var(--text-mute)');
        delC.addEventListener('click', () => {
          if (working.colsResult.length <= 1) { this._showToast('Mantenha ao menos 1 coluna.', 'err'); return; }
          working.colsResult.splice(ci, 1); renderCols();
        });
        colBox.appendChild(delC);
        colsWrap.appendChild(colBox);
      });

      const addColBtn = document.createElement('button');
      addColBtn.textContent = '+ Coluna';
      addColBtn.style.cssText = 'padding:6px 12px;border-radius:6px;border:1px dashed var(--accent,#4ea3ff);background:none;color:var(--accent,#4ea3ff);font-size:12px;cursor:pointer;';
      addColBtn.addEventListener('click', () => {
        const key = 'c_extra_' + Date.now().toString(36) + '_' + working.colsResult.length;
        working.colsResult.push({ key, label: 'Nova Coluna' });
        renderCols();
      });
      colsWrap.appendChild(addColBtn);
    };
    renderCols();
    panel.appendChild(colsWrap);

    /* Itens */
    panel.appendChild(mkLabel('Itens de Medição'));
    const itemsWrap = document.createElement('div');
    itemsWrap.style.cssText = 'margin-top:6px;';

    const GRID_ROW = '22px 42px 1fr 100px 75px 1fr 55px 60px';

    let dragIdx = null;

    /* Alça de arraste para reordenar */
    const _mkHandle = (ii) => {
      const h = document.createElement('div');
      h.textContent = '⠿';
      h.draggable = true;
      h.title = 'Arraste para reordenar';
      h.style.cssText = 'cursor:grab;color:var(--text-mute);font-size:15px;display:flex;align-items:center;justify-content:center;user-select:none;';
      h.addEventListener('dragstart', (e) => {
        dragIdx = ii;
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(ii)); } catch {}
      });
      h.addEventListener('dragend', () => { dragIdx = null; });
      return h;
    };

    /* Habilita uma linha como alvo de soltar (drop) */
    const _attachDrop = (rowEl, ii) => {
      rowEl.addEventListener('dragover', (e) => {
        if (dragIdx === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        rowEl.style.boxShadow = dragIdx < ii
          ? 'inset 0 -2px 0 var(--accent,#4ea3ff)'
          : 'inset 0 2px 0 var(--accent,#4ea3ff)';
      });
      rowEl.addEventListener('dragleave', () => { rowEl.style.boxShadow = 'none'; });
      rowEl.addEventListener('drop', (e) => {
        e.preventDefault();
        rowEl.style.boxShadow = 'none';
        const from = dragIdx, to = ii;
        if (from === null || from === to) return;
        const moved  = working.itens.splice(from, 1)[0];
        const target = from < to ? to - 1 : to;
        working.itens.splice(target, 0, moved);
        dragIdx = null;
        renderItems();
      });
    };

    /* Botão "+" — insere uma linha de medição logo abaixo desta */
    const _mkInsertBtn = (ii) => {
      const b = document.createElement('button');
      b.innerHTML = '+'; b.title = 'Inserir linha abaixo';
      b.style.cssText = 'background:none;border:1px solid transparent;border-radius:4px;color:var(--text-mute);cursor:pointer;font-size:15px;font-weight:700;padding:2px 6px;line-height:1;transition:all .15s;';
      b.addEventListener('mouseenter', () => { b.style.borderColor = 'var(--accent,#4ea3ff)'; b.style.color = 'var(--accent,#4ea3ff)'; });
      b.addEventListener('mouseleave', () => { b.style.borderColor = 'transparent'; b.style.color = 'var(--text-mute)'; });
      b.addEventListener('click', () => {
        working.itens.splice(ii + 1, 0, { no:'', desc:'', esp:'', maq:'', ponto:'', unid:'', spec:null });
        renderItems();
      });
      return b;
    };

    const renderItems = () => {
      itemsWrap.innerHTML = '';

      /* Cabeçalho da grade */
      const hRow = document.createElement('div');
      hRow.style.cssText = `display:grid;grid-template-columns:${GRID_ROW};gap:4px;margin-bottom:4px;`;
      ['','No','Descrição','Especificado','Máq.','Ponto medido','Unid',''].forEach(h => {
        const l = document.createElement('div');
        l.style.cssText = 'font-size:10px;color:var(--text-mute);text-transform:uppercase;padding:0 3px;';
        l.textContent = h; hRow.appendChild(l);
      });
      itemsWrap.appendChild(hRow);

      working.itens.forEach((item, ii) => {
        /* Cria a célula de ações (inserir + remover) */
        const mkActions = () => {
          const act = document.createElement('div');
          act.style.cssText = 'display:flex;align-items:center;gap:2px;justify-content:flex-end;';
          act.appendChild(_mkInsertBtn(ii));
          act.appendChild(_mkDelBtn(() => { working.itens.splice(ii, 1); renderItems(); }));
          return act;
        };

        /* Separador */
        if (item.separator !== undefined) {
          const sepRow = document.createElement('div');
          sepRow.style.cssText = 'display:grid;grid-template-columns:22px 1fr 60px;gap:4px;margin:6px 0;align-items:center;';
          sepRow.appendChild(_mkHandle(ii));
          const sepInp = document.createElement('input');
          sepInp.type = 'text'; sepInp.value = item.separator; sepInp.placeholder = 'Separador...';
          sepInp.style.cssText = 'background:#ffc000;border:none;border-radius:4px;color:#1a1a1a;font-size:11px;font-weight:700;padding:4px 8px;text-transform:uppercase;width:100%;box-sizing:border-box;';
          sepInp.addEventListener('input', () => { working.itens[ii].separator = sepInp.value; });
          sepRow.appendChild(sepInp);
          sepRow.appendChild(mkActions());
          _attachDrop(sepRow, ii);
          itemsWrap.appendChild(sepRow);
          return;
        }

        /* Linha normal */
        const row = document.createElement('div');
        row.style.cssText = `display:grid;grid-template-columns:${GRID_ROW};gap:4px;margin-bottom:4px;align-items:center;`;

        row.appendChild(_mkHandle(ii));

        [
          { key:'no',    ph:'No'          },
          { key:'desc',  ph:'Descrição'   },
          { key:'esp',   ph:'Especificado'},
          { key:'maq',   ph:'Máq.'        },
          { key:'ponto', ph:'Ponto'       },
          { key:'unid',  ph:'Unid'        },
        ].forEach(f => {
          const inp = document.createElement('input');
          inp.type = 'text'; inp.value = String(item[f.key] ?? ''); inp.placeholder = f.ph;
          inp.style.cssText = 'width:100%;box-sizing:border-box;background:var(--bg,#0d1521);border:1px solid var(--border);border-radius:5px;padding:5px 7px;color:var(--text);font-size:12px;';
          inp.addEventListener('focus', () => inp.style.borderColor = 'var(--accent,#4ea3ff)');
          inp.addEventListener('blur',  () => inp.style.borderColor = 'var(--border)');
          inp.addEventListener('input', () => {
            working.itens[ii][f.key] = f.key === 'no'
              ? (inp.value === '' ? '' : (!isNaN(inp.value) ? Number(inp.value) : inp.value))
              : inp.value;
          });
          row.appendChild(inp);
        });

        row.appendChild(mkActions());
        _attachDrop(row, ii);
        itemsWrap.appendChild(row);
      });

      /* Botões de adicionar (ao final da lista) */
      const addRow = document.createElement('div');
      addRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';

      const addItemBtn = document.createElement('button');
      addItemBtn.textContent = '+ Adicionar Linha';
      addItemBtn.style.cssText = 'padding:6px 14px;border-radius:6px;border:1px dashed var(--accent,#4ea3ff);background:none;color:var(--accent,#4ea3ff);font-size:12px;cursor:pointer;';
      addItemBtn.addEventListener('click', () => {
        working.itens.push({ no:'', desc:'', esp:'', maq:'', ponto:'', unid:'', spec:null });
        renderItems();
      });

      const addSepBtn = document.createElement('button');
      addSepBtn.textContent = '+ Separador';
      addSepBtn.style.cssText = 'padding:6px 14px;border-radius:6px;border:1px dashed var(--border);background:none;color:var(--text-mute);font-size:12px;cursor:pointer;';
      addSepBtn.addEventListener('click', () => {
        working.itens.push({ separator: 'Novo Separador' });
        renderItems();
      });

      const hint = document.createElement('div');
      hint.style.cssText = 'flex:1;text-align:right;font-size:10.5px;color:var(--text-mute);align-self:center;font-style:italic;';
      hint.textContent = '⠿ arraste para reordenar · + insere linha abaixo';

      addRow.appendChild(addItemBtn);
      addRow.appendChild(addSepBtn);
      addRow.appendChild(hint);
      itemsWrap.appendChild(addRow);
    };

    const _mkDelBtn = (onClick) => {
      const b = document.createElement('button');
      b.innerHTML = '🗑'; b.title = 'Remover';
      b.style.cssText = 'background:none;border:1px solid transparent;border-radius:4px;color:var(--text-mute);cursor:pointer;font-size:13px;padding:4px;transition:all .15s;';
      b.addEventListener('mouseenter', () => { b.style.borderColor='var(--danger,#ef4757)'; b.style.color='var(--danger,#ef4757)'; });
      b.addEventListener('mouseleave', () => { b.style.borderColor='transparent'; b.style.color='var(--text-mute)'; });
      b.addEventListener('click', onClick);
      return b;
    };

    renderItems();
    panel.appendChild(itemsWrap);

    /* Rodapé */
    const foot = document.createElement('div');
    foot.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid var(--border);';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↩ Restaurar Padrão';
    resetBtn.style.cssText = 'padding:7px 14px;border-radius:7px;border:1px solid rgba(239,71,87,.4);background:none;color:var(--danger,#ef4757);font-size:12px;cursor:pointer;';
    resetBtn.addEventListener('click', () => {
      if (!confirm('Restaurar configurações padrão? As personalizações serão apagadas.')) return;
      localStorage.removeItem(this._rastKey(tipo));
      ov.remove();
      this._renderStep();
    });

    const rightBtns = document.createElement('div');
    rightBtns.style.cssText = 'display:flex;gap:8px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = 'padding:7px 16px;border-radius:7px;border:1px solid var(--border);background:none;color:var(--text);font-size:12px;cursor:pointer;';
    cancelBtn.addEventListener('click', () => ov.remove());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✓ Salvar Alterações';
    saveBtn.style.cssText = 'padding:7px 18px;border-radius:7px;border:none;background:var(--accent,#4ea3ff);color:#fff;font-size:12px;font-weight:700;cursor:pointer;';
    saveBtn.addEventListener('click', () => {
      this._saveRastCustom(tipo, working);
      ov.remove();
      this._renderStep();
    });

    rightBtns.appendChild(cancelBtn);
    rightBtns.appendChild(saveBtn);
    foot.appendChild(resetBtn);
    foot.appendChild(rightBtns);
    panel.appendChild(foot);

    ov.appendChild(panel);
    ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  _showToast(msg, type = 'ok') {
    const color = type === 'ok' ? 'var(--ok,#22c55e)' : 'var(--danger,#ef4757)';
    const t = document.createElement('div');
    t.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:10000;
      background:var(--panel,#131c2e);border:1.5px solid ${color};
      border-radius:8px;padding:10px 22px;font-size:13px;font-weight:600;
      color:${color};box-shadow:0 4px 24px rgba(0,0,0,.45);
      white-space:nowrap;animation:apToastIn .25s ease;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2800);
  }

  _validate() {
    const id = this._currentStep?.id;
    if (id === 'projeto' && !this._data.projeto)    { this._showError('Selecione um projeto.'); return false; }
    if (id === 'linha'   && !this._data.linha)      { this._showError('Selecione uma linha.'); return false; }
    if (id === 'fornecedor_peca') {
      if (this._data.fornecedorModo === 'acrescentar') {
        const nome = (this._data._novaFornecedorNome ?? '').trim();
        if (!nome) { this._showError('Informe o nome da peça.'); return false; }
        // Salva nova peça na lista
        const nova = {
          nome,
          codigo: (this._data._novaFornecedorCodigo ?? '').trim(),
          back:   (this._data._novaFornecedorBack   ?? '').trim(),
        };
        const pecas = this._loadFornecedorPecas();
        if (!pecas.some(p => p.nome.toLowerCase() === nome.toLowerCase())) {
          pecas.push(nova);
          this._saveFornecedorPecas(pecas);
        }
        this._data.pecaFornecedor = nova;
        this._data.tipo = nova.nome; // mapeia para RASTREABILIDADE[nova.nome]
      }
      if (!this._data.pecaFornecedor) {
        this._showError(this._data.fornecedorModo === 'selecionar'
          ? 'Selecione uma peça da lista.'
          : 'Escolha uma opção: selecionar ou acrescentar peça.');
        return false;
      }
    }
    if (id === 'dados') {
      if (!this._data.pecaFornecedor && !this._data.numeroPeca) { this._showError('Informe o número da peça.'); return false; }
      if (this._data.pecaFornecedor && !this._data.nrOrder?.trim()) { this._showError('Informe o Nº Order.'); return false; }
    }
    if (id === 'medicao') {
      const rast = this._data.tipo ? RASTREABILIDADE[this._data.tipo] : null;
      if (rast && this._hasIssues(rast) && !this._data.obsGeral?.trim()) {
        this._showError('Observações obrigatórias — há itens NOK ou em zona de atenção.');
        const el = document.getElementById('ap-obs-geral-field');
        if (el) { el.style.borderColor = 'var(--warn,#ffb547)'; el.focus(); }
        return false;
      }
    }
    return true;
  }

  _showError(msg) {
    let err = this._bodyEl.querySelector('.ap-error');
    if (!err) { err = document.createElement('div'); err.className = 'ap-error'; this._bodyEl.prepend(err); }
    err.textContent = msg;
    setTimeout(() => err?.remove(), 3500);
  }

  _submit() {
    // Remove rascunho salvo se existir
    if (this._data._draftId) this._deleteDraft(this._data._draftId);

    this._data.timestamp = new Date().toISOString();
    this._bus.emit('analise-periodica:submit', this._data);
    this.close();
    const partes = [this._data.projeto, this._data.linha, this._data.operacao, this._data.tipo].filter(Boolean);
    const toast = document.createElement('div'); toast.className = 'toast toast--ok show';
    toast.textContent = `✓ Análise registrada — ${partes.join(' / ')}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
  }
}
