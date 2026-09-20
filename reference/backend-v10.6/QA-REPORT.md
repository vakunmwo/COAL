# QA — V10.6 Backend Local Slice

## Resultado

- PHP lint: **PASS em 16 arquivos**
- HTTP smoke: **PASS**
- invariantes: **PASS**
- `catch {}` vazio: **0**
- dados usados: **sintéticos**
- produção alterada: **não**
- MySQL/MariaDB runtime: **não testado neste ambiente**

## Smoke executado

`SMOKE PASS: auth, rate-limit, CSRF, board, venda360, activity+next-action, next-action, stale-version, transition, gate, idempotency, task-complete, missing-next-action, followups, proposals`

Cobertura do smoke:

- rota privada rejeita sessão ausente;
- rate limit de login persiste;
- login Argon2id;
- CSRF bloqueia mutação;
- Funnel Board;
- Venda 360;
- atividade + próximo passo;
- substituição explícita da Task anterior;
- stale version retorna conflito;
- transição Pesquisa → Evidência;
- replay idempotente não duplica mutação;
- gate de Evidência bloqueia sem override;
- override explícito permite Evidência → Abordagem;
- completar Task atual limpa `next_action_task_id`;
- case cai em `missing_next_action`;
- Acompanhamentos;
- Propostas.

## Invariantes executados

`INVARIANTS PASS: next-action pointers, stage transitions, opportunity truth, session hashes`

Foram validados:

- case só aponta para Task existente, aberta e do próprio case;
- transição real possui exatamente 1 EXIT + 1 ENTER;
- Opportunity não carrega `stage` nem `next_action_at`;
- tokens de sessão e CSRF ficam armazenados como hash.

## Preflight deste ambiente

```json
{
  "php_version": "8.4.23",
  "php_8_2_plus": true,
  "argon2id": true,
  "json_extension": true,
  "pdo": true,
  "pdo_mysql": false,
  "mysqli": false,
  "openssl": true,
  "sodium": true,
  "app_env": "local",
  "cookie_secure": false,
  "data_dir": "/mnt/data/COALUP-CRM-V10.6-BACKEND-LOCAL-SLICE/var",
  "data_dir_writable": true
}
```

A ausência de `pdo_mysql`/`mysqli` é o motivo explícito para o adaptador JSON local. Não foi transformada em falsa aprovação MySQL.
