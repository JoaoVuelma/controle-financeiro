import { state, markUnsaved } from '../store';
import { fmt, fmtDate, getCatNome, getPagNome, CAT_COLORS, escHtml, uid, toast, MESES } from '../utils';
import { gastosCobrancaMes, incideNoMes, gastoRealCat, parseLocalDate, getMesCobranca } from '../finance';
export function renderGastos() {
  const m = parseInt((document.getElementById('g-mes') as HTMLSelectElement).value);
  const y = parseInt((document.getElementById('g-ano') as HTMLSelectElement).value);
  
  if (!state.gastos) state.gastos = [];

  // Gastos literias (pela data da compra) vs. Gastos contábeis (pela fatura)
  const gastosMes = state.gastos.filter((g: any) => {
    const d = parseLocalDate(g.data);
    return d && d.getFullYear() === y && d.getMonth() === m;
  });
  const gastosOrc = gastosCobrancaMes(m, y);

  // Aqui buscamos apenas os limites que configuramos (fixas)
  const fixasVigentes = state.fixas.filter((f: any) =>
    incideNoMes(f.inicio, f.fim, m, y) && f.pag !== 6 && f.pag !== 'Poupança'
  );

  const orcamentoTotal = fixasVigentes.reduce((acc: number, f: any) => acc + f.limite, 0);
  const gastoTotal = gastosOrc.reduce((acc: number, g: any) => acc + g.valor, 0);
  const saldoLivre = orcamentoTotal - gastoTotal;

  // Renderiza métricas superiores
  const metricsEl = document.getElementById('g-metrics');
  if (metricsEl) {
    metricsEl.innerHTML = `
      <div class="metric">
        <div class="metric-label">Orçamento total</div>
        <div class="metric-value mv-blue">${fmt(orcamentoTotal)}</div>
        <div class="metric-sub">Soma dos seus limites</div>
      </div>
      <div class="metric">
        <div class="metric-label">Gasto real</div>
        <div class="metric-value ${gastoTotal > orcamentoTotal ? 'mv-red' : 'mv-amber'}">${fmt(gastoTotal)}</div>
        <div class="metric-sub">${gastosOrc.length} lançamentos na fatura</div>
      </div>
      <div class="metric">
        <div class="metric-label">${saldoLivre >= 0 ? 'Livre nas categorias' : 'Estourou geral'}</div>
        <div class="metric-value ${saldoLivre >= 0 ? 'mv-green' : 'mv-red'}">${fmt(Math.abs(saldoLivre))}</div>
        <div class="metric-sub">Orçamento vs Gasto</div>
      </div>`;
  }

  // Renderiza os Budget Cards (Limites vs Gastos por Categoria)
  const bC = document.getElementById('g-budget-cards');
  if (bC) {
    if (!fixasVigentes.length) {
      bC.innerHTML = '<div class="empty-state"><div class="es-icon">📋</div><p>Nenhum limite configurado para este mês.</p></div>';
    } else {
      const catMap: any = {};
      fixasVigentes.forEach((f: any) => {
        const k = f.cat;
        if (!catMap[k]) catMap[k] = { limite: 0, desc: getCatNome(f.cat) };
        catMap[k].limite += f.limite;
      });

      bC.innerHTML = Object.entries(catMap).map(([catId, info]: [string, any]) => {
        const gasto = gastoRealCat(parseInt(catId) || catId, m, y);
        const limite = info.limite;
        const resto = limite - gasto;
        const pct = limite > 0 ? Math.min(100, Math.round(gasto / limite * 100)) : 0;
        const cor = gasto > limite ? '#E24B4A' : pct >= 80 ? '#BA7517' : '#1D9E75';
        const cor2 = gasto > limite ? 'over' : pct >= 80 ? 'warn' : 'ok';
        
        return `
          <div class="budget-card">
            <div class="budget-card-head">
              <div class="budget-cat-name">
                <span class="cat-dot" style="background:${CAT_COLORS[info.desc] || '#888'};width:10px;height:10px;border-radius:3px"></span>
                ${escHtml(info.desc)}
              </div>
              <div class="budget-values">
                <strong style="color:${cor}">${fmt(gasto)}</strong><span> / ${fmt(limite)}</span>
              </div>
            </div>
            <div class="budget-prog-bar"><div class="budget-prog-fill" style="width:${pct}%;background:${cor}"></div></div>
            <div class="budget-footer">
              <span>${pct}% consumido</span>
              <span class="restante-${cor2}">${resto >= 0 ? 'Sobra ' + fmt(resto) : 'Passou ' + fmt(Math.abs(resto))}</span>
            </div>
          </div>`;
      }).join('');
    }
  }

  // Renderiza Lista de Gastos
  const lista = document.getElementById('g-lista');
  const empty = document.getElementById('g-lista-empty');
  const titleEl = document.getElementById('g-lista-title');
  if(titleEl) titleEl.textContent = `Lançamentos (Fatura e Avulsos de ${MESES[m]})`;

  const setIds = new Set();
  const arr: any[] = [];
  gastosOrc.forEach((g: any) => { setIds.add(g.id); arr.push(g); });
  gastosMes.forEach((g: any) => { if (!setIds.has(g.id)) { setIds.add(g.id); arr.push(g); } });

  if (lista && empty) {
    if (!arr.length) {
      lista.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      const sorted = arr.sort((a, b) => b.data.localeCompare(a.data));
      lista.innerHTML = sorted.map(g => {
        const nC = getCatNome(g.cat);
        const nP = getPagNome(g.pag);
        
        let tag = '';
        const mc = getMesCobranca(g.data, g.pag);
        const dg = parseLocalDate(g.data);
        if (mc && dg && (mc.m !== dg.getMonth() || mc.y !== dg.getFullYear())) {
          if (mc.m === m && mc.y === y) tag = `<span style="font-size:10px;padding:1px 7px;border-radius:4px;font-weight:600;background:var(--blue-light);color:var(--blue-dark);margin-left:4px">compra de ${MESES[dg.getMonth()].slice(0,3)}</span>`;
          else tag = `<span style="font-size:10px;padding:1px 7px;border-radius:4px;font-weight:600;background:var(--amber-light);color:var(--amber-dark);margin-left:4px">fatura ${MESES[mc.m].slice(0,3)}</span>`;
        }

        return `
          <div class="gasto-item">
            <span class="gasto-dot" style="background:${CAT_COLORS[nC] || '#888'}"></span>
            <div class="gasto-info">
              <div class="gasto-desc">${escHtml(g.desc || nC)}${tag}</div>
              <div class="gasto-meta">${escHtml(nC)} · ${escHtml(nP.replace('Conta Corrente ','CC '))} · ${fmtDate(g.data)}</div>
            </div>
            <span class="gasto-valor">− ${fmt(g.valor)}</span>
            <button class="gasto-del" onclick="delGasto(${g.id})" title="Remover">×</button>
          </div>`;
      }).join('');
    }
  }
}

