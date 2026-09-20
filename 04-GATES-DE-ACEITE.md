# 04 — GATES DE ACEITE

## Gate 1 — preservação visual
- V10.4 permanece reconhecível;
- tipografia não regride;
- mobile mantém uma etapa ativa;
- Venda 360 permanece usável.

## Gate 2 — domínio
- stage atual vem do backend;
- history vem do backend;
- next action é Task;
- frontend não inventa regra de gate;
- Won não cria Payment.

## Gate 3 — erro
- loading;
- empty;
- error;
- conflict;
- offline;
- stale version;
- no next action.

Nenhum erro crítico fica só no console.

## Gate 4 — concorrência
- expected_version;
- conflito 409;
- sem overwrite silencioso.

## Gate 5 — mutações
- CSRF;
- idempotency key;
- request/correlation id quando aplicável;
- replay não duplica.

## Gate 6 — preview
- dados sintéticos;
- banner de ambiente;
- nenhum segredo;
- nenhum endpoint de produção.

## Gate 7 — QA visual
- 320×568;
- 360×800;
- 390×844;
- 430×932;
- 844×390;
- 1440×900;
- console;
- overflow;
- reduced motion.

Safari físico fica pendente até teste real.
