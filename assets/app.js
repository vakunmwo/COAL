
(() => {
'use strict';
const CU=window.CU;
const app=document.getElementById('app');

CU.renderLogin=()=>{
  app.innerHTML=`<section class="login">
    <div class="login-visual"><div class="login-core"><div class="orbit"></div><div class="orbit o2"></div><img src="assets/core.svg" alt=""></div><div class="login-copy"><div class="eyebrow">COAL UP CRM / SIMPLE OPS</div><h1>Organizar a empresa sem complicar a operação.</h1><p>Funil comercial legível no desktop e no celular, com Acompanhamentos, Propostas e Venda 360 conectados.</p></div></div>
    <div class="login-side"><form class="login-card" id="loginForm"><div class="login-brand"><img src="assets/core.svg" alt=""><div><b>COAL UP CRM V10.4</b><span>READABILITY + FUNNEL UX · MODO TREINO</span></div></div><h2>Entrar no CRM</h2><p>Dados deste laboratório são sintéticos e não representam faturamento real da COAL UP.</p><div class="field"><label>USUÁRIO</label><input id="loginUser" autocomplete="username" required></div><div class="field"><label>SENHA</label><input id="loginPass" type="password" autocomplete="current-password" required></div><button class="login-submit">ENTRAR</button><div class="login-error" id="loginError"></div><div class="demo-login">Contas de laboratório:<div class="demo-users"><span class="demo-user">admin123</span><span class="demo-user">Gadmin123</span></div></div></form></div>
  </section>`;
  document.getElementById('loginForm').onsubmit=CU.loginSubmit;
};

CU.loginSubmit=async e=>{
  e.preventDefault();
  const user=document.getElementById('loginUser').value.trim(),password=document.getElementById('loginPass').value;
  if(!CU.USERS[user])return document.getElementById('loginError').textContent='Usuário não encontrado.';
  if(await CU.sha256(password)!==CU.USERS[user].hash)return document.getElementById('loginError').textContent='Senha incorreta.';
  CU.session={user,route:'today',focus:'Hoje',loginAt:Date.now()};CU.saveSession();CU.startPresence();CU.addEvent(`${CU.ownerName(user)} entrou no CRM`,user);CU.renderApp();
};

CU.logout=()=>{CU.addEvent(`${CU.ownerName(CU.session.user)} saiu do CRM`,CU.session.user);CU.stopPresence();CU.session=null;CU.clearSession();CU.renderLogin()};

CU.startPresence=()=>{CU.stopPresence();CU.publishPresence();CU.presenceTimer=setInterval(CU.publishPresence,3500)};
CU.stopPresence=()=>{if(CU.presenceTimer)clearInterval(CU.presenceTimer);CU.presenceTimer=null;if(CU.bc&&CU.session)CU.bc.postMessage({type:'off',user:CU.session.user})};
CU.publishPresence=()=>{if(!CU.session)return;const p={user:CU.session.user,route:CU.state.ui.route,focus:CU.session.focus||CU.state.ui.route,last:Date.now()};CU.presence[CU.session.user]=p;if(CU.bc)CU.bc.postMessage({type:'presence',payload:p});CU.renderPresence()};
CU.presenceSnapshot=()=>{const cut=Date.now()-12000;Object.keys(CU.presence).forEach(k=>{if(CU.presence[k].last<cut)delete CU.presence[k]});return CU.presence};
CU.presenceHTML=()=>{CU.presenceSnapshot();const all=[CU.presence[CU.session?.user],...Object.values(CU.presence).filter(p=>p.user!==CU.session?.user)].filter(Boolean);if(!all.length&&CU.session)all.push({user:CU.session.user,route:CU.state.ui.route,focus:CU.session.focus||CU.state.ui.route,last:Date.now()});return all.map(p=>`<div class="coop-item ${p.user!==CU.session.user?'partner':''}"><div class="avatar">${p.user==='Gadmin123'?'G':'A'}</div><div><div class="coop-name">${CU.ownerName(p.user)} ${p.user===CU.session.user?'<span class="muted">(você)</span>':''}</div><div class="coop-meta">${CU.esc(p.focus||p.route)}</div></div><span class="online">ONLINE</span></div>`).join('')};
CU.renderPresence=()=>{if(!CU.session)return;CU.presenceSnapshot();const other=Object.values(CU.presence).find(p=>p.user!==CU.session.user),top=document.getElementById('partnerTop');if(top)top.textContent=other?`${CU.ownerName(other.user)} · ${other.focus||other.route}`:'parceiro offline';const co=document.getElementById('coopToday');if(co)co.innerHTML=CU.presenceHTML()};
if(CU.bc)CU.bc.onmessage=e=>{const m=e.data||{};if(m.type==='presence'){CU.presence[m.payload.user]=m.payload;CU.renderPresence()}if(m.type==='off'){delete CU.presence[m.user];CU.renderPresence()}if(m.type==='state'&&m.from!==CU.session?.user){CU.state=m.state;CU.renderApp(false);CU.toast(`Atualização recebida de ${CU.ownerName(m.from)}`,'info')}};

CU.renderApp=(full=true)=>{
  if(!CU.session)return CU.renderLogin();
  if(full)app.innerHTML=CU.shell();
  CU.renderScene();CU.renderContext();CU.bindShell();CU.bindScene();CU.renderPresence();
};

CU.bindShell=()=>{
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>CU.openRoute(b.dataset.route));
  document.getElementById('quickNew')?.addEventListener('click',CU.quickNew);
  document.getElementById('userBtn')?.addEventListener('click',CU.userMenu);
  document.getElementById('contextClose')?.addEventListener('click',CU.clearContext);
  const gs=document.getElementById('globalSearch');if(gs){gs.oninput=()=>CU.renderSearch(gs.value);gs.onfocus=()=>{if(gs.value.trim())CU.renderSearch(gs.value)}}
  const ms=document.getElementById('mobileSearchBtn');if(ms)ms.onclick=()=>{document.getElementById('searchWrap').classList.toggle('mobile-open');setTimeout(()=>document.getElementById('globalSearch')?.focus(),20)};
};

CU.bindScene=()=>{
  document.querySelectorAll('[data-open-entity]').forEach(e=>e.onclick=()=>CU.openEntity(e.dataset.type,e.dataset.openEntity));
  document.querySelectorAll('[data-priority]').forEach(e=>e.onclick=()=>CU.openEntity(e.dataset.type,e.dataset.priority));
  document.querySelectorAll('[data-prospect-qualify]').forEach(e=>e.onclick=()=>CU.qualifyProspect(e.dataset.prospectQualify));
  document.querySelectorAll('[data-prospect-action]').forEach(e=>e.onclick=()=>CU.actionForm('prospect',e.dataset.prospectAction));
  document.querySelectorAll('[data-filter]').forEach(e=>e.onchange=()=>{CU.state.ui.filters[e.dataset.filter]=e.value;CU.saveState('filter');CU.renderScene();CU.bindScene()});
  document.querySelectorAll('[data-finance-view]').forEach(e=>e.onclick=()=>{CU.state.ui.financeView=e.dataset.financeView;CU.saveState('finance.view');CU.renderScene();CU.bindScene()});
  document.querySelectorAll('[data-work-view]').forEach(e=>e.onclick=()=>{CU.state.ui.workView=e.dataset.workView;CU.saveState('work.view');CU.renderScene();CU.bindScene()});
  document.querySelectorAll('[data-manual]').forEach(e=>e.onclick=()=>{CU.state.ui.manualTopic=e.dataset.manual;CU.saveState('manual');CU.renderScene();CU.bindScene()});
  document.querySelectorAll('[data-toggle-action]').forEach(e=>e.onclick=()=>CU.toggleAction(e.dataset.toggleAction));
  document.querySelectorAll('[data-budget-edit]').forEach(e=>e.onclick=()=>CU.editBudget(e.dataset.budgetEdit));
  document.querySelectorAll('[data-set-balance]').forEach(e=>e.onclick=CU.setOpeningBalance);
  document.querySelectorAll('[data-route-jump]').forEach(e=>e.onclick=()=>CU.openRoute(e.dataset.routeJump));
  document.querySelectorAll('[data-pay-receivable]').forEach(e=>e.onclick=()=>CU.paymentForm(e.dataset.payReceivable));
  document.querySelectorAll('[data-pay-expense]').forEach(e=>e.onclick=()=>CU.markExpensePaid(e.dataset.payExpense));
  const buttons={todayNew:CU.quickNew,newProspectBtn:CU.prospectForm,newDealBtn:CU.dealForm,newClientAction:()=>CU.actionForm(),newActionBtn:()=>CU.actionForm(),newProjectBtn:CU.projectForm,newExpenseBtn:CU.expenseForm,registerPaymentBtn:()=>CU.paymentForm()};
  Object.entries(buttons).forEach(([id,fn])=>{const e=document.getElementById(id);if(e)e.onclick=fn});
  const cf=document.getElementById('clientFilter');if(cf)cf.oninput=()=>CU.filterClients(cf.value);
  CU.setupDrag();
};

CU.renderContext=()=>{
  const box=document.getElementById('contextBody');if(!box)return;const html=CU.contextHTML();box.innerHTML=html;
  const mob=document.getElementById('mobileContext');if(mob)mob.innerHTML=`<div class="context-head"><span>DETALHES</span><button class="icon-button" id="mobileCtxClose">×</button></div><div class="context-body">${html}</div>`;
  CU.bindContext();
};

CU.bindContext=()=>{
  document.querySelectorAll('[data-deal-action]').forEach(b=>b.onclick=()=>CU.dealAction(b.dataset.dealAction,b.dataset.id));
  document.querySelectorAll('[data-deal-final]').forEach(b=>b.onclick=()=>CU.dealFinal(b.dataset.dealFinal,b.dataset.id));
  document.querySelectorAll('.context-body [data-toggle-action]').forEach(b=>b.onclick=()=>CU.toggleAction(b.dataset.toggleAction));
  document.querySelectorAll('[data-client-action]').forEach(b=>b.onclick=()=>CU.actionForm('client',b.dataset.clientAction));
  document.querySelectorAll('[data-project-action]').forEach(b=>b.onclick=()=>CU.actionForm('project',b.dataset.projectAction));
  document.getElementById('mobileCtxClose')?.addEventListener('click',CU.closeMobileContext);
};

CU.openRoute=route=>{CU.state.ui.route=route;CU.state.ui.context=null;CU.session.route=route;CU.session.focus=route;CU.saveSession();CU.saveState('route');CU.publishPresence();CU.renderApp()};
CU.clearContext=()=>{CU.state.ui.context=null;CU.renderContext();CU.closeMobileContext()};
CU.openEntity=(type,id)=>{
  CU.closeFloating();
  if(type==='deal'){CU.state.ui.route='sales';CU.state.ui.context={type:'deal',id}}
  if(type==='client'){CU.state.ui.route='clients';CU.state.ui.context={type:'client',id}}
  if(type==='project'){CU.state.ui.route='work';CU.state.ui.workView='projects';CU.state.ui.context={type:'project',id}}
  if(type==='action'){CU.state.ui.route='work';CU.state.ui.workView='actions';CU.state.ui.context={type:'action',id}}
  CU.session.focus=`${type}:${id}`;CU.saveSession();CU.saveState('open.entity');CU.renderApp();CU.openMobileContext();
};

CU.searchData=q=>{
  q=q.trim().toLowerCase();if(!q)return{};
  const match=(...v)=>v.some(x=>String(x||'').toLowerCase().includes(q));
  return{
    Vendas:CU.state.deals.filter(d=>match(d.name,d.contact,d.service,d.nextTitle)).slice(0,5).map(d=>({label:d.name,sub:`${CU.stageName(d.stage)} · ${CU.money(d.value)}`,type:'deal',id:d.id})),
    Clientes:CU.state.clients.filter(c=>match(c.name,c.contact,c.service,c.email)).slice(0,5).map(c=>({label:c.name,sub:`${c.contact} · ${c.service}`,type:'client',id:c.id})),
    Projetos:CU.state.projects.filter(p=>match(p.name,CU.clientName(p.clientId),p.status)).slice(0,5).map(p=>({label:CU.projectName(p),sub:`${p.progress}% · ${p.status}`,type:'project',id:p.id})),
    Ações:CU.state.actions.filter(a=>match(a.title,CU.entityLabel(a.entityType,a.entityId))).slice(0,5).map(a=>({label:a.title,sub:`${CU.fmtDate(a.due)} · ${CU.ownerName(a.owner)}`,type:'action',id:a.id}))
  };
};
CU.renderSearch=q=>{
  const box=document.getElementById('searchResults');if(!box)return;const groups=CU.searchData(q);let html='';
  Object.entries(groups).forEach(([g,items])=>{if(items.length)html+=`<div class="search-group">${g}</div>`+items.map(i=>`<div class="search-item" data-search-type="${i.type}" data-search-id="${i.id}"><div><b>${CU.esc(i.label)}</b><span>${CU.esc(i.sub)}</span></div><span>abrir</span></div>`).join('')});
  box.innerHTML=html||'<div class="search-group">Nenhum resultado</div>';box.classList.remove('hidden');box.querySelectorAll('[data-search-id]').forEach(el=>el.onclick=()=>CU.openEntity(el.dataset.searchType,el.dataset.searchId));
};
CU.userMenu=()=>{
  CU.closeFloating();const box=document.createElement('div');box.className='user-menu';box.id='floatingMenu';box.innerHTML=`<div style="padding:10px;font-size:10px;color:var(--muted)">${CU.ownerName(CU.session.user)} · ${CU.session.user}</div><button id="resetDemo">Reiniciar modo treino</button><button id="logoutMenu">Sair</button>`;document.body.appendChild(box);
  document.getElementById('logoutMenu').onclick=CU.logout;document.getElementById('resetDemo').onclick=()=>{if(confirm('Reiniciar todos os dados sintéticos deste CRM?')){CU.state=CU.seed();CU.saveState('reset');CU.renderApp();CU.toast('Modo treino reiniciado','info')}};
};
CU.closeFloating=()=>{document.getElementById('floatingMenu')?.remove();document.getElementById('searchResults')?.classList.add('hidden')};
CU.filterClients=q=>{q=q.toLowerCase();document.querySelectorAll('.list-item[data-type="client"]').forEach(el=>{const c=CU.state.clients.find(x=>x.id===el.dataset.openEntity);el.style.display=(c.name+' '+c.contact+' '+c.service).toLowerCase().includes(q)?'block':'none'})};

CU.setupDrag=()=>{
  document.querySelectorAll('.deal').forEach(d=>{d.ondragstart=e=>{window.__dragDeal=d.dataset.openEntity;e.dataTransfer.effectAllowed='move'}});
  document.querySelectorAll('.stage').forEach(s=>{s.ondragover=e=>{e.preventDefault();s.classList.add('dragover')};s.ondragleave=()=>s.classList.remove('dragover');s.ondrop=e=>{e.preventDefault();s.classList.remove('dragover');const id=window.__dragDeal;if(id)CU.requestAdvance(id,s.dataset.stage)}});
};
CU.openMobileContext=()=>{if(innerWidth<=980)document.getElementById('mobileContext')?.classList.add('open')};
CU.closeMobileContext=()=>document.getElementById('mobileContext')?.classList.remove('open');

document.addEventListener('click',e=>{if(!e.target.closest('#userBtn')&&!e.target.closest('#floatingMenu'))document.getElementById('floatingMenu')?.remove();if(!e.target.closest('#searchWrap'))document.getElementById('searchResults')?.classList.add('hidden')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){CU.closeModal();CU.closeMobileContext();CU.closeFloating()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('searchWrap')?.classList.add('mobile-open');document.getElementById('globalSearch')?.focus()}});
window.addEventListener('beforeunload',CU.stopPresence);

if(CU.session){CU.startPresence();CU.renderApp()}else CU.renderLogin();
})();
