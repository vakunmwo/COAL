# 02 — FLUXO GITHUB + GOOGLE AI STUDIO + VERCEL

## Papel de cada peça

```text
GitHub
= fonte de código e histórico

Google AI Studio
= agente de implementação/auditoria

Vercel
= preview/staging descartável

Hostinger
= destino final previsto
```

## Branches recomendadas

```text
main
└── estado aprovado

ai-studio/integration
└── trabalho do agente

preview/*
└── testes específicos quando necessário
```

Não mande alterações grandes direto para `main`.

## Ciclo

1. criar branch `ai-studio/integration`;
2. conectar repo ao Vercel Preview;
3. importar repo no Google AI Studio;
4. colar `01-HIPERPROMPT-GOOGLE-AI-STUDIO.md`;
5. conferir a resposta de handoff;
6. mandar `PROSSIGA`;
7. AI Studio implementa pequeno lote;
8. commit;
9. Vercel cria preview;
10. Jhonatan testa;
11. corrigir;
12. merge apenas após gate.

## Regra de preview

Adicionar indicador visível:

`AMBIENTE DE TESTE · DADOS FICTÍCIOS`

Nunca usar:
- senha real;
- cliente real;
- banco de produção;
- chave privada;
- token Hostinger.

## Vercel não governa arquitetura

O fato do preview estar na Vercel não autoriza:
- converter o backend final;
- trocar MySQL;
- trocar PHP;
- mudar as rotas finais;
- abandonar `/crm/`.

## Saída esperada antes de migrar para Hostinger

O repositório precisa ter:

- frontend consumindo contratos reais;
- backend PHP com storage abstrato/PDO;
- schema reproduzível;
- `.env.example`;
- nenhum segredo;
- smoke test;
- QA report;
- instrução de instalação Hostinger.
