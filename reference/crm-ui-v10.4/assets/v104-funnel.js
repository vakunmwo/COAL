
(() => {
'use strict';
const CU=window.CU;

CU.stageMetricsV104=stage=>{
  const ds=CU.openDeals().filter(d=>d.stage===stage);
  return{
    count:ds.length,
    value:ds.reduce((a,d)=>a+Number(d.value),0),
    avg:ds.length?Math.round(ds.reduce((a,d)=>a+CU.dealAge(d),0)/ds.length):null,
    attention:ds.filter(CU.hasAttention).length
  };
};

CU.dealCardV104=(d,mobile=false)=>{
  const task=CU.nextActionOf(d);
  const bucket=CU.nextActionBucket(d);
  const dueText=!task?'Sem próximo passo':task.due===CU.today()?'Hoje':task.due<CU.today()?`Vencido · ${CU.fmtDate(task.due)}`:CU.fmtDate(task.due);
  const status=!task?'SEM PRÓXIMO PASSO':bucket==='overdue'?'VENCIDO':d.risk?'ATENÇÃO':'OK';
  const statusClass=!task?'purple':bucket==='overdue'?'red':d.risk?'yellow':'green';
  return `<article class="deal ${CU.hasAttention(d)?'risk':''}" ${mobile?'':'draggable="true"'} data-open-entity="${d.id}" data-type="deal">
    <div class="deal-top">
      <div class="deal-name">${CU.esc(d.name)}</div>
      <div class="deal-value">${CU.money(d.value)}</div>
    </div>
    <div class="deal-contact">${CU.esc(d.contact)} · ${CU.esc(d.service||'Serviço não definido')}</div>
    <div class="deal-stage">${CU.esc(CU.stageName(d.stage))} · ${CU.dealAge(d)} dia(s)</div>
    <div class="deal-next-label">Próximo passo</div>
    <div class="deal-next">${task?CU.esc(task.title):'Definir próximo passo'}</div>
    <div class="deal-next-date">${CU.esc(dueText)}</div>
    <div class="deal-foot">
      <span>${CU.ownerName(d.owner)}</span>
      <span class="deal-status ${statusClass}">${status}</span>
    </div>
  </article>`;
};

CU.salesFiltersV104=()=>{
  const f=CU.state.ui.filters,services=[...new Set(CU.state.deals.map(d=>d.service).filter(Boolean))];
  return `<div class="sales-toolbar">
    <select class="filter" data-filter="owner"><option value="all">Todos responsáveis</option><option value="admin123" ${f.owner==='admin123'?'selected':''}>Sócio A</option><option value="Gadmin123" ${f.owner==='Gadmin123'?'selected':''}>Sócio B</option></select>
    <select class="filter" data-filter="stage"><option value="all">Todas etapas</option>${CU.state.stages.map(s=>`<option value="${s.id}" ${f.stage===s.id?'selected':''}>${CU.esc(s.name)}</option>`).join('')}</select>
    <select class="filter" data-filter="risk"><option value="all">Toda atenção</option><option value="risk" ${f.risk==='risk'?'selected':''}>Precisa de atenção</option><option value="ok" ${f.risk==='ok'?'selected':''}>Sem atenção</option></select>
    <select class="filter" data-filter="service"><option value="all">Todos serviços</option>${services.map(s=>`<option value="${CU.esc(s)}" ${f.service===s?'selected':''}>${CU.esc(s)}</option>`).join('')}</select>
    <select class="filter" data-filter="next"><option value="all">Todo próximo passo</option><option value="today" ${f.next==='today'?'selected':''}>Hoje</option><option value="late" ${f.next==='late'?'selected':''}>Vencido</option></select>
  </div>`;
};

CU.filteredDealsV104=()=>{
  const f=CU.state.ui.filters;
  return CU.openDeals().filter(d=>{
    const task=CU.nextActionOf(d);
    const risk=CU.hasAttention(d);
    return (f.owner==='all'||d.owner===f.owner)
      &&(f.stage==='all'||d.stage===f.stage)
      &&(f.risk==='all'||(f.risk==='risk'?risk:!risk))
      &&(f.service==='all'||d.service===f.service)
      &&(f.next==='all'||(f.next==='late'?(task&&task.due<CU.today()):f.next==='today'?(task&&task.due===CU.today()):true));
  });
};

CU.salesFunnelDesktopV104=deals=>`<div class="funnel-desktop">
  <div class="funnel-wrap"><div class="funnel">${CU.state.stages.map(s=>{
    const m=CU.stageMetricsV104(s.id),visible=deals.filter(d=>d.stage===s.id);
    return `<section class="stage" data-stage="${s.id}">
      <div class="stage-head">
        <div class="stage-title-row"><div class="stage-name">${CU.esc(s.name)}</div><div class="stage-count">${visible.length}</div></div>
        <div class="stage-summary">
          <div class="stage-metric"><span>Potencial atual</span><strong>${CU.money(m.value)}</strong></div>
          <div class="stage-metric"><span>Média no laboratório</span><strong>${m.avg===null?'—':`${m.avg} dias`}</strong></div>
          <div class="stage-metric"><span>Precisa de atenção</span><strong class="${m.attention?'red':''}">${m.attention}</strong></div>
          <div class="stage-metric"><span>Total na etapa</span><strong>${m.count}</strong></div>
        </div>
      </div>
      <div class="deal-list">${visible.map(d=>CU.dealCardV104(d,false)).join('')||'<div class="empty-structured">Nenhuma venda nesta etapa com os filtros atuais.</div>'}</div>
    </section>`;
  }).join('')}</div></div>
</div>`;

CU.salesFunnelMobileV104=deals=>{
  let stage=CU.state.ui.mobileSalesStage;
  if(!CU.state.stages.some(s=>s.id===stage))stage=CU.state.stages[0]?.id;
  const def=CU.state.stages.find(s=>s.id===stage),visible=deals.filter(d=>d.stage===stage),m=CU.stageMetricsV104(stage);
  return `<div class="funnel-mobile">
    <div class="mobile-stage-strip" aria-label="Etapas do funil">${CU.state.stages.map(s=>`<button class="mobile-stage-btn ${s.id===stage?'active':''}" data-v104-stage="${s.id}">${CU.esc(s.name)} · ${deals.filter(d=>d.stage===s.id).length}</button>`).join('')}</div>
    <div class="mobile-stage-summary">
      <div><h2>${CU.esc(def?.name||'Etapa')}</h2><p>${visible.length} venda(s) · ${m.attention} pedindo atenção</p></div>
      <strong>${CU.money(visible.reduce((a,d)=>a+Number(d.value),0))}</strong>
    </div>
    <div class="mobile-deal-list">${visible.map(d=>CU.dealCardV104(d,true)).join('')||'<div class="empty-structured">Nenhuma venda nesta etapa com os filtros atuais.</div>'}</div>
  </div>`;
};

CU.salesFunnelView=()=>{
  const deals=CU.filteredDealsV104();
  return `${CU.salesFiltersV104()}${CU.salesFunnelDesktopV104(deals)}${CU.salesFunnelMobileV104(deals)}`;
};

CU.followItemV104=(d,bucket)=>{
  const task=CU.nextActionOf(d);
  const cls=bucket==='overdue'?'overdue':bucket==='today'?'today':bucket==='missing'?'missing':'';
  return `<article class="follow-card-v104 ${cls}">
    <div class="follow-main">
      <h3>${CU.esc(d.name)} <span class="operator-chip">${CU.ownerName(d.owner)}</span></h3>
      <div class="next">${task?CU.esc(task.title):'Definir próximo passo'}</div>
      <div class="meta">${CU.stageName(d.stage)} · ${CU.money(d.value)} · ${task?CU.fmtDate(task.due):'sem prazo'} · ${CU.dealAge(d)} dia(s) na etapa</div>
    </div>
    <div class="follow-actions">
      <button class="btn sm" data-open-entity="${d.id}" data-type="deal">ABRIR VENDA</button>
      <button class="btn sm primary" data-v103-conversation="${d.id}">REGISTRAR CONVERSA</button>
      ${bucket==='missing'?`<button class="btn sm warn" data-v104-next-action="${d.id}">DEFINIR PRÓXIMO PASSO</button>`:''}
    </div>
  </article>`;
};

CU.salesFollowView=()=>{
  const groups=[
    ['VENCIDOS','overdue'],
    ['HOJE','today'],
    ['PRÓXIMOS','next'],
    ['SEM PRÓXIMO PASSO','missing']
  ];
  return `<div>${groups.map(([label,key])=>{
    const rows=CU.openDeals().filter(d=>CU.nextActionBucket(d)===key).sort((a,b)=>{
      const ta=CU.nextActionOf(a),tb=CU.nextActionOf(b);
      return String(ta?.due||'9999').localeCompare(String(tb?.due||'9999'));
    });
    return `<section class="follow-section">
      <div class="follow-section-title"><h2>${label}</h2><span>${rows.length} venda(s)</span></div>
      ${rows.map(d=>CU.followItemV104(d,key)).join('')||'<div class="empty-structured">Nenhuma venda neste grupo.</div>'}
    </section>`;
  }).join('')}</div>`;
};

CU.proposalCardV104=(p)=>{
  const d=CU.state.deals.find(d=>d.id===p.dealId),st=CU.proposalDisplayState(p);
  return `<article class="proposal-card-v104" data-open-entity="${d?.id||''}" data-type="deal">
    <h3>${CU.esc(d?.name||'Venda removida')}</h3>
    <div class="proposal-value">${CU.money(p.value)}</div>
    <div class="proposal-row"><span>Responsável</span><strong>${d?CU.ownerName(d.owner):'—'}</strong></div>
    <div class="proposal-row"><span>Etapa da venda</span><strong>${d?CU.stageName(d.stage):'—'}</strong></div>
    <div class="proposal-row"><span>Criada em</span><strong>${CU.fmtDate(p.createdAt)}</strong></div>
    <div class="proposal-row"><span>Retorno previsto</span><strong>${CU.fmtDate(p.followupDue)}</strong></div>
    <span class="proposal-state ${st.key==='waiting'?'yellow':st.key==='accepted'?'green':st.key==='closed'?'red':'purple'}">${CU.esc(st.label)}</span>
  </article>`;
};

CU.salesProposalView=()=>{
  const order=[
    ['RASCUNHO','draft'],
    ['ENVIADA','sent'],
    ['AGUARDANDO RETORNO','waiting'],
    ['ACEITA','accepted'],
    ['RECUSADA / ENCERRADA','closed']
  ];
  return `<div class="proposal-board-v104">${order.map(([label,key])=>{
    const rows=CU.state.proposals.filter(p=>CU.proposalDisplayState(p).key===key);
    return `<section class="proposal-group"><h2>${label} · ${rows.length}</h2>
      ${rows.length?`<div class="proposal-grid-v104">${rows.map(CU.proposalCardV104).join('')}</div>`:'<div class="empty-structured">Nenhuma proposta neste estado.</div>'}
    </section>`;
  }).join('')}</div>`;
};

CU.sceneSales=()=>{
  const view=CU.state.ui.salesView||'funnel';
  const open=CU.openDeals(),attention=open.filter(CU.hasAttention).length;
  return `<section class="scene sales-v104">
    <div class="scene-head">
      <div><div class="eyebrow">Vendas · Funnel UX Lab</div><h1>Vendas</h1><div class="scene-sub">O Funil mostra o estado comercial; Acompanhamentos mostra o próximo movimento; Propostas mostra o que está em decisão. Todos apontam para a mesma Venda 360.</div></div>
      <div class="head-actions"><button class="btn" id="newProspectBtn">+ Possível cliente</button><button class="btn primary" id="newDealBtn">+ Nova venda</button></div>
    </div>
    <div class="kpis">
      <div class="kpi" style="--c:var(--blue)"><label>Vendas abertas</label><strong>${open.length}</strong><small>em andamento</small></div>
      <div class="kpi" style="--c:var(--blue)"><label>Potencial em andamento</label><strong>${CU.money(open.reduce((a,d)=>a+Number(d.value),0))}</strong><small>não é dinheiro recebido</small></div>
      <div class="kpi" style="--c:var(--purple)"><label>Propostas abertas</label><strong>${CU.proposalsOpen().length}</strong><small>em decisão / retorno</small></div>
      <div class="kpi" style="--c:var(--red)"><label>Precisa de atenção</label><strong>${attention}</strong><small>próximo passo ou risco</small></div>
    </div>
    <div class="panel" style="margin-bottom:12px"><div class="panel-head"><b>Possíveis clientes</b><span>${CU.state.prospects.length}</span></div><div class="panel-body"><div class="prospect-strip">${CU.state.prospects.map(p=>`<div class="prospect-card"><b>${CU.esc(p.name)}</b><p>${CU.esc(p.contact)} · ${CU.esc(p.channel)}</p><p>${CU.esc(p.next)}</p><div class="actions"><button class="btn sm primary" data-prospect-qualify="${p.id}">Qualificar</button><button class="btn sm ghost" data-prospect-action="${p.id}">Nova ação</button></div></div>`).join('')}</div></div></div>
    <div class="subnav">
      <button class="seg-btn ${view==='funnel'?'active':''}" data-sales-view="funnel">Funil</button>
      <button class="seg-btn ${view==='follow'?'active':''}" data-sales-view="follow">Acompanhamentos</button>
      <button class="seg-btn ${view==='proposals'?'active':''}" data-sales-view="proposals">Propostas</button>
    </div>
    ${view==='follow'?CU.salesFollowView():view==='proposals'?CU.salesProposalView():CU.salesFunnelView()}
  </section>`;
};

document.addEventListener('click',e=>{
  const stage=e.target.closest('[data-v104-stage]');
  if(stage){
    CU.state.ui.mobileSalesStage=stage.dataset.v104Stage;
    CU.saveState('v104.mobile.stage');
    CU.renderScene();CU.bindScene();
    return;
  }
  const next=e.target.closest('[data-v104-next-action]');
  if(next){
    CU.actionForm('deal',next.dataset.v104NextAction);
  }
});
})();