export function salvarGasto() {
  const valor = parseFloat((document.getElementById('mg-valor') as HTMLInputElement).value);
  const cR = (document.getElementById('mg-cat') as HTMLInputElement).value;
  const data = (document.getElementById('mg-data') as HTMLInputElement).value;

  if (!valor || valor <= 0) { toast('⚠ Informe o valor.'); return; }
  if (!cR) { toast('⚠ Selecione uma categoria.'); return; }
  if (!data) { toast('⚠ Informe a data.'); return; }

  const obj = {
    cat: parseInt(cR) || cR,
    desc: (document.getElementById('mg-desc') as HTMLInputElement).value.trim(),
    valor,
    pag: parseInt((document.getElementById('mg-pag') as HTMLSelectElement).value),
    data
  };

  const id = (document.getElementById('mg-id') as HTMLInputElement).value;
  if (id) {
    const i = state.gastos.findIndex((g: any) => g.id == id);
    if (i >= 0) state.gastos[i] = { ...state.gastos[i], ...obj };
  } else {
    state.gastos.push({ id: uid(), ...obj });
  }

  document.getElementById('modal-gasto')!.style.display = 'none';
  renderGastos();
  markUnsaved();
  toast('✓ Gasto lançado!');
}

export function delGasto(id: number) {
  if (!confirm('Remover este lançamento?')) return;
  state.gastos = state.gastos.filter((g: any) => g.id !== id);
  renderGastos();
  markUnsaved();
  toast('Removido.');
}

