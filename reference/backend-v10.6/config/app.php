<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$dataDir = getenv('COALUP_DATA_DIR') ?: ($root . '/var');
if (!str_starts_with($dataDir, '/')) $dataDir = $root . '/' . ltrim($dataDir, './');

return [
    'env' => getenv('COALUP_APP_ENV') ?: 'local',
    'data_file' => rtrim($dataDir,'/') . '/local-store.json',
    'cookie_name' => 'coalup_crm_session',
    'cookie_secure' => filter_var(getenv('COALUP_COOKIE_SECURE') ?: '0', FILTER_VALIDATE_BOOL),
    'session_ttl_seconds' => max(900, (int)(getenv('COALUP_SESSION_TTL_SECONDS') ?: 28800)),
    'hash_key' => getenv('COALUP_LOCAL_HASH_KEY') ?: 'local-dev-only-not-for-production',
    'login_rate_limit' => ['max_attempts'=>8, 'window_seconds'=>900],
];
