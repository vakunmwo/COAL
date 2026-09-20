# COAL UP CRM V10.5 — CONTRATO PHP/API DO FUNNEL ENGINE

**Frente:** COAL UP Marketing e Presença Digital — CRM interno da COAL UP principal.  
**Coal TV:** fora.  
**Base visual:** V10.4 Readability + Funnel UX Lab aprovada por Jhonatan.  
**Infra planejada:** Hostinger, `coalup.com.br/crm/`, custo incremental planejado nesta fase: **R$ 0**.

---

# 1. Regra arquitetural

A interface aprovada não vira fonte de verdade.

Fluxo:

```text
V10.4 UI
  ↓
HTTP JSON
  ↓
PHP Application Service
  ↓
transação MySQL/InnoDB
  ↓
Domain Events + Audit
  ↓
resposta JSON
```

Regra central:

> **o CRM calcula; a interface exibe; o usuário confirma mutações reais.**

---

# 2. Base URL

Privada:

```text
https://coalup.com.br/crm/api/v1
```

Pública:

```text
https://coalup.com.br/api/public
```

---

# 3. Autenticação e headers privados

Toda rota privada exige sessão server-side válida.

Cookie:

```text
HttpOnly
Secure
SameSite=Strict
Path=/crm
```

Mutações privadas exigem:

```text
Content-Type: application/json
X-CSRF-Token: <token>
Idempotency-Key: <uuid/string estável por tentativa lógica>
X-Request-ID: <uuid>
```

O corpo também leva `expected_version` quando a entidade for mutável e concorrente.

---

