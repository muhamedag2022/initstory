#!/usr/bin/env bash
# scripts/gather-env.sh
# Run after `weave init` to auto-populate frontend .env
# Usage: bash scripts/gather-env.sh

set -e

echo "── InitStory: gathering appchain values ──────────────────────────────────"

APPCHAIN_ID=$(curl -s http://localhost:26657/status 2>/dev/null | jq -r '.result.node_info.network // empty')
if [ -z "$APPCHAIN_ID" ]; then
  echo "❌  Appchain not running. Start it with: weave rollup start -d"
  exit 1
fi

NATIVE_DENOM=$(minitiad q bank total --output json 2>/dev/null | jq -r '.supply[0].denom // "umin"')
GAS_BECH32=$(minitiad keys show gas-station -a --keyring-backend test 2>/dev/null)

echo ""
echo "Found:"
echo "  Chain ID:      $APPCHAIN_ID"
echo "  Native denom:  $NATIVE_DENOM"
echo "  Gas station:   $GAS_BECH32"
echo ""

FRONTEND_ENV="initstory-frontend/.env"
cp "initstory-frontend/.env.example" "$FRONTEND_ENV"

sed -i.bak "s|VITE_APPCHAIN_ID=.*|VITE_APPCHAIN_ID=$APPCHAIN_ID|"   "$FRONTEND_ENV"
sed -i.bak "s|VITE_NATIVE_DENOM=.*|VITE_NATIVE_DENOM=$NATIVE_DENOM|" "$FRONTEND_ENV"
sed -i.bak "s|VITE_NATIVE_SYMBOL=.*|VITE_NATIVE_SYMBOL=MIN|"          "$FRONTEND_ENV"
rm -f "${FRONTEND_ENV}.bak"

echo "✅  Written to $FRONTEND_ENV"
echo ""
echo "Next steps:"
echo "  1. Deploy the contract:  see README Step 2"
echo "  2. Paste module address: edit $FRONTEND_ENV → VITE_MODULE_ADDRESS=init19d9tvvjmdecfd6wlw8mc7gxejvr35upgzxngzf"
echo "  3. Start backend:        cd backend && cp .env.example .env && npm run dev"
echo "  4. Start frontend:       cd initstory-frontend && npm run dev"
