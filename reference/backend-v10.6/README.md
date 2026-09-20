# COAL UP CRM V10.6 — Backend Local Slice

**Frente 2 — COAL UP Marketing e Presença Digital.**

Primeira fatia vertical local do Funnel Engine:

`login → board → Venda 360 → próximo passo real → transição de etapa`

Também inclui Acompanhamentos, Propostas, registrar atividade e concluir Task para sustentar o fluxo aprovado na V10.4.

## Persistência local

O ambiente de execução usado nesta fase não possui `pdo_mysql` nem servidor MySQL/MariaDB. Para testar o comportamento HTTP de ponta a ponta sem fingir um banco que não existe, esta fatia usa **JsonStore local com lock e escrita atômica**.

Ele é **somente adaptador de desenvolvimento**. O schema real de produção continua sendo `sql/001_initial_schema.sql` para MySQL/MariaDB na Hostinger.

## Rodar

```bash
cp .env.example .env # opcional; o PHP lê variáveis de ambiente, não o arquivo sozinho
export COALUP_BOOTSTRAP_NAME='Jhonatan'
export COALUP_BOOTSTRAP_LOGIN='...'
export COALUP_BOOTSTRAP_PASSWORD='senha-com-12+-caracteres'
php bin/bootstrap-user.php
php bin/seed-demo.php
php -S 127.0.0.1:8787 public/router.php
```

API: `http://127.0.0.1:8787/crm/api/v1`

## Segurança implementada nesta fatia

- Argon2id;
- sessão server-side;
- cookie HttpOnly + SameSite=Strict + Path=/crm;
- CSRF em mutações;
- rate limit de login;
- optimistic concurrency com `expected_version`;
- idempotência em mutações do slice;
- falha explícita;
- audit + domain events de sucesso.

**MFA/TOTP ainda não foi implementado**, então isto não é autenticação final de produção.

## Testes

```bash
php bin/preflight.php
./tests/smoke.sh
php tests/invariants.php var/smoke/local-store.json
```

O smoke cria credencial aleatória temporária em runtime e usa somente dados sintéticos.
