import './styles/main.scss';

// Importações do Estado e GitHub
import { showConfig, hideConfig, saveConfig, githubSave, exportJSONBackup, loadCfg, githubLoad } from './store';

// Importações das Views (as lógicas de cada tela)
import { renderLimites, openFormFixa, editFixa, saveFixa, delFixa } from './views/limites';
import { renderGastos, salvarGasto, delGasto, abrirModalGasto, fecharModalGasto, selecionarCatChip } from './views/gastos';
// NOVOS IMPORTS:
import { renderReceitas, openFormReceita, editReceita, saveReceita, delReceita } from './views/receitas';
import { renderVariaveis, calcParcela, openFormVariavel, editVariavel, saveVariavel, togglePago, delVariavel } from './views/variaveis';
import { renderDash } from './views/dashboard';
import { renderParcelas } from './views/parcelas';
import { renderEconomias, calcEconomias } from './views/economias';
import { renderPrevisao } from './views/previsao';

// E lembre-se de pendurar o calcEconomias no window se o HTML usar ele num oninput:
(window as any).renderDash = renderDash;
(window as any).renderEconomias = renderEconomias;
(window as any).calcEconomias = calcEconomias;
// ==========================================
// EXPONDO FUNÇÕES PARA O HTML (window)
// ==========================================
(window as any).showConfig = showConfig;
(window as any).hideConfig = hideConfig;
(window as any).saveConfig = saveConfig;
(window as any).githubSave = githubSave;
(window as any).exportJSONBackup = exportJSONBackup;

// Ações Limites e Gastos
(window as any).openFormFixa = openFormFixa;
(window as any).editFixa = editFixa;
(window as any).saveFixa = saveFixa;
(window as any).delFixa = delFixa;
(window as any).salvarGasto = salvarGasto;
(window as any).delGasto = delGasto;
(window as any).abrirModalGasto = abrirModalGasto;
(window as any).fecharModalGasto = fecharModalGasto;
(window as any).selecionarCatChip = selecionarCatChip;

// Ações Receitas
(window as any).openFormReceita = openFormReceita;
(window as any).editReceita = editReceita;
(window as any).saveReceita = saveReceita;
(window as any).delReceita = delReceita;

// Ações Variáveis (Parcelas)
(window as any).calcParcela = calcParcela;
(window as any).openFormVariavel = openFormVariavel;
(window as any).editVariavel = editVariavel;
(window as any).saveVariavel = saveVariavel;
(window as any).togglePago = togglePago;
(window as any).delVariavel = delVariavel;

// UI Geral
(window as any).showPage = showPage;
(window as any).switchTab = switchTab;
(window as any).closeForm = closeForm;
(window as any).toggleTheme = toggleTheme;

// ==========================================
// FUNÇÕES GLOBAIS DE INTERFACE (UI)
// ==========================================
function showPage(pageId: string, btnElement?: HTMLElement) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.sidebar .nav-item[data-page], .mobile-nav button[data-page]').forEach(b => b.classList.remove('active'));
  
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  if (btnElement) btnElement.classList.add('active');
  
  reRenderActive();
  window.scrollTo(0, 0);
}

function switchTab(t: string, btn: HTMLElement) {
  document.getElementById('tab-fixas')!.style.display = t === 'fixas' ? 'block' : 'none';
  document.getElementById('tab-variaveis')!.style.display = t === 'variaveis' ? 'block' : 'none';
  document.querySelectorAll('.inner-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function closeForm(id: string) {
  const form = document.getElementById(id);
  if (form) form.style.display = 'none';
  clearForm(id);
}

function clearForm(id: string) {
  document.getElementById(id)?.querySelectorAll('input,select').forEach((el: any) => {
    if (el.type === 'hidden') el.value = '';
    else if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
  });
}

function applyTheme(t: string) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('mf_theme', t);
  const isDark = t === 'dark';
  const ic = document.getElementById('theme-ic'); if (ic) ic.textContent = isDark ? '☀' : '🌙';
  const lbl = document.getElementById('theme-lbl'); if (lbl) lbl.textContent = isDark ? 'Modo claro' : 'Modo escuro';
  const m = document.getElementById('btn-theme-m'); if (m) m.textContent = isDark ? '☀' : '🌙';
  try { reRenderActive(); } catch (e) {}
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

function reRenderActive() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  
  const pid = activePage.id.replace('page-', '');
  
  if (pid === 'dashboard') {
      renderDash();
  } else if (pid === 'despesas') {
      renderLimites(); 
      renderVariaveis();
  } else if (pid === 'gastos') {
      renderGastos();
  } else if (pid === 'receitas') {
      renderReceitas();
  } else if (pid === 'parcelas') {
      renderParcelas();
  } else if (pid === 'economias') {
      renderEconomias();
  } else if (pid === 'previsao') {
      renderPrevisao();
  }
  
  const fab = document.getElementById('btn-novo-gasto');
  if (fab) fab.style.display = pid === 'gastos' ? 'flex' : 'none';
}

(window as any).reRenderActive = reRenderActive;

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadCfg();
  
  const savedTheme = localStorage.getItem('mf_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  const now = new Date();
  (document.getElementById('dash-mes') as HTMLSelectElement).value = String(now.getMonth());
  (document.getElementById('dash-ano') as HTMLSelectElement).value = String(now.getFullYear());
  (document.getElementById('g-mes') as HTMLSelectElement).value = String(now.getMonth());
  (document.getElementById('g-ano') as HTMLSelectElement).value = String(now.getFullYear());
  
  githubLoad();
  showPage('despesas', document.querySelector('.nav-item[data-page="despesas"]') as HTMLElement);
});