/* ================================================================
   CONSTANTES GLOBAIS TESTEEEE
================================================================ */

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

// ── ENUMS ──────────────────────────────────────────────────────
// Categorias e pagamentos são salvos como números no JSON.
// Isso evita problemas de encoding com acentos e facilita migrações.
// Retrocompatibilidade: se vier string (JSON antigo), mantém a string.

const CATEGORIAS = {
  1: 'Alimentação',
  2: 'Saúde',
  3: 'Educação',
  4: 'Serviços',
  5: 'Lazer',
  6: 'Transporte',
  7: 'Investimentos',
  8: 'Moradia',
  9: 'Crédito',
  10: 'Compra',
  11: 'Outros',
};

const PAGAMENTOS = {
  1: 'Cartão Sicredi',
  2: 'Cartão M Pago',
  3: 'Cartão Banri',
  4: 'Dinheiro Vivo',
  5: 'Pix',
  6: 'Poupança',
  7: 'Conta Corrente Banri',
  8: 'Conta Corrente M Pago',
  9: 'Cartão Santander',
};

// Traduz ID numérico → nome. String() garante que IDs sem mapeamento
// nunca quebrem .replace() ou outras operações de string.
const getCatNome = c => (c != null) ? (CATEGORIAS[c] || String(c)) : '?';
const getPagNome = p => (p != null) ? (PAGAMENTOS[p] || String(p)) : '?';

// Cores por nome de categoria (após tradução)
const CAT_COLORS = {
  Alimentação:  '#1D9E75',
  Saúde:        '#E24B4A',
  Educação:     '#378ADD',
  Serviços:     '#BA7517',
  Lazer:        '#D4537E',
  Transporte:   '#7F77DD',
  Investimentos:'#639922',
  Moradia:      '#D85A30',
  Crédito:      '#888780',
  Compra:       '#5DCAA5',
  Outros:       '#B4B2A9',
};

// CSS class de tag por nome de pagamento (após tradução)
const PAY_CLASS = {
  'Cartão Sicredi':       'pt-sicredi',
  'Cartão M Pago':        'pt-mpago',
  'Cartão Banri':         'pt-banri',
  'Dinheiro Vivo':        'pt-dinheiro',
  'Pix':                  'pt-pix',
  'Poupança':             'pt-poupanca',
  'Conta Corrente Banri': 'pt-banri',
  'Conta Corrente M Pago':'pt-mpago',
  'Cartão Santander':     'pt-santander',
};

// Cores dos gráficos por nome de pagamento (após tradução)
const PAY_COLORS = {
  'Cartão Sicredi':       '#1D9E75',
  'Cartão M Pago':        '#00838F',
  'Cartão Banri':         '#378ADD',
  'Dinheiro Vivo':        '#888780',
  'Pix':                  '#BA7517',
  'Poupança':             '#639922',
  'Conta Corrente Banri': '#5DCAA5',
  'Conta Corrente M Pago':'#3BDAB0',
  'Cartão Santander':     '#EC0000',
};

// Mês e ano de referência — removido: parcelas agora calculadas por inicio+parcelas

/* ================================================================
   HELPERS
================================================================ */

// Formata valor em R$ com separador BR
const fmt = v =>
  'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Formata valor abreviado (ex: R$ 1,5k)
const fmtK = v => {
  const a = Math.abs(v);
  return (v < 0 ? '-' : '') + (a >= 1000 ? 'R$ ' + Math.round(a / 100) / 10 + 'k' : fmt(v));
};

// Formata data "yyyy-mm-dd" → "dd/mm/aaaa"
const fmtDate = s => {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

// Gera ID único
const uid = () => Date.now() + Math.floor(Math.random() * 9999);

// Escapa HTML
const escHtml = s =>
  String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Tag de pagamento colorida — traduz ID → nome antes de renderizar
const payTag = p => {
  const nome = String(getPagNome(p) ?? p ?? '?');
  return `<span class="pay-tag ${PAY_CLASS[nome] || 'pt-dinheiro'}">${escHtml(nome.replace('Conta Corrente ', 'CC '))}</span>`;
};

// Wrap de categoria com dot colorido — traduz ID → nome antes de renderizar
const catWrap = c => {
  const nome = String(getCatNome(c) ?? c ?? '?');
  return `<span class="cat-wrap"><span class="cat-dot" style="background:${CAT_COLORS[nome]||'#888'}"></span>${escHtml(nome)}</span>`;
};

// Toast de notificação
function toast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// Gerenciamento de gráficos Chart.js
let charts = {};
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

/* ================================================================
   DADOS PADRÃO
   Usados quando o dados.json ainda não existe no GitHub
================================================================ */
const DEFAULT_STATE = {
  receitas: [
    // Salários indicativos de jan e fev (recebidos, não projetados)
    { id: 1773773355486, desc: 'Salário', valor: 2550, inicio: '2026-01-01', fim: '2026-01-01' },
    { id: 1773773427985, desc: 'Salário', valor: 1092, inicio: '2026-02-17', fim: '2026-02-17' },
    // Recorrentes a partir de março
    { id: 1,   desc: 'Salário',                valor: 2250, inicio: '2026-03-01', fim: '2026-12-31' },
    { id: 2,   desc: 'Vale',                   valor:  750, inicio: '2026-01-01', fim: '2026-12-25' },
    { id: 3,   desc: 'Pagamento de Férias',    valor: 2900, inicio: '2026-04-01', fim: '2026-04-01' },
    { id: 4,   desc: '13º Salário (1ª Parc.)', valor: 1250, inicio: '2026-11-01', fim: '2026-11-01' },
    { id: 5,   desc: '13º Salário (2ª Parc.)', valor: 1000, inicio: '2026-12-01', fim: '2026-12-01' },
  ],
  fixas: [
    { id: 1, desc: 'Faculdade',    cat: 'Educação',     limite: 517, valor: 517, pag: 'Cartão Sicredi', inicio: '2026-01-01', fim: '' },
    { id: 2, desc: 'Corte',        cat: 'Saúde',        limite: 100, valor: 100, pag: 'Cartão Sicredi', inicio: '2026-01-01', fim: '' },
    { id: 3, desc: 'Streaming',    cat: 'Serviços',     limite: 183, valor: 183, pag: 'Cartão Sicredi', inicio: '2026-01-01', fim: '' },
    { id: 4, desc: 'Poupança',     cat: 'Investimentos',limite: 500, valor: 500, pag: 'Poupança',       inicio: '2026-04-01', fim: '' },
    { id: 5, desc: 'Mercado',      cat: 'Alimentação',  limite: 100, valor: 150, pag: 'Cartão Sicredi', inicio: '2026-01-02', fim: '' },
    { id: 6, desc: 'Farmacia',     cat: 'Saúde',        limite:  50, valor:  60, pag: 'Cartão Sicredi', inicio: '2026-01-02', fim: '' },
    { id: 7, desc: 'Lazer mensal', cat: 'Lazer',        limite: 450, valor: 500, pag: 'Cartão Sicredi', inicio: '2026-01-02', fim: '' },
  ],
  variaveis: [
    { id: 11, nome: 'Nike',            cat: 'Compra',  total: 660, mensal: 110, parcelas: 6,  faltam: 6,  pag: 'Cartão Sicredi',        inicio: '2026-01-01', pago: false },
    { id: 1,  nome: 'Mercado Livre 2', cat: 'Compra',  total:  52, mensal:  26, parcelas: 2,  faltam: 1,  pag: 'Cartão M Pago',         inicio: '2026-02-12', pago: false },
    { id: 2,  nome: 'Airbnb',          cat: 'Lazer',   total: 438, mensal:  73, parcelas: 6,  faltam: 5,  pag: 'Cartão Banri',          inicio: '2026-02-12', pago: false },
    { id: 3,  nome: 'Perfume',         cat: 'Compra',  total: 756, mensal:  63, parcelas: 12, faltam: 11, pag: 'Cartão M Pago',         inicio: '2026-02-12', pago: false },
    { id: 4,  nome: 'Renner',          cat: 'Compra',  total: 180, mensal:  60, parcelas: 3,  faltam: 2,  pag: 'Cartão Sicredi',        inicio: '2026-02-20', pago: false },
    { id: 5,  nome: 'C&A',             cat: 'Compra',  total: 326, mensal: 163, parcelas: 2,  faltam: 2,  pag: 'Cartão M Pago',         inicio: '2026-03-01', pago: false },
    { id: 6,  nome: 'Credito Banri',   cat: 'Credito', total:  86, mensal:  86, parcelas: 3,  faltam: 2,  pag: 'Conta Corrente Banri',  inicio: '2026-03-01', pago: false },
    { id: 7,  nome: 'H&M',             cat: 'Compra',  total: 348, mensal:  58, parcelas: 6,  faltam: 6,  pag: 'Cartão Sicredi',        inicio: '2026-03-01', pago: false },
    { id: 8,  nome: 'Credito Mercado', cat: 'Credito', total: 610, mensal: 122, parcelas: 5,  faltam: 4,  pag: 'Conta Corrente M Pago', inicio: '2026-03-02', pago: false },
    { id: 9,  nome: 'Amazon 1',        cat: 'Compra',  total: 288, mensal:  48, parcelas: 6,  faltam: 6,  pag: 'Cartão Banri',          inicio: '2026-03-09', pago: false },
    { id: 12, nome: 'Hering',          cat: 'Compra',  total: 264, mensal:  66, parcelas: 4,  faltam: 2,  pag: 'Pix',                   inicio: '2026-04-01', pago: false },
    { id: 10, nome: 'Aniversario Julia',cat:'Lazer',   total: 660, mensal: 110, parcelas: 6,  faltam: 6,  pag: 'Pix',                   inicio: '2026-09-01', pago: false },
  ],
  // gastos: lançamentos de gastos reais por mês
  // cada item: { id, cat (número), desc, valor, pag (número), data: 'YYYY-MM-DD' }
  gastos: [],
};

/* ================================================================
   ESTADO DA APLICAÇÃO
================================================================ */
let state = JSON.parse(JSON.stringify(DEFAULT_STATE));

/* ================================================================
   GITHUB SYNC
================================================================ */
const GH_OWNER  = 'JoaoVuelma';
const GH_REPO   = 'controle-financeiro';
const GH_FILE   = 'dados.json';
const GH_BRANCH = 'main';
const TOKEN_KEY = 'mf_gh_token';

let ghFileSha  = null; // SHA atual do arquivo no GitHub (necessário para atualizar)
let hasUnsaved = false;

// Atualiza o indicador visual de sincronização
function setSyncStatus(type, msg) {
  document.getElementById('sync-dot').className   = 'sync-dot ' + type;
  document.getElementById('sync-label').textContent = msg;
}

// Marca que há alterações não salvas
function markUnsaved() {
  hasUnsaved = true;
  document.getElementById('btn-salvar').style.display = 'inline-flex';
  setSyncStatus('unsaved', 'Não salvo');
}

// Marca como salvo
function markSaved() {
  hasUnsaved = false;
  document.getElementById('btn-salvar').style.display = 'none';
  setSyncStatus('ok', 'Sincronizado ✓');
}

// Abre modal de configuração
function showConfig() {
  document.getElementById('cfg-token').value = localStorage.getItem(TOKEN_KEY) || '';
  document.getElementById('modal-config').style.display = 'flex';
}

// Fecha modal de configuração
function hideConfig() {
  document.getElementById('modal-config').style.display = 'none';
}

// Salva token e carrega dados
function saveConfig() {
  const token = document.getElementById('cfg-token').value.trim();
  if (!token) { toast('⚠ Cole o token do GitHub.'); return; }
  localStorage.setItem(TOKEN_KEY, token);
  hideConfig();
  toast('Token salvo! Carregando dados...');
  githubLoad();
}

function getToken() { return localStorage.getItem(TOKEN_KEY); }

// Carrega dados do GitHub
async function githubLoad() {
  const token = getToken();

  if (!token) {
    setSyncStatus('error', 'Configure o token ⚙');
    document.getElementById('btn-salvar').style.display = 'inline-flex';
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    reRenderActive();
    return;
  }

  setSyncStatus('syncing', 'Carregando...');
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}?ref=${GH_BRANCH}&t=${Date.now()}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );

    if (res.status === 404) {
      // Arquivo ainda não existe — primeira vez
      setSyncStatus('ok', 'Pronto (novo arquivo)');
      document.getElementById('btn-salvar').style.display = 'inline-flex';
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      reRenderActive();
      return;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json      = await res.json();
    ghFileSha       = json.sha;
    // Decodifica Base64 com suporte completo a UTF-8 (acentos, ç, ã, etc.)
    const b64clean  = json.content.replace(/\n/g, '');
    const decoded   = JSON.parse(decodeURIComponent(escape(atob(b64clean))));
    state = {
      receitas:    decoded.receitas    || [],
      fixas:       decoded.fixas       || [],
      variaveis:   decoded.variaveis   || [],
      gastos:      decoded.gastos      || [],
      fechamentos: decoded.fechamentos || {},
    };

    markSaved();
    reRenderActive();
    toast('✓ Dados carregados!');

  } catch (err) {
    setSyncStatus('error', 'Erro ao carregar');
    document.getElementById('btn-salvar').style.display = 'inline-flex';
    toast('⚠ Erro: ' + err.message);
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    reRenderActive();
  }
}

