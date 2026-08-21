import { state } from './store';
import { getCatNome } from './utils';

export function ultimoDia(m: number, y: number) { return new Date(y, m + 1, 0); }
export function primeiroDia(m: number, y: number) { return new Date(y, m, 1); }

export function parseLocalDate(str: string) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function incideNoMes(inicioStr: string, fimStr: string, m: number, y: number) {
  const d1 = primeiroDia(m, y);
  const d2 = ultimoDia(m, y);
  const s = parseLocalDate(inicioStr);
  
  // Tenta converter a data de fim. Se a string for vazia ou retornar null,
  // assume o fallback (31 de dezembro de 2099)
  const e = parseLocalDate(fimStr) || new Date(2099, 11, 31);
  
  // Como agora garantimos que 'e' sempre será um Date, o TS para de chorar.
  // O 's' já estava seguro porque você colocou (s && s <= d2).
  return (s && s <= d2 && e >= d1);
}

export function getMesCobranca(dataStr: string, pagId: any) {
  const d = parseLocalDate(dataStr);
  if (!d) return null;
  const fech = state.fechamentos ? parseInt(state.fechamentos[pagId]) : NaN;
  if (!fech || isNaN(fech)) return { m: d.getMonth(), y: d.getFullYear() };

  let mFech = d.getMonth();
  let yFech = d.getFullYear();

  if (d.getDate() > fech) {
    mFech++;
    if (mFech > 11) { mFech = 0; yFech++; }
  }
  if (fech <= 15) {
    mFech--;
    if (mFech < 0) { mFech = 11; yFech--; }
  }
  return { m: mFech, y: yFech };
}

export function parcelasRestantesEm(v: any, m: number, y: number) {
  const inicioReal = getMesCobranca(v.inicio, v.pag);
  if (!inicioReal) return 0;
  const inicioAbs = inicioReal.y * 12 + inicioReal.m;
  const mAbs = y * 12 + m;
  const jaPassaram = mAbs - inicioAbs;
  if (jaPassaram < 0) return 0;
  return v.parcelas - jaPassaram;
}

export function gastosCobrancaMes(m: number, y: number) {
  if (!state.gastos) return [];
  return state.gastos.filter((g: any) => {
    const mc = getMesCobranca(g.data, g.pag);
    if (mc) return mc.m === m && mc.y === y;
    const d = parseLocalDate(g.data);
    return d && d.getFullYear() === y && d.getMonth() === m;
  });
}

export function gastoRealCat(catId: any, m: number, y: number) {
  return gastosCobrancaMes(m, y)
    .filter((g: any) => g.cat === catId || getCatNome(g.cat) === getCatNome(catId))
    .reduce((a: number, g: any) => a + g.valor, 0);
}

// ---------------------------------------------------------
// CÁLCULOS TOTAIS DO MÊS (A Nova Regra!)
// ---------------------------------------------------------

const MESES_ZERADOS = { ano: 2026, meses: [0, 1] }; // Jan e Fev zerados
export function mesZerado(m: number, y: number) {
  return y === MESES_ZERADOS.ano && MESES_ZERADOS.meses.includes(m);
}

export function getReceitaMes(m: number, y: number) {
  if (mesZerado(m, y)) return 0;
  return state.receitas
    .filter((r: any) => incideNoMes(r.inicio, r.fim, m, y))
    .reduce((acc: number, r: any) => acc + r.valor, 0);
}

export function getDespesaVariavelMes(m: number, y: number) {
  if (mesZerado(m, y)) return 0;
  return state.variaveis
    .filter((v: any) => parcelasRestantesEm(v, m, y) > 0)
    .reduce((acc: number, v: any) => acc + v.mensal, 0);
}

// A MÁGICA ACONTECE AQUI:
export function getLimiteVsGastoMes(m: number, y: number) {
  if (mesZerado(m, y)) return 0;
  
  return state.fixas
    .filter((f: any) => incideNoMes(f.inicio, f.fim, m, y))
    .reduce((acc: number, f: any) => {
      // Se essa categoria tem pagamento atrelado (ex: aluguel já debitado), usa o valor cravado.
      if (f.pag !== "" && f.pag !== null && f.pag !== undefined) {
        return acc + (f.valor || f.limite || 0);
      } else {
        // Se é uma categoria de LIMITE (ex: Alimentação), pega o gasto real lançado na aba Gastos
        const real = gastoRealCat(f.cat, m, y);
        // Retorna o que for MAIOR: Se planejei 500 e gastei 200, reserva 500. Se gastei 600, subtrai 600.
        return acc + Math.max(f.limite, real);
      }
    }, 0);
}

export function getSaldoMes(m: number, y: number) {
  if (mesZerado(m, y)) return 0;
  return getReceitaMes(m, y) - getLimiteVsGastoMes(m, y) - getDespesaVariavelMes(m, y);
}