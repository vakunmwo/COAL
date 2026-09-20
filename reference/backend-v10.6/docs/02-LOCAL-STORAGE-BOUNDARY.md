# Boundary do storage local

O `JsonStore` existe apenas para validar a fatia vertical sem banco disponível no ambiente atual.

Ele fornece:
- lock exclusivo por transação;
- rollback por exceção (o arquivo só é regravado no sucesso);
- escrita temporária + rename;
- permissões 0600 quando suportadas.

Ele **não substitui InnoDB** e não deve ser publicado na Hostinger.

No próximo gate de persistência, a interface do serviço continua e a gravação passa ao schema `001_initial_schema.sql`.
