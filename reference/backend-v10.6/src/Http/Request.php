<?php
declare(strict_types=1);
namespace CoalUp\CRM\Http;

final class Request {
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        public readonly array $cookies,
        public readonly array $json,
        public readonly ?string $ip,
        public readonly ?string $userAgent,
    ) {}

    public static function fromGlobals(): self {
        $headers=[];
        if (function_exists('getallheaders')) {
            foreach ((getallheaders() ?: []) as $k=>$v) $headers[strtolower((string)$k)] = (string)$v;
        } else {
            foreach ($_SERVER as $k=>$v) if (str_starts_with($k,'HTTP_')) $headers[strtolower(str_replace('_','-',substr($k,5)))] = (string)$v;
        }
        $raw=file_get_contents('php://input') ?: '';
        $json=[];
        if ($raw!=='') {
            try { $decoded=json_decode($raw,true,512,JSON_THROW_ON_ERROR); $json=is_array($decoded)?$decoded:[]; }
            catch (\JsonException) { throw new ApiException(400,'invalid_json','O corpo JSON é inválido.'); }
        }
        $uri=(string)($_SERVER['REQUEST_URI'] ?? '/');
        $path=parse_url($uri,PHP_URL_PATH) ?: '/';
        return new self(
            strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            rtrim($path,'/') ?: '/',
            $_GET,
            $headers,
            $_COOKIE,
            $json,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        );
    }

    public function header(string $name): ?string { return $this->headers[strtolower($name)] ?? null; }
}
