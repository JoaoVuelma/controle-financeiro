import { state, markUnsaved } from '../store';
import { fmt, getCatNome, getPagNome, catWrap, payTag, escHtml, uid, toast, MESES } from '../utils';
import { getDespesaVariavelMes, parcelasRestantesEm, parseLocalDate, ultimoDia } from '../finance';

export function renderVariaveis() {
  const m = parseInt((document.getElementById('dash-mes') as HTMLSelectElement).value);
  const y = parseInt((document.getElementById('dash-ano') as HTMLSelectElement).value);

  const tbV = document.getElementById('tbody-variaveis');
  if (!tbV) return;

  const sortedV = [...state.variaveis].sort((a: any, b: any) => (a.inicio || '').localeCompare(b.inicio || ''));
  const totMensal = getDespesaVariavelMes(m, y);
  const totRest = sortedV.reduce((a: number, v: any) => a + (v.mensal * v.faltam), 0);

  if (!sortedV.length) {
    tbV.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="es-icon">🛒</div><p>Nenhuma compra cadastrada</p></div></td></tr>';
  } else {
    tbV.innerHTML = sortedV.map((v: any) => {
      // Usa a lógica poderosa do finance.ts para saber se a parcela cai neste mês exato
      const ativa = parcelasRestantesEm(v, m, y) > 0 && parseLocalDate(v.inicio)! <= ultimoDia(m, y);
      
      return `
        <tr style="${!ativa ? 'opacity:.45' : ''}">
          <td style="font-weight:600">${escHtml(v.nome)}</td>
          <td>${catWrap(v.cat)}</td>
          <td>${fmt(v.total)}</td>
          <td style="font-weight:700">${fmt(v.mensal)}</td>
          <td style="color:var(--text-s)">${v.parcelas}x</td>
          <td><span style="color:${v.faltam > 6 ? 'var(--red)' : v.faltam > 3 ? 'var(--amber)' : 'var(--green)'};font-weight:700">${v.faltam}</span></td>
          <td>${payTag(v.pag)}</td>
          <td><span class="badge ${v.pago ? 'badge-pago' : 'badge-nao'}">${v.pago ? 'SIM' : 'NÃO'}</span></td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <button class="btn btn-ghost btn-xs" onclick="editVariavel(${v.id})">Ed.</button>
              <button class="btn ${v.pago ? 'btn-ghost' : 'btn-success'} btn-xs" onclick="togglePago(${v.id})">${v.pago ? 'Despagar' : 'Pagar'}</button>
              <button class="btn btn-danger btn-xs" onclick="delVariavel(${v.id})">Rem.</button>
            </div>
          </td>
        </tr>`;
    }).join('') + `
      <tr style="background:var(--bg2);border-top:2px solid var(--border-s)">
        <td colspan="3" style="font-weight:700">Impacto em ${MESES[m]}</td>
        <td style="font-weight:700;color:var(--red)">${fmt(totMensal)}</td>
        <td colspan="2" style="font-size:11px;color:var(--text-t)">Dívida restante:</td>
        <td colspan="3" style="font-weight:700;color:var(--amber)">${fmt(totRest)}</td>
      </tr>`;
  }
}

export function calcParcela() {
  const t = parseFloat((document.getElementById('v-total') as HTMLInputElement).value) || 0;
  const p = parseInt((document.getElementById('v-parcelas') as HTMLInputElement).value) || 1;
  if (t && p) {
    (document.getElementById('v-mensal') as HTMLInputElement).value = (Math.round((t / p) * 100) / 100).toString();
  }
}

export function openFormVariavel() {
  document.getElementById('form-variavel-title')!.textContent = 'Nova compra / parcela';
  (document.getElementById('v-id') as HTMLInputElement).value = '';
  document.getElementById('form-variavel')!.style.display = 'block';
  document.getElementById('form-variavel')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function editVariavel(id: number) {
  const v = state.variaveis.find((v: any) => v.id === id);
  if (!v) return;
  (document.getElementById('v-nome') as HTMLInputElement).value = v.nome;
  (document.getElementById('v-total') as HTMLInputElement).value = v.total;
  (document.getElementById('v-mensal') as HTMLInputElement).value = v.mensal;
  (document.getElementById('v-parcelas') as HTMLInputElement).value = v.parcelas;
  (document.getElementById('v-faltam') as HTMLInputElement).value = v.faltam;
  (document.getElementById('v-inicio') as HTMLInputElement).value = v.inicio || '';
  (document.getElementById('v-pago') as HTMLInputElement).checked = v.pago;
  (document.getElementById('v-id') as HTMLInputElement).value = v.id;

  const vC = document.getElementById('v-cat') as HTMLSelectElement;
  const oc = Array.from(vC.options).find(o => o.value == v.cat || o.text === getCatNome(v.cat));
  if (oc) vC.value = oc.value;

  const vP = document.getElementById('v-pag') as HTMLSelectElement;
  const op = Array.from(vP.options).find(o => o.value == v.pag || o.text === getPagNome(v.pag));
  if (op) vP.value = op.value;

  document.getElementById('form-variavel-title')!.textContent = 'Editar compra/parcela';
  document.getElementById('form-variavel')!.style.display = 'block';
  document.getElementById('form-variavel')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function saveVariavel() {
  const nome = (document.getElementById('v-nome') as HTMLInputElement).value.trim();
  if (!nome) { toast('⚠ Preencha o nome.'); return; }

  const cR = (document.getElementById('v-cat') as HTMLSelectElement).value;
  const pR = (document.getElementById('v-pag') as HTMLSelectElement).value;

  const obj = {
    nome,
    cat: parseInt(cR) || cR,
    total: parseFloat((document.getElementById('v-total') as HTMLInputElement).value) || 0,
    mensal: parseFloat((document.getElementById('v-mensal') as HTMLInputElement).value) || 0,
    parcelas: parseInt((document.getElementById('v-parcelas') as HTMLInputElement).value) || 1,
    faltam: parseInt((document.getElementById('v-faltam') as HTMLInputElement).value) || 0,
    pag: parseInt(pR) || pR,
    inicio: (document.getElementById('v-inicio') as HTMLInputElement).value,
    pago: (document.getElementById('v-pago') as HTMLInputElement).checked
  };

  const id = (document.getElementById('v-id') as HTMLInputElement).value;
  if (id) {
    const i = state.variaveis.findIndex((v: any) => v.id == id);
    if (i >= 0) state.variaveis[i] = { ...state.variaveis[i], ...obj };
  } else {
    state.variaveis.push({ id: uid(), ...obj });
  }

  document.getElementById('form-variavel')!.style.display = 'none';
  renderVariaveis();
  markUnsaved();
  toast('Compra/parcela salva!');
}

export function togglePago(id: number) {
  const v = state.variaveis.find((v: any) => v.id === id);
  if (!v) return;
  if (!v.pago) {
    v.pago = true;
    v.faltam = Math.max(0, v.faltam - 1);
    toast(`✓ Pago! Faltam ${v.faltam} parcelas.`);
  } else {
    v.pago = false;
    v.faltam = Math.min(v.parcelas, v.faltam + 1);
    toast('Marcado como não pago.');
  }
  renderVariaveis();
  markUnsaved();
}

export function delVariavel(id: number) {
  if (!confirm('Remover?')) return;
  state.variaveis = state.variaveis.filter((v: any) => v.id !== id);
  renderVariaveis();
  markUnsaved();
  toast('Removido.');
}