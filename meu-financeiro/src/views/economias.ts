import { state } from '../store';
import { fmt, fmtK, charts, destroyChart, MESES } from '../utils';
import { getSaldoMes, mesZerado, incideNoMes } from '../finance';

declare const Chart: any;

export function calcEconomias(y: number) {
  const taxaCDI = (parseFloat((document.getElementById('eco-taxa-cdi') as HTMLInputElement).value) || 120) / 100;
  const saldoIni = parseFloat((document.getElementById('eco-saldo-inicial') as HTMLInputElement).value) || 0;
  const CDI_ANUAL = 0.105;
  const taxaMensal = Math.pow(1 + CDI_ANUAL * taxaCDI, 1 / 12) - 1;
  
  const rows: any[] = [];
  let acumPoup = saldoIni;
  let acumCaixa = 0;
  
  for (let m = 0; m < 12; m++) {
    const sobra = getSaldoMes(m, y);
    const rend = acumPoup * taxaMensal;
    const dep = mesZerado(m, y) ? 0 : state.fixas.filter((f: any) => (f.pag === 6 || f.pag === 'Poupança') && incideNoMes(f.inicio, f.fim, m, y)).reduce((a: number, f: any) => a + f.valor, 0);
    
    acumPoup = acumPoup + rend + dep;
    acumCaixa += sobra;
    
    rows.push({ mes: MESES[m], sobraMes: Math.round(sobra * 100) / 100, deposito: dep, acumPoupanca: Math.round(acumPoup * 100) / 100, patrimonioTotal: Math.round((acumCaixa + acumPoup) * 100) / 100, rendimento: Math.round(rend * 100) / 100, acumCaixa: Math.round(acumCaixa * 100) / 100 });
  }
  return rows;
}

export function renderEconomias() {
  const y = parseInt((document.getElementById('eco-ano') as HTMLSelectElement).value);
  const rows = calcEconomias(y);
  
  const totRend = rows.reduce((a, r) => a + r.rendimento, 0);
  const patFinal = rows[rows.length - 1].patrimonioTotal;
  const totSobras = rows.reduce((a, r) => a + r.sobraMes, 0);
  const melhor = rows.reduce((b, r) => r.sobraMes > b.sobraMes ? r : b, rows[0]);
  
  document.getElementById('eco-metrics')!.innerHTML = `
    <div class="metric"><div class="metric-label">Patrimônio em dez/${String(y).slice(-2)}</div><div class="metric-value ${patFinal >= 0 ? 'mv-green' : 'mv-red'}">${fmt(patFinal)}</div><div class="metric-sub">caixa + poupança</div></div>
    <div class="metric"><div class="metric-label">Acumulado poupança</div><div class="metric-value mv-blue">${fmt(rows[rows.length - 1].acumPoupanca)}</div><div class="metric-sub">com juros compostos</div></div>
    <div class="metric"><div class="metric-label">Rendimento total</div><div class="metric-value mv-amber">${fmt(totRend)}</div><div class="metric-sub">juros no ano</div></div>
    <div class="metric"><div class="metric-label">Melhor mês</div><div class="metric-value ${melhor.sobraMes >= 0 ? 'mv-green' : 'mv-red'}">${fmt(melhor.sobraMes)}</div><div class="metric-sub">${melhor.mes}</div></div>`;

  destroyChart('chartEcoBar');
  charts.chartEcoBar = new Chart(document.getElementById('chartEcoBar'), {
    type: 'bar', data: {
      labels: rows.map(r => r.mes.slice(0, 3)), datasets: [
        { label: 'Poupança', data: rows.map(r => Math.max(0, Math.round(r.acumPoupanca))), backgroundColor: 'rgba(239,68,68,.6)', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 3, stack: 'eco' },
        { label: 'Caixa', data: rows.map(r => Math.max(0, Math.round(r.acumCaixa))), backgroundColor: 'rgba(59,130,246,.6)', borderColor: '#3b82f6', borderWidth: 1.5, borderRadius: 3, stack: 'eco' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, min: 0, ticks: { callback: (v: any) => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } } } }
  });

  destroyChart('chartEcoPatrimonio');
  charts.chartEcoPatrimonio = new Chart(document.getElementById('chartEcoPatrimonio'), {
    type: 'line', data: { labels: rows.map(r => r.mes.slice(0, 3)), datasets: [{ label: 'Patrimônio', data: rows.map(r => Math.round(r.patrimonioTotal)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.12)', tension: .4, fill: true, pointRadius: 4, pointBackgroundColor: '#10b981', pointBorderColor: '#fff', pointBorderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: any) => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });

  destroyChart('chartEcoRendimento');
  charts.chartEcoRendimento = new Chart(document.getElementById('chartEcoRendimento'), {
    type: 'bar', data: { labels: rows.map(r => r.mes.slice(0, 3)), datasets: [{ label: 'Rendimento', data: rows.map(r => Math.round(r.rendimento * 100) / 100), backgroundColor: 'rgba(245,158,11,.55)', borderColor: '#f59e0b', borderWidth: 1.5, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, ticks: { callback: (v: any) => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });

  document.getElementById('tbody-economias')!.innerHTML = rows.map((r, i) => `
    <tr style="${i % 2 === 1 ? 'background:var(--bg2)' : ''}">
      <td style="font-weight:600">${r.mes}</td>
      <td style="color:${r.sobraMes >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${fmt(r.sobraMes)}</td>
      <td style="color:var(--blue)">${fmt(r.deposito)}</td>
      <td style="color:var(--red);font-weight:600">${fmt(r.acumPoupanca)}</td>
      <td style="color:${r.patrimonioTotal >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${fmt(r.patrimonioTotal)}</td>
      <td style="color:var(--amber)">${fmt(r.rendimento)}</td>
    </tr>`).join('') + `
    <tr style="background:var(--bg3);border-top:2px solid var(--border-s)">
      <td style="font-weight:700">Total</td>
      <td style="font-weight:700;color:${totSobras >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(totSobras)}</td>
      <td style="font-weight:700;color:var(--blue)">${fmt(rows.reduce((a, r) => a + r.deposito, 0))}</td>
      <td style="color:var(--text-t)">—</td>
      <td style="font-weight:700;color:${patFinal >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(patFinal)}</td>
      <td style="font-weight:700;color:var(--amber)">${fmt(totRend)}</td>
    </tr>`;
}