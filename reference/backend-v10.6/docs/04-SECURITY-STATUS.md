# Segurança — estado da V10.6

## Implementado e testado

- `password_hash(..., PASSWORD_ARGON2ID)`;
- `password_verify`;
- token de sessão aleatório, servidor guarda somente SHA-256;
- CSRF aleatório, servidor guarda somente SHA-256;
- cookie `HttpOnly`;
- `SameSite=Strict`;
- `Path=/crm`;
- `Secure` configurável e desligado somente no localhost do teste;
- expiração de sessão;
- `auth_version`;
- rate limit de login;
- resposta genérica para credencial inválida;
- optimistic concurrency;
- idempotência vinculada ao operador + payload;
- `Cache-Control: no-store`;
- erros 500 não expõem stack ao cliente;
- nenhum `catch {}` vazio.

## Gate ainda aberto para produção

- MFA/TOTP;
- recovery codes reais;
- persistência MySQL/InnoDB;
- rate limit distribuído/DB;
- headers HTTP finais (`CSP`, `HSTS`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`);
- rotação/revogação operacional;
- backup/restore;
- auditoria de configuração Hostinger.

Portanto: **login local robusto para a fatia**, mas ainda não é autenticação final de produção.
