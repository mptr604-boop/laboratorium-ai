#!/usr/bin/env bash
# Smoke test przez curl: zastępuje Swaggera. Każdy krok pokazuje request, odpowiedź i sprawdza kod HTTP.
# Użycie:
#   ./scripts/smoke.sh                          # sam startuje serwer na tymczasowej bazie
#   BASE_URL=http://localhost:3000 ./scripts/smoke.sh   # testuje już działający serwer (zapisze do jego bazy!)
set -u
cd "$(dirname "$0")/.."

SERVER_PID=""
TMP_DIR=""
if [ -z "${BASE_URL:-}" ]; then
  PORT="${PORT:-3999}"
  BASE_URL="http://localhost:$PORT"
  TMP_DIR="$(mktemp -d)"
  DB_FILE="$TMP_DIR/smoke.sqlite" PORT="$PORT" node src/server.js >"$TMP_DIR/server.log" 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null; rm -rf "$TMP_DIR"' EXIT
  for _ in $(seq 1 30); do
    curl -s -o /dev/null "$BASE_URL/nope" && break
    sleep 0.1
  done
fi

DEVICE=1
FAILED=0

# check <opis> <oczekiwany kod> <metoda> <ścieżka> [body]
check() {
  local name="$1" expected="$2" method="$3" path="$4" body="${5-}"
  local out code
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -X "$method" --data-raw "$body" "$BASE_URL$path")
  else
    out=$(curl -s -w '\n%{http_code}' -X "$method" "$BASE_URL$path")
  fi
  code=$(printf '%s' "$out" | tail -n1)
  if [ "$code" = "$expected" ]; then
    printf 'PASS  %-46s %s %s -> %s\n' "$name" "$method" "$path" "$code"
  else
    printf 'FAIL  %-46s %s %s -> %s (oczekiwano %s)\n' "$name" "$method" "$path" "$code" "$expected"
    FAILED=$((FAILED + 1))
  fi
  printf '      %s\n' "$(printf '%s' "$out" | head -n1)"
}

echo "== Serwer: $BASE_URL =="
check "poprawny odczyt"                       201 POST "/devices/$DEVICE/readings" "TEMP: 23.4 C"
check "awaria aparatu (ERR) jest zapisywana"  201 POST "/devices/$DEVICE/readings" "ERR"
check "uszkodzona ramka jest zapisywana"      201 POST "/devices/$DEVICE/readings" "@@@garbage@@@"
check "kontrakt odrzuca 900 C"                422 POST "/devices/$DEVICE/readings" "TEMP: 900 C"
check "za duże body"                          413 POST "/devices/$DEVICE/readings" "$(head -c 2000 /dev/zero | tr '\0' 'x')"
check "nieznana ścieżka"                      404 GET  "/nope"
check "zła metoda"                            405 GET  "/devices/$DEVICE/readings"

# Scenariusz dla statystyk: 12 pomiarów, co trzeci to ERR, na innym urządzeniu (czysty wynik).
for i in $(seq 1 12); do
  if [ $((i % 3)) -eq 0 ]; then frame="ERR"; else frame="TEMP: 2$((i % 10)).5 C"; fi
  curl -s -o /dev/null -X POST --data-raw "$frame" "$BASE_URL/devices/2/readings"
done
stats=$(curl -s "$BASE_URL/devices/2/stats")
echo "== Statystyki urządzenia 2 (co trzeci ERR) =="
echo "      $stats"
if printf '%s' "$stats" | grep -q '"periodEvery":3'; then
  echo "PASS  wykryto okresowość co 3 pomiary"
else
  echo "FAIL  oczekiwano periodEvery=3"
  FAILED=$((FAILED + 1))
fi

echo
if [ "$FAILED" -eq 0 ]; then echo "Wszystko OK"; else echo "Niepowodzeń: $FAILED"; fi
[ "$FAILED" -eq 0 ]
