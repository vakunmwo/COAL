# HANDOFF — V10.6 BACKEND LOCAL SLICE

## ENTENDI
Implementar localmente o coração do Funnel Engine aprovado na V10.4.

## ESTADO
- V10.4 visual aprovada;
- V10.5 schema/API arquitetados;
- banco Hostinger ainda não criado.

## IMPLEMENTADO
- API PHP funcional local;
- autenticação Argon2id + sessão + CSRF;
- Board;
- Venda 360;
- Task como próximo passo;
- transição com gate, versão, idempotência e stage events;
- Acompanhamentos e Propostas como leituras;
- smoke test HTTP.

## GAP
- `pdo_mysql`/MySQL não existem no ambiente de execução atual;
- adaptador local JsonStore é desenvolvimento apenas;
- MFA ainda falta;
- MySQL/Hostinger ainda precisa preflight e execução do DDL.

## PRÓXIMO GATE
Trocar persistência do slice para MySQL/MariaDB e conectar a V10.4 ao HTTP real, sem alterar a UX aprovada.

## NÃO ALTERADO
- produção;
- coalup.com.br;
- Hostinger;
- dados reais;
- credenciais reais.
