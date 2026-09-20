#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${COALUP_TEST_PORT:-8787}"
DATA_DIR="$ROOT/var/smoke"
rm -rf "$DATA_DIR"; mkdir -p "$DATA_DIR"
export COALUP_DATA_DIR="$DATA_DIR"
export COALUP_COOKIE_SECURE=0
export COALUP_LOCAL_HASH_KEY="smoke-local-key"
export COALUP_BOOTSTRAP_NAME="Operador Smoke"
export COALUP_BOOTSTRAP_LOGIN="smoke-user"
PASS="Smoke-$(php -r 'echo bin2hex(random_bytes(12));')-A1!"
export COALUP_BOOTSTRAP_PASSWORD="$PASS"
php "$ROOT/bin/bootstrap-user.php" >/dev/null
php "$ROOT/bin/seed-demo.php" >/dev/null
php -S "127.0.0.1:$PORT" "$ROOT/public/router.php" >"$DATA_DIR/server.log" 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null || true' EXIT
sleep .5
BASE="http://127.0.0.1:$PORT/crm/api/v1"
JAR="$DATA_DIR/cookies.txt"

# Private route without session must be rejected.
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/funnel/board")
[ "$STATUS" = "401" ]

# Login rate limit must persist failed attempts.
for _ in $(seq 1 8); do
  curl -sS -o /dev/null -H 'Content-Type: application/json' \
    -d '{"login":"ratelimit-user","password":"wrong-password"}' "$BASE/auth/login"
done
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
  -d '{"login":"ratelimit-user","password":"wrong-password"}' "$BASE/auth/login")
[ "$STATUS" = "429" ]

LOGIN_PAYLOAD=$(LOGIN="$COALUP_BOOTSTRAP_LOGIN" PASS="$PASS" php -r 'echo json_encode(["login"=>getenv("LOGIN"),"password"=>getenv("PASS")]);')
LOGIN=$(curl -fsS -c "$JAR" -H 'Content-Type: application/json' \
  -H 'X-Request-ID: 11111111-1111-4111-8111-111111111111' \
  -d "$LOGIN_PAYLOAD" "$BASE/auth/login")