// Salva dados no GitHub
async function githubSave() {
  const token = getToken();
  if (!token) { showConfig(); return; }

  setSyncStatus('syncing', 'Salvando...');
  document.getElementById('btn-salvar').disabled = true;

  const payload = { _version: 1, _savedAt: new Date().toISOString(), ...state };
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
  const body    = {
    message: `dados: ${new Date().toLocaleString('pt-BR')}`,
    content,
    branch: GH_BRANCH,
  };
  if (ghFileSha) body.sha = ghFileSha;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_FILE}`,
      {
        method: 'PUT',
        headers: {
          Authorization:  `token ${token}`,
          Accept:         'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    ghFileSha  = json.content.sha;
    markSaved();
    toast('✓ Dados salvos no GitHub!');

  } catch (err) {
    setSyncStatus('error', 'Erro ao salvar');
    toast('⚠ Erro: ' + err.message);
  } finally {
    document.getElementById('btn-salvar').disabled = false;
  }
}

// Exporta backup local em JSON
function exportJSONBackup() {
  const data = { _version: 1, _exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `meufinanceiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Backup exportado!');
}

/* ================================================================
   NAVEGAÇÃO
================================================================ */

function showPage(p, btn) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  if (btn) btn.classList.add('active');
  reRenderActive();
}

function switchTab(t, btn) {
  document.getElementById('tab-fixas').style.display     = t === 'fixas'     ? 'block' : 'none';
  document.getElementById('tab-variaveis').style.display = t === 'variaveis' ? 'block' : 'none';
  document.querySelectorAll('.inner-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// Re-renderiza a página ativa (chamado após load, resize, etc.)
function reRenderActive() {
  const pid = (document.querySelector('.page.active') || {}).id?.replace('page-', '');
  const renders = {
    dashboard: renderDash,
    receitas:  renderReceitas,
    despesas:  renderDespesas,
    parcelas:  renderParcelas,
    gastos:    renderGastos,
    economias: renderEconomias,
    previsao:  renderPrevisao,
  };
  if (pid && renders[pid]) renders[pid]();
  // Botão flutuante só aparece na aba gastos
  const btn = document.getElementById('btn-novo-gasto');
  if (btn) btn.style.display = pid === 'gastos' ? 'flex' : 'none';
}

// Abre / fecha formulários
function closeForm(id) {
  document.getElementById(id).style.display = 'none';
  clearForm(id);
}

function clearForm(id) {
  document.getElementById(id).querySelectorAll('input,select').forEach(el => {
    if      (el.type === 'hidden' || el.type === 'file') el.value   = '';
    else if (el.type === 'checkbox')                     el.checked  = false;
    else                                                 el.value   = '';
  });
}

/* ================================================================
   CÁLCULOS — LÓGICA DE PERÍODOS

   REGRAS CENTRAIS:
   ─────────────────────────────────────────────────────────────────
   1. RECEITA incide no mês M se:
      inicio <= último dia de M  E  fim >= primeiro dia de M

   2. DESPESA FIXA incide no mês M se:
      inicio <= último dia de M  E  (fim vazio OU fim >= primeiro dia de M)

   3. DESPESA VARIÁVEL (parcelada) incide no mês M se:
      - Mês de início da parcela = mês de v.inicio
      - Última parcela = mês de v.inicio + (v.parcelas - 1) meses
      - Logo: incide se  mêsInicio <= M <= mêsInicio + (parcelas - 1)
      Exemplo: inicio = março/2026, parcelas = 2, faltam = 2
        → parcela 1 = março, parcela 2 = abril. Termina em abril.

   4. SOBRA = Receita(M) − FixasPeriodo(M) − VariáveisPeriodo(M)
================================================================ */

// Retorna o último dia do mês (Date)
function ultimoDia(m, y) {
  return new Date(y, m + 1, 0);
}

// Retorna o primeiro dia do mês (Date)
function primeiroDia(m, y) {
  return new Date(y, m, 1);
}

// Verifica se inicio/fim incide no mês M/Y
// IMPORTANTE: usa parseLocalDate para evitar o bug de timezone do JS.
// new Date('2026-04-01') interpreta como UTC e em fuso BR vira 31/03 às 21h,
// fazendo comparações de datas falharem. parseLocalDate força hora local.
function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d); // mês 0-indexed, sem conversão UTC
}

function incideNoMes(inicioStr, fimStr, m, y) {
  const d1 = primeiroDia(m, y);
  const d2 = ultimoDia(m, y);
  const s  = parseLocalDate(inicioStr);
  const e  = fimStr ? parseLocalDate(fimStr) : new Date(2099, 11, 31);
  return s <= d2 && e >= d1;
}

// Parcelas restantes de uma variável no mês M/Y
// Usa inicio + parcelas diretamente — sem depender de nenhum mês de referência fixo.
// Retorna > 0 se o mês M ainda está dentro da janela de parcelas.
function parcelasRestantesEm(v, m, y) {
  // Agora pegamos o início real considerando o fechamento do cartão
  const inicioReal = getMesCobranca(v.inicio, v.pag);
  if (!inicioReal) return 0;
  
  const inicioAbs = inicioReal.y * 12 + inicioReal.m;
  const mAbs      = y * 12 + m;
  const jaPassaram = mAbs - inicioAbs;
  
  if (jaPassaram < 0) return 0; // Ainda não chegou na fatura
  return v.parcelas - jaPassaram;
}

// Janeiro (0) e Fevereiro (1) de 2026 são zerados — controle começa em março
const MESES_ZERADOS = { ano: 2026, meses: [0, 1] };
function mesZerado(m, y) {
  return y === MESES_ZERADOS.ano && MESES_ZERADOS.meses.includes(m);
}

// Soma das RECEITAS que incidem no mês M/Y
function getReceitaMes(m, y) {
  if (mesZerado(m, y)) return 0;
  return state.receitas
    .filter(r => incideNoMes(r.inicio, r.fim, m, y))
    .reduce((acc, r) => acc + r.valor, 0);
}

