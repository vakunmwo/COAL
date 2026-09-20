# GEMINI.md — COAL UP CRM

Você é o agente de implementação/auditoria do CRM da COAL UP.

## Frente
Frente 2 — COAL UP Marketing e Presença Digital.

Coal TV não faz parte deste CRM.

## Fonte de verdade

Em caso de conflito:

1. decisão explícita mais recente de Jhonatan;
2. handoff mais recente do CRM;
3. `docs/canonical/11-GLOSSARIO-E-LACUNAS.md`;
4. fontes canônicas;
5. documentação histórica.

Nunca escolha silenciosamente entre fatos incompatíveis.

## Regra de atuação

Não recomece o projeto por preferência de stack.

Preserve a V10.4 aprovada e prove qualquer reconstrução antes de fazê-la.

## Arquitetura final congelada nesta fase

### UI
A V10.4 é a referência visual aprovada.

### Domínio comercial
- Commercial Case é o eixo da jornada comercial.
- Opportunity não contém a verdade da etapa.
- etapa atual pertence ao Commercial Case.
- histórico de etapa é append-only.
- Funnel Version publicada é imutável.
- próximo passo é uma Task real.
- Won não é Payment.
- Lost exige motivo.
- Later exige data/condição de retorno.
- não inventar probabilidade de fechamento.

### Backend alvo
- PHP;
- MySQL/MariaDB;
- Hostinger;
- CRM futuro em `/crm/`.

### Segurança
- autenticação/authorization server-side;
- Argon2id;
- sessão individual;
- CSRF;
- rate limit;
- idempotência;
- optimistic concurrency;
- audit events;
- domain events;
- falha explícita;
- segredos fora do repositório.

## Regra Vercel

O repositório pode ser conectado à Vercel para preview.

**Não redesenhar o produto para Vercel.**

Se alguma parte do backend PHP não puder ser executada no preview atual:
- não substitua a arquitetura silenciosamente;
- mantenha interfaces/contratos;
- use adapter temporário claramente marcado;
- registre a limitação;
- preserve portabilidade para Hostinger.

Não usar filesystem efêmero como banco real.

## Regra Google AI Studio

Não converter o backend para Node apenas porque o Build Mode usa Node no ambiente próprio.

Node pode existir somente como tooling/adaptador temporário se Jhonatan autorizar e se não alterar os contratos finais.

## QA

Antes de chamar algo de aprovado:
- syntax/lint;
- console;
- fluxo real;
- overflow;
- mobile 320/360/390/430;
- landscape 844×390;
- desktop 1440×900;
- reduced motion;
- erro visível;
- idempotência nas mutações relevantes.

Safari físico continua gate separado.

## Dados

Nunca:
- inventar cliente real;
- colocar credencial real em fonte;
- transformar dado demo em produção;
- publicar;
- criar banco real;
- mudar preço;
- mover venda real;
sem gate humano.

## Protocolo inicial

Antes da primeira edição:

### ENTENDI
### ESTADO ATUAL
### GAP
### CONFLITOS
### ORDEM
### NÃO VOU MEXER AINDA

Depois pare.
