# 00 — START HERE · GOOGLE AI STUDIO HANDOFF

## Frente
**Frente 2 — COAL UP Marketing e Presença Digital.**

Este repositório/pacote contém o estado atual do **CRM interno da COAL UP principal**.

**Coal TV está fora deste sistema.**

## Objetivo deste handoff

Permitir que o Google AI Studio trabalhe sobre o projeto sem Jhonatan precisar reconstruir manualmente todo o contexto a cada sessão.

O fluxo planejado é:

```text
GitHub = fonte de código
Google AI Studio = agente de implementação/auditoria
Vercel = preview/staging descartável
Hostinger = destino final previsto
```

## Primeira regra

Antes de editar código, leia nesta ordem:

1. `GEMINI.md`
2. `docs/canonical/00-LEIA-PRIMEIRO.md`
3. `docs/handoffs/V10.4-UX-HANDOFF.md`
4. `docs/handoffs/V10.5-FOUNDATION-HANDOFF.md`
5. `docs/handoffs/V10.6-BACKEND-HANDOFF.md`
6. `docs/contracts/V10.5-DOMAIN-INVARIANTS.md`
7. `docs/contracts/V10.5-API-CONTRACT-FUNNEL.md`

Depois leia os arquivos específicos da tarefa.

## Estado congelado

### V10.4 — UX aprovada
A experiência visual/operacional do Funnel Engine foi aprovada por Jhonatan.

Preservar:
- legibilidade;
- Funil desktop;
- Funil mobile com uma etapa ativa;
- Acompanhamentos;
- Propostas;
- Venda 360;
- Black Command simplificado.

### V10.5 — fundação arquitetada
Existe:
- `001_initial_schema.sql`;
- contratos de API;
- invariantes do domínio;
- Playbooks;
- arquitetura PHP/MySQL/Hostinger.

### V10.6 — primeira fatia backend local
Existe e passou smoke local:
- login;
- Board;
- Venda 360;
- Task como próximo passo;
- transição;
- gate/override;
- stage events;
- Acompanhamentos;
- Propostas.

Persistência atual do slice: JsonStore **somente para desenvolvimento**.

## Destino final

```text
coalup.com.br/
├── site público
├── api/public/intake
└── crm/
```

Backend alvo:
- PHP;
- MySQL/MariaDB;
- Hostinger.

## Importante sobre o ambiente temporário

Não transforme a arquitetura final em Node/Next apenas porque o preview está em Vercel ou o Google AI Studio usa runtime Node.

Vercel é **ambiente temporário de teste/preview**.

O código final precisa continuar portátil para PHP/MySQL/Hostinger, conforme os contratos do projeto.

## Primeira resposta obrigatória da IA

Antes de alterar qualquer arquivo, responda apenas com:

### ENTENDI
### ESTADO ATUAL
### GAP
### CONFLITOS
### ORDEM
### NÃO VOU MEXER AINDA

E pare.

Só implemente depois de Jhonatan mandar prosseguir.