// Soma das DESPESAS FIXAS que incidem no mês M/Y
function getDespesaFixaMes(m, y) {
  if (mesZerado(m, y)) return 0;
  return state.fixas
    .filter(f => incideNoMes(f.inicio, f.fim, m, y))
    .reduce((acc, f) => {
      const real = gastoRealCat(f.cat, m, y);
      return acc + (real > 0 ? real : f.limite);
    }, 0);
}

// Soma das DESPESAS VARIÁVEIS que incidem no mês M/Y
function getDespesaVariavelMes(m, y) {
  if (mesZerado(m, y)) return 0;
  return state.variaveis
    .filter(v => parcelasRestantesEm(v, m, y) > 0)
    .reduce((acc, v) => acc + v.mensal, 0);
}

// Sobra = receita − fixas − variáveis
function getSaldoMes(m, y) {
  if (mesZerado(m, y)) return 0;
  return getReceitaMes(m, y) - getDespesaFixaMes(m, y) - getDespesaVariavelMes(m, y);
}

function getMesCobranca(dataStr, pagId) {
  const d = parseLocalDate(dataStr);
  if (!d) return null;

  const fech = state.fechamentos ? parseInt(state.fechamentos[pagId]) : NaN;
  
  // Se não tem data de fechamento configurada, fica no mês real da compra
  if (!fech || isNaN(fech)) return { m: d.getMonth(), y: d.getFullYear() };

  // 1. Descobre o mês em que a fatura efetivamente FECHA
  let mFech = d.getMonth();
  let yFech = d.getFullYear();

  // Se passou do dia de fechamento, cai na fatura que fecha no mês seguinte
  if (d.getDate() > fech) {
    mFech++;
    if (mFech > 11) {
      mFech = 0;
      yFech++;
    }
  }

  // 2. ALINHAMENTO COM O SALÁRIO (A Mágica)
  // Se o cartão fecha no início do mês (dia 15 ou antes, como o seu dia 5), 
  // ele vence nesse mesmo mês e é pago com o salário do mês ANTERIOR.
  // Então, subtraímos 1 mês para ele aparecer no painel correto (ex: Maio -> Abril).
  if (fech <= 15) {
    mFech--;
    if (mFech < 0) {
      mFech = 11;
      yFech--;
    }
  }

  return { m: mFech, y: yFech };
}

// Gastos filtrados pelo mês de COBRANÇA (usado no orçamento/budget cards)
function gastosCobrancaMes(m, y) {
  if (!state.gastos) return [];
  return state.gastos.filter(g => {
    const mc = getMesCobranca(g.data, g.pag);
    if (mc) return mc.m === m && mc.y === y;
    const d = parseLocalDate(g.data);
    return d && d.getFullYear() === y && d.getMonth() === m;
  });
}

// Valor real gasto em uma categoria num mês (por cobrança)
function gastoRealCat(catId, m, y) {
  return gastosCobrancaMes(m, y)
    .filter(g => g.cat === catId || getCatNome(g.cat) === getCatNome(catId))
    .reduce((a, g) => a + g.valor, 0);
}

