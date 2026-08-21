export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export const CATEGORIAS: Record<number, string> = {
  1:'Alimentação', 2:'Saúde', 3:'Educação', 4:'Serviços', 5:'Lazer', 6:'Transporte',
  7:'Investimentos', 8:'Moradia', 9:'Crédito', 10:'Compra', 11:'Outros'
};

export const PAGAMENTOS: Record<number, string> = {
  1:'Cartão Sicredi', 2:'Cartão M Pago', 3:'Cartão Banri', 4:'Dinheiro Vivo', 5:'Pix',
  6:'Poupança', 7:'Conta Corrente Banri', 8:'Conta Corrente M Pago', 9:'Cartão Santander'
};

export const getCatNome = (c: any) => (c != null) ? (CATEGORIAS[Number(c)] || String(c)) : '?';
export const getPagNome = (p: any) => (p != null) ? (PAGAMENTOS[Number(p)] || String(p)) : '?';

export const CAT_COLORS: Record<string, string> = {
  Alimentação:'#1D9E75', Saúde:'#E24B4A', Educação:'#378ADD', Serviços:'#BA7517', Lazer:'#D4537E',
  Transporte:'#7F77DD', Investimentos:'#639922', Moradia:'#D85A30', Crédito:'#888780', Compra:'#5DCAA5', Outros:'#B4B2A9'
};

export const PAY_CLASS: Record<string, string> = {
  'Cartão Sicredi':'pt-sicredi', 'Cartão M Pago':'pt-mpago', 'Cartão Banri':'pt-banri',
  'Dinheiro Vivo':'pt-dinheiro', 'Pix':'pt-pix', 'Poupança':'pt-poupanca',
  'Conta Corrente Banri':'pt-banri', 'Conta Corrente M Pago':'pt-mpago', 'Cartão Santander':'pt-santander'
};

export const PAY_COLORS: Record<string, string> = {
  'Cartão Sicredi':'#1D9E75', 'Cartão M Pago':'#00838F', 'Cartão Banri':'#378ADD', 'Dinheiro Vivo':'#888780',
  'Pix':'#BA7517', 'Poupança':'#639922', 'Conta Corrente Banri':'#5DCAA5', 'Conta Corrente M Pago':'#3BDAB0',
  'Cartão Santander':'#EC0000', 'A Realizar (Previsão)':'#D3D3D3'
};

export const fmt = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
export const fmtK = (v: number) => { const a=Math.abs(v); return (v<0?'-':'')+(a>=1000?'R$ '+Math.round(a/100)/10+'k':fmt(v)); };
export const fmtDate = (s: string) => { if(!s) return '—'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };
export const uid = () => Date.now() + Math.floor(Math.random() * 9999);
export const escHtml = (s: string) => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export const payTag = (p: any) => { 
  const n = String(getPagNome(p) ?? p ?? '?'); 
  return `<span class="pay-tag ${PAY_CLASS[n] || 'pt-dinheiro'}">${escHtml(n.replace('Conta Corrente ','CC '))}</span>`; 
};

export const catWrap = (c: any) => { 
  const n = String(getCatNome(c) ?? c ?? '?'); 
  return `<span class="cat-wrap"><span class="cat-dot" style="background:${CAT_COLORS[n]||'#888'}"></span>${escHtml(n)}</span>`; 
};

let toastTimeout: any;
export function toast(msg: string, d = 2500) { 
  const el = document.getElementById('toast'); 
  if(!el) return;
  el.textContent = msg; 
  el.classList.add('show'); 
  clearTimeout(toastTimeout); 
  toastTimeout = setTimeout(() => el.classList.remove('show'), d); 
}

export const charts: Record<string, any> = {};
export function destroyChart(id: string) { 
  if (charts[id]) { charts[id].destroy(); delete charts[id]; } 
}