<?php
declare(strict_types=1);
namespace CoalUp\CRM\Http;

final class ApiException extends \RuntimeException {
    public function __construct(
        public readonly int $status,
        public readonly string $apiCode,
        string $message,
        public readonly array $fields = [],
        public readonly ?int $currentVersion = null,
    ) { parent::__construct($message); }
}
