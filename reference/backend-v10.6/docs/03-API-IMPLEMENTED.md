# API implementada na V10.6

Base local: `/crm/api/v1`.

## Auth

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

## Leituras do Funnel Engine

- `GET /funnel/board`
- `GET /funnel/followups`
- `GET /proposals`
- `GET /commercial-cases/{caseId}`

## Mutações da primeira fatia

- `POST /commercial-cases/{caseId}/activities`
- `PUT /commercial-cases/{caseId}/next-action`
- `POST /commercial-cases/{caseId}/transition`
- `POST /tasks/{taskId}/complete`

Mutações privadas exigem:

```text
X-CSRF-Token
Idempotency-Key
X-Request-ID recomendado
Content-Type: application/json
```

## Ainda fora desta fatia

- create case HTTP;
- decision Won/Lost/Later;
- create/update proposal;
- public intake;
- financeiro.

Essas rotas continuam no contrato alvo da V10.5, mas não são declaradas como implementadas nesta versão.
