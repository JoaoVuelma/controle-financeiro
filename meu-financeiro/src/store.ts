import { toast } from './utils';

export const DEFAULT_STATE = { receitas: [], fixas: [], variaveis: [], gastos: [], fechamentos: {} };
export let state: any = JSON.parse(JSON.stringify(DEFAULT_STATE));

const CFG_KEY = 'mf_gh_cfg';
const TOKEN_KEY = 'mf_gh_token';
export let ghCfg = { owner: 'JoaoVuelma', repo: 'controle-financeiro', branch: 'main', file: 'dados.json' };
export let ghFileSha: string | null = null;
export let hasUnsaved = false;

export function loadCfg() {
  try { const s = localStorage.getItem(CFG_KEY); if (s) ghCfg = Object.assign(ghCfg, JSON.parse(s)); } catch (e) {}
}
export function saveCfgLocal() { localStorage.setItem(CFG_KEY, JSON.stringify(ghCfg)); }
export function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

export function setSyncStatus(type: string, msg: string) {
  ['sync-dot', 'sync-dot-m'].forEach(id => { const el = document.getElementById(id); if (el) el.className = 'sync-dot ' + type; });
  ['sync-label', 'sync-label-m'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = msg; });
}

export function markUnsaved() {
  hasUnsaved = true;
  ['btn-salvar', 'btn-salvar-m'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'inline-flex'; });
  setSyncStatus('unsaved', 'Não salvo');
}

export function markSaved() {
  hasUnsaved = false;
  ['btn-salvar', 'btn-salvar-m'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  setSyncStatus('ok', 'Sincronizado ✓');
}

export function showConfig() {
  loadCfg();
  (document.getElementById('cfg-token') as HTMLInputElement).value = getToken();
  (document.getElementById('cfg-owner') as HTMLInputElement).value = ghCfg.owner;
  (document.getElementById('cfg-repo') as HTMLInputElement).value = ghCfg.repo;
  (document.getElementById('cfg-branch') as HTMLInputElement).value = ghCfg.branch;
  (document.getElementById('cfg-file') as HTMLInputElement).value = ghCfg.file;
  document.getElementById('modal-config')!.style.display = 'flex';
}

export function hideConfig() { document.getElementById('modal-config')!.style.display = 'none'; }

export function saveConfig() {
  const token = (document.getElementById('cfg-token') as HTMLInputElement).value.trim();
  ghCfg.owner = (document.getElementById('cfg-owner') as HTMLInputElement).value.trim() || ghCfg.owner;
  ghCfg.repo = (document.getElementById('cfg-repo') as HTMLInputElement).value.trim() || ghCfg.repo;
  ghCfg.branch = (document.getElementById('cfg-branch') as HTMLInputElement).value.trim() || 'main';
  ghCfg.file = (document.getElementById('cfg-file') as HTMLInputElement).value.trim() || 'dados.json';
  saveCfgLocal();
  if (!token) { toast('⚠ Cole o token do GitHub.'); return; }
  localStorage.setItem(TOKEN_KEY, token);
  hideConfig();
  toast('Configuração salva! Carregando dados...');
  githubLoad();
}

export async function githubLoad() {
  const token = getToken();
  if (!token) {
    setSyncStatus('error', 'Configure o token ⚙');
    ['btn-salvar', 'btn-salvar-m'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'inline-flex'; });
    (window as any).reRenderActive();
    return;
  }
  setSyncStatus('syncing', 'Carregando...');
  try {
    const res = await fetch(`https://api.github.com/repos/${ghCfg.owner}/${ghCfg.repo}/contents/${encodeURIComponent(ghCfg.file)}?ref=${encodeURIComponent(ghCfg.branch)}&t=${Date.now()}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
    if (res.status === 404) {
      setSyncStatus('ok', 'Pronto (novo arquivo)');
      ['btn-salvar', 'btn-salvar-m'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'inline-flex'; });
      (window as any).reRenderActive();
      return;
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    ghFileSha = json.sha;
    const b64 = json.content.replace(/\n/g, '');
    const decoded = JSON.parse(decodeURIComponent(escape(atob(b64))));
    state = { receitas: decoded.receitas || [], fixas: decoded.fixas || [], variaveis: decoded.variaveis || [], gastos: decoded.gastos || [], fechamentos: decoded.fechamentos || {} };
    markSaved();
    (window as any).reRenderActive();
    toast('✓ Dados carregados!');
  } catch (err: any) {
    setSyncStatus('error', 'Erro ao carregar');
    toast('⚠ Erro: ' + err.message);
    (window as any).reRenderActive();
  }
}

export async function githubSave() {
  const token = getToken();
  if (!token) { showConfig(); return; }
  setSyncStatus('syncing', 'Salvando...');
  const payload = { _version: 1, _savedAt: new Date().toISOString(), ...state };
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
  const body: any = { message: `dados: ${new Date().toLocaleString('pt-BR')}`, content, branch: ghCfg.branch };
  if (ghFileSha) body.sha = ghFileSha;
  try {
    const res = await fetch(`https://api.github.com/repos/${ghCfg.owner}/${ghCfg.repo}/contents/${encodeURIComponent(ghCfg.file)}`, {
      method: 'PUT', headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Erro ao salvar');
    const json = await res.json();
    ghFileSha = json.content.sha;
    markSaved();
    toast('✓ Dados salvos no GitHub!');
  } catch (err: any) {
    setSyncStatus('error', 'Erro ao salvar');
    toast('⚠ Erro: ' + err.message);
  }
}

export function exportJSONBackup() {
  const data = { _version: 1, _exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `meufinanceiro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Backup exportado!');
}