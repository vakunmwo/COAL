-- COAL UP CRM V10.5 — Hostinger preflight (READ ONLY)
-- Execute depois de criar o banco vazio e antes de importar 001_initial_schema.sql.

SELECT VERSION() AS db_version;
SELECT DATABASE() AS current_database;
SELECT @@character_set_database AS database_charset;
SELECT @@collation_database AS database_collation;
SELECT @@session.time_zone AS session_time_zone;
SELECT @@sql_mode AS sql_mode;

-- O deploy deve parar se o banco não estiver vazio, exceto schema_migrations quando explicitamente esperado.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY table_name;
