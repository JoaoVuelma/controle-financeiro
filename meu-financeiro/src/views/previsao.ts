import { state } from '../store';
import { fmt, fmtK, charts, destroyChart, MESES } from '../utils';
import { getReceitaMes, getLimiteVsGastoMes, getDespesaVariavelMes } from '../finance';

declare const Chart: any;

export function renderPrevisao() {
  const now = new Date(); const m0 = now.getMonth(); const y0 = now.getFullYear();
  const labels: any[] = [], recs: any[] = [], desps: any[] = [], sobras: any[] = [], saldosAcc: any[] = [];
  let acc = 0;

  for (let i = 0; i < 12; i++) {
    const m = (m0 + i) % 12; const y = y0 + Math.floor((m0 + i) / 12);
    const r = getReceitaMes(m, y);
    const d = getLimiteVsGastoMes(m, y) + getDespesaVariavelMes(m, y); // Regra Nova!
    const s = r - d; acc += s;
    labels.push(MESES[m].slice(0, 3) + '/' + String(y).slice(-2));
    recs.push(Math.round(r)); desps.push(Math.round(d)); sobras.push(Math.round(s)); saldosAcc.push(Math.round(acc));
  }

  destroyChart('chartPrevisao');
  charts.chartPrevisao = new Chart(document.getElementById('chartPrevisao'), {
    type: 'line', data: { labels, datasets: [{ label: 'Caixa acumulado', data: saldosAcc, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.12)', tension: .4, fill: true, pointRadius: 4, pointBackgroundColor: saldosAcc.map(s => s >= 0 ? '#10b981' : '#ef4444'), pointBorderColor: '#fff', pointBorderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: any) => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });

  destroyChart('chartRvsD');
  charts.chartRvsD = new Chart(document.getElementById('chartRvsD'), {
    type: 'bar', data: { labels, datasets: [{ label: 'Receita', data: recs, backgroundColor: 'rgba(16,185,129,.45)', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 3 }, { label: 'Despesas', data: desps, backgroundColor: 'rgba(239,68,68,.45)', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } }, scales: { y: { ticks: { callback: (v: any) => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });

  const recMed = Math.round(recs.reduce((a, v) => a + v, 0) / 12);
  const despMed = Math.round(desps.reduce((a, v) => a + v, 0) / 12);
  const sobraMed = recMed - despMed;
  const taxa = recMed > 0 ? Math.round(sobraMed / recMed * 100) : 0;
  const comprP = recMed > 0 ? Math.round(state.variaveis.filter((v: any) => v.faltam > 0).reduce((a: number, v: any) => a + v.mensal, 0) / recMed * 100) : 0;
  const saldoFinal = saldosAcc[saldosAcc.length - 1];

  document.getElementById('div-indicadores')!.innerHTML = `
    <div class="predict-block"><div class="predict-head"><span>Taxa de sobra média</span><span style="color:${taxa >= 20 ? 'var(--green)' : 'var(--red)'}">${taxa}%</span></div><div class="prog-bar"><div class="prog-fill" style="width:${Math.max(0, Math.min(100, taxa))}%;background:${taxa >= 20 ? '#10b981' : '#ef4444'}"></div></div><div class="prog-labels"><span>Meta: 20%</span><span>${taxa >= 20 ? '✓ Atingida' : 'Abaixo da meta'}</span></div></div>
    <div class="predict-block"><div class="predict-head"><span>Renda em parcelas</span><span style="color:${comprP > 30 ? 'var(--red)' : comprP > 20 ? 'var(--amber)' : 'var(--green)'}">${comprP}%</span></div><div class="prog-bar"><div class="prog-fill" style="width:${Math.min(100, comprP)}%;background:${comprP > 30 ? '#ef4444' : comprP > 20 ? '#f59e0b' : '#10b981'}"></div></div><div class="prog-labels"><span>Ideal: abaixo de 20%</span></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Receita média/mês</div><div style="font-size:18px;font-weight:700;color:var(--green)">${fmt(recMed)}</div></div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Despesa média/mês</div><div style="font-size:18px;font-weight:700;color:var(--red)">${fmt(despMed)}</div></div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Sobra média/mês</div><div style="font-size:18px;font-weight:700;color:${sobraMed >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(sobraMed)}</div></div>
      <div style="padding:12px;background:var(--bg2);border-radius:var(--radius-sm)"><div style="font-size:11px;color:var(--text-t);margin-bottom:3px">Caixa em 12 meses</div><div style="font-size:18px;font-weight:700;color:${saldoFinal >= 0 ? 'var(--green)' : 'var(--red)'}">${fmt(saldoFinal)}</div></div>
    </div>`;

  const melhorIdx = sobras.indexOf(Math.max(...sobras));
  const piorIdx = sobras.indexOf(Math.min(...sobras));
  const quaseAcab = state.variaveis.filter((v: any) => v.faltam > 0 && v.faltam <= 3);
  const mesesNeg = sobras.filter(s => s < 0).length;
  const icons: any = { danger: '⚠', warn: '⚡', info: 'ℹ', success: '✓' };
  const arr = [
    mesesNeg > 0 ? { t: 'danger', msg: `${mesesNeg} mês(es) com despesas maiores que a receita.` } : null,
    { t: 'info', msg: `Melhor mês: <strong>${labels[melhorIdx]}</strong> — sobra de ${fmt(sobras[melhorIdx])}` },
    { t: sobras[piorIdx] < 0 ? 'danger' : 'warn', msg: `Mês mais apertado: <strong>${labels[piorIdx]}</strong> — ${fmt(sobras[piorIdx])}` },
    quaseAcab.length ? { t: 'success', msg: `${quaseAcab.length} parcela(s) terminam em até 3 meses — libera ${fmt(quaseAcab.reduce((a: number, v: any) => a + v.mensal, 0))}/mês.` } : null,
    saldoFinal > 0 ? { t: 'success', msg: `Nesse ritmo, acumula ${fmt(saldoFinal)} em caixa nos próximos 12 meses.` } : { t: 'danger', msg: `Nesse ritmo, o caixa ficará ${fmt(saldoFinal)} em 12 meses.` }
  ].filter(Boolean);
  
  document.getElementById('div-analise')!.innerHTML = arr.map((a: any) => `<div class="alert alert-${a.t}"><span class="alert-icon">${icons[a.t]}</span><span>${a.msg}</span></div>`).join('');
}