export function abrirModalGasto(idEdicao?: number) {
  const catsSet = new Set([1,2,3,4,5,6,7,8,9,10,11]);
  state.fixas.forEach((f: any) => catsSet.add(f.cat));
  const chips = document.getElementById('mg-cat-chips');
  
  if(chips) {
    chips.innerHTML = [...catsSet].map(cid => {
      const n = getCatNome(cid); 
      const cor = CAT_COLORS[n] || '#888';
      return `<button type="button" class="cat-chip" data-cat="${cid}" onclick="selecionarCatChip(this,${JSON.stringify(cid)})"><span style="width:8px;height:8px;border-radius:2px;background:${cor}"></span>${escHtml(n)}</button>`;
    }).join('');
  }

  const h = new Date();
  (document.getElementById('mg-data') as HTMLInputElement).value = `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,'0')}-${String(h.getDate()).padStart(2,'0')}`;
  (document.getElementById('mg-valor') as HTMLInputElement).value = ''; 
  (document.getElementById('mg-desc') as HTMLInputElement).value = ''; 
  (document.getElementById('mg-cat') as HTMLInputElement).value = ''; 
  (document.getElementById('mg-id') as HTMLInputElement).value = '';
  document.getElementById('modal-gasto-title')!.textContent = '📝 Lançar gasto';

  if (idEdicao) {
    const g = state.gastos.find((g: any) => g.id === idEdicao);
    if (g) {
      (document.getElementById('mg-valor') as HTMLInputElement).value = g.valor; 
      (document.getElementById('mg-desc') as HTMLInputElement).value = g.desc || ''; 
      (document.getElementById('mg-data') as HTMLInputElement).value = g.data;
      (document.getElementById('mg-cat') as HTMLInputElement).value = g.cat; 
      (document.getElementById('mg-id') as HTMLInputElement).value = g.id;
      document.getElementById('modal-gasto-title')!.textContent = '✏️ Editar gasto';
      
      if(chips) {
        const cE = chips.querySelector(`[data-cat="${g.cat}"]`) as HTMLElement; 
        if(cE) selecionarCatChip(cE, g.cat);
      }
      const sel = document.getElementById('mg-pag') as HTMLSelectElement; 
      const opt = Array.from(sel.options).find(o => o.value == g.pag || o.text === getPagNome(g.pag)); 
      if(opt) sel.value = opt.value;
    }
  }
  document.getElementById('modal-gasto')!.style.display = 'flex';
  setTimeout(() => document.getElementById('mg-valor')!.focus(), 120);
}

export function selecionarCatChip(el: HTMLElement, cid: any) {
  document.querySelectorAll('#mg-cat-chips .cat-chip').forEach((c: any) => { 
    c.classList.remove('selected'); 
    c.style.background = ''; 
    c.style.color = ''; 
  });
  const n = getCatNome(cid); 
  const cor = CAT_COLORS[n] || '#888';
  el.classList.add('selected'); 
  el.style.background = cor; 
  el.style.color = '#fff';
  (document.getElementById('mg-cat') as HTMLInputElement).value = cid;
}

export function fecharModalGasto() { 
  document.getElementById('modal-gasto')!.style.display = 'none'; 
}