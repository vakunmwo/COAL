
(() => {
'use strict';
const CU=window.CU;

CU.NAV=[['today','◉','HOJE'],['sales','↗','VENDAS'],['clients','◎','CLIENTES'],['work','✓','TRABALHO'],['finance','R$','FINANCEIRO'],['journey','◇','JORNADA'],['manual','?','MANUAL']];

CU.shell=()=>`<div class="shell">
<header class="topbar">
  <div class="brand"><img src="assets/core.svg" alt=""><div><b>COAL UP CRM</b><span>READABILITY + FUNNEL UX · MODO TREINO</span></div></div>
  <div class="search-wrap" id="searchWrap"><input id="globalSearch" placeholder="Buscar cliente, venda, projeto ou ação..."><span class="search-icon">⌕</span><div class="search-results hidden" id="searchResults"></div></div>
  <div class="top-actions"><button class="icon-button mobile-more" id="mobileSearchBtn">⌕</button><div class="partner-chip"><span class="dot"></span><span id="partnerTop">parceiro offline</span></div><button class="new-btn" id="quickNew">+ NOVO</button><button class="user-btn" id="userBtn">${CU.session.user==='Gadmin123'?'G':'A'}</button></div>
</header>
<div class="main">
  <nav class="nav">${CU.NAV.map(([r,i,n])=>`<button class="nav-btn ${CU.state.ui.route===r?'active':''}" data-route="${r}"><span class="ico">${i}</span><span>${n}</span></button>`).join('')}<div class="nav-divider"></div><div class="nav-foot"><div class="training">MODO TREINO<br>dados sintéticos</div></div></nav>
  <main class="workspace" id="workspace"></main>
  <aside class="context"><div class="context-head"><span>DETALHES</span><button class="icon-button" id="contextClose">×</button></div><div class="context-body" id="contextBody"></div></aside>
</div></div>`;

CU.renderScene=()=>{
  const map={today:CU.sceneToday,sales:CU.sceneSales,clients:CU.sceneClients,work:CU.sceneWork,finance:CU.sceneFinance,journey:CU.sceneJourney,manual:CU.sceneManual};
  document.getElementById('workspace').innerHTML=(map[CU.state.ui.route]||CU.sceneToday)();
};

CU.sceneToday=()=>{
  const fm=CU.financeMetrics(),prs=CU.priorities(),att=CU.risks().slice(0,5);
  const todayActions=CU.state.actions.filter(a=>a.status==='open'&&a.due===CU.today()).length;
  const overdue=CU.state.actions.filter(a=>a.status==='open'&&a.due<CU.today()).length;
  const blocked=CU.state.projects.filter(p=>['blocked','waiting'].includes(p.status)).length;
  return `<section class="scene">
  <div class="scene-head"><div><div class="eyebrow">HOJE / VISÃO OPERACIONAL</div><h1>O que precisa acontecer agora</h1><div class="scene-sub">Prioridades, riscos, vendas, trabalho e dinheiro em uma leitura curta.</div></div><div class="head-actions"><button class="btn primary" id="todayNew">+ NOVO</button></div></div>
  <div class="grid">
    <div class="panel s7"><div class="panel-head"><b>PRIORIDADES</b><span>até 3</span></div><div class="panel-body"><div class="priority-stack">${prs.map(p=>`<div class="priority" style="--c:${p.kind==='main'?'var(--blue)':p.kind==='protect'?'var(--red)':'var(--cyan)'}"><div class="priority-bar"></div><div><b>${CU.esc(p.title)}</b><p>${CU.esc(p.text)}</p><div class="meta">${p.kind==='main'?'MISSÃO PRINCIPAL':p.kind==='protect'?'PROTEÇÃO':'AVANÇO'}</div></div><button class="btn sm" data-priority="${p.entityId}" data-type="${p.entityType}">ABRIR</button></div>`).join('')||'<div class="muted">Nenhuma prioridade crítica.</div>'}</div></div></div>
    <div class="panel s5"><div class="panel-head"><b>ATENÇÕES</b><span>${att.length}</span></div><div class="panel-body">${att.map(a=>`<div class="alert-row"><div><b>${CU.esc(a.title)}</b><p>${CU.esc(a.text)}</p></div><span class="pill ${a.severity}">${a.type==='sale'?'VENDA':a.type==='project'?'TRABALHO':'FINANCEIRO'}</span></div>`).join('')||'<div class="muted">Sem alertas críticos.</div>'}</div></div>
    <div class="panel s4"><div class="panel-head"><b>DINHEIRO</b><button class="btn sm ghost" data-route-jump="finance">VER</button></div><div class="panel-body"><div class="ctx-row"><span>Recebido no mês</span><strong class="green">${CU.money(fm.received)}</strong></div><div class="ctx-row"><span>A receber</span><strong>${CU.money(fm.toReceive)}</strong></div><div class="ctx-row"><span>Atrasado</span><strong class="${fm.late?'red':''}">${CU.money(fm.late)}</strong></div><div class="ctx-row"><span>Recorrência</span><strong class="cyan">${CU.money(fm.recurring)}/m</strong></div></div></div>
    <div class="panel s4"><div class="panel-head"><b>VENDAS</b><span>funil</span></div><div class="panel-body"><div class="ctx-row"><span>Abertas</span><strong>${CU.openDeals().length}</strong></div><div class="ctx-row"><span>Propostas</span><strong>${CU.proposalsOpen().length}</strong></div><div class="ctx-row"><span>Sem próximo passo</span><strong class="${CU.missingNextDeals().length?'yellow':''}">${CU.missingNextDeals().length}</strong></div><div class="ctx-row"><span>Valor em andamento</span><strong class="blue">${CU.money(CU.openDeals().reduce((a,d)=>a+Number(d.value),0))}</strong></div></div></div>
    <div class="panel s4"><div class="panel-head"><b>TRABALHO</b><span>ações e projetos</span></div><div class="panel-body"><div class="ctx-row"><span>Ações hoje</span><strong>${todayActions}</strong></div><div class="ctx-row"><span>Atrasadas</span><strong class="${overdue?'red':''}">${overdue}</strong></div><div class="ctx-row"><span>Projetos bloqueados</span><strong class="${blocked?'yellow':''}">${blocked}</strong></div></div></div>
    <div class="panel s6"><div class="panel-head"><b>DUPLA</b><span>CO-OP</span></div><div class="panel-body"><div class="coop-list" id="coopToday">${CU.presenceHTML()}</div></div></div>
    <div class="panel s6"><div class="panel-head"><b>ATIVIDADE RECENTE</b><span>histórico</span></div><div class="panel-body">${CU.state.events.slice(0,6).map(e=>`<div class="simple-row"><div><b>${CU.esc(e.text)}</b><p>${CU.ownerName(e.actor)} · ${CU.fmtDate(e.date)} ${e.time||''}</p></div></div>`).join('')}</div></div>
  </div></section>`;
};

CU.sceneSales=()=>{
  const f=CU.state.ui.filters;
  const deals=CU.openDeals().filter(d=>(f.owner==='all'||d.owner===f.owner)&&(f.stage==='all'||d.stage===f.stage)&&(f.risk==='all'||(f.risk==='risk'?d.risk:!d.risk))&&(f.service==='all'||d.service===f.service)&&(f.next==='all'||(f.next==='late'?d.nextDue<CU.today():f.next==='today'?d.nextDue===CU.today():true)));
  const services=[...new Set(CU.state.deals.map(d=>d.service))];
  return `<section class="scene">
  <div class="scene-head"><div><div class="eyebrow">VENDAS / FUNIL</div><h1>Funil de vendas</h1><div class="scene-sub">Etapa, tempo, próximo passo, responsável e risco. Valor em funil é potencial — não dinheiro recebido.</div></div><div class="head-actions"><button class="btn" id="newProspectBtn">+ POSSÍVEL CLIENTE</button><button class="btn primary" id="newDealBtn">+ NOVA VENDA</button></div></div>
  <div class="kpis">
    <div class="kpi" style="--c:var(--blue)"><label>VENDAS ABERTAS</label><strong>${CU.openDeals().length}</strong><small>em andamento</small></div>
    <div class="kpi" style="--c:var(--blue)"><label>VALOR EM ANDAMENTO</label><strong>${CU.money(CU.openDeals().reduce((a,d)=>a+Number(d.value),0))}</strong><small>potencial comercial</small></div>
    <div class="kpi" style="--c:var(--purple)"><label>PROPOSTAS ABERTAS</label><strong>${CU.proposalsOpen().length}</strong><small>aguardando retorno</small></div>
    <div class="kpi" style="--c:var(--red)"><label>PRECISAM DE ATENÇÃO</label><strong>${CU.openDeals().filter(d=>d.risk||d.nextDue<CU.today()).length}</strong><small>risco ou passo vencido</small></div>
  </div>
  <div class="panel" style="margin-bottom:9px"><div class="panel-head"><b>POSSÍVEIS CLIENTES</b><span>${CU.state.prospects.length}</span></div><div class="panel-body"><div class="prospect-strip">${CU.state.prospects.map(p=>`<div class="prospect-card"><b>${CU.esc(p.name)}</b><p>${CU.esc(p.contact)} · ${CU.esc(p.channel)}</p><p>${CU.esc(p.next)}</p><div class="actions"><button class="btn sm primary" data-prospect-qualify="${p.id}">QUALIFICAR</button><button class="btn sm ghost" data-prospect-action="${p.id}">NOVA AÇÃO</button></div></div>`).join('')}</div></div></div>
  <div class="sales-toolbar">
    <select class="filter" data-filter="owner"><option value="all">Todos responsáveis</option><option value="admin123" ${f.owner==='admin123'?'selected':''}>Sócio A</option><option value="Gadmin123" ${f.owner==='Gadmin123'?'selected':''}>Sócio B</option></select>
    <select class="filter" data-filter="stage"><option value="all">Todas etapas</option>${CU.state.stages.map(s=>`<option value="${s.id}" ${f.stage===s.id?'selected':''}>${s.name}</option>`).join('')}</select>
    <select class="filter" data-filter="risk"><option value="all">Todo risco</option><option value="risk" ${f.risk==='risk'?'selected':''}>Com atenção</option><option value="ok" ${f.risk==='ok'?'selected':''}>Sem atenção</option></select>
    <select class="filter" data-filter="service"><option value="all">Todos serviços</option>${services.map(s=>`<option ${f.service===s?'selected':''}>${CU.esc(s)}</option>`).join('')}</select>
    <select class="filter" data-filter="next"><option value="all">Todo próximo passo</option><option value="today" ${f.next==='today'?'selected':''}>Hoje</option><option value="late" ${f.next==='late'?'selected':''}>Vencido</option></select>
  </div>
  <div class="funnel-wrap"><div class="funnel">${CU.state.stages.map(s=>`<div class="stage" data-stage="${s.id}"><div class="stage-head"><b>${CU.esc(s.name.toUpperCase())}</b><span>${deals.filter(d=>d.stage===s.id).length}</span></div><div class="deal-list">${deals.filter(d=>d.stage===s.id).map(CU.dealCard).join('')}</div></div>`).join('')}</div></div>
  </section>`;
};
CU.dealCard=d=>`<article class="deal ${d.risk||d.nextDue<CU.today()?'risk':''}" draggable="true" data-open-entity="${d.id}" data-type="deal"><div class="deal-top"><div class="deal-name">${CU.esc(d.name)}</div><div class="deal-value">${CU.money(d.value)}</div></div><div class="deal-contact">${CU.esc(d.contact)}</div><div class="deal-stage">${CU.esc(CU.stageName(d.stage).toUpperCase())} · ${CU.dealAge(d)} dia(s)</div><div class="deal-next"><span class="muted">Próximo passo:</span><br>${CU.esc(d.nextTitle||'Não definido')} · ${CU.fmtDate(d.nextDue)}</div><div class="deal-foot"><span>${CU.ownerName(d.owner)}</span><span>${d.nextDue<CU.today()?'<span class="red">VENCIDO</span>':d.risk?'<span class="yellow">ATENÇÃO</span>':'OK'}</span></div></article>`;

CU.sceneClients=()=>{
  const sel=CU.state.ui.context?.type==='client'?CU.state.ui.context.id:CU.state.clients[0]?.id,c=CU.state.clients.find(x=>x.id===sel)||CU.state.clients[0];
  const projects=CU.state.projects.filter(p=>p.clientId===c?.id),recs=CU.state.receivables.filter(r=>r.clientId===c?.id);
  return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">CLIENTES / RELACIONAMENTO</div><h1>Clientes</h1><div class="scene-sub">Contato, serviços, trabalho e dinheiro conectados no mesmo cadastro.</div></div><div class="head-actions"><button class="btn primary" id="newClientAction">+ NOVA AÇÃO</button></div></div><div class="two-col">
  <div class="listbox"><div class="list-search"><input id="clientFilter" placeholder="Buscar cliente..."></div>${CU.state.clients.map(x=>`<div class="list-item ${x.id===c?.id?'active':''}" data-open-entity="${x.id}" data-type="client"><b>${CU.esc(x.name)}</b><span>${CU.esc(x.contact)} · ${CU.esc(x.service)}</span></div>`).join('')}</div>
  <div class="detail"><div class="detail-hero"><div><h2>${CU.esc(c?.name||'')}</h2><p>${CU.esc(c?.contact||'')} · ${CU.esc(c?.service||'')}</p></div><span class="pill green">CLIENTE ATIVO</span></div><div class="block-grid">
    <div class="block"><div class="block-title">CONTATO</div><div class="ctx-row"><span>Nome</span><strong>${CU.esc(c?.contact||'—')}</strong></div><div class="ctx-row"><span>Função</span><strong>${CU.esc(c?.role||'—')}</strong></div><div class="ctx-row"><span>Telefone</span><strong class="cyan">${CU.esc(c?.phone||'—')}</strong></div><div class="ctx-row"><span>E-mail</span><strong>${CU.esc(c?.email||'—')}</strong></div></div>
    <div class="block"><div class="block-title">TRABALHO</div>${projects.map(p=>`<div class="simple-row"><div><b>${CU.esc(p.name)}</b><p>${p.progress}% · ${CU.fmtDate(p.due)}</p><div class="progress"><span style="width:${p.progress}%"></span></div></div><button class="btn sm" data-open-entity="${p.id}" data-type="project">ABRIR</button></div>`).join('')||'<div class="muted">Sem projeto ativo.</div>'}</div>
    <div class="block"><div class="block-title">DINHEIRO</div><div class="ctx-row"><span>Recebido registrado</span><strong class="green">${CU.money(CU.state.payments.filter(p=>recs.some(r=>r.id===p.receivableId)&&p.type==='received').reduce((a,p)=>a+Number(p.amount),0))}</strong></div><div class="ctx-row"><span>Em aberto</span><strong>${CU.money(recs.reduce((a,r)=>a+CU.remainingReceivable(r),0))}</strong></div></div>
    <div class="block"><div class="block-title">RESPONSABILIDADE</div><div class="ctx-row"><span>Responsável</span><strong>${CU.ownerName(c?.owner)}</strong></div><div class="ctx-row"><span>Status</span><strong>Ativo</strong></div></div>
  </div></div></div></section>`;
};

CU.sceneWork=()=>{
  const view=CU.state.ui.workView||'actions';
  return `<section class="scene"><div class="scene-head"><div><div class="eyebrow">TRABALHO / EXECUÇÃO</div><h1>Trabalho</h1><div class="scene-sub">Ações futuras e projetos ficam separados. Histórico continua sendo registro do que aconteceu.</div></div><div class="head-actions"><button class="btn" id="newActionBtn">+ NOVA AÇÃO</button><button class="btn primary" id="newProjectBtn">+ NOVO PROJETO</button></div></div><div class="work-tabs"><button class="seg-btn ${view==='actions'?'active':''}" data-work-view="actions">AÇÕES</button><button class="seg-btn ${view==='projects'?'active':''}" data-work-view="projects">PROJETOS</button><button class="seg-btn ${view==='processes'?'active':''}" data-work-view="processes">PROCESSOS</button></div>${view==='actions'?CU.workActions():view==='projects'?CU.workProjects():CU.workProcesses()}</section>`;
};
CU.workActions=()=>{
  const groups=[['ATRASADAS',CU.state.actions.filter(a=>a.status==='open'&&a.due<CU.today())],['HOJE',CU.state.actions.filter(a=>a.status==='open'&&a.due===CU.today())],['PRÓXIMAS',CU.state.actions.filter(a=>a.status==='open'&&a.due>CU.today())],['CONCLUÍDAS',CU.state.actions.filter(a=>a.status==='done')]];
  return `<div class="grid">${groups.map(([name,items])=>`<div class="panel s6"><div class="panel-head"><b>${name}</b><span>${items.length}</span></div><div class="panel-body">${items.map(a=>`<div class="action-row"><button class="check" data-toggle-action="${a.id}">${a.status==='done'?'✓':''}</button><div data-open-entity="${a.id}" data-type="action" style="cursor:pointer"><b>${CU.esc(a.title)}</b><p>${CU.entityLabel(a.entityType,a.entityId)} · ${CU.ownerName(a.owner)}</p></div><span class="due ${a.status==='open'&&a.due<CU.today()?'red':''}">${CU.fmtDate(a.due)}</span></div>`).join('')||'<div class="muted">Nenhuma ação.</div>'}</div></div>`).join('')}</div>`;
};
CU.workProjects=()=>{
  const groups=[['PLANEJADO','planned'],['EM ANDAMENTO','doing'],['AGUARDANDO CLIENTE','waiting'],['BLOQUEADO','blocked'],['ENTREGUE','done']];
  return `<div class="grid">${groups.map(([n,s])=>`<div class="panel s4"><div class="panel-head"><b>${n}</b><span>${CU.state.projects.filter(p=>p.status===s).length}</span></div><div class="panel-body" style="display:flex;flex-direction:column;gap:7px">${CU.state.projects.filter(p=>p.status===s).map(p=>`<div class="project-card" data-open-entity="${p.id}" data-type="project" style="cursor:pointer"><b>${CU.esc(CU.projectName(p))}</b><p>${p.blockedReason?CU.esc(p.blockedReason):`Entrega prevista ${CU.fmtDate(p.due)}`}</p><div class="progress"><span style="width:${p.progress}%"></span></div><div class="project-meta"><span>${p.progress}%</span><span>${CU.fmtDate(p.due)}</span></div></div>`).join('')||'<div class="muted">Vazio.</div>'}</div></div>`).join('')}</div>`;
};
CU.workProcesses=()=>`<div class="grid"><div class="panel s6"><div class="panel-head"><b>MODELOS DE PROCESSO</b><span>reutilizáveis</span></div><div class="panel-body"><div class="simple-row"><div><b>Entrega de site</b><p>Briefing → conteúdo → primeira versão → ajustes → QA → publicação</p></div><span class="pill blue">MODELO</span></div><div class="simple-row"><div><b>Presença local</b><p>Diagnóstico → evidências → ficha → materiais → acompanhamento</p></div><span class="pill blue">MODELO</span></div></div></div><div class="panel s6"><div class="panel-head"><b>REGRA</b></div><div class="panel-body"><p class="muted">Aplicar um processo em um projeto cria um snapshot. Alterar o modelo depois não muda silenciosamente uma entrega em andamento.</p></div></div></div>`;

})();
