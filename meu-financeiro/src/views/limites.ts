import { state, markUnsaved } from '../store';
import { fmt, getCatNome, catWrap, payTag, escHtml, uid, toast, MESES } from '../utils';
import { getLimiteVsGastoMes, incideNoMes } from '../finance';

export function renderLimites() {
  const m = parseInt((document.getElementById('dash-mes') as HTMLSelectElement).value);
  const y = parseInt((document.getElementById('dash-ano') as HTMLSelectElement).value);

  const tbF = document.getElementById('tbody-fixas');
  if (!tbF) return;

  const sortedF = [...state.fixas].sort((a, b) => a.inicio.localeCompare(b.inicio));

  if (!sortedF.length) {
    tbF.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="es-icon">📋</div><p>Nenhum limite/despesa configurado</p></div></td></tr>';
  } else {
    // Aqui usamos a nova função do finance.ts
    const totalGastoMes = getLimiteVsGastoMes(m, y); 
    const totalLimiteMes = sortedF
      .filter(f => incideNoMes(f.inicio, f.fim, m, y))
      .reduce((acc, f) => acc + f.limite, 0);

    tbF.innerHTML = sortedF.map(f => {
      const diff = f.limite - f.valor; // O valor aqui pode ser atualizado para refletir o gasto real depois
      const pct = f.limite > 0 ? Math.min(100, Math.round(f.valor / f.limite * 100)) : 0;
      const ativa = incideNoMes(f.inicio, f.fim, m, y);
      
      const status = !ativa ? '<span class="badge badge-neutral">Fora do período</span>'
        : f.valor === 0 ? '<span class="badge badge-neutral">Não usado</span>'
        : diff < 0 ? `<span class="badge badge-over">Estourou ${fmt(Math.abs(diff))}</span>`
        : '<span class="badge badge-ok">OK</span>';

      return `
        <tr style="${!ativa ? 'opacity:.45' : ''}">
          <td style="font-weight:600">${escHtml(f.desc)}</td>
          <td>${catWrap(f.cat)}</td>
          <td>${fmt(f.limite)}</td>
          <td>
            <span style="font-weight:700">${fmt(f.valor)}</span>
            <div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${diff < 0 ? '#E24B4A' : '#1D9E75'}"></div></div>
            <div class="prog-labels"><span>${pct}%</span><span>${fmt(f.limite)}</span></div>
          </td>
          <td>${status}</td>
          <td>${payTag(f.pag)}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-xs" onclick="editFixa(${f.id})">Ed.</button>
              <button class="btn btn-danger btn-xs" onclick="delFixa(${f.id})">Rem.</button>
            </div>
          </td>
        </tr>`;
    }).join('') + `
      <tr style="background:var(--bg3);border-top:2px solid var(--border-s)">
        <td colspan="2" style="font-weight:700;padding:10px">Total ${MESES[m]}</td>
        <td style="font-weight:600;color:var(--text-s)">${fmt(totalLimiteMes)}</td>
        <td style="font-weight:700;color:var(--red)">${fmt(totalGastoMes)}</td>
        <td colspan="3" style="font-size:11px;color:var(--text-t)">Previsão vs Gastos em ${MESES[m]}</td>
      </tr>`;
  }
}

export function openFormFixa() {
  const title = document.getElementById('form-fixa-title');
  if (title) title.textContent = 'Novo Limite / Despesa Fixa';
  (document.getElementById('f-id') as HTMLInputElement).value = '';
  document.getElementById('form-fixa')!.style.display = 'block';
  document.getElementById('form-fixa')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function editFixa(id: number) {
  const f = state.fixas.find((f: any) => f.id === id);
  if (!f) return;
  (document.getElementById('f-desc') as HTMLInputElement).value = f.desc;
  (document.getElementById('f-limite') as HTMLInputElement).value = f.limite;
  (document.getElementById('f-valor') as HTMLInputElement).value = f.valor;
  (document.getElementById('f-inicio') as HTMLInputElement).value = f.inicio || '';
  (document.getElementById('f-fim') as HTMLInputElement).value = f.fim || '';
  (document.getElementById('f-id') as HTMLInputElement).value = f.id;

  const fCat = document.getElementById('f-cat') as HTMLSelectElement;
  const catOpt = Array.from(fCat.options).find(o => o.value == f.cat || o.text === getCatNome(f.cat));
  if (catOpt) fCat.value = catOpt.value;

  const fPag = document.getElementById('f-pag') as HTMLSelectElement;
  const pagOpt = Array.from(fPag.options).find(o => o.value == f.pag);
  if (pagOpt) fPag.value = pagOpt.value;

  document.getElementById('form-fixa-title')!.textContent = 'Editar Limite / Despesa';
  document.getElementById('form-fixa')!.style.display = 'block';
  document.getElementById('form-fixa')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function saveFixa() {
  const desc = (document.getElementById('f-desc') as HTMLInputElement).value.trim();
  if (!desc) { toast('⚠ Preencha a descrição.'); return; }

  const catRaw = (document.getElementById('f-cat') as HTMLSelectElement).value;
  const pagRaw = (document.getElementById('f-pag') as HTMLSelectElement).value;

  const obj = {
    desc,
    cat: parseInt(catRaw) || catRaw,
    limite: parseFloat((document.getElementById('f-limite') as HTMLInputElement).value) || 0,
    valor: parseFloat((document.getElementById('f-valor') as HTMLInputElement).value) || 0,
    pag: pagRaw ? (parseInt(pagRaw) || pagRaw) : "",
    inicio: (document.getElementById('f-inicio') as HTMLInputElement).value,
    fim: (document.getElementById('f-fim') as HTMLInputElement).value,
  };
  
  const id = (document.getElementById('f-id') as HTMLInputElement).value;

  if (id) {
    const i = state.fixas.findIndex((f: any) => f.id == id);
    if (i >= 0) state.fixas[i] = { ...state.fixas[i], ...obj };
  } else {
    state.fixas.push({ id: uid(), ...obj });
  }

  document.getElementById('form-fixa')!.style.display = 'none';
  renderLimites();
  markUnsaved();
  toast('Limite salvo!');
}

export function delFixa(id: number) {
  if (!confirm('Remover este limite/despesa?')) return;
  state.fixas = state.fixas.filter((f: any) => f.id !== id);
  renderLimites();
  markUnsaved();
  toast('Removido.');
}