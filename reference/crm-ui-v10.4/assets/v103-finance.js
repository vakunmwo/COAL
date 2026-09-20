(() => {
'use strict';
const CU=window.CU;
const oldFinanceView=CU.financeView;
CU.financeClosing=()=>{
  CU.ensureV103State();const month=CU.state.meta.financeMonth||CU.month(),c=CU.state.monthClosures[month];
  const items=[
    ['payments','Pagamentos recebidos conferidos','Comparar os recebimentos cadastrados com os comprovantes/controle real.'],
    ['expenses','Despesas pagas conferidas','Confirmar que o que foi pago no mês está registrado.'],
    ['overdue','Atrasos revisados','Olhar valores a receber e a pagar vencidos e definir próximo passo.'],
    ['recurrence','Recorrências conferidas','Separar infraestrutura recorrente de serviço recorrente.'],
    ['budget','Orçamento comparado','Revisar planejado x realizado antes de virar o mês.'],
    ['nextMonth','Próximo mês revisado','Conferir compromissos e recebimentos previstos do próximo período.']
  ];
  const complete=items.every(([k])=>c.items[k]);
  return `<div class="grid"><div class="panel s8"><div class="panel-head"><b>FECHAMENTO OPERACIONAL · ${month}</b><span>${complete?'PRONTO':'EM REVISÃO'}</span></div><div class="panel-body"><div class="close-list">${items.map(([k,t,d])=>`<div class="close-item ${c.items[k]?'done':''}"><button class="close-check" data-close-item="${k}">${c.items[k]?'✓':''}</button><div><b>${t}</b><p>${d}</p></div><span class="close-status">${c.items[k]?'CONFERIDO':'PENDENTE'}</span></div>`).join('')}</div></div></div><div class="panel s4"><div class="panel-head"><b>STATUS</b></div><div class="panel-body">${c.closedAt?`<div class="pill green">FECHADO</div><div class="ctx-row"><span>Data</span><strong>${CU.fmtDate(c.closedAt)}</strong></div><div class="ctx-row"><span>Por</span><strong>${CU.ownerName(c.closedBy)}</strong></div><button class="btn ghost" data-reopen-close style="margin-top:8px">REABRIR CONFERÊNCIA</button>`:`<p class="muted" style="font-size:10px;line-height:1.55">Fechamento operacional é um checklist de organização. Não é fechamento contábil.</p><button class="btn primary" data-finalize-close ${complete?'':'disabled'}>CONCLUIR FECHAMENTO</button>`}</div></div></div>`;
};
CU.financeView=(view,fm)=>view==='closing'?CU.financeClosing():oldFinanceView(view,fm);
CU.sceneFinance=()=>{
  CU.ensureV103State();const view=CU.state.ui.financeView||'overview',fm=CU.financeMetrics();
  const tabs=[['overview','VISÃO GERAL'],['receive','RECEBER'],['pay','PAGAR'],['expenses','DESPESAS'],['budget','ORÇAMENTO'],['recurrence','RECORRÊNCIA'],['cashflow','FLUXO DE CAIXA'],['calendar','CALENDÁRIO'],['closing','FECHAMENTO']];
  return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">FINANCEIRO / ORGANIZAÇÃO OPERACIONAL</div><h1>Financeiro</h1><div class="scene-sub">Recebimentos, contas, orçamento, recorrência e fechamento operacional. Não substitui contabilidade.</div></div><div class="head-actions"><button class="btn" id="newExpenseBtn">+ DESPESA</button><button class="btn primary" id="registerPaymentBtn">+ PAGAMENTO</button></div></div><div class="finance-hero"><div class="fin-card"><label>RECEBIDO NO MÊS</label><strong class="green">${CU.money(fm.received)}</strong><small>pagamentos - estornos</small></div><div class="fin-card"><label>A RECEBER</label><strong>${CU.money(fm.toReceive)}</strong><small>a vencer / hoje</small></div><div class="fin-card"><label>ATRASADO</label><strong class="${fm.late?'red':''}">${CU.money(fm.late)}</strong><small>saldo vencido</small></div><div class="fin-card"><label>DESPESAS PAGAS</label><strong>${CU.money(fm.expensesPaid)}</strong><small>mês atual</small></div><div class="fin-card"><label>A PAGAR</label><strong>${CU.money(fm.toPay)}</strong><small>inclui vencidas</small></div><div class="fin-card"><label>RECORRÊNCIA ATIVA</label><strong class="cyan">${CU.money(fm.recurring)}/m</strong><small>infra + serviço</small></div></div><div class="finance-tabs">${tabs.map(([k,n])=>`<button class="seg-btn ${view===k?'active':''}" data-finance-view="${k}">${n}</button>`).join('')}</div>${CU.financeView(view,fm)}</section>`;
};
})();