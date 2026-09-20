<?php
declare(strict_types=1);
namespace CoalUp\CRM\Http;

final class Response {
    public function __construct(
        public readonly int $status,
        public readonly array $body,
        public readonly array $headers = [],
        public readonly array $cookies = [],
    ) {}

    public static function json(array $body, int $status=200, array $headers=[], array $cookies=[]): self {
        return new self($status,$body,$headers,$cookies);
    }

    public function send(): never {
        http_response_code($this->status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        foreach ($this->headers as $k=>$v) header($k . ': ' . $v);
        foreach ($this->cookies as $cookie) setcookie($cookie['name'],$cookie['value'],$cookie['options']);
        echo json_encode($this->body, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
        exit;
    }
}
