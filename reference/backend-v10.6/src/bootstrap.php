<?php
declare(strict_types=1);

spl_autoload_register(function(string $class): void {
    $prefix = 'CoalUp\\CRM\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) require $path;
});

function coalup_uuid(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    $hex = bin2hex($data);
    return sprintf('%s-%s-%s-%s-%s', substr($hex,0,8), substr($hex,8,4), substr($hex,12,4), substr($hex,16,4), substr($hex,20,12));
}

function coalup_now(): string { return gmdate('Y-m-d\\TH:i:s\\Z'); }
function coalup_plus_seconds(int $seconds): string { return gmdate('Y-m-d\\TH:i:s\\Z', time()+$seconds); }
function coalup_ts(?string $iso): ?int { if ($iso===null || $iso==='') return null; $t=strtotime($iso); return $t===false?null:$t; }

function coalup_json_canonical(mixed $value): string {
    $sort = function(mixed $v) use (&$sort): mixed {
        if (is_array($v)) {
            if (array_is_list($v)) return array_map($sort, $v);
            ksort($v, SORT_STRING);
            foreach ($v as $k=>$item) $v[$k]=$sort($item);
        }
        return $v;
    };
    return json_encode($sort($value), JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
}
