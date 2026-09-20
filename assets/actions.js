
(() => {
'use strict';
const CU=window.CU;

CU.openModal=(title,body,foot='')=>{
  CU.closeModal();
  const wrap=document.createElement('div');wrap.className='backdrop';wrap.id='modalRoot';
  wrap.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><b>${CU.esc(title)}</b><button class="icon-button" data-close-modal>×</button></div><div class="modal-body">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}</div>`;
  document.body.appendChild(wrap);wrap.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=CU.closeModal);wrap.onclick=e=>{if(e.target===wrap)CU.closeModal()};
};
CU.closeModal=()=>document.getElementById('modalRoot')?.remove();
CU.v=id=>document.getElementById(id)?.value.trim()||'';

CU.quickNew=()=>{
  CU.openModal('Criar novo',`<div class="quick-grid">
  ${CU.quickCard('prospect','Possível cliente','Começar pesquisa e qualificação.')}
  ${CU.quickCard('conversation','Registrar conversa','Histórico + próximo passo.')}
  ${CU.quickCard('action','Nova ação','Algo que precisa acontecer.')}
  ${CU.quickCard('deal','Nova venda','Criar venda em andamento.')}
  ${CU.quickCard('proposal','Nova proposta','Ligar proposta a uma venda.')}
  ${CU.quickCard('payment','Registrar pagamento','Entrada real de dinheiro.')}
  ${CU.quickCard('expense','Nova despesa','Fixa, variável ou única.')}
  ${CU.quickCard('project','Novo projeto','Trabalho ligado a cliente.')}
  </div>`,`<button class="btn" data-close-modal>FECHAR</button>`);
  document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>{const t=b.dataset.quick;CU.closeModal();setTimeout(()=>CU.quickForm(t),0)});
};
CU.quickCard=(t,title,desc)=>`<button class="quick-card" data-quick="${t}"><b>${title}</b><span>${desc}</span></button>`;
CU.quickForm=type=>{
  if(type==='prospect')return CU.prospectForm();
  if(type==='conversation')return CU.chooseDealThen('conversation');
  if(type==='action')return CU.actionForm();
  if(type==='deal')return CU.dealForm();
  if(type==='proposal')return CU.chooseDealThen('proposal');
  if(type==='payment')return CU.paymentForm();
  if(type==='expense')return CU.expenseForm();
  if(type==='project')return CU.projectForm();
};

CU.prospectForm=()=>{
  CU.openModal('Novo possível cliente',`<div class="form-grid"><div class="wide"><div class="form-label">NEGÓCIO</div><input class="form-control" id="pName"></div><div><div class="form-label">CONTATO</div><input class="form-control" id="pContact"></div><div><div class="form-label">ORIGEM</div><input class="form-control" id="pChannel" placeholder="Indicação, Google..."></div><div class="wide"><div class="form-label">PRÓXIMO PASSO</div><input class="form-control" id="pNext" placeholder="Pesquisar presença digital"></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveProspect">SALVAR</button>`);
  document.getElementById('saveProspect').onclick=()=>{
    const name=CU.v('pName'),contact=CU.v('pContact'),channel=CU.v('pChannel'),next=CU.v('pNext');
    if(!name||!contact||!next)return CU.toast('Preencha negócio, contato e próximo passo.','err');
    CU.state.prospects.push({id:CU.uid('L'),name,contact,channel:channel||'Não informado',next,owner:CU.session.user});
    CU.addEvent(`Possível cliente criado · ${name}`);CU.saveState('prospect');CU.closeModal();CU.state.ui.route='sales';CU.renderApp();CU.toast('Possível cliente criado');
  };
};

CU.qualifyProspect=id=>{
  const p=CU.state.prospects.find(x=>x.id===id);if(!p)return;
  CU.openModal(`Qualificar · ${p.name}`,`<div class="form-grid"><div><div class="form-label">VALOR ESTIMADO</div><input class="form-control" id="qValue" type="number" step="0.01"></div><div><div class="form-label">SERVIÇO</div><input class="form-control" id="qService" placeholder="Site, GMN..."></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveQualify">CRIAR VENDA</button>`);
  document.getElementById('saveQualify').onclick=()=>{
    const value=Number(document.getElementById('qValue').value),service=CU.v('qService');if(!value||!service)return CU.toast('Informe valor e serviço.','err');
    const d={id:CU.uid('O'),name:p.name,contact:p.contact,stage:'pesquisa',value,owner:p.owner,enteredAt:CU.today(),nextTitle:p.next,nextDue:CU.addDays(1),risk:false,source:p.channel,service,status:'open',history:[{text:'Possível cliente qualificado',actor:CU.session.user,date:CU.today(),time:CU.nowTime()}]};
    CU.state.deals.push(d);CU.state.prospects=CU.state.prospects.filter(x=>x.id!==id);CU.state.actions.push({id:CU.uid('A'),title:p.next,due:CU.addDays(1),status:'open',owner:p.owner,entityType:'deal',entityId:d.id});
    CU.addEvent(`Venda criada a partir de possível cliente · ${p.name}`);CU.saveState('qualify');CU.closeModal();CU.state.ui.context={type:'deal',id:d.id};CU.renderApp(false);CU.renderContext();CU.toast('Venda criada');
  };
};

CU.dealForm=()=>{
  CU.openModal('Nova venda',`<div class="form-grid"><div class="wide"><div class="form-label">NEGÓCIO</div><input class="form-control" id="dName"></div><div><div class="form-label">CONTATO</div><input class="form-control" id="dContact"></div><div><div class="form-label">VALOR</div><input class="form-control" id="dValue" type="number" step="0.01"></div><div><div class="form-label">SERVIÇO</div><input class="form-control" id="dService"></div><div><div class="form-label">RESPONSÁVEL</div><select class="form-control" id="dOwner"><option value="admin123">Sócio A</option><option value="Gadmin123">Sócio B</option></select></div><div class="wide"><div class="form-label">PRÓXIMO PASSO</div><input class="form-control" id="dNext" placeholder="Ex.: pesquisar presença digital"></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveDeal">CRIAR VENDA</button>`);
  document.getElementById('dOwner').value=CU.session.user;
  document.getElementById('saveDeal').onclick=()=>{
    const name=CU.v('dName'),contact=CU.v('dContact'),value=Number(document.getElementById('dValue').value),service=CU.v('dService'),owner=CU.v('dOwner'),next=CU.v('dNext');
    if(!name||!contact||!value||!service||!next)return CU.toast('Preencha todos os campos.','err');
    const d={id:CU.uid('O'),name,contact,stage:'pesquisa',value,owner,enteredAt:CU.today(),nextTitle:next,nextDue:CU.addDays(1),risk:false,source:'Manual',service,status:'open',history:[{text:'Venda criada',actor:CU.session.user,date:CU.today(),time:CU.nowTime()}]};
    CU.state.deals.push(d);CU.state.actions.push({id:CU.uid('A'),title:next,due:CU.addDays(1),status:'open',owner,entityType:'deal',entityId:d.id});
    CU.addEvent(`Nova venda · ${name}`);CU.saveState('deal.new');CU.closeModal();CU.state.ui.route='sales';CU.state.ui.context={type:'deal',id:d.id};CU.renderApp();CU.toast('Venda criada');
  };
};

CU.chooseDealThen=action=>{
  const opts=CU.openDeals().map(d=>`<option value="${d.id}">${CU.esc(d.name)} · ${CU.stageName(d.stage)}</option>`).join('');if(!opts)return CU.toast('Não há venda aberta.','err');
  CU.openModal(action==='proposal'?'Criar proposta':'Registrar conversa',`<div class="field"><label>VENDA</label><select class="form-control" id="chooseDeal">${opts}</select></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="continueDeal">CONTINUAR</button>`);
  document.getElementById('continueDeal').onclick=()=>{const id=CU.v('chooseDeal');CU.closeModal();setTimeout(()=>action==='proposal'?CU.proposalForm(id):CU.conversationForm(id),0)};
};

CU.actionForm=(entityType='general',entityId='')=>{
  CU.openModal('Nova ação',`<div class="form-grid"><div class="wide"><div class="form-label">AÇÃO</div><input class="form-control" id="aTitle"></div><div><div class="form-label">PRAZO</div><input class="form-control" id="aDue" type="date" value="${CU.addDays(1)}"></div><div><div class="form-label">RESPONSÁVEL</div><select class="form-control" id="aOwner"><option value="admin123">Sócio A</option><option value="Gadmin123">Sócio B</option></select></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveAction">SALVAR</button>`);
  document.getElementById('aOwner').value=CU.session.user;
  document.getElementById('saveAction').onclick=()=>{
    const title=CU.v('aTitle'),due=CU.v('aDue'),owner=CU.v('aOwner');if(!title||!due)return CU.toast('Informe ação e prazo.','err');
    CU.state.actions.push({id:CU.uid('A'),title,due,status:'open',owner,entityType,entityId});CU.addEvent(`Ação criada · ${title}`);CU.saveState('action.new');CU.closeModal();CU.renderApp(false);CU.toast('Ação criada');
  };
};

CU.toggleAction=id=>{
  const a=CU.state.actions.find(x=>x.id===id);if(!a)return;a.status=a.status==='done'?'open':'done';CU.addEvent(`${a.status==='done'?'Ação concluída':'Ação reaberta'} · ${a.title}`);CU.saveState('action.toggle');CU.renderApp(false);if(CU.state.ui.context?.id===id)CU.renderContext();CU.toast(a.status==='done'?'Ação concluída':'Ação reaberta','info');
};

CU.conversationForm=id=>{
  const d=CU.state.deals.find(x=>x.id===id);
  CU.openModal(`Registrar conversa · ${d.name}`,`<div class="field"><label>RESUMO DA CONVERSA</label><textarea class="form-control" id="convSummary" placeholder="O que aconteceu?"></textarea></div><div class="form-grid"><div><div class="form-label">PRÓXIMO PASSO</div><input class="form-control" id="convNext" placeholder="Ex.: enviar proposta"></div><div><div class="form-label">DATA</div><input class="form-control" id="convDue" type="date" value="${CU.addDays(1)}"></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveConversation">SALVAR</button>`);
  document.getElementById('saveConversation').onclick=()=>{
    const summary=CU.v('convSummary'),next=CU.v('convNext'),due=CU.v('convDue');if(!summary)return CU.toast('Escreva um resumo da conversa.','err');
    d.history.unshift({text:`Conversa: ${summary}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});
    if(next&&due){d.nextTitle=next;d.nextDue=due;CU.state.actions.push({id:CU.uid('A'),title:next,due,status:'open',owner:d.owner,entityType:'deal',entityId:d.id})}
    CU.addEvent(`Conversa registrada · ${d.name}`);CU.saveState('conversation');CU.closeModal();CU.renderApp(false);CU.state.ui.context={type:'deal',id};CU.renderContext();CU.toast('Conversa registrada');
  };
};

CU.proposalForm=id=>{
  const d=CU.state.deals.find(x=>x.id===id),existing=CU.state.proposals.find(p=>p.dealId===id);
  CU.openModal(`${existing?'Proposta':'Criar proposta'} · ${d.name}`,`<div class="form-grid"><div><div class="form-label">VALOR</div><input class="form-control" id="proposalValue" type="number" step="0.01" value="${existing?.value||d.value}"></div><div><div class="form-label">PRÓXIMO RETORNO</div><input class="form-control" id="proposalFollow" type="date" value="${existing?.followupDue||CU.addDays(2)}"></div><div class="wide"><div class="form-label">STATUS</div><select class="form-control" id="proposalStatus"><option value="draft">Rascunho</option><option value="sent" ${existing?.status==='sent'?'selected':''}>Enviada</option></select></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveProposal">SALVAR</button>`);
  document.getElementById('saveProposal').onclick=()=>{
    const value=Number(document.getElementById('proposalValue').value),follow=CU.v('proposalFollow'),status=CU.v('proposalStatus');if(!value||!follow)return CU.toast('Preencha valor e próximo retorno.','err');
    if(existing){existing.value=value;existing.followupDue=follow;existing.status=status}else CU.state.proposals.push({id:CU.uid('PR'),dealId:id,value,status,createdAt:CU.today(),followupDue:follow});
    d.value=value;d.nextTitle='Acompanhar proposta';d.nextDue=follow;if(!['proposta','decisao'].includes(d.stage)){d.stage='proposta';d.enteredAt=CU.today()}
    d.history.unshift({text:`Proposta ${existing?'atualizada':'criada'} · ${CU.money(value)}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});
    CU.addEvent(`Proposta ${existing?'atualizada':'criada'} · ${d.name}`);CU.saveState('proposal');CU.closeModal();CU.renderApp(false);CU.state.ui.context={type:'deal',id};CU.renderContext();CU.toast('Proposta salva');
  };
};

CU.requestAdvance=(id,target=null)=>{
  const d=CU.state.deals.find(x=>x.id===id);if(!d||d.status!=='open')return;
  const idx=CU.state.stages.findIndex(s=>s.id===d.stage),targetStage=target||CU.state.stages[idx+1]?.id;
  if(!targetStage)return CU.toast('A venda já está na última etapa. Use a decisão comercial.','info');
  if(CU.state.stages.findIndex(s=>s.id===targetStage)<=idx)return CU.moveDeal(d,targetStage,'Retorno manual');
  const missing=CU.gateFor(d).filter(x=>!x.ok);
  if(!missing.length)return CU.moveDeal(d,targetStage,'Gate atendido');
  CU.openModal('Avançar com pendências',`<p class="muted">Faltam ${missing.length} item(ns). O gate é suave: você pode avançar, mas precisa registrar o motivo.</p><div class="gate-list">${missing.map(x=>`<div class="gate-item"><span class="gate-miss">!</span><span>${CU.esc(x.label)}</span></div>`).join('')}</div><div class="field"><label>MOTIVO DO OVERRIDE</label><textarea class="form-control" id="overrideReason"></textarea></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="confirmAdvance">AVANÇAR</button>`);
  document.getElementById('confirmAdvance').onclick=()=>{const reason=CU.v('overrideReason');if(!reason)return CU.toast('Informe o motivo para avançar.','err');CU.moveDeal(d,targetStage,reason);CU.closeModal()};
};
CU.moveDeal=(d,target,reason)=>{
  const old=d.stage;d.stage=target;d.enteredAt=CU.today();d.risk=false;d.history.unshift({text:`Etapa: ${CU.stageName(old)} → ${CU.stageName(target)} · ${reason}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});
  CU.addEvent(`${d.name} avançou para ${CU.stageName(target)}`);CU.saveState('deal.advance');CU.renderApp(false);CU.state.ui.context={type:'deal',id:d.id};CU.renderContext();CU.toast(`${d.name} → ${CU.stageName(target)}`);
};

CU.dealAction=(action,id)=>{
  if(action==='conversation')CU.conversationForm(id);
  if(action==='task')CU.actionForm('deal',id);
  if(action==='proposal')CU.proposalForm(id);
  if(action==='advance')CU.requestAdvance(id);
};

CU.dealFinal=(type,id)=>{
  const d=CU.state.deals.find(x=>x.id===id);
  if(type==='won'){
    CU.openModal(`Venda ganha · ${d.name}`,`<p class="muted">Ganhou cria cliente, projeto e recebíveis. Não registra pagamento automaticamente.</p><div class="form-grid"><div><div class="form-label">VALOR FINAL</div><input class="form-control" id="wonValue" type="number" step="0.01" value="${d.value}"></div><div><div class="form-label">PARCELAS</div><input class="form-control" id="wonInstallments" type="number" min="1" max="24" value="2"></div><div><div class="form-label">CONDIÇÃO</div><input class="form-control" id="wonCondition" value="50% + 50%"></div><div><div class="form-label">INÍCIO PREVISTO</div><input class="form-control" id="wonStart" type="date" value="${CU.addDays(3)}"></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn success" id="saveWon">CONFIRMAR VENDA</button>`);
    document.getElementById('saveWon').onclick=()=>CU.confirmWon(d);
  }
  if(type==='lost'){
    CU.openModal(`Venda perdida · ${d.name}`,`<div class="field"><label>MOTIVO</label><textarea class="form-control" id="lostReason"></textarea></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn danger" id="saveLost">REGISTRAR PERDA</button>`);
    document.getElementById('saveLost').onclick=()=>{const reason=CU.v('lostReason');if(!reason)return CU.toast('Informe o motivo.','err');d.status='lost';d.history.unshift({text:`Venda perdida · ${reason}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});CU.addEvent(`Venda perdida · ${d.name}`);CU.saveState('deal.lost');CU.closeModal();CU.state.ui.context=null;CU.renderApp(false);CU.toast('Perda registrada','info')};
  }
  if(type==='later'){
    CU.openModal(`Não agora · ${d.name}`,`<div class="form-grid"><div><div class="form-label">RETORNAR EM</div><input class="form-control" id="laterDate" type="date" value="${CU.addDays(30)}"></div><div class="wide"><div class="form-label">CONDIÇÃO / MOTIVO</div><textarea class="form-control" id="laterReason"></textarea></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn warn" id="saveLater">AGENDAR RETORNO</button>`);
    document.getElementById('saveLater').onclick=()=>{const date=CU.v('laterDate'),reason=CU.v('laterReason');if(!date||!reason)return CU.toast('Informe data e condição de retorno.','err');d.status='later';d.history.unshift({text:`Não agora · ${reason}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});CU.state.actions.push({id:CU.uid('A'),title:`Retomar ${d.name}`,due:date,status:'open',owner:d.owner,entityType:'deal',entityId:d.id});CU.addEvent(`Venda marcada para retorno · ${d.name}`);CU.saveState('deal.later');CU.closeModal();CU.state.ui.context=null;CU.renderApp(false);CU.toast('Retorno agendado')};
  }
};

CU.confirmWon=d=>{
  const value=Number(document.getElementById('wonValue').value),n=Math.max(1,Number(document.getElementById('wonInstallments').value)||1),condition=CU.v('wonCondition'),start=CU.v('wonStart');
  if(!value||!condition||!start)return CU.toast('Preencha os campos da venda ganha.','err');
  d.value=value;d.status='won';d.history.unshift({text:`Venda ganha · ${CU.money(value)} · ${condition}`,actor:CU.session.user,date:CU.today(),time:CU.nowTime()});
  let c=CU.state.clients.find(c=>c.name.toLowerCase()===d.name.toLowerCase());
  if(!c){c={id:CU.uid('C'),name:d.name,contact:d.contact,role:'Contato principal',phone:'',email:'',service:d.service,owner:d.owner,status:'active'};CU.state.clients.push(c)}
  const p={id:CU.uid('P'),clientId:c.id,name:d.service,status:'planned',progress:0,due:CU.addDays(14),blockedReason:''};CU.state.projects.push(p);
  const base=Math.floor((value/n)*100)/100;let created=0;
  for(let i=1;i<=n;i++){const amount=i===n?Number((value-created).toFixed(2)):base;created=Number((created+amount).toFixed(2));CU.state.receivables.push({id:CU.uid('R'),clientId:c.id,dealId:d.id,projectId:p.id,description:`Parcela ${i}/${n} · ${d.name}`,amount,due:CU.addDays((i-1)*30),status:'open'})}
  CU.addEvent(`Venda ganha · ${d.name} · ${CU.money(value)}`);CU.saveState('deal.won');CU.closeModal();CU.state.ui.route='clients';CU.state.ui.context={type:'client',id:c.id};CU.renderApp();CU.toast('Venda confirmada. Cliente, projeto e recebíveis criados.');
};

CU.paymentForm=(receivableId='')=>{
  const open=CU.state.receivables.filter(r=>CU.remainingReceivable(r)>0&&r.status!=='cancelled');if(!open.length)return CU.toast('Não há valor a receber em aberto.','info');
  CU.openModal('Registrar pagamento',`<div class="form-grid"><div class="wide"><div class="form-label">VALOR A RECEBER</div><select class="form-control" id="payRec">${open.map(r=>`<option value="${r.id}" ${r.id===receivableId?'selected':''}>${CU.esc(CU.clientName(r.clientId))} · ${CU.esc(r.description)} · saldo ${CU.money(CU.remainingReceivable(r))}</option>`).join('')}</select></div><div><div class="form-label">VALOR RECEBIDO</div><input class="form-control" id="payAmount" type="number" step="0.01"></div><div><div class="form-label">DATA</div><input class="form-control" id="payDate" type="date" value="${CU.today()}"></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn success" id="savePayment">REGISTRAR</button>`);
  const sel=document.getElementById('payRec'),amount=document.getElementById('payAmount'),sync=()=>amount.value=CU.remainingReceivable(CU.state.receivables.find(r=>r.id===sel.value)).toFixed(2);sel.onchange=sync;sync();
  document.getElementById('savePayment').onclick=()=>{const rid=CU.v('payRec'),amt=Number(document.getElementById('payAmount').value),date=CU.v('payDate'),r=CU.state.receivables.find(x=>x.id===rid),rem=CU.remainingReceivable(r);if(!amt||amt<=0||amt>rem+.001)return CU.toast(`Valor deve ser entre R$ 0,01 e ${CU.money(rem)}.`,'err');CU.state.payments.push({id:CU.uid('PAY'),receivableId:rid,amount:amt,date,type:'received'});CU.addEvent(`Pagamento recebido · ${CU.clientName(r.clientId)} · ${CU.money(amt)}`);CU.saveState('payment');CU.closeModal();CU.state.ui.route='finance';CU.state.ui.financeView='overview';CU.renderApp();CU.toast('Pagamento registrado')};
};

CU.expenseForm=()=>{
  CU.openModal('Nova despesa',`<div class="form-grid"><div class="wide"><div class="form-label">DESCRIÇÃO</div><input class="form-control" id="eDesc"></div><div><div class="form-label">CATEGORIA</div><select class="form-control" id="eCat">${CU.state.budgets.categories.map(c=>`<option>${CU.esc(c.name)}</option>`).join('')}</select></div><div><div class="form-label">TIPO</div><select class="form-control" id="eKind"><option value="fixed">Fixa / recorrente</option><option value="variable">Variável</option><option value="one">Única</option></select></div><div><div class="form-label">VALOR</div><input class="form-control" id="eAmount" type="number" step="0.01"></div><div><div class="form-label">VENCIMENTO</div><input class="form-control" id="eDue" type="date" value="${CU.addDays(5)}"></div><div><div class="form-label">FORNECEDOR</div><input class="form-control" id="eSupplier"></div><div><div class="form-label">SITUAÇÃO</div><select class="form-control" id="eStatus"><option value="open">A pagar</option><option value="paid">Já paga</option></select></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveExpense">SALVAR</button>`);
  document.getElementById('saveExpense').onclick=()=>{const description=CU.v('eDesc'),category=CU.v('eCat'),kind=CU.v('eKind'),amount=Number(document.getElementById('eAmount').value),due=CU.v('eDue'),supplier=CU.v('eSupplier'),status=CU.v('eStatus');if(!description||!amount||!due)return CU.toast('Preencha descrição, valor e vencimento.','err');CU.state.expenses.push({id:CU.uid('E'),description,category,kind,amount,due,supplier,status,paidAt:status==='paid'?CU.today():null});CU.addEvent(`Despesa registrada · ${description} · ${CU.money(amount)}`);CU.saveState('expense');CU.closeModal();CU.state.ui.route='finance';CU.state.ui.financeView='expenses';CU.renderApp();CU.toast('Despesa registrada')};
};

CU.projectForm=()=>{
  if(!CU.state.clients.length)return CU.toast('Cadastre ou converta um cliente antes.','err');
  CU.openModal('Novo projeto',`<div class="form-grid"><div class="wide"><div class="form-label">CLIENTE</div><select class="form-control" id="pjClient">${CU.state.clients.map(c=>`<option value="${c.id}">${CU.esc(c.name)}</option>`).join('')}</select></div><div class="wide"><div class="form-label">PROJETO</div><input class="form-control" id="pjName"></div><div><div class="form-label">PRAZO</div><input class="form-control" id="pjDue" type="date" value="${CU.addDays(14)}"></div><div><div class="form-label">STATUS</div><select class="form-control" id="pjStatus"><option value="planned">Planejado</option><option value="doing">Em andamento</option></select></div></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveProject">SALVAR</button>`);
  document.getElementById('saveProject').onclick=()=>{const clientId=CU.v('pjClient'),name=CU.v('pjName'),due=CU.v('pjDue'),status=CU.v('pjStatus');if(!name||!due)return CU.toast('Informe projeto e prazo.','err');CU.state.projects.push({id:CU.uid('P'),clientId,name,status,progress:0,due,blockedReason:''});CU.addEvent(`Projeto criado · ${CU.clientName(clientId)} · ${name}`);CU.saveState('project');CU.closeModal();CU.state.ui.route='work';CU.state.ui.workView='projects';CU.renderApp();CU.toast('Projeto criado')};
};

CU.markExpensePaid=id=>{const e=CU.state.expenses.find(x=>x.id===id);if(!e||e.paidAt)return CU.toast('Despesa já está paga.','info');e.status='paid';e.paidAt=CU.today();CU.addEvent(`Despesa paga · ${e.description} · ${CU.money(e.amount)}`);CU.saveState('expense.paid');CU.renderApp(false);CU.toast('Despesa marcada como paga')};
CU.editBudget=cat=>{const c=CU.state.budgets.categories.find(x=>x.name===cat);CU.openModal(`Orçamento · ${cat}`,`<div class="field"><label>PLANEJADO PARA O MÊS</label><input class="form-control" id="budgetValue" type="number" step="0.01" value="${c.planned}"></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveBudget">SALVAR</button>`);document.getElementById('saveBudget').onclick=()=>{const n=Number(document.getElementById('budgetValue').value);if(n<0)return CU.toast('Valor inválido.','err');c.planned=n;CU.saveState('budget');CU.closeModal();CU.renderApp(false);CU.toast('Orçamento atualizado')}};
CU.setOpeningBalance=()=>{CU.openModal('Definir saldo inicial registrado',`<p class="muted">Use um saldo que você realmente conferiu. O laboratório não consulta banco.</p><div class="field"><label>SALDO INICIAL</label><input class="form-control" id="openingBalance" type="number" step="0.01" value="${CU.state.meta.openingBalance??''}"></div>`,`<button class="btn" data-close-modal>CANCELAR</button><button class="btn primary" id="saveBalance">SALVAR</button>`);document.getElementById('saveBalance').onclick=()=>{const n=Number(document.getElementById('openingBalance').value);if(Number.isNaN(n))return CU.toast('Informe um valor válido.','err');CU.state.meta.openingBalance=n;CU.saveState('opening.balance');CU.closeModal();CU.renderApp(false);CU.toast('Saldo inicial registrado')}};

})();