/* ================================================================
   DASHBOARD
================================================================ */
function renderDash() {
  const m = parseInt(document.getElementById('dash-mes').value);
  const y     = parseInt(document.getElementById('dash-ano').value);
  const zero  = mesZerado(m, y);

  const rec   = getReceitaMes(m, y);
  const fix   = getDespesaFixaMes(m, y);
  const vari  = getDespesaVariavelMes(m, y);
  const saldo = getSaldoMes(m, y);

  // Métricas
  document.getElementById('dash-metrics').innerHTML = `
    <div class="metric">
      <div class="metric-label">Receita do mês</div>
      <div class="metric-value ${zero ? 'mv-amber' : 'mv-green'}">${zero ? '—' : fmt(rec)}</div>
      <div class="metric-sub">${MESES[m]} ${y}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Despesas fixas</div>
      <div class="metric-value ${zero ? 'mv-amber' : 'mv-red'}">${zero ? '—' : fmt(fix)}</div>
      <div class="metric-sub">${zero ? 'mês não contabilizado' : 'vigentes no mês'}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Despesas variáveis</div>
      <div class="metric-value ${zero ? 'mv-amber' : 'mv-amber'}">${zero ? '—' : fmt(vari)}</div>
      <div class="metric-sub">${zero ? 'mês não contabilizado' : 'parcelas ativas'}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Sobra do mês</div>
      <div class="metric-value ${zero ? 'mv-amber' : saldo >= 0 ? 'mv-green' : 'mv-red'}">${zero ? 'R$ 0,00' : fmt(saldo)}</div>
      <div class="metric-sub">${zero ? 'controle começa em março' : saldo >= 0 ? 'Para economizar ✓' : 'Despesas > receita'}</div>
    </div>
  `;

  // Alertas
  const icons  = { danger:'⚠', warn:'⚡', info:'ℹ', success:'✓' };
  const alerts = [];

  if (zero) {
    alerts.push({ t: 'info', msg: `${MESES[m]} é um mês anterior ao início do controle — todos os valores estão zerados. O controle começa em março de ${y}.` });
  } else {
    // Alertas de fechamento de fatura
    const hoje = new Date();
    if (hoje.getMonth() === m && hoje.getFullYear() === y && state.fechamentos) {
      Object.entries(state.fechamentos).forEach(([cidStr, fech]) => {
        const cid = parseInt(cidStr);
        const diasRest = fech - hoje.getDate();
        
        if (diasRest >= 0 && diasRest <= 10) { // Expandido para avisar com 10 dias de antecedência
          // Pega gastos avulsos da fatura
          const gAvulsos = (state.gastos || [])
            .filter(g => g.pag === cid)
            .filter(g => {
               const mc = getMesCobranca(g.data, g.pag);
               return mc && mc.m === m && mc.y === y;
            }).reduce((a, g) => a + g.valor, 0);

          // Pega parcelas ativas caindo nesta fatura
          const gVar = (state.variaveis || [])
            .filter(v => v.pag === cid && parcelasRestantesEm(v, m, y) > 0)
            .reduce((a, v) => a + v.mensal, 0);

          const totalCartao = gAvulsos + gVar;

          if (totalCartao > 0) {
            const nd = diasRest === 0 ? 'hoje' : diasRest === 1 ? 'amanhã' : `em ${diasRest} dias`;
            alerts.push({ t: diasRest <= 2 ? 'danger' : 'warn', msg: `💳 Fatura ${getPagNome(cid)} fecha ${nd} — Valor: ${fmt(totalCartao)}` });
          }
        }
      });
    }
    if (saldo < 0)
      alerts.push({ t: 'danger', msg: `Despesas superam a receita em ${fmt(Math.abs(saldo))} em ${MESES[m]}.` });

    const overBudget = state.fixas.filter(f => incideNoMes(f.inicio, f.fim, m, y) && f.valor > f.limite && f.limite > 0);
    if (overBudget.length)
      alerts.push({ t: 'warn', msg: `${overBudget.length} despesa(s) estouraram o limite: ${overBudget.map(f => escHtml(f.desc)).join(', ')}.` });

    if (rec > 0) {
      const pct = Math.round((fix + vari) / rec * 100);
      if (pct > 85)
        alerts.push({ t: 'warn', msg: `${pct}% da renda comprometida este mês.` });
    }
  }

  document.getElementById('dash-alerts').innerHTML = alerts
    .map(a => `<div class="alert alert-${a.t}"><span class="alert-icon">${icons[a.t]}</span><span>${a.msg}</span></div>`)
    .join('');

  // Gráfico de categorias (doughnut) — usa getCatNome para traduzir ID → nome
  const isMobile = window.innerWidth <= 430;
  const catT = {};
  if (!zero) {
    state.fixas   .filter(f => incideNoMes(f.inicio, f.fim, m, y))
                  .forEach(f => { const k = getCatNome(f.cat); catT[k] = (catT[k] || 0) + f.valor; });
    state.variaveis.filter(v => parcelasRestantesEm(v, m, y) > 0)
                  .forEach(v => { const k = getCatNome(v.cat); catT[k] = (catT[k] || 0) + v.mensal; });
  }
  const catE = Object.entries(catT).sort((a, b) => b[1] - a[1]);

  document.getElementById('chart-cat-wrap').style.height = isMobile ? '280px' : '220px';
  destroyChart('chartCat');
  charts.chartCat = new Chart(document.getElementById('chartCat'), {
    type: 'doughnut',
    data: {
      labels:   catE.map(c => c[0]),
      datasets: [{
        data:            catE.map(c => Math.round(c[1])),
        backgroundColor: catE.map(c => CAT_COLORS[c[0]] || '#888'),
        borderWidth: 2,
        borderColor: 'transparent',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: isMobile ? 'bottom' : 'right',
          labels: { boxWidth: 10, font: { size: 10 }, padding: isMobile ? 6 : 8 },
        },
      },
    },
  });

  // Gráfico de sobra acumulada no ano
  let acc = 0;
  const saldosAno = MESES.map((_, i) => {
    acc += getSaldoMes(i, y);
    return Math.round(acc);
  });

  destroyChart('chartSaldo');
  charts.chartSaldo = new Chart(document.getElementById('chartSaldo'), {
    type: 'bar',
    data: {
      labels:   MESES.map(mes => mes.slice(0, 3)),
      datasets: [{
        data:            saldosAno,
        backgroundColor: saldosAno.map(s => s >= 0 ? 'rgba(29,158,117,.5)' : 'rgba(226,75,74,.4)'),
        borderColor:     saldosAno.map(s => s >= 0 ? '#1D9E75' : '#E24B4A'),
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  // Gráfico de pagamentos — usa getPagNome para traduzir ID → nome
  const payT = {};
  if (!zero) {
    state.fixas   .filter(f => incideNoMes(f.inicio, f.fim, m, y))
                  .forEach(f => { const k = getPagNome(f.pag); payT[k] = (payT[k] || 0) + f.valor; });
    state.variaveis.filter(v => parcelasRestantesEm(v, m, y) > 0)
                  .forEach(v => { const k = getPagNome(v.pag); payT[k] = (payT[k] || 0) + v.mensal; });
  }
  const payE = Object.entries(payT).sort((a, b) => b[1] - a[1]);

  destroyChart('chartPay');
  charts.chartPay = new Chart(document.getElementById('chartPay'), {
    type: 'bar',
    data: {
      labels:   payE.map(p => p[0].replace('Conta Corrente ', 'CC ')),
      datasets: [{
        data:            payE.map(p => Math.round(p[1])),
        backgroundColor: payE.map(p => PAY_COLORS[p[0]] || '#888'),
        borderWidth: 0,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        y: { ticks: { font: { size: 11 } } },
      },
    },
  });
}

/* ================================================================
   RECEITAS
================================================================ */
function renderReceitas() {
  const tb     = document.getElementById('tbody-receitas');
  const sorted = [...state.receitas].sort((a, b) => a.inicio.localeCompare(b.inicio));

  if (!sorted.length) {
    tb.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="es-icon">💵</div><p>Nenhuma receita cadastrada</p></div></td></tr>';
    return;
  }

  tb.innerHTML = sorted.map(r => `
    <tr>
      <td style="font-weight:600">${escHtml(r.desc)}</td>
      <td style="color:var(--green);font-weight:700">${fmt(r.valor)}</td>
      <td style="color:var(--text-t);font-size:12px">${fmtDate(r.inicio)}</td>
      <td style="color:var(--text-t);font-size:12px">${fmtDate(r.fim)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs"  onclick="editReceita(${r.id})">Editar</button>
          <button class="btn btn-danger btn-xs" onclick="delReceita(${r.id})">Remover</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openFormReceita() {
  document.getElementById('form-receita-title').textContent = 'Nova receita';
  document.getElementById('r-id').value = '';
  document.getElementById('form-receita').style.display = 'block';
  document.getElementById('form-receita').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function editReceita(id) {
  const r = state.receitas.find(r => r.id === id);
  if (!r) return;
  document.getElementById('r-desc').value  = r.desc;
  document.getElementById('r-valor').value = r.valor;
  document.getElementById('r-inicio').value = r.inicio;
  document.getElementById('r-fim').value    = r.fim;
  document.getElementById('r-id').value     = r.id;
  document.getElementById('form-receita-title').textContent = 'Editar receita';
  document.getElementById('form-receita').style.display = 'block';
  document.getElementById('form-receita').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveReceita() {
  const desc  = document.getElementById('r-desc').value.trim();
  const valor = parseFloat(document.getElementById('r-valor').value) || 0;
  if (!desc || !valor) { toast('⚠ Preencha descrição e valor.'); return; }

  const obj = {
    desc,
    valor,
    inicio: document.getElementById('r-inicio').value,
    fim:    document.getElementById('r-fim').value,
  };
  const id = document.getElementById('r-id').value;

  if (id) {
    const i = state.receitas.findIndex(r => r.id == id);
    if (i >= 0) state.receitas[i] = { ...state.receitas[i], ...obj };
  } else {
    state.receitas.push({ id: uid(), ...obj });
  }

  closeForm('form-receita');
  renderReceitas();
  markUnsaved();
  toast('Receita salva!');
}

function delReceita(id) {
  if (!confirm('Remover esta receita?')) return;
  state.receitas = state.receitas.filter(r => r.id !== id);
  renderReceitas();
  markUnsaved();
  toast('Receita removida.');
}

/* ================================================================
   DESPESAS FIXAS
================================================================ */
function renderDespesas() {
  // Lê o mês selecionado no Dashboard para filtrar corretamente
  const m = parseInt(document.getElementById('dash-mes').value);
  const y = parseInt(document.getElementById('dash-ano').value);

  // ── Fixas ──
  const tbF     = document.getElementById('tbody-fixas');
  const sortedF = [...state.fixas].sort((a, b) => a.inicio.localeCompare(b.inicio));

  if (!sortedF.length) {
    tbF.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="es-icon">📋</div><p>Nenhuma despesa fixa</p></div></td></tr>';
  } else {
    // Totais calculados APENAS para o mês selecionado (respeitando inicio/fim)
    const totalGastoMes  = getDespesaFixaMes(m, y);
    const totalLimiteMes = sortedF
      .filter(f => incideNoMes(f.inicio, f.fim, m, y))
      .reduce((acc, f) => acc + f.limite, 0);

    tbF.innerHTML = sortedF.map(f => {
      const diff   = f.limite - f.valor;
      const pct    = f.limite > 0 ? Math.min(100, Math.round(f.valor / f.limite * 100)) : 0;
      const ativa  = incideNoMes(f.inicio, f.fim, m, y);
      const status = !ativa
        ? '<span class="badge badge-neutral">Fora do período</span>'
        : f.valor === 0
          ? '<span class="badge badge-neutral">Não usado</span>'
          : diff < 0
            ? `<span class="badge badge-over">Estourou ${fmt(Math.abs(diff))}</span>`
            : '<span class="badge badge-ok">OK</span>';

      return `
        <tr style="${!ativa ? 'opacity:.45' : ''}">
          <td style="font-weight:600">${escHtml(f.desc)}</td>
          <td>${catWrap(f.cat)}</td>
          <td>${fmt(f.limite)}</td>
          <td>
            <span style="font-weight:700">${fmt(f.valor)}</span>
            <div class="prog-bar">
              <div class="prog-fill" style="width:${pct}%;background:${diff < 0 ? '#E24B4A' : '#1D9E75'}"></div>
            </div>
            <div class="prog-labels"><span>${pct}%</span><span>${fmt(f.limite)}</span></div>
          </td>
          <td>${status}</td>
          <td>${payTag(f.pag)}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-xs"  onclick="editFixa(${f.id})">Editar</button>
              <button class="btn btn-danger btn-xs" onclick="delFixa(${f.id})">Rem.</button>
            </div>
          </td>
        </tr>
      `;
    }).join('') + `
      <tr style="background:var(--bg3);border-top:2px solid var(--border-s)">
        <td colspan="2" style="font-weight:700;padding:10px">Total ${MESES[m]}</td>
        <td style="font-weight:600;color:var(--text-s)">${fmt(totalLimiteMes)}</td>
        <td style="font-weight:700;color:var(--red)">${fmt(totalGastoMes)}</td>
        <td colspan="3" style="font-size:11px;color:var(--text-t)">Apenas despesas vigentes em ${MESES[m]}</td>
      </tr>
    `;
  }

  // ── Variáveis ──
  const tbV     = document.getElementById('tbody-variaveis');
  const sortedV = [...state.variaveis].sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Total ativo no mês selecionado (apenas parcelas que incidem em M/Y)
  const totMensalMes = getDespesaVariavelMes(m, y);
  // Total restante global (quanto ainda falta pagar de todas as parcelas)
  const totRestGlobal = sortedV.reduce((acc, v) => acc + v.mensal * v.faltam, 0);

  if (!sortedV.length) {
    tbV.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="es-icon">🛒</div><p>Nenhuma compra cadastrada</p></div></td></tr>';
  } else {
    tbV.innerHTML = sortedV.map(v => {
      const ativaNoMes = parcelasRestantesEm(v, m, y) > 0 && parseLocalDate(v.inicio) <= ultimoDia(m, y);
      return `
        <tr style="${!ativaNoMes ? 'opacity:.45' : ''}">
          <td style="font-weight:600">${escHtml(v.nome)}</td>
          <td>${catWrap(v.cat)}</td>
          <td>${fmt(v.total)}</td>
          <td style="font-weight:700">${fmt(v.mensal)}</td>
          <td style="color:var(--text-s)">${v.parcelas}x</td>
          <td>
            <span style="color:${v.faltam > 6 ? 'var(--red)' : v.faltam > 3 ? 'var(--amber)' : 'var(--green)'};font-weight:700">
              ${v.faltam}
            </span>
          </td>
          <td>${payTag(v.pag)}</td>
          <td><span class="badge ${v.pago ? 'badge-pago' : 'badge-nao'}">${v.pago ? 'SIM' : 'NÃO'}</span></td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-xs"   onclick="editVariavel(${v.id})">Ed.</button>
              <button class="btn ${v.pago ? 'btn-ghost' : 'btn-success'} btn-xs" onclick="togglePago(${v.id})">
                ${v.pago ? 'Despagar' : 'Pagar'}
              </button>
              <button class="btn btn-danger btn-xs" onclick="delVariavel(${v.id})">Rem.</button>
            </div>
          </td>
        </tr>
      `;
    }).join('') + `
      <tr style="background:var(--bg3);border-top:2px solid var(--border-s)">
        <td colspan="3" style="font-weight:700;padding:10px">Impacto em ${MESES[m]}</td>
        <td style="font-weight:700;color:var(--red)">${fmt(totMensalMes)}</td>
        <td colspan="2" style="font-size:11px;color:var(--text-t)">Dívida total restante:</td>
        <td colspan="3" style="font-weight:700;color:var(--amber)">${fmt(totRestGlobal)}</td>
      </tr>
    `;
  }
}

function openFormFixa() {
  document.getElementById('form-fixa-title').textContent = 'Nova despesa fixa';
  document.getElementById('f-id').value = '';
  document.getElementById('form-fixa').style.display = 'block';
  document.getElementById('form-fixa').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function editFixa(id) {
  const f = state.fixas.find(f => f.id === id);
  if (!f) return;
  document.getElementById('f-desc').value   = f.desc;
  document.getElementById('f-limite').value = f.limite;
  document.getElementById('f-valor').value  = f.valor;
  document.getElementById('f-inicio').value = f.inicio || '';
  document.getElementById('f-fim').value    = f.fim    || '';
  document.getElementById('f-id').value     = f.id;

  // Popula o select de categoria: tenta por valor numérico, depois por texto
  const fCat = document.getElementById('f-cat');
  const catNome = getCatNome(f.cat);
  const catOpt  = Array.from(fCat.options).find(o => o.value == f.cat || o.text === catNome);
  if (catOpt) fCat.value = catOpt.value;

  // Popula o select de pagamento: tenta por valor numérico, depois por texto
  const fPag = document.getElementById('f-pag');
  const pagNome = getPagNome(f.pag);
  const pagOpt  = Array.from(fPag.options).find(o => o.value == f.pag || o.text === pagNome);
  if (pagOpt) fPag.value = pagOpt.value;

  document.getElementById('form-fixa-title').textContent = 'Editar despesa fixa';
  document.getElementById('form-fixa').style.display = 'block';
  document.getElementById('form-fixa').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveFixa() {
  const desc = document.getElementById('f-desc').value.trim();
  if (!desc) { toast('⚠ Preencha a descrição.'); return; }

  // Salva como número (ID do enum). Retrocompat: se não for numérico, salva string.
  const catRaw = document.getElementById('f-cat').value;
  const pagRaw = document.getElementById('f-pag').value;

  const obj = {
    desc,
    cat:    parseInt(catRaw) || catRaw,
    limite: parseFloat(document.getElementById('f-limite').value) || 0,
    valor:  parseFloat(document.getElementById('f-valor').value)  || 0,
    pag:    parseInt(pagRaw) || pagRaw,
    inicio: document.getElementById('f-inicio').value,
    fim:    document.getElementById('f-fim').value,
  };
  const id = document.getElementById('f-id').value;

  if (id) {
    const i = state.fixas.findIndex(f => f.id == id);
    if (i >= 0) state.fixas[i] = { ...state.fixas[i], ...obj };
  } else {
    state.fixas.push({ id: uid(), ...obj });
  }

  closeForm('form-fixa');
  renderDespesas();
  markUnsaved();
  toast('Despesa fixa salva!');
}

function delFixa(id) {
  if (!confirm('Remover?')) return;
  state.fixas = state.fixas.filter(f => f.id !== id);
  renderDespesas();
  markUnsaved();
  toast('Removido.');
}

/* ================================================================
   DESPESAS VARIÁVEIS / PARCELADAS
================================================================ */
function calcParcela() {
  const t = parseFloat(document.getElementById('v-total').value)    || 0;
  const p = parseInt(document.getElementById('v-parcelas').value)   || 1;
  if (t && p) document.getElementById('v-mensal').value = Math.round(t / p * 100) / 100;
}

function openFormVariavel() {
  document.getElementById('form-variavel-title').textContent = 'Nova compra / parcela';
  document.getElementById('v-id').value = '';
  document.getElementById('form-variavel').style.display = 'block';
  document.getElementById('form-variavel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function editVariavel(id) {
  const v = state.variaveis.find(v => v.id === id);
  if (!v) return;
  document.getElementById('v-nome').value     = v.nome;
  document.getElementById('v-total').value    = v.total;
  document.getElementById('v-mensal').value   = v.mensal;
  document.getElementById('v-parcelas').value = v.parcelas;
  document.getElementById('v-faltam').value   = v.faltam;
  document.getElementById('v-inicio').value   = v.inicio || '';
  document.getElementById('v-pago').checked   = v.pago;
  document.getElementById('v-id').value       = v.id;

  // Popula o select de categoria: tenta por valor numérico, depois por texto
  const vCat = document.getElementById('v-cat');
  const catNome = getCatNome(v.cat);
  const catOpt  = Array.from(vCat.options).find(o => o.value == v.cat || o.text === catNome);
  if (catOpt) vCat.value = catOpt.value;

  // Popula o select de pagamento: tenta por valor numérico, depois por texto
  const vPag = document.getElementById('v-pag');
  const pagNome = getPagNome(v.pag);
  const pagOpt  = Array.from(vPag.options).find(o => o.value == v.pag || o.text === pagNome);
  if (pagOpt) vPag.value = pagOpt.value;

  document.getElementById('form-variavel-title').textContent = 'Editar compra/parcela';
  document.getElementById('form-variavel').style.display = 'block';
  document.getElementById('form-variavel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveVariavel() {
  const nome = document.getElementById('v-nome').value.trim();
  if (!nome) { toast('⚠ Preencha o nome.'); return; }

  // Salva como número (ID do enum). Retrocompat: se não for numérico, salva string.
  const catRaw = document.getElementById('v-cat').value;
  const pagRaw = document.getElementById('v-pag').value;

  const obj = {
    nome,
    cat:      parseInt(catRaw) || catRaw,
    total:    parseFloat(document.getElementById('v-total').value)    || 0,
    mensal:   parseFloat(document.getElementById('v-mensal').value)   || 0,
    parcelas: parseInt(document.getElementById('v-parcelas').value)   || 1,
    faltam:   parseInt(document.getElementById('v-faltam').value)     || 0,
    pag:      parseInt(pagRaw) || pagRaw,
    inicio:   document.getElementById('v-inicio').value,
    pago:     document.getElementById('v-pago').checked,
  };
  const id = document.getElementById('v-id').value;

  if (id) {
    const i = state.variaveis.findIndex(v => v.id == id);
    if (i >= 0) state.variaveis[i] = { ...state.variaveis[i], ...obj };
  } else {
    state.variaveis.push({ id: uid(), ...obj });
  }

  closeForm('form-variavel');
  renderDespesas();
  markUnsaved();
  toast('Compra/parcela salva!');
}

function togglePago(id) {
  const v = state.variaveis.find(v => v.id === id);
  if (!v) return;

  if (!v.pago) {
    v.pago   = true;
    v.faltam = Math.max(0, v.faltam - 1);
    toast(`✓ Pago! Faltam ${v.faltam} parcelas.`);
  } else {
    v.pago   = false;
    v.faltam = Math.min(v.parcelas, v.faltam + 1);
    toast('Marcado como não pago.');
  }

  renderDespesas();
  markUnsaved();
}

function delVariavel(id) {
  if (!confirm('Remover?')) return;
  state.variaveis = state.variaveis.filter(v => v.id !== id);
  renderDespesas();
  markUnsaved();
  toast('Removido.');
}

/* ================================================================
   PARCELAS
================================================================ */
function renderParcelas() {
  // Lê o mês selecionado no Dashboard
  const m = parseInt(document.getElementById('dash-mes').value);
  const y = parseInt(document.getElementById('dash-ano').value);

  // Parcelas que ainda têm saldo a partir do mês selecionado
  const ativas = state.variaveis
    .filter(v => parcelasRestantesEm(v, m, y) > 0 && parseLocalDate(v.inicio) <= ultimoDia(m, y))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));

  // Comprometimento = o que realmente cai no mês selecionado
  const totMensalMes = getDespesaVariavelMes(m, y);
  const totRestGlobal = ativas.reduce((acc, v) => acc + v.mensal * v.faltam, 0);
  const maxP = ativas.length ? Math.max(...ativas.map(v => v.faltam)) : 0;

  document.getElementById('metrics-parcelas').innerHTML = `
    <div class="metric">
      <div class="metric-label">Comprometimento em ${MESES[m]}</div>
      <div class="metric-value mv-red">${fmt(totMensalMes)}</div>
      <div class="metric-sub">${ativas.length} parcelas ativas</div>
    </div>
    <div class="metric">
      <div class="metric-label">Total restante</div>
      <div class="metric-value mv-amber">${fmt(totRestGlobal)}</div>
      <div class="metric-sub">dívida acumulada</div>
    </div>
    <div class="metric">
      <div class="metric-label">Prazo mais longo</div>
      <div class="metric-value mv-blue">${maxP} meses</div>
    </div>
  `;

  document.getElementById('tbody-parcelas').innerHTML = ativas.length
    ? ativas.map(v => {
        const fim = parseLocalDate(v.inicio);
        fim.setMonth(fim.getMonth() + v.parcelas);
        return `
          <tr>
            <td style="font-weight:600">${escHtml(v.nome)}</td>
            <td>${payTag(v.pag)}</td>
            <td style="font-weight:700">${fmt(v.mensal)}</td>
            <td>
              <span style="color:${v.faltam <= 2 ? 'var(--amber)' : 'var(--text)'};font-weight:${v.faltam <= 2 ? 700 : 400}">
                ${v.faltam}x
              </span>
            </td>
            <td>${fmt(v.mensal * v.faltam)}</td>
            <td style="font-size:12px;color:var(--text-t)">
              ${fim.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })}
            </td>
            <td>
              ${v.faltam <= 2
                ? '<span class="badge badge-warn">Quase acabando</span>'
                : '<span class="badge badge-neutral">Em andamento</span>'}
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7"><div class="empty-state"><div class="es-icon">🎉</div><p>Nenhuma parcela ativa em ' + MESES[m] + '!</p></div></td></tr>';

  // Gráfico: comprometimento por cartão (parcelas ativas no mês)
  const cartT = {};
  ativas.forEach(v => {
    const nomePag = getPagNome(v.pag);
    cartT[nomePag] = (cartT[nomePag] || 0) + v.mensal;
  });
  const cE = Object.entries(cartT).sort((a, b) => b[1] - a[1]);

  destroyChart('chartCartoes');
  if (cE.length) {
    charts.chartCartoes = new Chart(document.getElementById('chartCartoes'), {
      type: 'bar',
      data: {
        labels:   cE.map(k => k[0].replace('Conta Corrente ', 'CC ')),
        datasets: [{
          data:            cE.map(k => Math.round(k[1])),
          backgroundColor: cE.map(k => PAY_COLORS[k[0]] || '#888'),
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { callback: v => fmt(v), font: { size: 10 } } },
          y: { ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  // Gráfico: liberação por mês (quando cada parcela termina)
  const libT = {};
  ativas.forEach(v => {
    const fim = parseLocalDate(v.inicio);
    fim.setMonth(fim.getMonth() + v.parcelas);
    const key = MESES[fim.getMonth()].slice(0, 3) + '/' + String(fim.getFullYear()).slice(-2);
    libT[key] = (libT[key] || 0) + v.mensal;
  });
  const lE = Object.entries(libT).sort();

  destroyChart('chartLiberacao');
  if (lE.length) {
    charts.chartLiberacao = new Chart(document.getElementById('chartLiberacao'), {
      type: 'bar',
      data: {
        labels:   lE.map(k => k[0]),
        datasets: [{
          label: 'Valor liberado',
          data:  lE.map(k => Math.round(k[1])),
          backgroundColor: 'rgba(29,158,117,.4)',
          borderColor:     '#1D9E75',
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
          x: { ticks: { font: { size: 10 } } },
        },
      },
    });
  }
}

/* ================================================================
   ECONOMIAS

   Lógica:
   - Sobra do Mês  = receita(M) − fixas_período(M) − variáveis_período(M)
   - Rendimento    = acumPoupança_anterior × taxa_mensal
   - Depósito      = valor fixo configurado (só incide nos meses com sobra)
   - acumPoupança  = acumPoupança_anterior + rendimento + depósito
   - acumCaixa     = soma das sobras mensais
   - Patrimônio    = acumCaixa + acumPoupança
================================================================ */
function calcEconomias(y) {
  const taxaCDI    = (parseFloat(document.getElementById('eco-taxa-cdi').value)    || 120) / 100;
  const saldoIni   = parseFloat(document.getElementById('eco-saldo-inicial').value)|| 0;

  // Taxa mensal equivalente: CDI_anual × percentual_CDI → mensal composto
  const CDI_ANUAL  = 0.105; // CDI referência ~10,5% a.a.
  const taxaMensal = Math.pow(1 + CDI_ANUAL * taxaCDI, 1 / 12) - 1;

  const rows       = [];
  let acumPoupanca = saldoIni;
  let acumCaixa    = 0;

  for (let m = 0; m < 12; m++) {
    const sobraMes = getSaldoMes(m, y);

    // Rendimento sobre o saldo atual antes do depósito
    const rendimento = acumPoupanca * taxaMensal;

    // Depósito = soma das despesas fixas com pagamento Poupança (pag === 6)
    // vigentes neste mês, respeitando inicio/fim de cada uma
    const depositoMes = mesZerado(m, y) ? 0 : state.fixas
      .filter(f => (f.pag === 6 || f.pag === 'Poupança') && incideNoMes(f.inicio, f.fim, m, y))
      .reduce((acc, f) => acc + f.valor, 0);

    acumPoupanca = acumPoupanca + rendimento + depositoMes;
    acumCaixa    += sobraMes;

    rows.push({
      mes:             MESES[m],
      sobraMes:        Math.round(sobraMes        * 100) / 100,
      deposito:        depositoMes,
      acumPoupanca:    Math.round(acumPoupanca    * 100) / 100,
      patrimonioTotal: Math.round((acumCaixa + acumPoupanca) * 100) / 100,
      rendimento:      Math.round(rendimento      * 100) / 100,
      acumCaixa:       Math.round(acumCaixa       * 100) / 100,
    });
  }

  return rows;
}

function renderEconomias() {
  const y    = parseInt(document.getElementById('eco-ano').value);
  const rows = calcEconomias(y);

  const totalRendimento = rows.reduce((acc, r) => acc + r.rendimento, 0);
  const patrimonioFinal = rows[rows.length - 1].patrimonioTotal;
  const totalSobras     = rows.reduce((acc, r) => acc + r.sobraMes, 0);
  const melhorMes       = rows.reduce((b, r) => r.sobraMes > b.sobraMes ? r : b, rows[0]);

  // Métricas
  document.getElementById('eco-metrics').innerHTML = `
    <div class="metric">
      <div class="metric-label">Patrimônio em dez/${String(y).slice(-2)}</div>
      <div class="metric-value ${patrimonioFinal >= 0 ? 'mv-green' : 'mv-red'}">${fmt(patrimonioFinal)}</div>
      <div class="metric-sub">caixa + poupança</div>
    </div>
    <div class="metric">
      <div class="metric-label">Acumulado poupança</div>
      <div class="metric-value mv-blue">${fmt(rows[rows.length - 1].acumPoupanca)}</div>
      <div class="metric-sub">com juros compostos</div>
    </div>
    <div class="metric">
      <div class="metric-label">Rendimento total</div>
      <div class="metric-value mv-amber">${fmt(totalRendimento)}</div>
      <div class="metric-sub">juros no ano</div>
    </div>
    <div class="metric">
      <div class="metric-label">Melhor mês</div>
      <div class="metric-value ${melhorMes.sobraMes >= 0 ? 'mv-green' : 'mv-red'}">${fmt(melhorMes.sobraMes)}</div>
      <div class="metric-sub">${melhorMes.mes}</div>
    </div>
  `;

  // Gráfico empilhado: poupança (vermelho) + caixa (azul)
  destroyChart('chartEcoBar');
  charts.chartEcoBar = new Chart(document.getElementById('chartEcoBar'), {
    type: 'bar',
    data: {
      labels: rows.map(r => r.mes.slice(0, 3)),
      datasets: [
        {
          label:           'Acumulado Poupança',
          data:            rows.map(r => Math.max(0, Math.round(r.acumPoupanca))),
          backgroundColor: 'rgba(226,75,74,.65)',
          borderColor:     '#E24B4A',
          borderWidth: 1.5, borderRadius: 3, stack: 'eco',
        },
        {
          label:           'Caixa Acumulado',
          data:            rows.map(r => Math.max(0, Math.round(r.acumCaixa))),
          backgroundColor: 'rgba(55,138,221,.65)',
          borderColor:     '#378ADD',
          borderWidth: 1.5, borderRadius: 3, stack: 'eco',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { font: { size: 10 } } },
        y: { stacked: true, min: 0, ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
      },
    },
  });

  // Gráfico linha: patrimônio total
  destroyChart('chartEcoPatrimonio');
  charts.chartEcoPatrimonio = new Chart(document.getElementById('chartEcoPatrimonio'), {
    type: 'line',
    data: {
      labels:   rows.map(r => r.mes.slice(0, 3)),
      datasets: [{
        label: 'Patrimônio Total',
        data:  rows.map(r => Math.round(r.patrimonioTotal)),
        borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,.12)',
        tension: 0.4, fill: true,
        pointRadius: 4, pointBackgroundColor: '#1D9E75', pointBorderColor: '#fff', pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  // Gráfico barras: rendimento mensal
  destroyChart('chartEcoRendimento');
  charts.chartEcoRendimento = new Chart(document.getElementById('chartEcoRendimento'), {
    type: 'bar',
    data: {
      labels:   rows.map(r => r.mes.slice(0, 3)),
      datasets: [{
        label: 'Rendimento (R$)',
        data:  rows.map(r => Math.round(r.rendimento * 100) / 100),
        backgroundColor: 'rgba(186,117,23,.55)',
        borderColor: '#BA7517',
        borderWidth: 1.5, borderRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, ticks: { callback: v => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  // Tabela detalhada
  document.getElementById('tbody-economias').innerHTML =
    rows.map((r, i) => `
      <tr style="${i % 2 === 1 ? 'background:var(--bg2)' : ''}">
        <td style="font-weight:600">${r.mes}</td>
        <td style="color:${r.sobraMes >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${fmt(r.sobraMes)}</td>
        <td style="color:var(--blue)">${fmt(r.deposito)}</td>
        <td style="color:var(--red);font-weight:600">${fmt(r.acumPoupanca)}</td>
        <td style="color:${r.patrimonioTotal >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${fmt(r.patrimonioTotal)}</td>
        <td style="color:var(--amber)">${fmt(r.rendimento)}</td>
      </tr>
    `).join('') + `
      <tr style="background:var(--bg3);border-top:2px solid var(--border-s)">
        <td style="font-weight:700">Total</td>
        <td style="font-weight:700;color:${totalSobras >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(totalSobras)}</td>
        <td style="font-weight:700;color:var(--blue)">${fmt(rows.reduce((a, r) => a + r.deposito, 0))}</td>
        <td style="color:var(--text-t)">—</td>
        <td style="font-weight:700;color:${patrimonioFinal >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(patrimonioFinal)}</td>
        <td style="font-weight:700;color:var(--amber)">${fmt(totalRendimento)}</td>
      </tr>
    `;
}

/* ================================================================
   PREVISÃO FINANCEIRA
================================================================ */
function renderPrevisao() {
  const now = new Date();
  const m0  = now.getMonth();
  const y0  = now.getFullYear();

  const labels    = [];
  const recs      = [];
  const desps     = [];
  const sobras    = [];
  const saldosAcc = [];
  let acc         = 0;

  for (let i = 0; i < 12; i++) {
    const m = (m0 + i) % 12;
    const y = y0 + Math.floor((m0 + i) / 12);

    const r     = getReceitaMes(m, y);
    const d     = getDespesaFixaMes(m, y) + getDespesaVariavelMes(m, y);
    const sobra = r - d;
    acc        += sobra;

    labels.push(MESES[m].slice(0, 3) + '/' + String(y).slice(-2));
    recs.push(Math.round(r));
    desps.push(Math.round(d));
    sobras.push(Math.round(sobra));
    saldosAcc.push(Math.round(acc));
  }

  // Gráfico linha: caixa acumulado
  destroyChart('chartPrevisao');
  charts.chartPrevisao = new Chart(document.getElementById('chartPrevisao'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Caixa acumulado',
        data:  saldosAcc,
        borderColor:     '#1D9E75',
        backgroundColor: 'rgba(29,158,117,.1)',
        tension: .4, fill: true,
        pointRadius:          4,
        pointBackgroundColor: saldosAcc.map(s => s >= 0 ? '#1D9E75' : '#E24B4A'),
        pointBorderColor:     '#fff',
        pointBorderWidth:     2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  // Gráfico barras: receita vs despesas
  destroyChart('chartRvsD');
  charts.chartRvsD = new Chart(document.getElementById('chartRvsD'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Receita',   data: recs,  backgroundColor: 'rgba(29,158,117,.45)', borderColor: '#1D9E75', borderWidth: 1.5, borderRadius: 3 },
        { label: 'Despesas',  data: desps, backgroundColor: 'rgba(226,75,74,.45)',  borderColor: '#E24B4A', borderWidth: 1.5, borderRadius: 3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: {
        y: { ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,.1)' } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });

  // Indicadores
  const recMed    = Math.round(recs.reduce((a, v) => a + v, 0)  / 12);
  const despMed   = Math.round(desps.reduce((a, v) => a + v, 0) / 12);
  const sobraMed  = recMed - despMed;
  const taxa      = recMed > 0 ? Math.round(sobraMed / recMed * 100) : 0;
  const comprP    = recMed > 0
    ? Math.round(state.variaveis.filter(v => v.faltam > 0).reduce((a, v) => a + v.mensal, 0) / recMed * 100)
    : 0;
  const saldoFinal = saldosAcc[saldosAcc.length - 1];

  document.getElementById('div-indicadores').innerHTML = `
    <div class="predict-block">
      <div class="predict-head">
        <span>Taxa de sobra média</span>
        <span style="color:${taxa >= 20 ? 'var(--green)' : 'var(--red)'}">${taxa}%</span>
      </div>
      <div class="prog-bar">
        <div class="prog-fill" style="width:${Math.max(0, Math.min(100, taxa))}%;background:${taxa >= 20 ? '#1D9E75' : '#E24B4A'}"></div>
      </div>
      <div class="prog-labels"><span>Meta: 20%</span><span>${taxa >= 20 ? '✓ Atingida' : 'Abaixo da meta'}</span></div>
    </div>
    <div class="predict-block">
      <div class="predict-head">
        <span>Renda em parcelas</span>
        <span style="color:${comprP > 30 ? 'var(--red)' : comprP > 20 ? 'var(--amber)' : 'var(--green)'}">${comprP}%</span>
      </div>
      <div class="prog-bar">
        <div class="prog-fill" style="width:${Math.min(100, comprP)}%;background:${comprP > 30 ? '#E24B4A' : comprP > 20 ? '#BA7517' : '#1D9E75'}"></div>
      </div>
      <div class="prog-labels"><span>Ideal: abaixo de 20%</span></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Receita média/mês</div>
        <div style="font-size:18px;font-weight:700;color:var(--green)">${fmt(recMed)}</div>
      </div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Despesa média/mês</div>
        <div style="font-size:18px;font-weight:700;color:var(--red)">${fmt(despMed)}</div>
      </div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Sobra média/mês</div>
        <div style="font-size:18px;font-weight:700;color:${sobraMed >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(sobraMed)}</div>
      </div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)">
        <div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Caixa em 12 meses</div>
        <div style="font-size:18px;font-weight:700;color:${saldoFinal >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(saldoFinal)}</div>
      </div>
    </div>
  `;

  // Alertas automáticos
  const melhorIdx       = sobras.indexOf(Math.max(...sobras));
  const piorIdx         = sobras.indexOf(Math.min(...sobras));
  const quaseAcab       = state.variaveis.filter(v => v.faltam > 0 && v.faltam <= 3);
  const mesesNegativos  = sobras.filter(s => s < 0).length;
  const icons = { danger:'⚠', warn:'⚡', info:'ℹ', success:'✓' };

  const analAlerts = [
    mesesNegativos > 0
      ? { t: 'danger',  msg: `${mesesNegativos} mês(es) com despesas maiores que a receita.` }
      : null,
    { t: 'info',    msg: `Melhor mês: <strong>${labels[melhorIdx]}</strong> — sobra de ${fmt(sobras[melhorIdx])}` },
    { t: sobras[piorIdx] < 0 ? 'danger' : 'warn',
      msg: `Mês mais apertado: <strong>${labels[piorIdx]}</strong> — ${fmt(sobras[piorIdx])}` },
    quaseAcab.length
      ? { t: 'success', msg: `${quaseAcab.length} parcela(s) terminam em até 3 meses — libera ${fmt(quaseAcab.reduce((a, v) => a + v.mensal, 0))}/mês.` }
      : null,
    saldoFinal > 0
      ? { t: 'success', msg: `Nesse ritmo, acumula ${fmt(saldoFinal)} em caixa nos próximos 12 meses.` }
      : { t: 'danger',  msg: `Nesse ritmo, o caixa ficará ${fmt(saldoFinal)} em 12 meses.` },
  ].filter(Boolean);

  document.getElementById('div-analise').innerHTML = analAlerts
    .map(a => `<div class="alert alert-${a.t}"><span class="alert-icon">${icons[a.t]}</span><span>${a.msg}</span></div>`)
    .join('');
}

/* ================================================================
   GASTOS — LANÇAMENTOS REAIS

   Estrutura de cada gasto:
     { id, cat (int enum), desc (string), valor (float),
       pag (int enum), data (string 'YYYY-MM-DD') }

   O orçamento de cada categoria vem das despesas fixas daquele mês
   (limite). O gasto real é a soma dos lançamentos do mês.
================================================================ */

// Garante que state.gastos existe (retrocompatibilidade com dados antigos)
function ensureGastos() {
  if (!state.gastos) state.gastos = [];
}

// Retorna os gastos do mês M/Y
function gastosDoMes(m, y) {
  ensureGastos();
  return state.gastos.filter(g => {
    const d = parseLocalDate(g.data);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

// Soma dos gastos de uma categoria no mês
function gastosCatMes(catId, m, y) {
  return gastosDoMes(m, y)
    .filter(g => g.cat === catId || getCatNome(g.cat) === getCatNome(catId))
    .reduce((acc, g) => acc + g.valor, 0);
}

/* ── RENDER ──────────────────────────────────────────────────── */
function renderGastos() {
  const m = parseInt(document.getElementById('g-mes').value);
  const y = parseInt(document.getElementById('g-ano').value);
  ensureGastos();

  // Lista exibe gastos pela DATA REAL do lançamento
  const gastosMes = gastosDoMes(m, y);
  // Orçamento usa gastos pelo MÊS DE COBRANÇA (considera fechamento)
  const gastosOrc = gastosCobrancaMes(m, y);

  const fixasVigentes = state.fixas.filter(f =>
    incideNoMes(f.inicio, f.fim, m, y) &&
    f.pag !== 6 && f.pag !== 'Poupança'
  );

  const orcamentoTotal = fixasVigentes.reduce((acc, f) => acc + f.limite, 0);
  const gastoTotal     = gastosOrc.reduce((acc, g) => acc + g.valor, 0);
  const saldoLivre     = orcamentoTotal - gastoTotal;

  const hoje      = new Date();
  const ultimoMes = new Date(y, m + 1, 0);
  const diasRest  = (hoje.getFullYear() === y && hoje.getMonth() === m)
      ? ultimoMes.getDate() - hoje.getDate()
      : (hoje < new Date(y, m, 1) ? ultimoMes.getDate() : 0);
  
  document.getElementById('g-metrics').innerHTML = `
    <div class="metric">
      <div class="metric-label">Orçamento total</div>
      <div class="metric-value mv-blue">${fmt(orcamentoTotal)}</div>
      <div class="metric-sub">${fixasVigentes.length} categorias</div>
    </div>
    <div class="metric">
      <div class="metric-label">Gasto real</div>
      <div class="metric-value ${gastoTotal > orcamentoTotal ? 'mv-red' : 'mv-amber'}">${fmt(gastoTotal)}</div>
      <div class="metric-sub">${gastosOrc.length} lançamentos</div>
    </div>
    <div class="metric">
      <div class="metric-label">${saldoLivre >= 0 ? 'Disponível' : 'Estourou'}</div>
      <div class="metric-value ${saldoLivre >= 0 ? 'mv-green' : 'mv-red'}">${fmt(Math.abs(saldoLivre))}</div>
      <div class="metric-sub">${diasRest > 0 ? diasRest + ' dias restantes' : diasRest === 0 ? 'último dia' : 'mês encerrado'}</div>
    </div>
  `;
  
  // Budget cards por categoria (usa cobrança)
  const budgetCards = document.getElementById('g-budget-cards');
  if (!fixasVigentes.length) {
    budgetCards.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><p>Nenhuma despesa fixa configurada para este mês.</p></div>';
  } else {
    const catMap = {};
    fixasVigentes.forEach(f => {
      const k = f.cat;
      if (!catMap[k]) catMap[k] = { limite: 0, desc: getCatNome(f.cat) };
      catMap[k].limite += f.limite;
    });
  
    budgetCards.innerHTML = Object.entries(catMap).map(([catId, info]) => {
      const gasto  = gastoRealCat(parseInt(catId) || catId, m, y);
      const limite = info.limite;
      const resto  = limite - gasto;
      const pct    = limite > 0 ? Math.min(100, Math.round(gasto / limite * 100)) : 0;
      const cor    = gasto > limite ? '#E24B4A' : pct >= 80 ? '#BA7517' : '#1D9E75';
      const cor2   = gasto > limite ? 'over' : pct >= 80 ? 'warn' : 'ok';
      const nomecat = info.desc;
      const corDot  = CAT_COLORS[nomecat] || '#888';
  
      return `
        <div class="budget-card">
          <div class="budget-card-head">
            <div class="budget-cat-name">
              <span class="cat-dot" style="background:${corDot};width:10px;height:10px;border-radius:3px"></span>
              ${escHtml(nomecat)}
            </div>
            <div class="budget-values">
              <strong style="color:${cor}">${fmt(gasto)}</strong>
              <span> / ${fmt(limite)}</span>
            </div>
          </div>
          <div class="budget-prog-bar">
            <div class="budget-prog-fill" style="width:${pct}%;background:${cor}"></div>
          </div>
          <div class="budget-footer">
            <span>${pct}% usado</span>
            <span class="restante-${cor2}">
              ${resto >= 0 ? 'Faltam ' + fmt(resto) : 'Estourou ' + fmt(Math.abs(resto))}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Lista de lançamentos mesclada (Orçamento do mês + Lançamentos literais do calendário)
  const lista  = document.getElementById('g-lista');
  const empty  = document.getElementById('g-lista-empty');
  document.getElementById('g-lista-title').textContent = `Lançamentos (Fatura e Avulsos de ${MESES[m]})`;
  
  const setIds = new Set();
  const gastosParaMostrar = [];
  
  // 1. Puxa tudo que compõe a fatura deste mês
  gastosOrc.forEach(g => { setIds.add(g.id); gastosParaMostrar.push(g); });
  // 2. Puxa tudo que foi comprado neste mês, para não sumir da tela
  gastosMes.forEach(g => {
    if (!setIds.has(g.id)) {
      setIds.add(g.id);
      gastosParaMostrar.push(g);
    }
  });
  
  if (!gastosParaMostrar.length) {
    lista.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    const sorted = gastosParaMostrar.sort((a, b) => b.data.localeCompare(a.data));
    lista.innerHTML = sorted.map(g => {
      const nomeCat = getCatNome(g.cat);
      const nomePag = getPagNome(g.pag);
      const corCat  = CAT_COLORS[nomeCat] || '#888';
      
      let faturaTag = '';
      const mc = getMesCobranca(g.data, g.pag);
      const dg = parseLocalDate(g.data);
  
      // Regra visual das tags
      if (mc && (mc.m !== dg.getMonth() || mc.y !== dg.getFullYear())) {
        if (mc.m === m && mc.y === y) {
            // Pertence a esta fatura, mas foi comprado mês passado
            faturaTag = `<span style="font-size:10px;padding:1px 7px;border-radius:4px;font-weight:600;background:var(--blue-light);color:var(--blue-dark);margin-left:4px">compra de ${MESES[dg.getMonth()].slice(0,3)}</span>`;
        } else {
            // Comprado neste mês, mas já foi para a próxima fatura
            faturaTag = `<span style="font-size:10px;padding:1px 7px;border-radius:4px;font-weight:600;background:var(--amber-light);color:var(--amber);margin-left:4px">fatura ${MESES[mc.m].slice(0,3)}/${String(mc.y).slice(-2)}</span>`;
        }
      }
  
      return `
        <div class="gasto-item">
          <span class="gasto-dot" style="background:${corCat}"></span>
          <div class="gasto-info">
            <div class="gasto-desc">${escHtml(g.desc || nomeCat)}${faturaTag}</div>
            <div class="gasto-meta">${escHtml(nomeCat)} · ${escHtml(nomePag.replace('Conta Corrente ','CC '))} · ${fmtDate(g.data)}</div>
          </div>
          <span class="gasto-valor">− ${fmt(g.valor)}</span>
          <button class="gasto-del" onclick="delGasto(${g.id})" title="Remover">×</button>
        </div>
      `;
    }).join('');
  }
}

/* ── MODAL DE LANÇAMENTO ─────────────────────────────────────── */
function abrirModalGasto(idEdicao) {
  // Constrói os chips de categoria com base nas fixas vigentes do mês atual
  const m = parseInt(document.getElementById('g-mes').value);
  const y = parseInt(document.getElementById('g-ano').value);

  // Coleta categorias únicas das fixas vigentes no mês + todas as fixas (para outros meses)
  const catsSet = new Set();
  state.fixas.forEach(f => catsSet.add(f.cat));
  // Adiciona categorias padrão sempre disponíveis
  [1,2,3,4,5,6,7,8,9,10,11].forEach(c => catsSet.add(c));

  const chips = document.getElementById('mg-cat-chips');
  chips.innerHTML = [...catsSet].map(catId => {
    const nome = getCatNome(catId);
    const cor  = CAT_COLORS[nome] || '#888';
    return `
      <button type="button" class="cat-chip" data-cat="${catId}"
              onclick="selecionarCatChip(this, ${JSON.stringify(catId)})"
              style="--chip-cor:${cor}">
        <span style="width:8px;height:8px;border-radius:2px;background:${cor};flex-shrink:0"></span>
        ${escHtml(nome)}
      </button>
    `;
  }).join('');

  // Data padrão = hoje
  const hoje = new Date();
  document.getElementById('mg-data').value =
    `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;

  document.getElementById('mg-valor').value = '';
  document.getElementById('mg-desc').value  = '';
  document.getElementById('mg-cat').value   = '';
  document.getElementById('mg-id').value    = '';
  document.getElementById('modal-gasto-title').textContent = '📝 Lançar gasto';

  if (idEdicao) {
    ensureGastos();
    const g = state.gastos.find(g => g.id === idEdicao);
    if (g) {
      document.getElementById('mg-valor').value = g.valor;
      document.getElementById('mg-desc').value  = g.desc || '';
      document.getElementById('mg-data').value  = g.data;
      document.getElementById('mg-cat').value   = g.cat;
      document.getElementById('mg-id').value    = g.id;
      document.getElementById('modal-gasto-title').textContent = '✏️ Editar gasto';
      // Seleciona o chip correto
      const chipEl = chips.querySelector(`[data-cat="${g.cat}"]`);
      if (chipEl) selecionarCatChip(chipEl, g.cat);
      // Pagamento
      const pagSel = document.getElementById('mg-pag');
      const pagOpt = Array.from(pagSel.options).find(o => o.value == g.pag || o.text === getPagNome(g.pag));
      if (pagOpt) pagSel.value = pagOpt.value;
    }
  }

  document.getElementById('modal-gasto').style.display = 'flex';
  // Foca no campo de valor após animação
  setTimeout(() => document.getElementById('mg-valor').focus(), 120);
}

function selecionarCatChip(el, catId) {
  // Desmarca todos
  document.querySelectorAll('#mg-cat-chips .cat-chip').forEach(c => {
    c.classList.remove('selected');
    c.style.background = '';
    c.style.color = '';
  });
  // Marca o clicado
  const nome = getCatNome(catId);
  const cor  = CAT_COLORS[nome] || '#888';
  el.classList.add('selected');
  el.style.background = cor;
  el.style.color = '#fff';
  document.getElementById('mg-cat').value = catId;
}

function fecharModalGasto() {
  document.getElementById('modal-gasto').style.display = 'none';
}

function salvarGasto() {
  const valor = parseFloat(document.getElementById('mg-valor').value);
  const catRaw = document.getElementById('mg-cat').value;
  const data   = document.getElementById('mg-data').value;

  if (!valor || valor <= 0) { toast('⚠ Informe o valor do gasto.'); return; }
  if (!catRaw)               { toast('⚠ Selecione uma categoria.'); return; }
  if (!data)                 { toast('⚠ Informe a data.'); return; }

  ensureGastos();

  const obj = {
    cat:   parseInt(catRaw) || catRaw,
    desc:  document.getElementById('mg-desc').value.trim(),
    valor,
    pag:   parseInt(document.getElementById('mg-pag').value),
    data,
  };

  const idEdit = document.getElementById('mg-id').value;
  if (idEdit) {
    const i = state.gastos.findIndex(g => g.id == idEdit);
    if (i >= 0) state.gastos[i] = { ...state.gastos[i], ...obj };
  } else {
    state.gastos.push({ id: uid(), ...obj });
  }

  fecharModalGasto();
  renderGastos();
  markUnsaved();
  toast('✓ Gasto lançado!');
}

function delGasto(id) {
  ensureGastos();
  state.gastos = state.gastos.filter(g => g.id !== id);
  renderGastos();
  markUnsaved();
  toast('Lançamento removido.');
}

/* ================================================================
   INICIALIZAÇÃO
================================================================ */
(function init() {
  // Define o mês inicial como o mês atual
  const now = new Date();
  document.getElementById('dash-mes').value = now.getMonth();
  document.getElementById('dash-ano').value = now.getFullYear();
  document.getElementById('g-mes').value = now.getMonth();
  document.getElementById('g-ano').value = now.getFullYear();

  // Re-renderiza os gráficos ao rotacionar o dispositivo
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => reRenderActive(), 200);
  });

  // Carrega dados do GitHub
  githubLoad();
})();
