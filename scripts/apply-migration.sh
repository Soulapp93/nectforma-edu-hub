#!/usr/bin/env bash
# Apply a single SQL migration file via Supabase Management API.
# Requires: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in /app/.env
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-sql-file>"
  exit 1
fi

SQL_FILE="$1"
if [ ! -f "$SQL_FILE" ]; then
  echo "File not found: $SQL_FILE"; exit 1
fi

# shellcheck source=/dev/null
set -a; source /app/.env; set +a

if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF in /app/.env"; exit 1
fi

PAYLOAD=$(python3 -c "import json,sys; print(json.dumps({'query': open(sys.argv[1]).read()}))" "$SQL_FILE")

echo ">>> Applying migration $SQL_FILE to project $SUPABASE_PROJECT_REF"
RESPONSE=$(curl -sS -w "\n__HTTP__%{http_code}" -X POST \
  "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1 | sed 's/^__HTTP__//')
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP $HTTP_CODE"
echo "$BODY"

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  exit 1
fi
echo ">>> Migration applied successfully"
