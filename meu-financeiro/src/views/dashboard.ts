import { state } from '../store';
import { fmt, fmtK, getCatNome, getPagNome, CAT_COLORS, PAY_COLORS, escHtml, charts, destroyChart, MESES } from '../utils';
import { mesZerado, getReceitaMes, getLimiteVsGastoMes, getDespesaVariavelMes, getSaldoMes, parcelasRestantesEm, incideNoMes, gastosCobrancaMes, getMesCobranca } from '../finance';

declare const Chart: any;

export function renderDash() {
  const m = parseInt((document.getElementById('dash-mes') as HTMLSelectElement).value);
  const y = parseInt((document.getElementById('dash-ano') as HTMLSelectElement).value);
  const zero = mesZerado(m, y);

  const rec = getReceitaMes(m, y);
  const fix = getLimiteVsGastoMes(m, y); // Usando a nova regra!
  const vari = getDespesaVariavelMes(m, y);
  const saldo = getSaldoMes(m, y);

  document.getElementById('dash-metrics')!.innerHTML = `
    <div class="metric"><div class="metric-label">Receita do mês</div><div class="metric-value ${zero ? 'mv-amber' : 'mv-green'}">${zero ? '—' : fmt(rec)}</div><div class="metric-sub">${MESES[m]} ${y}</div></div>
    <div class="metric"><div class="metric-label">Limites vs Gastos</div><div class="metric-value ${zero ? 'mv-amber' : 'mv-red'}">${zero ? '—' : fmt(fix)}</div><div class="metric-sub">${zero ? 'não contabilizado' : 'limites da categoria'}</div></div>
    <div class="metric"><div class="metric-label">Despesas variáveis</div><div class="metric-value mv-amber">${zero ? '—' : fmt(vari)}</div><div class="metric-sub">${zero ? 'não contabilizado' : 'parcelas ativas'}</div></div>
    <div class="metric"><div class="metric-label">Sobra do mês</div><div class="metric-value ${zero ? 'mv-amber' : saldo >= 0 ? 'mv-green' : 'mv-red'}">${zero ? 'R$ 0,00' : fmt(saldo)}</div><div class="metric-sub">${zero ? 'controle começa em março' : saldo >= 0 ? 'Para economizar ✓' : 'Despesas > receita'}</div></div>
  `;

  const icons: any = { danger: '⚠', warn: '⚡', info: 'ℹ', success: '✓' };
  const alerts: any[] = [];

  if (zero) {
    alerts.push({ t: 'info', msg: `${MESES[m]} é um mês anterior ao início do controle — todos os valores estão zerados. O controle começa em março de ${y}.` });
  } else {
    const hoje = new Date();
    if (hoje.getMonth() === m && hoje.getFullYear() === y && state.fechamentos) {
      Object.entries(state.fechamentos).forEach(([cidStr, fech]: [string, any]) => {
        const cid = parseInt(cidStr);
        const diasRest = fech - hoje.getDate();

        if (diasRest >= 0 && diasRest <= 10) {
          const gAv = (state.gastos || []).filter((g: any) => g.pag === cid).filter((g: any) => {
            const mc = getMesCobranca(g.data, g.pag);
            return mc && mc.m === m && mc.y === y;
          }).reduce((a: number, g: any) => a + g.valor, 0);

          const gVar = (state.variaveis || []).filter((v: any) => v.pag === cid && parcelasRestantesEm(v, m, y) > 0).reduce((a: number, v: any) => a + v.mensal, 0);
          const total = gAv + gVar;

          if (total > 0) {
            const nd = diasRest === 0 ? 'hoje' : diasRest === 1 ? 'amanhã' : `em ${diasRest} dias`;
            alerts.push({ t: diasRest <= 2 ? 'danger' : 'warn', msg: `💳 Fatura ${getPagNome(cid)} fecha ${nd} — Valor: ${fmt(total)}` });
          }
        }
      });
    }
    if (saldo < 0) alerts.push({ t: 'danger', msg: `Despesas superam a receita em ${fmt(Math.abs(saldo))} em ${MESES[m]}.` });

    const over = state.fixas.filter((f: any) => incideNoMes(f.inicio, f.fim, m, y) && f.valor > f.limite && f.limite > 0);
    if (over.length) alerts.push({ t: 'warn', msg: `${over.length} despesa(s) estouraram o limite: ${over.map((f: any) => escHtml(f.desc)).join(', ')}.` });

    if (rec > 0) {
      const pct = Math.round((fix + vari) / rec * 100);
      if (pct > 85) alerts.push({ t: 'warn', msg: `${pct}% da renda comprometida este mês.` });
    }
  }

  document.getElementById('dash-alerts')!.innerHTML = alerts.map(a => `<div class="alert alert-${a.t}"><span class="alert-icon">${icons[a.t]}</span><span>${a.msg}</span></div>`).join('');

  const isMobile = window.innerWidth <= 768;
  const catT: any = {}, payT: any = {};

  if (!zero) {
    state.variaveis.filter((v: any) => parcelasRestantesEm(v, m, y) > 0).forEach((v: any) => {
      const kC = getCatNome(v.cat), kP = getPagNome(v.pag);
      catT[kC] = (catT[kC] || 0) + v.mensal; payT[kP] = (payT[kP] || 0) + v.mensal;
    });

    const catsFixed = new Set();
    const mapSemPag: any = {};

    state.fixas.filter((f: any) => incideNoMes(f.inicio, f.fim, m, y)).forEach((f: any) => {
      if (f.pag !== '' && f.pag !== null && f.pag !== undefined) {
        const kC = getCatNome(f.cat), kP = getPagNome(f.pag);
        const val = f.valor || f.limite || 0;
        catT[kC] = (catT[kC] || 0) + val; payT[kP] = (payT[kP] || 0) + val;
        catsFixed.add(f.cat);
      } else {
        mapSemPag[f.cat] = (mapSemPag[f.cat] || 0) + f.limite;
      }
    });

    gastosCobrancaMes(m, y).forEach((g: any) => {
      if (!catsFixed.has(g.cat)) {
        const kC = getCatNome(g.cat), kP = getPagNome(g.pag);
        catT[kC] = (catT[kC] || 0) + g.valor; payT[kP] = (payT[kP] || 0) + g.valor;
        if (mapSemPag[g.cat] !== undefined) mapSemPag[g.cat] -= g.valor;
      }
    });

    Object.keys(mapSemPag).forEach(cat => {
      const gap = mapSemPag[cat];
      if (gap > 0) {
        const kC = getCatNome(cat);
        catT[kC] = (catT[kC] || 0) + gap;
        payT['A Realizar (Previsão)'] = (payT['A Realizar (Previsão)'] || 0) + gap;
      }
    });
  }

  const catE = Object.entries(catT).sort((a: any, b: any) => b[1] - a[1]);
  document.getElementById('chart-cat-wrap')!.style.height = isMobile ? '280px' : '220px';
  destroyChart('chartCat');
  charts.chartCat = new Chart(document.getElementById('chartCat'), {
    type: 'doughnut',
    data: { labels: catE.map(c => c[0]), datasets: [{ data: catE.map(c => Math.round(c[1] as number)), backgroundColor: catE.map(c => CAT_COLORS[c[0]] || '#888'), borderWidth: 2, borderColor: 'transparent' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: isMobile ? 'bottom' : 'right', labels: { boxWidth: 10, font: { size: 10 }, padding: isMobile ? 6 : 8 } } } }
  });

  let acc = 0;
  const saldosAno = MESES.map((_, i) => { acc += getSaldoMes(i, y); return Math.round(acc); });
  destroyChart('chartSaldo');
  charts.chartSaldo = new Chart(document.getElementById('chartSaldo'), {
    type: 'bar',
    data: { labels: MESES.map(m => m.slice(0, 3)), datasets: [{ data: saldosAno, backgroundColor: saldosAno.map(s => s >= 0 ? 'rgba(16,185,129,.5)' : 'rgba(239,68,68,.4)'), borderColor: saldosAno.map(s => s >= 0 ? '#10b981' : '#ef4444'), borderWidth: 1.5, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: any) => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });

  const payE = Object.entries(payT).sort((a: any, b: any) => b[1] - a[1]);
  destroyChart('chartPay');
  charts.chartPay = new Chart(document.getElementById('chartPay'), {
    type: 'bar',
    data: { labels: payE.map(p => p[0].replace('Conta Corrente ', 'CC ')), datasets: [{ data: payE.map(p => Math.round(p[1] as number)), backgroundColor: payE.map(p => PAY_COLORS[p[0]] || '#888'), borderWidth: 0, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v: any) => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, y: { ticks: { font: { size: 11 } } } } }
  });
}