# 4. Envelope de sucesso

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "server_time": "2026-09-20T12:00:00.000000Z"
  }
}
```

# 5. Envelope de erro

```json
{
  "error": {
    "code": "stale_version",
    "message": "A venda foi alterada por outro operador.",
    "fields": {},
    "current_version": 18,
    "request_id": "uuid"
  }
}
```

Códigos HTTP:

- `400` payload inválido;
- `401` sessão ausente/expirada;
- `403` sessão válida sem permissão para a ação;
- `404` entidade inexistente;
- `409` conflito de versão/idempotência/estado concorrente;
- `422` regra de domínio não atendida;
- `429` rate limit;
- `500` falha inesperada, com contexto preservado e sem detalhe sensível.

---

# 6. GET /funnel/board

Alimenta a visão **Funil**.

Query opcional:

```text
owner_id
stage_id
attention
service
next_action
```

Resposta resumida:

```json
{
  "data": {
    "funnel": {
      "id": "uuid",
      "name": "Prospecção COAL UP",
      "version_id": "uuid",
      "version_number": 1
    },
    "summary": {
      "open_cases": 6,
      "potential_amount_cents": 950990,
      "open_proposals": 2,
      "attention_cases": 2
    },
    "stages": [
      {
        "id": "uuid",
        "key": "proposta",
        "name": "Proposta",
        "position": 6,
        "current_count": 2,
        "current_potential_cents": 312990,
        "observed_average_seconds": 345600,
        "sla_days": null,
        "attention_count": 1,
        "cases": []
      }
    ]
  }
}
```

`observed_average_seconds` vem de `funnel_stage_events`.

Se não houver amostra suficiente:

```json
"observed_average_seconds": null
```

Nunca substituir ausência por SLA inventado.

Cada case do card:

```json
{
  "id": "uuid",
  "version": 17,
  "organization": {
    "id": "uuid",
    "name": "Atlas Oficina"
  },
  "primary_contact": {
    "id": "uuid",
    "name": "Matheus"
  },
  "opportunity": {
    "id": "uuid",
    "amount_cents": 180000,
    "currency": "BRL",
    "service_label": "Site"
  },
  "stage": {
    "id": "uuid",
    "name": "Proposta",
    "entered_at": "2026-09-16T15:00:00Z"
  },
  "owner": {
    "id": "uuid",
    "name": "Jhonatan"
  },
  "next_action": {
    "id": "uuid",
    "title": "Retomar proposta",
    "due_at": "2026-09-20T14:00:00Z",
    "status": "open"
  },
  "attention": {
    "needs_attention": true,
    "reasons": ["next_action_due"]
  }
}
```

Não existe probabilidade de fechamento.

---

# 7. GET /funnel/followups

Alimenta **Acompanhamentos**.

A API devolve quatro grupos derivados da mesma Task apontada por `commercial_cases.next_action_task_id`:

```json
{
  "data": {
    "overdue": [],
    "today": [],
    "upcoming": [],
    "missing_next_action": []
  }
}
```

Não existe tabela paralela de follow-up.

---

# 8. GET /proposals

Alimenta **Propostas**.

Filtros:

```text
status
owner_id
commercial_case_id
```

Resposta:

```json
{
  "data": [
    {
      "id": "uuid",
      "version": 3,
      "commercial_case_id": "uuid",
      "organization_name": "Atlas Oficina",
      "amount_cents": 180000,
      "currency": "BRL",
      "status": "sent",
      "created_at": "...",
      "sent_at": "...",
      "followup_due_at": "...",
      "stage_name": "Proposta",
      "owner_name": "Jhonatan"
    }
  ]
}
```

A UI pode derivar “Aguardando retorno” quando a proposta está `sent` e o acompanhamento venceu/chegou.

---

# 9. GET /commercial-cases/{id}

Alimenta **Venda 360**.

Retorna:

- organização;
- contato principal;
- Lead;
- Opportunity quando existir;
- etapa atual;
- tempo na etapa;
- responsável;
- próximo passo real;
- resultado do gate atual;
- diagnóstico/evidências;
- histórico;
- propostas;
- contatos;
- arquivos;
- notas;
- versão da entidade.

O bloco `gate`:

```json
{
  "gate": {
    "stage_id": "uuid",
    "requirements": [
      {
        "requirement_id": "uuid",
        "label": "Contato principal identificado",
        "status": "met",
        "override_allowed": true
      },
      {
        "requirement_id": "uuid",
        "label": "Próximo passo definido",
        "status": "missing",
        "override_allowed": true
      }
    ],
    "can_transition_without_override": false
  }
}
```

---

# 10. POST /commercial-cases

Criação manual de possível cliente/venda inicial.

Body mínimo:

```json
{
  "business_name": "Negócio",
  "contact_name": "Pessoa",
  "phone": "+5541...",
  "source": "manual",
  "funnel_key": "prospeccao_coalup",
  "owner_id": "uuid-ou-null",
  "first_action": {
    "title": "Levantar evidências",
    "due_at": "2026-09-21T15:00:00Z",
    "assigned_to": "uuid-ou-null"
  }
}
```

Transação:

1. cria/resolve Organization;
2. cria/resolve Contact;
3. cria Lead;
4. carrega a versão publicada do Funil;
5. cria Commercial Case na primeira etapa;
6. cria evento `enter` inicial;
7. cria Task se explicitamente fornecida;
8. aponta `next_action_task_id`;
9. grava Domain Event + Audit.

Não cria Opportunity antes do estágio que exige `entity_mode=opportunity`.

---

# 11. POST /commercial-cases/{id}/activities

“Registrar conversa”.

```json
{
  "expected_version": 17,
  "kind": "conversation",
  "channel": "whatsapp",
  "occurred_at": "2026-09-20T15:30:00Z",
  "summary": "Cliente confirmou que precisa organizar pedidos.",
  "agreement_note": "Enviar proposta até amanhã.",
  "next_action": {
    "title": "Enviar proposta",
    "due_at": "2026-09-21T18:00:00Z",
    "assigned_to": "uuid"
  }
}
```

Se `next_action` for enviado:
- cria Task;
- substitui o ponteiro do próximo passo;
- a Task anterior não é apagada;
- se ainda estiver aberta, a UI deve pedir se ela será concluída/cancelada antes de substituir.

A API **não conclui uma Task antiga silenciosamente**.

---

# 12. PUT /commercial-cases/{id}/next-action

Define explicitamente o próximo passo.

```json
{
  "expected_version": 18,
  "title": "Acompanhar proposta",
  "due_at": "2026-09-23T14:00:00Z",
  "assigned_to": "uuid-ou-null",
  "replace_open_task": {
    "task_id": "uuid-ou-null",
    "resolution": "complete|cancel|keep"
  }
}
```

Regra:

> um case pode apontar para apenas uma Task como “próximo passo”, mas pode ter várias Tasks históricas/abertas por outros motivos.

---

# 13. POST /tasks/{id}/complete

```json
{
  "expected_version": 4,
  "completion_note": "Proposta enviada pelo WhatsApp."
}
```

Se a Task concluída for `commercial_cases.next_action_task_id`:

```text
task.status = completed
commercial_cases.next_action_task_id = NULL
domain event = commercial_case.no_next_action
```

Não cria novo próximo passo automaticamente.

---

# 14. POST /commercial-cases/{id}/transition

Esta é a mutação mais importante do Funnel Engine.

Body:

```json
{
  "expected_version": 18,
  "target_stage_id": "uuid",
  "transition_reason": "Diagnóstico concluído",
  "override_reason": null,
  "next_action": {
    "title": "Desenhar oferta",
    "due_at": "2026-09-22T18:00:00Z",
    "assigned_to": "uuid"
  }
}
```

`next_action` é opcional e precisa ser explicitamente confirmado pelo operador.

## Algoritmo transacional

```text
BEGIN
↓
SELECT commercial_case FOR UPDATE
↓
comparar expected_version
↓
validar target_stage pertence à mesma funnel_version
↓
validar transição lógica
↓
avaliar requirements da etapa atual
↓
se faltar requisito não-overrideável → bloquear
↓
se faltar requisito overrideável e não houver override_reason → pedir override
↓
se target.entity_mode = opportunity e ainda não há Opportunity:
    exigir owner
    criar Opportunity atomicamente
    ligar Lead → Opportunity sem apagar Lead
↓
criar transition_id
↓
INSERT stage event EXIT
↓
UPDATE commercial_case current_stage/current_stage_entered_at/version
↓
INSERT stage event ENTER
↓
se next_action explícito:
    criar Task e apontar next_action_task_id
senão:
    next_action_task_id = NULL
    emitir commercial_case.no_next_action
