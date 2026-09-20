# COAL UP CRM V10.5 — INVARIANTES DO FUNNEL ENGINE

## Frente
COAL UP Marketing e Presença Digital — CRM interno.

# 1. Organização não é “cliente” duplicado

`organizations` representa o negócio externo.

A relação muda em:

```text
relationship_state = prospect → client
client_since = timestamp real
```

Não criar uma tabela `clients` paralela.

# 2. Lead não é apagado ao virar Opportunity

Fluxo:

```text
Lead
  ↓
Commercial Case
  ↓ quando entra em etapa entity_mode=opportunity
Opportunity
```

O Lead continua como histórico da origem.

# 3. Stage não mora em Opportunity

Proibido introduzir:

```text
opportunities.stage
opportunities.next_action_at
```

Fonte atual:

```text
commercial_cases.current_stage_id
commercial_cases.current_stage_entered_at
```

Histórico:

```text
funnel_stage_events
```

# 4. Funnel Version é imutável depois de publicada

Publicada:
- não editar stage;
- não reordenar;
- não mudar requirement;
- não mudar conteúdo silenciosamente.

Mudança = nova versão draft → publicar → novos cases usam a nova versão.

# 5. Stage pertence à versão do case

Garantido por FK composta:

```text
(current_stage_id, funnel_version_id)
```

# 6. Próximo passo é Task

Fonte única:

```text
tasks
commercial_cases.next_action_task_id
```

Não persistir `next_title` / `next_due` duplicados na tabela de venda.

# 7. Concluir próximo passo não cria outro

Se a Task concluída era o ponteiro atual:

```text
next_action_task_id = NULL
```

E emitir:

```text
commercial_case.no_next_action
```

# 8. Um avanço = uma transição

Uma transição gera:
- 1 `exit`;
- 1 `enter`;
- mesmo `transition_id`.

Criação inicial do case gera somente o `enter` da primeira etapa.

# 9. Gate

Avaliar requirements da etapa atual antes de sair.

- requisito não overrideável faltando → bloquear;
- requisito overrideável faltando → exigir motivo;
- snapshot do gate no stage event.

# 10. SLA

Campo existe, mas pode ser `NULL`.

Não preencher até:
- haver observação real suficiente;
- ou Jhonatan definir explicitamente a referência.

# 11. Valor do Funil não é receita

`opportunities.amount_cents` é potencial comercial.

Receita recebida vem de:

```text
payments(payment_type='receipt')
-
payments(payment_type='reversal')
```

# 12. Won não é Payment

Ao ganhar:
- fecha venda;
- ativa relação de cliente;
- pode criar projeto/recebíveis explicitamente.

Não cria pagamento.

# 13. Receivable não armazena “atrasado” como verdade principal

Atraso é derivado:

```text
lifecycle_status = open
AND due_at < now
AND saldo > 0
```

Pago é derivado pela soma líquida de Payments.

# 14. Reversal é lançamento separado

Nunca editar um Payment recebido para “desfazer”.

Criar:

```text
payment_type = reversal
related_payment_id = pagamento original
```

# 15. Budget realizado

Realizado por categoria = despesas com `paid_at` no período.

```text
diferença = realizado - planejado
```

Não chamar de lucro.

# 16. Public Intake não escolhe dono sem regra confirmada

Novo lead do site pode nascer:

```text
owner_id = NULL
assigned_to = NULL
```

até triagem humana ou regra futura confirmada.

# 17. Dedupe não auto-merge

Match forte ou ambíguo:
- registrar capture;
- sinalizar possível duplicidade;
- revisão humana.

# 18. Falha visível

Proibido:
- `catch {}` vazio;
- salvar e responder sucesso sem commit;
- engolir conflito de versão;
- mutação crítica sem audit.

# 19. Segurança

- password = Argon2id;
- TOTP secret cifrado com app key fora do `public_html`;
- session token só em cookie; banco guarda hash;
- CSRF em mutações privadas;
- rate limit login/intake;
- `Cache-Control: no-store` no CRM;
- `noindex` no CRM.
