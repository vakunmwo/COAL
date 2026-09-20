
(() => {
'use strict';
const CU=window.CU=window.CU||{};

CU.USERS={
  admin123:{hash:'240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',label:'Sócio A'},
  Gadmin123:{hash:'6f10ec7107715576e0dcf16ebe9880a1c860a6e3ba6ccd14901c74f967b57c6b',label:'Sócio B'}
};
CU.STATE_KEY='coalup-v103-operacao-integrada';
CU.SESSION_KEY='coalup-v104-session';
CU.memoryState=null;CU.memorySession=null;CU.presence={};CU.bc=null;CU.presenceTimer=null;
try{if('BroadcastChannel' in window)CU.bc=new BroadcastChannel('coalup-v104-coop')}catch(err){console.warn('[V10.4] Co-op local indisponível',err)}
CU.today=()=>new Date().toISOString().slice(0,10);
CU.month=()=>new Date().toISOString().slice(0,7);
CU.uid=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
CU.clone=x=>JSON.parse(JSON.stringify(x));
CU.esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
CU.money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
CU.fmtDate=v=>{if(!v)return '—';const [y,m,d]=String(v).slice(0,10).split('-');return `${d}/${m}/${y}`};
CU.nowTime=()=>new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
CU.daysDiff=(a,b)=>Math.max(0,Math.ceil((new Date(a+'T12:00:00')-new Date(b+'T12:00:00'))/86400000));
CU.addDays=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
CU.hist=(text,actor,days)=>({text,actor,date:CU.addDays(days),time:'10:00'});
CU.evt=(text,actor,days)=>({id:CU.uid('EV'),text,actor,date:CU.addDays(days),time:'10:00'});

CU.seed=()=>({
  meta:{training:true,version:'10.3',financeMonth:CU.month(),openingBalance:null},
  ui:{route:'today',context:null,financeView:'overview',salesView:'funnel',workView:'actions',manualTopic:'start',filters:{owner:'all',stage:'all',risk:'all',service:'all',next:'all'}},
  prospects:[
    {id:'L-01',name:'Brava Fitness',contact:'Renata',channel:'Indicação',next:'Pesquisar presença digital',owner:'admin123'},
    {id:'L-02',name:'Oficina Delta',contact:'Lucas',channel:'Google',next:'Levantar evidências',owner:'Gadmin123'},
    {id:'L-03',name:'Casa Lume',contact:'Fernanda',channel:'Instagram',next:'Primeiro contato',owner:'admin123'}
  ],
  stages:[
    {id:'pesquisa',name:'Pesquisa'},{id:'evidencia',name:'Evidência'},{id:'abordagem',name:'Abordagem'},
    {id:'diagnostico',name:'Diagnóstico'},{id:'oferta',name:'Oferta'},{id:'proposta',name:'Proposta'},{id:'decisao',name:'Decisão'}
  ],
  deals:[
    {id:'O-01',name:'Atlas Oficina',contact:'Matheus',stage:'proposta',value:1800,owner:'admin123',enteredAt:CU.addDays(-4),nextTitle:'Retomar proposta',nextDue:CU.addDays(0),risk:true,source:'Indicação',service:'Site',status:'open',history:[CU.hist('Proposta enviada','Gadmin123',-3),CU.hist('Diagnóstico concluído','admin123',-5)]},
    {id:'O-02',name:'Nativa Pet',contact:'Camila',stage:'diagnostico',value:1990,owner:'Gadmin123',enteredAt:CU.addDays(-2),nextTitle:'Fechar diagnóstico',nextDue:CU.addDays(0),risk:false,source:'Instagram',service:'Presença Digital',status:'open',history:[CU.hist('Conversa registrada','Gadmin123',-2)]},
    {id:'O-03',name:'Aurora Studio',contact:'Andréia',stage:'proposta',value:1329.90,owner:'admin123',enteredAt:CU.addDays(-3),nextTitle:'Acompanhar proposta',nextDue:CU.addDays(1),risk:false,source:'Indicação',service:'Site',status:'open',history:[CU.hist('Proposta criada','admin123',-3)]},
    {id:'O-04',name:'Studio Norte',contact:'Carla',stage:'oferta',value:2490,owner:'Gadmin123',enteredAt:CU.addDays(-2),nextTitle:'Montar oferta',nextDue:CU.addDays(1),risk:false,source:'Google',service:'Presença Digital',status:'open',history:[CU.hist('Diagnóstico registrado','Gadmin123',-2)]},
    {id:'O-05',name:'Café Horizonte',contact:'Paula',stage:'pesquisa',value:800,owner:'admin123',enteredAt:CU.addDays(-1),nextTitle:'Completar pesquisa',nextDue:CU.addDays(0),risk:false,source:'Prospecção',service:'GMN',status:'open',history:[CU.hist('Venda criada','admin123',-1)]},
    {id:'O-06',name:'Casa Nobre',contact:'Mariana',stage:'evidencia',value:1100,owner:'Gadmin123',enteredAt:CU.addDays(-5),nextTitle:'Registrar evidências',nextDue:CU.addDays(-1),risk:true,source:'Prospecção',service:'GMN',status:'open',history:[CU.hist('Pesquisa concluída','Gadmin123',-5)]}
  ],
  proposals:[
    {id:'PR-01',dealId:'O-01',value:1800,status:'sent',createdAt:CU.addDays(-3),followupDue:CU.addDays(0)},
    {id:'PR-02',dealId:'O-03',value:1329.90,status:'sent',createdAt:CU.addDays(-3),followupDue:CU.addDays(1)}
  ],
  clients:[
    {id:'C-01',name:'Mosaico Café',contact:'Bruno Lima',role:'Proprietário',phone:'(41) 99900-1001',email:'bruno@mosaico.demo',service:'Site + GMN',owner:'admin123',status:'active'},
    {id:'C-02',name:'Estúdio Prisma',contact:'Lívia Santos',role:'Gestora',phone:'(41) 99900-2002',email:'livia@prisma.demo',service:'Presença Digital',owner:'Gadmin123',status:'active'},
    {id:'C-03',name:'Lume Arquitetura',contact:'Paula Reis',role:'Sócia',phone:'(41) 99900-3003',email:'paula@lume.demo',service:'Site',owner:'admin123',status:'active'}
  ],
  actions:[
    {id:'A-01',title:'Retomar proposta Atlas Oficina',due:CU.addDays(0),status:'open',owner:'admin123',entityType:'deal',entityId:'O-01'},
    {id:'A-02',title:'Fechar diagnóstico Nativa Pet',due:CU.addDays(0),status:'open',owner:'Gadmin123',entityType:'deal',entityId:'O-02'},
    {id:'A-03',title:'Cobrar materiais do Estúdio Prisma',due:CU.addDays(-1),status:'open',owner:'Gadmin123',entityType:'client',entityId:'C-02'},
    {id:'A-04',title:'Revisar entrega Mosaico Café',due:CU.addDays(1),status:'open',owner:'admin123',entityType:'project',entityId:'P-01'}
  ],
  projects:[
    {id:'P-01',clientId:'C-01',name:'Site institucional',status:'doing',progress:72,due:CU.addDays(5),blockedReason:''},
    {id:'P-02',clientId:'C-02',name:'Presença Digital',status:'waiting',progress:48,due:CU.addDays(7),blockedReason:'Aguardando materiais do cliente'},
    {id:'P-03',clientId:'C-03',name:'Site portfólio',status:'planned',progress:15,due:CU.addDays(14),blockedReason:''}
  ],
  receivables:[
    {id:'R-01',clientId:'C-01',dealId:null,projectId:'P-01',description:'Parcela 2 · Site',amount:700,due:CU.addDays(3),status:'open'},
    {id:'R-02',clientId:'C-02',dealId:null,projectId:'P-02',description:'Mensalidade setembro',amount:250,due:CU.addDays(-2),status:'open'},
    {id:'R-03',clientId:'C-03',dealId:null,projectId:'P-03',description:'Entrada do projeto',amount:500,due:CU.addDays(-10),status:'received'}
  ],
  payments:[
    {id:'PAY-01',receivableId:'R-03',amount:500,date:CU.addDays(-10),type:'received'},
    {id:'PAY-02',receivableId:null,amount:300,date:CU.addDays(-4),type:'received',description:'Serviço pontual'},
    {id:'PAY-03',receivableId:null,amount:129.90,date:CU.addDays(-2),type:'received',description:'Recorrência de serviço'}
  ],
  expenses:[
    {id:'E-01',description:'Hospedagem',category:'Infraestrutura',amount:29.90,due:CU.addDays(-8),paidAt:CU.addDays(-8),status:'paid',kind:'fixed',supplier:'Fornecedor Demo'},
    {id:'E-02',description:'Ferramenta de design',category:'Ferramentas',amount:79.90,due:CU.addDays(-6),paidAt:CU.addDays(-6),status:'paid',kind:'fixed',supplier:'Fornecedor Demo'},
    {id:'E-03',description:'Impressão de material',category:'Marketing',amount:120,due:CU.addDays(2),paidAt:null,status:'open',kind:'variable',supplier:'Gráfica Demo'},
    {id:'E-04',description:'Imposto MEI',category:'Impostos',amount:80,due:CU.addDays(5),paidAt:null,status:'open',kind:'fixed',supplier:'Obrigação cadastrada'}
  ],
  budgets:{month:CU.month(),categories:[
    {name:'Infraestrutura',planned:160},{name:'Ferramentas',planned:200},{name:'Marketing',planned:350},{name:'Impostos',planned:100},{name:'Outros',planned:150}
  ]},
  recurrences:[
    {id:'REC-01',name:'Hospedagem clientes',type:'infrastructure',amount:89.70,status:'active'},
    {id:'REC-02',name:'Serviço recorrente',type:'service',amount:250,status:'active'}
  ],
  events:[CU.evt('Pagamento registrado · R$ 129,90','admin123',-2),CU.evt('Proposta criada · Aurora Studio','admin123',-3),CU.evt('Diagnóstico concluído · Atlas Oficina','Gadmin123',-5)]
});

CU.loadState=()=>{try{const raw=localStorage.getItem(CU.STATE_KEY);return raw?JSON.parse(raw):CU.seed()}catch(err){console.warn('[V10.4] localStorage indisponível',err);return CU.memoryState?CU.clone(CU.memoryState):CU.seed()}};
CU.saveState=(reason='update')=>{CU.memoryState=CU.clone(CU.state);try{localStorage.setItem(CU.STATE_KEY,JSON.stringify(CU.state))}catch(err){console.warn('[V10.4] localStorage indisponível',err)}if(CU.bc)CU.bc.postMessage({type:'state',state:CU.state,from:CU.session?.user||null,reason,at:Date.now()})};
CU.loadSession=()=>{try{return JSON.parse(sessionStorage.getItem(CU.SESSION_KEY)||'null')}catch(err){console.warn('[V10.4] sessionStorage indisponível',err);return CU.memorySession?CU.clone(CU.memorySession):null}};
CU.saveSession=()=>{CU.memorySession=CU.session?CU.clone(CU.session):null;try{sessionStorage.setItem(CU.SESSION_KEY,JSON.stringify(CU.session))}catch(err){console.warn('[V10.4] não foi possível persistir a sessão neste contexto',err)}};
CU.clearSession=()=>{CU.memorySession=null;try{sessionStorage.removeItem(CU.SESSION_KEY)}catch(err){console.warn('[V10.4] não foi possível limpar a sessão persistida',err)}};

CU.state=CU.loadState();CU.session=CU.loadSession();

CU.ownerName=u=>u==='admin123'?'Sócio A':u==='Gadmin123'?'Sócio B':u||'Sem responsável';
CU.stageName=id=>CU.state.stages.find(s=>s.id===id)?.name||id;
CU.clientName=id=>CU.state.clients.find(c=>c.id===id)?.name||'Sem cliente';
CU.projectName=p=>`${CU.clientName(p.clientId)} · ${p.name}`;
CU.entityLabel=(type,id)=>{
  if(type==='deal')return CU.state.deals.find(d=>d.id===id)?.name||'Venda';
  if(type==='client')return CU.clientName(id);
  if(type==='project'){const p=CU.state.projects.find(p=>p.id===id);return p?CU.projectName(p):'Projeto'}
  return 'Operação';
};
CU.openDeals=()=>CU.state.deals.filter(d=>d.status==='open');
CU.proposalsOpen=()=>CU.state.proposals.filter(p=>['draft','sent'].includes(p.status));
CU.dealAge=d=>CU.daysDiff(CU.today(),d.enteredAt);
CU.paidForReceivable=id=>CU.state.payments.filter(p=>p.receivableId===id&&p.type==='received').reduce((a,p)=>a+Number(p.amount),0);
CU.remainingReceivable=r=>Math.max(0,Number(r.amount)-CU.paidForReceivable(r.id));
CU.recStatus=r=>{if(r.status==='cancelled')return'cancelled';if(CU.remainingReceivable(r)<=0)return'received';if(r.due<CU.today())return'late';if(r.due===CU.today())return'today';return'open'};
CU.expStatus=e=>{if(e.status==='cancelled')return'cancelled';if(e.paidAt||e.status==='paid')return'paid';if(e.due<CU.today())return'late';if(e.due===CU.today())return'today';return'open'};
CU.financeMetrics=()=>{
  const m=CU.state.meta.financeMonth||CU.month();
  const received=CU.state.payments.filter(p=>p.type==='received'&&String(p.date).startsWith(m)).reduce((a,p)=>a+Number(p.amount),0)-CU.state.payments.filter(p=>p.type==='reversal'&&String(p.date).startsWith(m)).reduce((a,p)=>a+Number(p.amount),0);
  const expensesPaid=CU.state.expenses.filter(e=>e.paidAt&&String(e.paidAt).startsWith(m)).reduce((a,e)=>a+Number(e.amount),0);
  const toReceive=CU.state.receivables.filter(r=>['open','today'].includes(CU.recStatus(r))).reduce((a,r)=>a+CU.remainingReceivable(r),0);
  const late=CU.state.receivables.filter(r=>CU.recStatus(r)==='late').reduce((a,r)=>a+CU.remainingReceivable(r),0);
  const toPay=CU.state.expenses.filter(e=>['open','today','late'].includes(CU.expStatus(e))).reduce((a,e)=>a+Number(e.amount),0);
  const recurring=CU.state.recurrences.filter(r=>r.status==='active').reduce((a,r)=>a+Number(r.amount),0);
  return{received,expensesPaid,toReceive,late,toPay,recurring,operational:received-expensesPaid};
};
CU.actualBudget=cat=>{const m=CU.state.meta.financeMonth||CU.month();return CU.state.expenses.filter(e=>e.category===cat&&e.paidAt&&String(e.paidAt).startsWith(m)).reduce((a,e)=>a+Number(e.amount),0)};
CU.missingNextDeals=()=>CU.openDeals().filter(d=>!d.nextTitle||!d.nextDue);

CU.risks=()=>{
  const arr=[];
  CU.openDeals().filter(d=>d.risk||d.nextDue<CU.today()).forEach(d=>arr.push({type:'sale',id:d.id,title:d.name,text:d.nextDue<CU.today()?'Próximo passo vencido':`${CU.dealAge(d)} dias nesta etapa`,severity:'red'}));
  CU.state.projects.filter(p=>['waiting','blocked'].includes(p.status)).forEach(p=>arr.push({type:'project',id:p.id,title:CU.projectName(p),text:p.blockedReason||'Projeto aguardando condição',severity:'yellow'}));
  CU.state.receivables.filter(r=>CU.recStatus(r)==='late').forEach(r=>arr.push({type:'receivable',id:r.id,title:CU.clientName(r.clientId),text:`${CU.money(CU.remainingReceivable(r))} atrasado`,severity:'red'}));
  return arr;
};
CU.priorities=()=>{
  const out=[],late=CU.openDeals().find(d=>d.nextDue<=CU.today()&&(d.risk||d.nextDue<CU.today()));
  if(late)out.push({kind:'main',title:`Retomar ${late.name}`,text:`${CU.stageName(late.stage)} · próximo passo ${CU.fmtDate(late.nextDue)}`,entityType:'deal',entityId:late.id});
  const diag=CU.openDeals().find(d=>d.stage==='diagnostico');if(diag)out.push({kind:'advance',title:`Avançar ${diag.name}`,text:'Fechar diagnóstico e preparar a próxima etapa.',entityType:'deal',entityId:diag.id});
  const p=CU.state.projects.find(p=>['waiting','blocked'].includes(p.status));if(p)out.push({kind:'protect',title:`Desbloquear ${CU.projectName(p)}`,text:p.blockedReason||'Projeto precisa de atenção.',entityType:'project',entityId:p.id});
  return out.slice(0,3);
};
CU.journey=()=>{
  const fm=CU.financeMetrics();
  return[
    {title:'Primeiro recebimento',done:CU.state.payments.some(p=>p.type==='received'&&p.amount>0),text:'Registrar o primeiro pagamento real.'},
    {title:'R$ 1 mil recebidos',done:fm.received>=1000,text:`Mês atual: ${CU.money(fm.received)}`},
    {title:'Primeira recorrência',done:CU.state.recurrences.some(r=>r.status==='active'&&r.amount>0),text:`Ativa: ${CU.money(fm.recurring)}/m`},
    {title:'Funil com próximo passo',done:CU.missingNextDeals().length===0,text:CU.missingNextDeals().length?`${CU.missingNextDeals().length} venda(s) sem próximo passo`:'Todas cobertas'},
    {title:'Sem atraso financeiro',done:fm.late===0,text:fm.late?`${CU.money(fm.late)} atrasado`:'Nenhum valor atrasado'},
    {title:'R$ 5 mil recebidos',done:fm.received>=5000,text:`Faltam ${CU.money(Math.max(0,5000-fm.received))}`}
  ];
};

CU.addEvent=(text,actor=CU.session?.user||'sistema')=>{CU.state.events.unshift({id:CU.uid('EV'),text,actor,date:CU.today(),time:CU.nowTime()});CU.state.events=CU.state.events.slice(0,40)};
CU.toast=(msg,type='ok')=>{const box=document.getElementById('toasts');if(!box)return;const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;box.appendChild(t);setTimeout(()=>t.remove(),3300)};

CU.sha256Fallback=function(ascii){
  function rr(value,amount){return(value>>>amount)|(value<<(32-amount))}
  const mp=Math.pow,mw=mp(2,32);let result='',words=[],len=ascii.length*8,hash=[];const k=[],comp={};let pc=0;
  for(let cand=2;pc<64;cand++)if(!comp[cand]){for(let i=0;i<313;i+=cand)comp[i]=cand;hash[pc]=(mp(cand,.5)*mw)|0;k[pc++]=(mp(cand,1/3)*mw)|0}
  ascii+='\x80';while(ascii.length%64-56)ascii+='\x00';
  for(let i=0;i<ascii.length;i++){const j=ascii.charCodeAt(i);if(j>>8)return'';words[i>>2]|=j<<((3-i)%4)*8}
  words[words.length]=((len/mw)|0);words[words.length]=len;
  for(let j=0;j<words.length;){const w=words.slice(j,j+=16),old=hash.slice(0);for(let i=0;i<64;i++){const w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4],t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0),t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));hash=[(t1+t2)|0].concat(hash);hash[4]=(hash[4]+t1)|0;hash.pop()}for(let i=0;i<8;i++)hash[i]=(hash[i]+old[i])|0}
  for(let i=0;i<8;i++)for(let j=3;j+1;j--){const b=(hash[i]>>(j*8))&255;result+=(b<16?'0':'')+b.toString(16)}return result;
};
CU.sha256=async text=>{try{if(globalThis.crypto?.subtle){const data=new TextEncoder().encode(text),hash=await crypto.subtle.digest('SHA-256',data);return[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}}catch(err){console.warn('[V10.4] Web Crypto indisponível',err)}return CU.sha256Fallback(text)};

})();
