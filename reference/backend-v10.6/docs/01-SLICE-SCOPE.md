# Escopo V10.6

## Implementado

- login local seguro;
- sessão e CSRF;
- Funnel Board;
- Acompanhamentos;
- Propostas;
- Venda 360;
- registrar atividade;
- próximo passo como Task real;
- concluir Task;
- transição adjacente de etapa;
- gate + override;
- criação atômica de Opportunity ao entrar em etapa `entity_mode=opportunity`;
- stage EXIT + ENTER com mesmo `transition_id`;
- optimistic concurrency;
- idempotência;
- Domain Events + Audit.

## Não implementado ainda

- MySQL runtime;
- MFA/TOTP;
- decisão Won/Lost/Later;
- criação/edição de propostas;
- intake público;
- financeiro;
- upload;
- integração da V10.4 ao HTTP real;
- deploy Hostinger.
