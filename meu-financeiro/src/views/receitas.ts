import { state, markUnsaved } from '../store';
import { fmt, fmtDate, escHtml, uid, toast } from '../utils';

export function renderReceitas() {
  const tb = document.getElementById('tbody-receitas');
  if (!tb) return;

  const sorted = [...state.receitas].sort((a: any, b: any) => (a.inicio || '').localeCompare(b.inicio || ''));
  
  if (!sorted.length) {
    tb.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="es-icon">💵</div><p>Nenhuma receita cadastrada</p></div></td></tr>';
    return;
  }
  
  tb.innerHTML = sorted.map((r: any) => `
    <tr>
      <td style="font-weight:600">${escHtml(r.desc)}</td>
      <td style="color:var(--green);font-weight:700">${fmt(r.valor)}</td>
      <td style="color:var(--text-t);font-size:12px">${fmtDate(r.inicio)}</td>
      <td style="color:var(--text-t);font-size:12px">${fmtDate(r.fim)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-xs" onclick="editReceita(${r.id})">Editar</button>
          <button class="btn btn-danger btn-xs" onclick="delReceita(${r.id})">Rem.</button>
        </div>
      </td>
    </tr>`).join('');
}

export function openFormReceita() {
  document.getElementById('form-receita-title')!.textContent = 'Nova receita';
  (document.getElementById('r-id') as HTMLInputElement).value = '';
  document.getElementById('form-receita')!.style.display = 'block';
  document.getElementById('form-receita')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function editReceita(id: number) {
  const r = state.receitas.find((r: any) => r.id === id);
  if (!r) return;
  (document.getElementById('r-desc') as HTMLInputElement).value = r.desc;
  (document.getElementById('r-valor') as HTMLInputElement).value = r.valor;
  (document.getElementById('r-inicio') as HTMLInputElement).value = r.inicio || '';
  (document.getElementById('r-fim') as HTMLInputElement).value = r.fim || '';
  (document.getElementById('r-id') as HTMLInputElement).value = r.id;
  
  document.getElementById('form-receita-title')!.textContent = 'Editar receita';
  document.getElementById('form-receita')!.style.display = 'block';
  document.getElementById('form-receita')!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function saveReceita() {
  const desc = (document.getElementById('r-desc') as HTMLInputElement).value.trim();
  const valor = parseFloat((document.getElementById('r-valor') as HTMLInputElement).value) || 0;
  
  if (!desc || !valor) { toast('⚠ Preencha descrição e valor.'); return; }
  
  const obj = {
    desc,
    valor,
    inicio: (document.getElementById('r-inicio') as HTMLInputElement).value,
    fim: (document.getElementById('r-fim') as HTMLInputElement).value
  };
  
  const id = (document.getElementById('r-id') as HTMLInputElement).value;
  if (id) {
    const i = state.receitas.findIndex((r: any) => r.id == id);
    if (i >= 0) state.receitas[i] = { ...state.receitas[i], ...obj };
  } else {
    state.receitas.push({ id: uid(), ...obj });
  }
  
  document.getElementById('form-receita')!.style.display = 'none';
  renderReceitas();
  markUnsaved();
  toast('Receita salva!');
}

export function delReceita(id: number) {
  if (!confirm('Remover?')) return;
  state.receitas = state.receitas.filter((r: any) => r.id !== id);
  renderReceitas();
  markUnsaved();
  toast('Removida.');
}