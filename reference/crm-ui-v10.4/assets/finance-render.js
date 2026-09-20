
(() => {
'use strict';
const CU=window.CU;

CU.sceneFinance=()=>{
  const view=CU.state.ui.financeView||'overview',fm=CU.financeMetrics();
  const tabs=[['overview','VISÃO GERAL'],['receive','RECEBER'],['pay','PAGAR'],['expenses','DESPESAS'],['budget','ORÇAMENTO'],['recurrence','RECORRÊNCIA'],['cashflow','FLUXO DE CAIXA'],['calendar','CALENDÁRIO']];
  return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">FINANCEIRO / ORGANIZAÇÃO OPERACIONAL</div><h1>Financeiro</h1><div class="scene-sub">Recebimentos, compromissos, orçamento e fluxo de caixa. Não substitui contabilidade.</div></div><div class="head-actions"><button class="btn" id="newExpenseBtn">+ DESPESA</button><button class="btn primary" id="registerPaymentBtn">+ PAGAMENTO</button></div></div>
  <div class="finance-hero">
    <div class="fin-card"><label>RECEBIDO NO MÊS</label><strong class="green">${CU.money(fm.received)}</strong><small>pagamentos - estornos</small></div>
    <div class="fin-card"><label>A RECEBER</label><strong>${CU.money(fm.toReceive)}</strong><small>a vencer / hoje</small></div>
    <div class="fin-card"><label>ATRASADO</label><strong class="${fm.late?'red':''}">${CU.money(fm.late)}</strong><small>saldo vencido</small></div>
    <div class="fin-card"><label>DESPESAS PAGAS</label><strong>${CU.money(fm.expensesPaid)}</strong><small>mês atual</small></div>
    <div class="fin-card"><label>A PAGAR</label><strong>${CU.money(fm.toPay)}</strong><small>inclui vencidas</small></div>
    <div class="fin-card"><label>RECORRÊNCIA ATIVA</label><strong class="cyan">${CU.money(fm.recurring)}/m</strong><small>infra + serviço</small></div>
  </div>
  <div class="finance-tabs">${tabs.map(([k,n])=>`<button class="seg-btn ${view===k?'active':''}" data-finance-view="${k}">${n}</button>`).join('')}</div>
  ${CU.financeView(view,fm)}</section>`;
};

CU.financeView=(view,fm)=>{
  if(view==='receive')return CU.financeReceive();
  if(view==='pay')return CU.financePay();
  if(view==='expenses')return CU.financeExpenses();
  if(view==='budget')return CU.financeBudget();
  if(view==='recurrence')return CU.financeRecurrence();
  if(view==='cashflow')return CU.financeCashflow(fm);
  if(view==='calendar')return CU.financeCalendar();
  return CU.financeOverview(fm);
};

CU.financeOverview=fm=>`<div class="grid">
<div class="panel s7"><div class="panel-head"><b>RESULTADO OPERACIONAL REGISTRADO</b><span>mês atual</span></div><div class="panel-body"><div class="ctx-row"><span>Receitas recebidas registradas</span><strong class="green">${CU.money(fm.received)}</strong></div><div class="ctx-row"><span>Despesas pagas registradas</span><strong>${CU.money(fm.expensesPaid)}</strong></div><div style="height:1px;background:var(--line2);margin:11px 0"></div><div class="ctx-row"><span>Resultado operacional registrado</span><strong class="${fm.operational>=0?'green':'red'}">${CU.money(fm.operational)}</strong></div><p class="muted" style="font-size:9px">Conta: recebido - despesas pagas. Não é lucro contábil.</p></div></div>
<div class="panel s5"><div class="panel-head"><b>PRÓXIMOS COMPROMISSOS</b><span>financeiro</span></div><div class="panel-body">${CU.financialUpcoming(5)}</div></div>
<div class="panel s12"><div class="panel-head"><b>ORÇAMENTO DO MÊS</b><button class="btn sm ghost" data-finance-view="budget">ABRIR ORÇAMENTO</button></div><div class="panel-body">${CU.budgetSummary()}</div></div>
</div>`;

CU.financeReceive=()=>`<div class="panel"><div class="panel-head"><b>CONTAS A RECEBER</b><span>cliente · projeto · parcela</span></div><div class="panel-body" style="overflow:auto"><table class="money-table"><thead><tr><th>Descrição</th><th>Cliente</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Saldo</th><th></th></tr></thead><tbody>${CU.state.receivables.map(r=>`<tr><td>${CU.esc(r.description)}</td><td>${CU.esc(CU.clientName(r.clientId))}</td><td>${CU.fmtDate(r.due)}</td><td>${CU.statusReceivableLabel(CU.recStatus(r))}</td><td class="amount">${CU.money(r.amount)}</td><td class="amount">${CU.money(CU.remainingReceivable(r))}</td><td>${CU.remainingReceivable(r)>0?`<button class="btn sm primary" data-pay-receivable="${r.id}">REGISTRAR</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`;

CU.financePay=()=>`<div class="panel"><div class="panel-head"><b>CONTAS A PAGAR</b><span>vencimentos</span></div><div class="panel-body" style="overflow:auto"><table class="money-table"><thead><tr><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Vencimento</th><th>Status</th><th>Valor</th><th></th></tr></thead><tbody>${CU.state.expenses.map(e=>`<tr><td>${CU.esc(e.description)}</td><td>${CU.esc(e.category)}</td><td>${CU.esc(e.supplier||'—')}</td><td>${CU.fmtDate(e.due)}</td><td>${CU.statusExpenseLabel(CU.expStatus(e))}</td><td class="amount">${CU.money(e.amount)}</td><td>${CU.expStatus(e)!=='paid'?`<button class="btn sm success" data-pay-expense="${e.id}">MARCAR PAGA</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`;

CU.financeExpenses=()=>{
  const fixed=CU.state.expenses.filter(e=>e.kind==='fixed').reduce((a,e)=>a+Number(e.amount),0),variable=CU.state.expenses.filter(e=>e.kind==='variable').reduce((a,e)=>a+Number(e.amount),0),one=CU.state.expenses.filter(e=>e.kind==='one').reduce((a,e)=>a+Number(e.amount),0);
  return `<div class="grid"><div class="panel s4"><div class="panel-head"><b>FIXAS / RECORRENTES</b></div><div class="panel-body"><div style="font:24px var(--mono);color:var(--text)">${CU.money(fixed)}</div><p class="muted">Compromissos cadastrados como fixos.</p></div></div><div class="panel s4"><div class="panel-head"><b>VARIÁVEIS</b></div><div class="panel-body"><div style="font:24px var(--mono);color:var(--text)">${CU.money(variable)}</div><p class="muted">Ligadas ao movimento da operação.</p></div></div><div class="panel s4"><div class="panel-head"><b>ÚNICAS</b></div><div class="panel-body"><div style="font:24px var(--mono);color:var(--text)">${CU.money(one)}</div><p class="muted">Sem recorrência.</p></div></div><div class="panel s12"><div class="panel-head"><b>DESPESAS CADASTRADAS</b></div><div class="panel-body" style="overflow:auto"><table class="money-table"><thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Status</th><th>Vencimento</th><th>Valor</th></tr></thead><tbody>${CU.state.expenses.map(e=>`<tr><td>${CU.esc(e.description)}</td><td>${CU.kindLabel(e.kind)}</td><td>${CU.esc(e.category)}</td><td>${CU.statusExpenseLabel(CU.expStatus(e))}</td><td>${CU.fmtDate(e.due)}</td><td class="amount">${CU.money(e.amount)}</td></tr>`).join('')}</tbody></table></div></div></div>`;
};

CU.financeBudget=()=>`<div class="grid"><div class="panel s8"><div class="panel-head"><b>ORÇAMENTO · ${CU.state.budgets.month}</b><span>planejado x realizado pago</span></div><div class="panel-body" style="overflow:auto"><table class="money-table"><thead><tr><th>Categoria</th><th>Planejado</th><th>Realizado</th><th>Diferença</th><th>Uso</th><th></th></tr></thead><tbody>${CU.state.budgets.categories.map(c=>{const actual=CU.actualBudget(c.name),diff=actual-Number(c.planned),pct=c.planned?Math.min(100,(actual/c.planned)*100):0;return `<tr><td>${CU.esc(c.name)}</td><td class="amount">${CU.money(c.planned)}</td><td class="amount">${CU.money(actual)}</td><td class="amount ${diff>0?'red':'green'}">${diff>=0?'+ ':''}${CU.money(diff)}</td><td style="min-width:130px"><div class="budget-bar ${diff>0?'over':''}"><span style="width:${pct}%"></span></div></td><td><button class="btn sm ghost" data-budget-edit="${CU.esc(c.name)}">EDITAR</button></td></tr>`}).join('')}</tbody></table></div></div><div class="panel s4"><div class="panel-head"><b>COMO LER</b></div><div class="panel-body"><p class="muted">Diferença = realizado pago - planejado. Positivo significa gasto acima do orçamento da categoria.</p></div></div></div>`;

CU.financeRecurrence=()=>{
  const infra=CU.state.recurrences.filter(r=>r.type==='infrastructure'&&r.status==='active').reduce((a,r)=>a+Number(r.amount),0),service=CU.state.recurrences.filter(r=>r.type==='service'&&r.status==='active').reduce((a,r)=>a+Number(r.amount),0);
  return `<div class="grid"><div class="panel s6"><div class="panel-head"><b>INFRAESTRUTURA RECORRENTE</b></div><div class="panel-body"><div style="font:24px var(--mono)" class="cyan">${CU.money(infra)}/m</div><p class="muted">Hospedagem, domínio e serviços necessários para manter ativos publicados.</p>${CU.state.recurrences.filter(r=>r.type==='infrastructure').map(r=>`<div class="simple-row"><div><b>${CU.esc(r.name)}</b><p>${r.status}</p></div><strong>${CU.money(r.amount)}/m</strong></div>`).join('')}</div></div><div class="panel s6"><div class="panel-head"><b>SERVIÇO RECORRENTE</b></div><div class="panel-body"><div style="font:24px var(--mono)" class="green">${CU.money(service)}/m</div><p class="muted">Suporte/acompanhamento somente quando existe entrega recorrente real.</p>${CU.state.recurrences.filter(r=>r.type==='service').map(r=>`<div class="simple-row"><div><b>${CU.esc(r.name)}</b><p>${r.status}</p></div><strong>${CU.money(r.amount)}/m</strong></div>`).join('')}</div></div></div>`;
};

CU.financeCashflow=fm=>{
  const incoming=CU.state.receivables.filter(r=>CU.remainingReceivable(r)>0&&r.status!=='cancelled').reduce((a,r)=>a+CU.remainingReceivable(r),0),outgoing=CU.state.expenses.filter(e=>!['paid','cancelled'].includes(CU.expStatus(e))).reduce((a,e)=>a+Number(e.amount),0),has=CU.state.meta.openingBalance!==null&&CU.state.meta.openingBalance!=='',projected=has?Number(CU.state.meta.openingBalance)+incoming-outgoing:null;
  return `<div class="grid"><div class="panel s6"><div class="panel-head"><b>REALIZADO</b><span>mês atual</span></div><div class="panel-body"><div class="ctx-row"><span>Entradas realizadas</span><strong class="green">${CU.money(fm.received)}</strong></div><div class="ctx-row"><span>Saídas realizadas</span><strong>${CU.money(fm.expensesPaid)}</strong></div><div class="ctx-row"><span>Movimento operacional</span><strong>${CU.money(fm.operational)}</strong></div></div></div>
  <div class="panel s6"><div class="panel-head"><b>PREVISTO</b><span>valores cadastrados</span></div><div class="panel-body"><div class="ctx-row"><span>Entradas previstas</span><strong>${CU.money(incoming)}</strong></div><div class="ctx-row"><span>Saídas previstas</span><strong>${CU.money(outgoing)}</strong></div>${has?`<div class="ctx-row"><span>Saldo inicial registrado</span><strong>${CU.money(CU.state.meta.openingBalance)}</strong></div><div class="ctx-row"><span>Saldo projetado</span><strong class="${projected>=0?'green':'red'}">${CU.money(projected)}</strong></div>`:`<div class="insufficient"><b>DADOS INSUFICIENTES PARA PROJETAR SALDO</b><br>Defina um saldo inicial conferido. O CRM não inventa saldo bancário.</div><button class="btn primary" style="margin-top:10px" data-set-balance>DEFINIR SALDO INICIAL</button>`}</div></div></div>`;
};

CU.financeCalendar=()=>{
  const d=new Date(),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push(null);for(let day=1;day<=last.getDate();day++)cells.push(new Date(y,m,day));
  const ev=date=>{if(!date)return[];const iso=date.toISOString().slice(0,10),arr=[];CU.state.receivables.filter(r=>r.due===iso&&CU.remainingReceivable(r)>0).forEach(r=>arr.push({type:'in',text:`Receber ${CU.money(CU.remainingReceivable(r))}`}));CU.state.expenses.filter(e=>e.due===iso&&CU.expStatus(e)!=='paid').forEach(e=>arr.push({type:'out',text:`Pagar ${CU.money(e.amount)}`}));return arr};
  return `<div class="panel"><div class="panel-head"><b>CALENDÁRIO FINANCEIRO</b><span>${CU.month()}</span></div><div class="panel-body"><div class="calendar-grid">${['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(x=>`<div class="cal-head">${x}</div>`).join('')}${cells.map(date=>date?`<div class="cal-day"><b>${date.getDate()}</b>${ev(date).map(e=>`<div class="cal-event ${e.type}">${CU.esc(e.text)}</div>`).join('')}</div>`:'<div></div>').join('')}</div></div></div>`;
};

CU.financialUpcoming=n=>{
  const arr=[];CU.state.receivables.filter(r=>CU.remainingReceivable(r)>0).forEach(r=>arr.push({date:r.due,type:'in',title:`Receber · ${CU.clientName(r.clientId)}`,amount:CU.remainingReceivable(r)}));CU.state.expenses.filter(e=>CU.expStatus(e)!=='paid').forEach(e=>arr.push({date:e.due,type:'out',title:`Pagar · ${e.description}`,amount:e.amount}));
  return arr.sort((a,b)=>a.date.localeCompare(b.date)).slice(0,n).map(i=>`<div class="simple-row"><div><b>${CU.esc(i.title)}</b><p>${CU.fmtDate(i.date)}</p></div><strong class="${i.type==='in'?'green':'red'}">${i.type==='in'?'+ ':'- '}${CU.money(i.amount)}</strong></div>`).join('');
};
CU.budgetSummary=()=>CU.state.budgets.categories.map(c=>{const a=CU.actualBudget(c.name),p=Number(c.planned),pct=p?Math.min(100,a/p*100):0;return `<div style="display:grid;grid-template-columns:140px minmax(120px,1fr) 120px;gap:10px;align-items:center;margin:8px 0"><span style="font-size:9px">${CU.esc(c.name)}</span><div class="budget-bar ${a>p?'over':''}"><span style="width:${pct}%"></span></div><span class="mono muted" style="font-size:8px;text-align:right">${CU.money(a)} / ${CU.money(p)}</span></div>`}).join('');
CU.statusReceivableLabel=s=>({received:'<span class="green">RECEBIDO</span>',late:'<span class="red">ATRASADO</span>',today:'<span class="yellow">HOJE</span>',open:'A VENCER',cancelled:'CANCELADO'})[s]||s;
CU.statusExpenseLabel=s=>({paid:'<span class="green">PAGA</span>',late:'<span class="red">ATRASADA</span>',today:'<span class="yellow">HOJE</span>',open:'A VENCER',cancelled:'CANCELADA'})[s]||s;
CU.kindLabel=k=>({fixed:'Fixa / recorrente',variable:'Variável',one:'Única'})[k]||k;

CU.sceneJourney=()=>{
  const ms=CU.journey(),done=ms.filter(m=>m.done).length,fm=CU.financeMetrics();
  return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">JORNADA / PROGRESSO REAL</div><h1>Jornada da empresa</h1><div class="scene-sub">A empresa avança com fatos: vendas, entrega, recebimentos e recorrência. Nada de XP por clique.</div></div></div><div class="kpis"><div class="kpi" style="--c:var(--purple)"><label>MARCOS DESBLOQUEADOS</label><strong>${done}/${ms.length}</strong><small>derivados da operação</small></div><div class="kpi" style="--c:var(--green)"><label>RECEBIDO NO MÊS</label><strong>${CU.money(fm.received)}</strong><small>placar econômico</small></div><div class="kpi" style="--c:var(--cyan)"><label>RECORRÊNCIA</label><strong>${CU.money(fm.recurring)}/m</strong><small>estabilidade</small></div><div class="kpi" style="--c:var(--yellow)"><label>RISCOS ABERTOS</label><strong>${CU.risks().length}</strong><small>pedem ação</small></div></div><div class="milestones">${ms.map(m=>`<div class="milestone ${m.done?'done':'locked'}"><div class="milestone-icon">${m.done?'✓':'◇'}</div><h3>${CU.esc(m.title)}</h3><p>${CU.esc(m.text)}</p></div>`).join('')}</div></section>`;
};

CU.DOCS={
  start:{title:'Comece aqui',html:`<p>Use <b>Hoje</b> para saber o que fazer. Use <b>Vendas</b> para o funil, <b>Clientes</b> para relacionamento, <b>Trabalho</b> para ações/projetos e <b>Financeiro</b> para recebimentos e despesas.</p><h3>Regra principal</h3><p>Venda não é pagamento. Projeto não é histórico. Ação futura não é atividade passada.</p>`},
  sales:{title:'Como usar Vendas',html:`<p>Possível cliente fica separado de venda em andamento. Ao qualificar, o CRM cria uma venda no Funil.</p><p>Clique no card para abrir a Venda 360: conversa, ação, proposta, avançar etapa e decisão comercial.</p>`},
  finance:{title:'Como usar Financeiro',html:`<p>O financeiro é operacional, não contábil.</p><ul><li>Recebido = pagamentos registrados - estornos.</li><li>Resultado operacional = recebido - despesas pagas.</li><li>Orçamento compara planejado com despesas pagas.</li><li>Saldo projetado só existe depois de registrar saldo inicial.</li></ul>`},
  coop:{title:'Co-op',html:`<p>Os dois sócios usam contas individuais. No laboratório, abas podem compartilhar estado por BroadcastChannel/localStorage.</p><p>Produção deve usar backend como autoridade, sessão individual, auditoria e sincronização real.</p>`},
  safety:{title:'Segurança e produção',html:`<p>As credenciais deste laboratório não representam autenticação de produção.</p><p>Produção exige Argon2id, TOTP, sessão segura, rate limit, CSRF, autorização por mutação, auditoria e backups testados.</p>`}
};
CU.sceneManual=()=>{const topic=CU.state.ui.manualTopic||'start',d=CU.DOCS[topic];return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">MANUAL / AJUDA</div><h1>Manual do CRM</h1><div class="scene-sub">Documentação curta e permanente. O sistema deve ser simples sem decorar comandos.</div></div></div><div class="manual"><nav class="manual-nav">${Object.entries(CU.DOCS).map(([k,v])=>`<button class="${topic===k?'active':''}" data-manual="${k}">${CU.esc(v.title)}</button>`).join('')}</nav><article class="doc"><h2>${CU.esc(d.title)}</h2>${d.html}</article></div></section>`};

CU.gateFor=d=>{
  const proposal=CU.state.proposals.find(p=>p.dealId===d.id),hasAction=CU.state.actions.some(a=>a.entityType==='deal'&&a.entityId===d.id&&a.status==='open');
  const base=[{label:'Contato principal identificado',ok:!!d.contact},{label:'Próximo passo definido',ok:!!d.nextTitle&&!!d.nextDue}];
  if(['diagnostico','oferta','proposta','decisao'].includes(d.stage))base.push({label:'Problema / diagnóstico registrado',ok:(d.history||[]).some(h=>/diagn|problema|conversa/i.test(h.text))});
  if(['oferta','proposta','decisao'].includes(d.stage))base.push({label:'Solução / oferta definida',ok:(d.history||[]).some(h=>/oferta|solu/i.test(h.text))||['oferta','proposta','decisao'].includes(d.stage)});
  if(['proposta','decisao'].includes(d.stage))base.push({label:'Proposta criada',ok:!!proposal});
  base.push({label:'Existe ação futura relacionada',ok:hasAction});return base;
};

CU.contextHTML=()=>{
  const c=CU.state.ui.context;if(!c)return `<div class="ctx-empty"><b>Selecione algo</b><span>Clique numa venda, cliente, projeto ou ação para abrir detalhes sem sair da cena.</span></div>`;
  if(c.type==='deal'){
    const d=CU.state.deals.find(x=>x.id===c.id);if(!d)return `<div class="ctx-empty">Venda não encontrada.</div>`;
    const p=CU.state.proposals.find(x=>x.dealId===d.id),g=CU.gateFor(d);
    return `<div class="ctx-kicker">VENDA 360</div><div class="ctx-title">${CU.esc(d.name)}</div><div class="ctx-sub">${CU.esc(d.contact)} · ${CU.money(d.value)}</div>
    <div class="ctx-section"><div class="ctx-row"><span>Etapa</span><strong>${CU.stageName(d.stage)}</strong></div><div class="ctx-row"><span>Tempo</span><strong>${CU.dealAge(d)} dia(s)</strong></div><div class="ctx-row"><span>Responsável</span><strong>${CU.ownerName(d.owner)}</strong></div><div class="ctx-row"><span>Próximo passo</span><strong class="${d.nextDue<CU.today()?'red':''}">${CU.esc(d.nextTitle||'Não definido')} · ${CU.fmtDate(d.nextDue)}</strong></div></div>
    <div class="ctx-section"><div class="ctx-label">AÇÕES PRINCIPAIS</div><div class="context-actions"><button class="btn" data-deal-action="conversation" data-id="${d.id}">REGISTRAR CONVERSA</button><button class="btn" data-deal-action="task" data-id="${d.id}">NOVA AÇÃO</button><button class="btn primary" data-deal-action="proposal" data-id="${d.id}">${p?'ABRIR PROPOSTA':'CRIAR PROPOSTA'}</button><button class="btn primary" data-deal-action="advance" data-id="${d.id}">AVANÇAR ETAPA</button></div></div>
    <details class="accordion" open><summary>Para avançar <span>${g.filter(x=>x.ok).length}/${g.length}</span></summary><div class="accordion-content"><div class="gate-list">${g.map(x=>`<div class="gate-item"><span class="${x.ok?'gate-ok':'gate-miss'}">${x.ok?'✓':'!'}</span><span>${CU.esc(x.label)}</span></div>`).join('')}</div></div></details>
    <details class="accordion"><summary>Histórico <span>${d.history?.length||0}</span></summary><div class="accordion-content">${(d.history||[]).map(h=>`<div class="history-line"><b>${CU.esc(h.text)}</b><span>${CU.ownerName(h.actor)} · ${CU.fmtDate(h.date)}</span></div>`).join('')||'Sem histórico.'}</div></details>
    <details class="accordion"><summary>Proposta <span>${p?CU.money(p.value):'—'}</span></summary><div class="accordion-content">${p?`Status: ${p.status}<br>Valor: ${CU.money(p.value)}<br>Retorno: ${CU.fmtDate(p.followupDue)}`:'Nenhuma proposta criada.'}</div></details>
    <div class="ctx-section"><div class="ctx-label">DECISÃO COMERCIAL</div><div class="context-actions"><button class="btn success" data-deal-final="won" data-id="${d.id}">GANHOU</button><button class="btn danger" data-deal-final="lost" data-id="${d.id}">PERDEU</button><button class="btn warn wide" data-deal-final="later" data-id="${d.id}">NÃO AGORA</button></div></div>`;
  }
  if(c.type==='client'){
    const x=CU.state.clients.find(v=>v.id===c.id);if(!x)return'<div class="ctx-empty">Cliente não encontrado.</div>';const ps=CU.state.projects.filter(p=>p.clientId===x.id),rs=CU.state.receivables.filter(r=>r.clientId===x.id);
    return `<div class="ctx-kicker">CLIENTE 360</div><div class="ctx-title">${CU.esc(x.name)}</div><div class="ctx-sub">${CU.esc(x.contact)} · ${CU.esc(x.service)}</div><div class="ctx-section"><div class="ctx-row"><span>Responsável</span><strong>${CU.ownerName(x.owner)}</strong></div><div class="ctx-row"><span>Telefone</span><strong>${CU.esc(x.phone)}</strong></div><div class="ctx-row"><span>E-mail</span><strong>${CU.esc(x.email)}</strong></div></div><details class="accordion" open><summary>Projetos <span>${ps.length}</span></summary><div class="accordion-content">${ps.map(p=>`${CU.esc(p.name)} · ${p.progress}%`).join('<br>')||'Sem projeto.'}</div></details><details class="accordion"><summary>Financeiro <span>${CU.money(rs.reduce((a,r)=>a+CU.remainingReceivable(r),0))}</span></summary><div class="accordion-content">${rs.map(r=>`${CU.esc(r.description)} · saldo ${CU.money(CU.remainingReceivable(r))}`).join('<br>')||'Sem recebíveis.'}</div></details><div class="ctx-section"><button class="btn primary" data-client-action="${x.id}">NOVA AÇÃO</button></div>`;
  }
  if(c.type==='project'){
    const p=CU.state.projects.find(x=>x.id===c.id);if(!p)return'<div class="ctx-empty">Projeto não encontrado.</div>';
    return `<div class="ctx-kicker">PROJETO</div><div class="ctx-title">${CU.esc(p.name)}</div><div class="ctx-sub">${CU.esc(CU.clientName(p.clientId))}</div><div class="ctx-section"><div class="ctx-row"><span>Status</span><strong>${CU.esc(p.status)}</strong></div><div class="ctx-row"><span>Progresso</span><strong>${p.progress}%</strong></div><div class="ctx-row"><span>Prazo</span><strong>${CU.fmtDate(p.due)}</strong></div>${p.blockedReason?`<div class="ctx-row"><span>Bloqueio</span><strong class="yellow">${CU.esc(p.blockedReason)}</strong></div>`:''}</div><div class="ctx-section"><button class="btn primary" data-project-action="${p.id}">NOVA AÇÃO</button></div>`;
  }
  if(c.type==='action'){
    const a=CU.state.actions.find(x=>x.id===c.id);if(!a)return'<div class="ctx-empty">Ação não encontrada.</div>';
    return `<div class="ctx-kicker">AÇÃO</div><div class="ctx-title">${CU.esc(a.title)}</div><div class="ctx-sub">${CU.entityLabel(a.entityType,a.entityId)}</div><div class="ctx-section"><div class="ctx-row"><span>Responsável</span><strong>${CU.ownerName(a.owner)}</strong></div><div class="ctx-row"><span>Prazo</span><strong>${CU.fmtDate(a.due)}</strong></div><div class="ctx-row"><span>Status</span><strong>${a.status==='done'?'Concluída':'Aberta'}</strong></div></div><div class="ctx-section"><button class="btn ${a.status==='done'?'':'success'}" data-toggle-action="${a.id}">${a.status==='done'?'REABRIR':'CONCLUIR'}</button></div>`;
  }
  return '<div class="ctx-empty">Sem detalhes.</div>';
};

})();
