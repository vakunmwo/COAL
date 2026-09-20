
(() => {
'use strict';
const CU=window.CU;

CU.state.meta.version='10.4';
CU.state.ui.salesView=CU.state.ui.salesView||'funnel';
CU.state.ui.mobileSalesStage=CU.state.ui.mobileSalesStage||'proposta';

/*
UX LAB:
O backend real ainda não está ligado.
Para aproximar a experiência do contrato final, cada venda aberta ganha um
nextActionTaskId apontando para uma Action real quando possível.
Os campos legacy nextTitle/nextDue continuam existentes apenas para
compatibilidade com a V10.3.
*/
CU.state.deals.filter(d=>d.status==='open').forEach(d=>{
  let task=CU.state.actions.find(a=>a.entityType==='deal'&&a.entityId===d.id&&a.status==='open');
  if(!task && d.nextTitle && d.nextDue){
    task={
      id:CU.uid('A'),
      title:d.nextTitle,
      due:d.nextDue,
      status:'open',
      owner:d.owner,
      entityType:'deal',
      entityId:d.id,
      source:'v104-compat'
    };
    CU.state.actions.push(task);
  }
  d.nextActionTaskId=task?.id||null;
});

CU.nextActionOf=d=>{
  if(!d)return null;
  let task=d.nextActionTaskId?CU.state.actions.find(a=>a.id===d.nextActionTaskId&&a.status==='open'):null;
  if(!task){
    task=CU.state.actions.find(a=>a.entityType==='deal'&&a.entityId===d.id&&a.status==='open');
    if(task)d.nextActionTaskId=task.id;
  }
  return task||null;
};

CU.hasAttention=d=>{
  const task=CU.nextActionOf(d);
  return !!(d.risk || !task || (task.due && task.due<CU.today()));
};

CU.nextActionBucket=d=>{
  const task=CU.nextActionOf(d);
  if(!task)return 'missing';
  if(task.due<CU.today())return 'overdue';
  if(task.due===CU.today())return 'today';
  return 'next';
};

CU.proposalDisplayState=p=>{
  if(p.status==='draft')return {key:'draft',label:'Rascunho'};
  if(p.status==='accepted')return {key:'accepted',label:'Aceita'};
  if(['rejected','closed'].includes(p.status))return {key:'closed',label:'Recusada / encerrada'};
  if(p.status==='sent' && p.followupDue && p.followupDue<=CU.today())return {key:'waiting',label:'Aguardando retorno'};
  if(p.status==='sent')return {key:'sent',label:'Enviada'};
  return {key:p.status||'unknown',label:p.status||'Sem estado'};
};

CU.saveState('v104.state.bridge');
})();