CSRF=$(printf '%s' "$LOGIN" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["csrf_token"]??"";')
[ -n "$CSRF" ]

BOARD=$(curl -fsS -b "$JAR" "$BASE/funnel/board")
DIAG_CASE=$(printf '%s' "$BOARD" | php -r '$x=json_decode(stream_get_contents(STDIN),true); foreach($x["data"]["stages"] as $s){if($s["key"]==="diagnostico" && !empty($s["cases"])) {echo $s["cases"][0]["id"]; break;}}')
if [ -n "$DIAG_CASE" ]; then
  DIAG_DETAIL=$(curl -fsS -b "$JAR" "$BASE/commercial-cases/$DIAG_CASE")
  DIAG_VERSION=$(printf '%s' "$DIAG_DETAIL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["version"]??0;')
  DIAG_TASK=$(printf '%s' "$DIAG_DETAIL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["next_action"]["id"]??"";')
  ACT_BODY="{\"expected_version\":$DIAG_VERSION,\"kind\":\"conversation\",\"channel\":\"whatsapp\",\"summary\":\"Smoke: conversa registrada.\",\"occurred_at\":\"2099-01-01T10:00:00Z\",\"next_action\":{\"title\":\"Smoke: preparar oferta\",\"due_at\":\"2099-01-04T12:00:00Z\",\"assigned_to\":null,\"replace_open_task\":{\"task_id\":\"$DIAG_TASK\",\"resolution\":\"complete\"}}}"
  ACT=$(curl -fsS -b "$JAR" -X POST -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: smoke-activity-1' --data "$ACT_BODY" "$BASE/commercial-cases/$DIAG_CASE/activities")
  SOURCE_MATCH=$(printf '%s' "$ACT" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo (($x["data"]["activity"]["id"]??"")===($x["data"]["next_action"]["source_activity_id"]??""))?"yes":"no";')
  [ "$SOURCE_MATCH" = "yes" ]
fi
CASE_ID=$(printf '%s' "$BOARD" | php -r '$x=json_decode(stream_get_contents(STDIN),true); foreach($x["data"]["stages"] as $s){if($s["key"]==="pesquisa" && !empty($s["cases"])) {echo $s["cases"][0]["id"]; break;}}')
TARGET_EVIDENCIA=$(printf '%s' "$BOARD" | php -r '$x=json_decode(stream_get_contents(STDIN),true); foreach($x["data"]["stages"] as $s){if($s["key"]==="evidencia") echo $s["id"]; }')
TARGET_ABORDAGEM=$(printf '%s' "$BOARD" | php -r '$x=json_decode(stream_get_contents(STDIN),true); foreach($x["data"]["stages"] as $s){if($s["key"]==="abordagem") echo $s["id"]; }')
[ -n "$CASE_ID" ] && [ -n "$TARGET_EVIDENCIA" ] && [ -n "$TARGET_ABORDAGEM" ]

DETAIL=$(curl -fsS -b "$JAR" "$BASE/commercial-cases/$CASE_ID")
VERSION=$(printf '%s' "$DETAIL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["version"]??0;')
OLD_TASK=$(printf '%s' "$DETAIL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["next_action"]["id"]??"";')

# Mutation without CSRF must fail before any state change.
NEXT_BODY="{\"expected_version\":$VERSION,\"title\":\"Confirmar evidência\",\"due_at\":\"2099-01-01T12:00:00Z\",\"assigned_to\":null,\"replace_open_task\":{\"task_id\":\"$OLD_TASK\",\"resolution\":\"complete\"}}"
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' -b "$JAR" -X PUT \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: csrf-must-fail' \
  --data "$NEXT_BODY" "$BASE/commercial-cases/$CASE_ID/next-action")
[ "$STATUS" = "403" ]

NEXT=$(curl -fsS -b "$JAR" -X PUT -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: smoke-next-1' \
  -H 'X-Request-ID: 22222222-2222-4222-8222-222222222222' \
  --data "$NEXT_BODY" "$BASE/commercial-cases/$CASE_ID/next-action")
VERSION2=$(printf '%s' "$NEXT" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["version"]??0;')

# Old version must not overwrite the fresh state.
STATUS=$(curl -sS -o /dev/null -w '%{http_code}' -b "$JAR" -X PUT \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
  -H 'Idempotency-Key: stale-version-check' \
  --data "$NEXT_BODY" "$BASE/commercial-cases/$CASE_ID/next-action")
[ "$STATUS" = "409" ]

TRANS_BODY="{\"expected_version\":$VERSION2,\"target_stage_id\":\"$TARGET_EVIDENCIA\",\"transition_reason\":\"Smoke test\",\"override_reason\":null,\"next_action\":{\"title\":\"Preparar abordagem\",\"due_at\":\"2099-01-02T12:00:00Z\",\"assigned_to\":null}}"
TRANS=$(curl -fsS -b "$JAR" -X POST -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: smoke-transition-1' \
  -H 'X-Request-ID: 33333333-3333-4333-8333-333333333333' \
  --data "$TRANS_BODY" "$BASE/commercial-cases/$CASE_ID/transition")
STAGE=$(printf '%s' "$TRANS" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["current_stage_id"]??"";')
VERSION3=$(printf '%s' "$TRANS" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["version"]??0;')
[ "$STAGE" = "$TARGET_EVIDENCIA" ]

# Same key + same body replays instead of duplicating stage events.
REPLAY=$(curl -fsS -b "$JAR" -X POST -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: smoke-transition-1' \
  -H 'X-Request-ID: 44444444-4444-4444-8444-444444444444' \
  --data "$TRANS_BODY" "$BASE/commercial-cases/$CASE_ID/transition")
REPLAY_FLAG=$(printf '%s' "$REPLAY" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo !empty($x["meta"]["idempotent_replay"])?"yes":"no";')
[ "$REPLAY_FLAG" = "yes" ]

# Evidence stage has synthetic gaps; transition must request an override reason.
NO_OVERRIDE="{\"expected_version\":$VERSION3,\"target_stage_id\":\"$TARGET_ABORDAGEM\",\"transition_reason\":\"Gate negative test\",\"override_reason\":null,\"next_action\":{\"title\":\"Confirmar interesse\",\"due_at\":\"2099-01-03T12:00:00Z\",\"assigned_to\":null}}"
STATUS=$(curl -sS -o "$DATA_DIR/gate-error.json" -w '%{http_code}' -b "$JAR" -X POST \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
  -H 'Idempotency-Key: gate-no-override' --data "$NO_OVERRIDE" \
  "$BASE/commercial-cases/$CASE_ID/transition")
[ "$STATUS" = "422" ]
GATE_CODE=$(php -r '$x=json_decode(file_get_contents($argv[1]),true); echo $x["error"]["code"]??"";' "$DATA_DIR/gate-error.json")
[ "$GATE_CODE" = "gate_override_required" ]

WITH_OVERRIDE="{\"expected_version\":$VERSION3,\"target_stage_id\":\"$TARGET_ABORDAGEM\",\"transition_reason\":\"Gate positive test\",\"override_reason\":\"Seed local não possui evidência estruturada; avanço autorizado apenas para validar o motor.\",\"next_action\":{\"title\":\"Confirmar interesse\",\"due_at\":\"2099-01-03T12:00:00Z\",\"assigned_to\":null}}"
TRANS2=$(curl -fsS -b "$JAR" -X POST -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: gate-with-override' \
  --data "$WITH_OVERRIDE" "$BASE/commercial-cases/$CASE_ID/transition")

FINAL=$(curl -fsS -b "$JAR" "$BASE/commercial-cases/$CASE_ID")
FINAL_STAGE=$(printf '%s' "$FINAL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["stage"]["key"]??"";')
[ "$FINAL_STAGE" = "abordagem" ]
FINAL_TASK=$(printf '%s' "$FINAL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["next_action"]["id"]??"";')
FINAL_TASK_VERSION=$(printf '%s' "$FINAL" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo $x["data"]["next_action"]["version"]??0;')
[ -n "$FINAL_TASK" ] && [ "$FINAL_TASK_VERSION" -gt 0 ]

# Completing the current next-action must clear the case pointer and must not create another task.
COMPLETE_BODY="{\"expected_version\":$FINAL_TASK_VERSION,\"completion_note\":\"Smoke: ação concluída.\"}"
curl -fsS -b "$JAR" -X POST -H 'Content-Type: application/json' \
  -H "X-CSRF-Token: $CSRF" -H 'Idempotency-Key: complete-current-next' \
  --data "$COMPLETE_BODY" "$BASE/tasks/$FINAL_TASK/complete" >/dev/null
AFTER_COMPLETE=$(curl -fsS -b "$JAR" "$BASE/commercial-cases/$CASE_ID")
HAS_NEXT=$(printf '%s' "$AFTER_COMPLETE" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo empty($x["data"]["next_action"])?"no":"yes";')
[ "$HAS_NEXT" = "no" ]

FOLLOW=$(curl -fsS -b "$JAR" "$BASE/funnel/followups")
MISSING_FOUND=$(printf '%s' "$FOLLOW" | CASE_ID="$CASE_ID" php -r '$x=json_decode(stream_get_contents(STDIN),true); $id=getenv("CASE_ID"); foreach($x["data"]["missing_next_action"]??[] as $c){if(($c["id"]??"")===$id){echo "yes"; exit;}} echo "no";')
[ "$MISSING_FOUND" = "yes" ]
PROP=$(curl -fsS -b "$JAR" "$BASE/proposals")
COUNT=$(printf '%s' "$PROP" | php -r '$x=json_decode(stream_get_contents(STDIN),true); echo count($x["data"]??[]);')
[ "$COUNT" -ge 1 ]

echo "SMOKE PASS: auth, rate-limit, CSRF, board, venda360, activity+next-action, next-action, stale-version, transition, gate, idempotency, task-complete, missing-next-action, followups, proposals"
