# Próximo gate — MySQL/MariaDB

## FATO

O ambiente usado para implementar/testar a V10.6 possui PHP 8.4 e Argon2id, mas não possui `pdo_mysql`, `mysqli` nem servidor MySQL/MariaDB.

Por isso o runtime local desta fatia usa `JsonStore` exclusivamente como adaptador de desenvolvimento.

## Próxima execução recomendada

1. criar banco vazio na Hostinger;
2. rodar o preflight read-only da V10.5;
3. confirmar versão MySQL/MariaDB, charset e timezone;
4. aplicar `001_initial_schema.sql`;
5. criar as duas contas individualmente;
6. importar Playbook publicado;
7. portar os services da V10.6 para repositories PDO/MySQL;
8. repetir a mesma suíte de smoke/invariantes contra InnoDB;
9. só então ligar a V10.4 ao backend.

## Proibição

O `JsonStore` não deve ser enviado como banco de produção para `coalup.com.br/crm/`.
