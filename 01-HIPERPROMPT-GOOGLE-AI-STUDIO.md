# HIPERPROMPT — GOOGLE AI STUDIO · COAL UP CRM

Você acabou de importar o repositório do CRM da COAL UP.

Sua missão NÃO é reinventar o produto.

Sua missão é continuar a implementação usando o estado aprovado e os contratos existentes.

## PASSO 0 — leitura obrigatória

Leia primeiro:

- `/00-START-HERE.md`
- `/GEMINI.md`
- `/docs/canonical/00-LEIA-PRIMEIRO.md`
- `/docs/canonical/01-OPERADOR-E-RESTRICOES.md`
- `/docs/canonical/02-FRENTES-DE-NEGOCIO.md`
- `/docs/canonical/10-INFRA-E-ARMADILHAS.md`
- `/docs/canonical/11-GLOSSARIO-E-LACUNAS.md`
- `/docs/canonical/15-QA-MOBILE-E-CONVERSAO.md`
- `/docs/canonical/18-HANDOFF-E-AUDITORIA-ENTRE-IAS.md`
- `/docs/handoffs/V10.4-UX-HANDOFF.md`
- `/docs/handoffs/V10.5-FOUNDATION-HANDOFF.md`
- `/docs/handoffs/V10.6-BACKEND-HANDOFF.md`
- `/docs/contracts/V10.5-DOMAIN-INVARIANTS.md`
- `/docs/contracts/V10.5-API-CONTRACT-FUNNEL.md`

Depois inspecione:

- `/reference/crm-ui-v10.4/`
- `/reference/backend-v10.6/`
- `/reference/database-v10.5/`

## MISSÃO IMEDIATA

Preparar o repositório para integrar a **V10.4 aprovada** com a **V10.6 backend slice**, preservando a arquitetura final PHP/MySQL/Hostinger.

A integração deve ser feita em fases pequenas e auditáveis.

### Fase A — inventário
1. mapear framework e estrutura real do repositório importado;
2. identificar o melhor lugar para incorporar a UI V10.4;
3. identificar o melhor lugar para incorporar o backend PHP V10.6;
4. listar conflitos com Vercel;
5. não modificar ainda.

### Fase B — adapter
Depois de autorização:
1. criar uma camada de API client na UI;
2. substituir leituras demo por endpoints do contrato;
3. manter fallback demo somente se estiver explicitamente marcado `DEMO`;
4. não duplicar regra de domínio no frontend.

### Fase C — backend
1. preservar contratos V10.5/V10.6;
2. substituir JsonStore por Repository/Storage interface compatível com PDO/MySQL;
3. não usar filesystem da Vercel como banco;
4. não criar schema novo incompatível com `001_initial_schema.sql`.

### Fase D — preview
No preview:
- dados sintéticos apenas;
- nenhuma credencial real;
- nenhum cliente real;
- nenhuma mutação em produção;
- banner visível `AMBIENTE DE TESTE`.

### Fase E — QA
Executar e registrar:
- build;
- lint/syntax;
- runtime;
- login;
- Board;
- Venda 360;
- next action;
- transition;
- gate/override;
- Acompanhamentos;
- Propostas;
- 320/360/390/430/844×390/1440×900;
- console;
- overflow;
- erros;
- diff final.

## PROIBIDO

- trocar PHP/MySQL por Node/Postgres como arquitetura final;
- refazer a V10.4 por gosto;
- reduzir tipografia aprovada;
- transformar Vercel em fonte de verdade do produto;
- usar localStorage como produção;
- usar filesystem efêmero como banco;
- publicar em `coalup.com.br`;
- inserir segredos;
- inventar dados reais;
- marcar pagamento ao ganhar venda;
- inventar SLA;
- inventar probabilidade de fechamento;
- mover etapas automaticamente por IA.

## PRIMEIRA RESPOSTA

Antes de alterar qualquer coisa, responda SOMENTE:

### ENTENDI
- ...

### ESTADO ATUAL
- ...

### GAP
- ...

### CONFLITOS
- ...

### ORDEM
1. ...
2. ...

### NÃO VOU MEXER AINDA
- ...

Pare e espere Jhonatan mandar `PROSSIGA`.
