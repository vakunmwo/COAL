
(() => {
'use strict';
const CU=window.CU;
const baseContext=CU.contextHTML;

CU.dealContextV104=id=>{
  const d=CU.state.deals.find(x=>x.id===id);
  if(!d)return '<div class="ctx-empty">Venda não encontrada.</div>';
  const proposal=CU.state.proposals.find(p=>p.dealId===id);
  const gate=CU.gateFor(d);
  const task=CU.nextActionOf(d);
  const bucket=CU.nextActionBucket(d);
  const history=d.history||[];
  const diagnosis=history.filter(h=>/diagn|problema|conversa|evid/i.test(h.text));
  const proposalState=proposal?CU.proposalDisplayState(proposal):null;

  const taskBox=!task
    ? `<div class="next-action-box missing"><div class="next-action-label">Próximo passo</div><div class="next-action-title">Ainda não definido</div><div class="next-action-meta">A venda precisa sair daqui com uma ação real.</div><button class="btn sm warn" style="margin-top:10px" data-v104-next-action="${d.id}">Definir próximo passo</button></div>`
    : `<div class="next-action-box ${bucket==='overdue'?'attention':''}"><div class="next-action-label">Próximo passo</div><div class="next-action-title">${CU.esc(task.title)}</div><div class="next-action-meta">${bucket==='overdue'?'Vencido · ':bucket==='today'?'Hoje · ':''}${CU.fmtDate(task.due)} · ${CU.ownerName(task.owner)}</div></div>`;

  return `<div class="deal360-head">
    <div class="ctx-kicker">Venda 360 · Cockpit comercial</div>
    <div class="deal360-title-row"><div><div class="deal360-title">${CU.esc(d.name)}</div><div class="deal360-contact">${CU.esc(d.contact)} · ${CU.esc(d.service||'Serviço não definido')}</div></div><div class="deal360-value">${CU.money(d.value)}</div></div>
    <div class="deal360-meta">
      <div><span>Etapa</span><strong>${CU.stageName(d.stage)}</strong></div>
      <div><span>Tempo na etapa</span><strong>${CU.dealAge(d)} dia(s)</strong></div>
      <div><span>Responsável</span><strong>${CU.ownerName(d.owner)}</strong></div>
      <div><span>Origem</span><strong>${CU.esc(d.source||'Não informada')}</strong></div>
    </div>
    <div class="deal360-primary">
      <button class="btn" data-deal-action="conversation" data-id="${d.id}">Registrar conversa</button>
      <button class="btn" data-deal-action="task" data-id="${d.id}">Nova ação</button>
      <button class="btn primary" data-deal-action="proposal" data-id="${d.id}">${proposal?'Abrir / atualizar proposta':'Criar proposta'}</button>
      <button class="btn primary" data-deal-action="advance" data-id="${d.id}">Avançar etapa</button>
    </div>
  </div>

  <div class="ctx-section">${taskBox}</div>

  <details class="accordion" open>
    <summary>Para avançar <span>${gate.filter(x=>x.ok).length}/${gate.length}</span></summary>
    <div class="accordion-content"><div class="gate-list">${gate.map(x=>`<div class="gate-item"><span class="${x.ok?'gate-ok':'gate-miss'}">${x.ok?'✓':'!'}</span><span>${CU.esc(x.label)}</span></div>`).join('')}</div><p style="margin:12px 0 0;color:var(--muted)">Gate suave no laboratório: pendência exige motivo ao avançar.</p></div>
  </details>

  <details class="accordion">
    <summary>Diagnóstico e evidências <span>${diagnosis.length}</span></summary>
    <div class="accordion-content">${diagnosis.length?diagnosis.map(h=>`<div class="history-line"><b>${CU.esc(h.text)}</b><span>${CU.ownerName(h.actor)} · ${CU.fmtDate(h.date)}</span></div>`).join(''):'<div class="empty-structured">Nenhuma evidência estruturada neste laboratório. Não inventamos dado para preencher o bloco.</div>'}</div>
  </details>

  <details class="accordion">
    <summary>Histórico <span>${history.length}</span></summary>
    <div class="accordion-content">${history.length?history.map(h=>`<div class="history-line"><b>${CU.esc(h.text)}</b><span>${CU.ownerName(h.actor)} · ${CU.fmtDate(h.date)}</span></div>`).join(''):'Sem histórico.'}</div>
  </details>

  <details class="accordion">
    <summary>Proposta <span>${proposal?CU.money(proposal.value):'—'}</span></summary>
    <div class="accordion-content">${proposal?`<div class="ctx-row"><span>Estado</span><strong>${CU.esc(proposalState.label)}</strong></div><div class="ctx-row"><span>Valor</span><strong>${CU.money(proposal.value)}</strong></div><div class="ctx-row"><span>Criada em</span><strong>${CU.fmtDate(proposal.createdAt)}</strong></div><div class="ctx-row"><span>Retorno</span><strong>${CU.fmtDate(proposal.followupDue)}</strong></div>`:'<div class="empty-structured">Nenhuma proposta criada.</div>'}</div>
  </details>

  <details class="accordion">
    <summary>Contatos <span>${d.contact?1:0}</span></summary>
    <div class="accordion-content">${d.contact?`<div class="ctx-row"><span>Contato principal</span><strong>${CU.esc(d.contact)}</strong></div>`:'<div class="empty-structured">Contato principal ainda não registrado.</div>'}</div>
  </details>

  <details class="accordion">
    <summary>Arquivos <span>0</span></summary>
    <div class="accordion-content"><div class="empty-structured">Arquivos comerciais ainda não foram estruturados neste UX Lab.</div></div>
  </details>

  <details class="accordion">
    <summary>Notas <span>0</span></summary>
    <div class="accordion-content"><div class="empty-structured">Notas comerciais estruturadas entram no Funnel Engine real; este laboratório não cria conteúdo fictício.</div></div>
  </details>

  <div class="ctx-section">
    <div class="ctx-label">Decisão comercial</div>
    <div class="context-actions">
      <button class="btn success" data-deal-final="won" data-id="${d.id}">Ganhou</button>
      <button class="btn danger" data-deal-final="lost" data-id="${d.id}">Perdeu</button>
      <button class="btn warn wide" data-deal-final="later" data-id="${d.id}">Não agora</button>
    </div>
  </div>`;
};

CU.contextHTML=()=>{
  const c=CU.state.ui.context;
  if(c?.type==='deal')return CU.dealContextV104(c.id);
  return baseContext();
};
})();
