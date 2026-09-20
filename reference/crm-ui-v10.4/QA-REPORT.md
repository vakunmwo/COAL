# QA — V10.4 READABILITY + FUNNEL UX LAB

## Frente

COAL UP Marketing e Presença Digital — CRM interno.

## Estático

- 12 módulos JavaScript: **PASS em `node --check`**
- bundle standalone: **PASS**
- IDs duplicados no HTML base: **0**
- `100dvh`: presente
- safe-area: presente
- reduced motion: presente

## Runtime real em Chromium

O laboratório foi renderizado em Chromium headless com o HTML standalone injetado diretamente.

### Desktop 1440×900

- shell V10.4: **PASS**
- Funil: **7 etapas**
- título de cena: **32px**
- nome da venda: **16px**
- próximo passo: **15px**
- botão: **mínimo 44px de altura**
- Venda 360: **PASS**
- próximo passo na Venda 360: **PASS**
- Acompanhamentos: **4 grupos**
- Propostas: **5 grupos**
- erros JavaScript no fluxo testado: **0**

### Mobile

Viewports testadas:

- 320×568: **sem overflow horizontal**
- 360×800: **sem overflow horizontal**
- 390×844: **sem overflow horizontal**
- 430×932: **sem overflow horizontal**
- 844×390: **sem overflow horizontal**

No mobile:

- Funil desktop fica oculto;
- Funil mobile usa uma etapa ativa;
- existem 7 botões de etapa;
- nome de venda: **16px**;
- título de cena: **27px**;
- busca/input: **16px**;
- botões: **mínimo 46px**;
- Venda 360 abre em **100dvh**;
- Venda 360 em 390×844 ficou com **844px de altura**;
- erros JavaScript no fluxo testado: **0**.

## Funil implementado

- desktop com colunas de 300–320px;
- métricas por etapa;
- valor tratado como potencial comercial, não receita;
- média exibida como média do laboratório, não SLA;
- atenção por próximo passo/risco;
- drag desktop preservado;
- mobile sem Kanban comprimido;
- uma etapa ativa por vez.

## Acompanhamentos implementado

Grupos:

1. Vencidos
2. Hoje
3. Próximos
4. Sem próximo passo

A área usa `nextActionTaskId` / Actions do laboratório como ponte conceitual para a fonte única futura.

## Propostas implementado

Estados visuais:

- Rascunho
- Enviada
- Aguardando retorno
- Aceita
- Recusada / encerrada

Abrir proposta não registra pagamento.

## Venda 360 implementada

- cabeçalho comercial;
- próximo passo destacado;
- Para avançar;
- Diagnóstico e evidências;
- Histórico;
- Proposta;
- Contatos;
- Arquivos;
- Notas;
- decisão comercial.

Blocos sem dado estruturado mostram lacuna, não conteúdo inventado.

## Verdade do laboratório

- dados continuam sintéticos;
- backend real ainda não está conectado;
- stage events reais ainda não existem;
- Funnel Version real ainda não existe;
- SLA não foi inventado;
- produção não foi alterada;
- `coalup.com.br` não foi publicado/alterado.

## Gate ainda aberto

**Safari físico não foi testado.**

Conforme a fonte canônica de QA, Chromium não encerra aprovação Safari.

Status atual:

- QA técnico Chromium: **aprovado para o UX Lab**
- QA visual Safari: **bloqueado / pendente**
- produção: **não iniciada**