↓
INSERT domain events
↓
INSERT audit event
↓
COMMIT
```

## Snapshot do gate

`gate_snapshot_json` registra o estado avaliado naquele momento.

Exemplo:

```json
{
  "requirements": [
    {"key":"primary_contact_present","status":"met"},
    {"key":"next_action_present","status":"missing","overridden":true}
  ]
}
```

Isso não substitui os dados reais; preserva a justificativa da transição.

---

# 15. POST /commercial-cases/{id}/decision

Body base:

```json
{
  "expected_version": 20,
  "decision": "won|lost|later|disqualified"
}
```

## WON

```json
{
  "expected_version": 20,
  "decision": "won",
  "final_amount_cents": 180000,
  "currency": "BRL",
  "commercial_condition": "50% + 50%",
  "project": {
    "create": true,
    "name": "Site institucional",
    "due_at": null,
    "owner_id": "uuid"
  },
  "receivables": [
    {"description":"Entrada 1/2","amount_cents":90000,"due_at":"..."},
    {"description":"Entrega 2/2","amount_cents":90000,"due_at":"..."}
  ]
}
```

Transação:

- Opportunity → `won`;
- Commercial Case → `won/closed`;
- Organization → relacionamento de cliente + `client_since` se ainda não existir;
- cria Project somente se `project.create=true`;
- cria Receivables somente se forem explicitamente enviados;
- soma dos Receivables enviados deve bater com `final_amount_cents` quando a agenda for fornecida;
- **não cria Payment**;
- **não aumenta recebido**.

## LOST

```json
{
  "expected_version": 20,
  "decision": "lost",
  "reason": "Cliente decidiu não investir agora."
}
```

`reason` obrigatório.

## LATER

```json
{
  "expected_version": 20,
  "decision": "later",
  "return_at": "2026-11-10T15:00:00Z",
  "return_condition": "Retomar quando terminar a reforma."
}
```

Exigir `return_at` **ou** `return_condition`.

Se `return_at` existir, a API cria Task de retorno real.

## DISQUALIFIED

Para case ainda em modo Lead.

Exige motivo.

---

# 16. POST /proposals

```json
{
  "commercial_case_id": "uuid",
  "expected_case_version": 18,
  "amount_cents": 180000,
  "currency": "BRL",
  "followup_due_at": "2026-09-23T15:00:00Z",
  "valid_until": null,
  "snapshot": {
    "scope": "...",
    "commercial_condition": "..."
  }
}
```

Criar proposta não marca enviada automaticamente.

# 17. PATCH /proposals/{id}

Pode:
- editar rascunho;
- marcar como enviada com confirmação explícita;
- registrar aceite/recusa futuramente.

Abrir proposta web futuramente não muda status comercial sozinho.

---

# 18. POST /api/public/intake

Sem sessão administrativa.

Body:

```json
{
  "client_submission_id": "uuid-opcional",
  "name": "Nome",
  "business_name": "Negócio",
  "phone": "+55...",
  "email": null,
  "message": "O que quer resolver?",
  "page_url": "/servicos/site",
  "cta_key": "solicitar_diagnostico",
  "service_context": "site",
  "utm_source": null,
  "utm_medium": null,
  "utm_campaign": null,
  "utm_content": null,
  "utm_term": null,
  "referrer": null,
  "website": ""
}
```

`website` é honeypot e deve chegar vazio.

Pipeline:

```text
validate
→ normalize
→ rate limit / anti-abuse
→ lead_capture
→ dedupe
→ create/link organization/contact/lead
→ commercial_case com Playbook Entrada pelo Site
→ primeira etapa
→ primeira Task real, inicialmente sem responsável se não houver regra confirmada de distribuição
→ domain event
```

Não auto-merge.

Não inventar responsável.

Resposta pública:

```json
{
  "ok": true,
  "message": "Recebemos sua solicitação."
}
```

Não expor IDs internos.

---

# 19. Concorrência

Toda entidade mutável tem `version`.

Exemplo:

```text
Jhonatan abre case version=17
Sócio B salva → version=18
Jhonatan tenta salvar expected_version=17
```

Resposta:

```http
409 Conflict
```

```json
{
  "error": {
    "code": "stale_version",
    "message": "A venda mudou desde que você abriu.",
    "current_version": 18
  }
}
```

Nunca last-write-wins silencioso.

---

# 20. Idempotência

Toda mutação financeira, transição e decisão comercial usa `Idempotency-Key`.

Servidor grava:

```text
scope
idempotency_key
payload_hash
response_code
result_json
expires_at
```

Mesmo key + mesmo payload:
- devolve o resultado anterior.

Mesmo key + payload diferente:
- `409 idempotency_conflict`.

---

# 21. Regra de auditoria

`domain_events` = fato do negócio.

Exemplos:
- `commercial_case.stage_entered`;
- `commercial_case.no_next_action`;
- `opportunity.won`;
- `payment.received`.

`audit_events` = quem fez o quê no sistema.

Exemplos:
- ator;
- request_id;
- entidade;
- resumo;
- resultado;
- contexto técnico mínimo.

Não misturar os dois.
