# AI_STUDIO_ENTRYPOINT.md — COAL UP CRM

## 1. Frente
**Frente 2 — COAL UP Marketing e Presença Digital.**

Este repositório contém o **CRM interno da COAL UP principal**.

**Coal TV está fora deste projeto.**

---

## 2. Regra de trabalho

Este projeto NÃO deve ser recriado do zero.

A IA deve:
1. ler;
2. provar que entendeu;
3. propor uma única fatia;
4. aguardar autorização;
5. alterar somente os arquivos autorizados;
6. testar;
7. mostrar o diff lógico e os testes.

---

## 3. Fonte de verdade atual

### UX aprovada
**V10.4 Readability + Funnel UX Lab**

Preservar:
- português do Brasil;
- Black Command simplificado;
- alta legibilidade;
- corpo 15px desktop / 16px mobile;
- informação operacional nunca abaixo de 12px;
- touch target >= 44px;
- navegação:
  `HOJE · VENDAS · CLIENTES · TRABALHO · FINANCEIRO · JORNADA · MANUAL`;
- em Vendas:
  `FUNIL · ACOMPANHAMENTOS · PROPOSTAS`;
- mobile: uma etapa ativa por vez;
- Venda 360;
- `Para avançar`.

### Funnel Engine
Playbook principal:

`Pesquisa → Evidência → Abordagem → Diagnóstico → Oferta → Proposta → Decisão`

Saídas:
`Ganhou · Perdeu · Não agora`

Regras:
- Commercial Case é o eixo da jornada comercial;
- etapa atual pertence ao Commercial Case;
- histórico de etapa é append-only;
- próximo passo é uma Task real;
- gate `Para avançar` é suave;
- override exige motivo;
- Perdeu exige motivo;
- Não agora exige data/condição;
- **Ganhou NÃO é pagamento**;
- não usar probability;
- não usar weighted pipeline;
- não inventar SLA;
- não inventar leaderboard/meta comercial;
- IA não move etapa automaticamente.

### Backend alvo
- PHP;
- MySQL/MariaDB;
- Hostinger;
- destino previsto: `coalup.com.br/crm/`.

### Preview
Vercel pode ser usado como preview temporário.

**Vercel não define a arquitetura final.**

Não converter PHP/MySQL para Node/Next/Postgres apenas porque o ambiente de preview facilita.

---

## 4. Arquivos que a IA deve ler primeiro

Leia somente estes arquivos antes da primeira análise:

1. `/AI_STUDIO_ENTRYPOINT.md`
2. `/docs/handoffs/CURRENT-UX-V10.4.md`
3. `/docs/handoffs/CURRENT-BACKEND-V10.6.md`
4. `/docs/contracts/V10.5-DOMAIN-INVARIANTS.md`
5. `/docs/contracts/V10.5-API-CONTRACT-FUNNEL.md`

Depois inspecione a aplicação aprovada na raiz e o backend PHP somente se a tarefa exigir.

Não faça varredura ampla do repositório antes de concluir essa leitura inicial.

---

## 5. Idioma e localização

Toda interface visível:
- português do Brasil;
- moeda: BRL / R$;
- datas: pt-BR;
- termos do CRM conforme o projeto.

Não criar UI em inglês.

---

## 6. Stop conditions

PARE e informe a lacuna se:
- algum arquivo obrigatório acima não existir;
- houver conflito entre documentação e código;
- não for possível identificar qual é a V10.4 aprovada;
- a tarefa exigir mudar stack;
- a tarefa exigir dado real não presente;
- a tarefa exigir segredo/credencial;
- a alteração tocar produção.

Não tente resolver silenciosamente.

---

## 7. Protocolo de edição

Antes de editar, responder:

### LEITURA COMPROVADA
Liste os 5 arquivos obrigatórios e uma decisão concreta encontrada em cada um.

### ESTADO
O que existe hoje.

### FATIA
Uma única mudança pequena proposta.

### ARQUIVOS
Lista exata dos arquivos que serão alterados.

### INVARIANTES
O que não pode regredir.

### TESTES
Como a mudança será validada.

Depois PARE.

Só editar após Jhonatan escrever:

`AUTORIZADO: EXECUTE ESTA FATIA`
