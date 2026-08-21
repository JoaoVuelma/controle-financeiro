import { state } from '../store';
import { fmt, getPagNome, payTag, escHtml, charts, destroyChart, PAY_COLORS, MESES } from '../utils';
import { getDespesaVariavelMes, parcelasRestantesEm, parseLocalDate, ultimoDia } from '../finance';

declare const Chart: any;

export function renderParcelas() {
  const m = parseInt((document.getElementById('dash-mes') as HTMLSelectElement).value);
  const y = parseInt((document.getElementById('dash-ano') as HTMLSelectElement).value);

  const ativas = state.variaveis.filter((v: any) => parcelasRestantesEm(v, m, y) > 0 && parseLocalDate(v.inicio)! <= ultimoDia(m, y)).sort((a: any, b: any) => (a.inicio || '').localeCompare(b.inicio || ''));
  const totMensal = getDespesaVariavelMes(m, y);
  const totRest = ativas.reduce((a: number, v: any) => a + v.mensal * v.faltam, 0);
  const maxP = ativas.length ? Math.max(...ativas.map((v: any) => v.faltam)) : 0;

  document.getElementById('metrics-parcelas')!.innerHTML = `
    <div class="metric"><div class="metric-label">Comprometimento em ${MESES[m]}</div><div class="metric-value mv-red">${fmt(totMensal)}</div><div class="metric-sub">${ativas.length} parcelas ativas</div></div>
    <div class="metric"><div class="metric-label">Total restante</div><div class="metric-value mv-amber">${fmt(totRest)}</div><div class="metric-sub">dívida acumulada</div></div>
    <div class="metric"><div class="metric-label">Prazo mais longo</div><div class="metric-value mv-blue">${maxP} meses</div></div>`;

  document.getElementById('tbody-parcelas')!.innerHTML = ativas.length
    ? ativas.map((v: any) => {
        const fim = parseLocalDate(v.inicio)!; fim.setMonth(fim.getMonth() + v.parcelas);
        return `
          <tr>
            <td style="font-weight:600">${escHtml(v.nome)}</td>
            <td>${payTag(v.pag)}</td>
            <td style="font-weight:700">${fmt(v.mensal)}</td>
            <td><span style="color:${v.faltam <= 2 ? 'var(--amber)' : 'var(--text)'};font-weight:${v.faltam <= 2 ? 700 : 400}">${v.faltam}x</span></td>
            <td>${fmt(v.mensal * v.faltam)}</td>
            <td style="font-size:12px;color:var(--text-t)">${fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
            <td>${v.faltam <= 2 ? '<span class="badge badge-warn">Quase acabando</span>' : '<span class="badge badge-neutral">Em andamento</span>'}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="7"><div class="empty-state"><div class="es-icon">🎉</div><p>Nenhuma parcela ativa em ${MESES[m]}!</p></div></td></tr>`;

  const cartT: any = {};
  ativas.forEach((v: any) => { const n = getPagNome(v.pag); cartT[n] = (cartT[n] || 0) + v.mensal; });
  const cE = Object.entries(cartT).sort((a: any, b: any) => b[1] - a[1]);
  
  destroyChart('chartCartoes');
  if (cE.length) charts.chartCartoes = new Chart(document.getElementById('chartCartoes'), {
    type: 'bar', data: { labels: cE.map(k => k[0].replace('Conta Corrente ', 'CC ')), datasets: [{ data: cE.map(k => Math.round(k[1] as number)), backgroundColor: cE.map(k => PAY_COLORS[k[0]] || '#888'), borderWidth: 0, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v: any) => fmt(v), font: { size: 10 } } }, y: { ticks: { font: { size: 11 } } } } }
  });

  const libT: any = {};
  ativas.forEach((v: any) => {
    const fim = parseLocalDate(v.inicio)!; fim.setMonth(fim.getMonth() + v.parcelas);
    const key = MESES[fim.getMonth()].slice(0, 3) + '/' + String(fim.getFullYear()).slice(-2);
    libT[key] = (libT[key] || 0) + v.mensal;
  });
  const lE = Object.entries(libT).sort();
  
  destroyChart('chartLiberacao');
  if (lE.length) charts.chartLiberacao = new Chart(document.getElementById('chartLiberacao'), {
    type: 'bar', data: { labels: lE.map(k => k[0]), datasets: [{ label: 'Liberado', data: lE.map(k => Math.round(k[1] as number)), backgroundColor: 'rgba(16,185,129,.4)', borderColor: '#10b981', borderWidth: 1.5, borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: any) => fmt(v), font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.15)' } }, x: { ticks: { font: { size: 10 } } } } }
  });
}