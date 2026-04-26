#!/usr/bin/env bash
set +e

PASS=0; FAIL=0
check() {
  local label="$1"; local ok="$2"
  if [ "$ok" = "1" ]; then
    printf "  \033[32m✔ PASS\033[0m  %s\n" "$label"
    ((PASS++))
  else
    printf "  \033[31m✘ FAIL\033[0m  %s\n" "$label"
    ((FAIL++))
  fi
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "═══ InitStory Pre-Submission Checklist ═══"
echo

# 1. weave CLI installed (Initia, not TeX)
weave_ok=0
if command -v weave &>/dev/null && weave version &>/dev/null; then weave_ok=1; fi
check "weave CLI installed (Initia)" "$weave_ok"

# 2. weave init / blocks producing — skip if weave not running
blocks_ok=0
if curl -s http://localhost:1317/cosmos/base/tendermint/v1beta1/blocks/latest 2>/dev/null | grep -q '"block_id"'; then blocks_ok=1; fi
check "Local chain producing blocks" "$blocks_ok"

# 3. gas-station key in minitiad
gas_ok=0
if minitiad keys show gas-station --keyring-backend test &>/dev/null; then gas_ok=1; fi
check "gas-station key in minitiad" "$gas_ok"

# 4. Move contract builds
build_ok=0
if minitiad move build --path "$ROOT/initstory-contract" \
   --named-addresses initstory=0x2b4ab6325b6e7096e9df71f78f20d993071a7028 \
   --skip-fetch-latest-git-deps &>/dev/null; then build_ok=1; fi
check "Move contract builds without errors" "$build_ok"

# 5. Unit tests pass (3 tests)
test_ok=0
test_out=$(minitiad move test --path "$ROOT/initstory-contract" \
   --named-addresses initstory=0x2b4ab6325b6e7096e9df71f78f20d993071a7028 \
   --skip-fetch-latest-git-deps 2>&1 || true)
if echo "$test_out" | grep -q "passed: 3"; then test_ok=1; fi
check "All 3 Move unit tests pass" "$test_ok"

# 6. Contract deployed (deployed_address in submission.json)
deploy_ok=0
if [ -f "$ROOT/.initia/submission.json" ]; then
  addr=$(grep -oP '"deployed_address"\s*:\s*"\K[^"]+' "$ROOT/.initia/submission.json")
  if [ -n "$addr" ] && [ "$addr" != "TO_BE_FILLED" ]; then deploy_ok=1; fi
fi
check "deployed_address set in submission.json" "$deploy_ok"

# 7. Backend health check
be_ok=0
if curl -sf http://localhost:3001/health &>/dev/null; then be_ok=1; fi
check "Backend running (health check)" "$be_ok"

# 8. Frontend reachable
fe_ok=0
if curl -sf http://localhost:3000 &>/dev/null; then fe_ok=1; fi
check "Frontend running on :3000" "$fe_ok"

# 9. Keplr / wallet connect — check InterwovenKit is in frontend deps
keplr_ok=0
if grep -q "interwovenkit\|@initia/initia.js" "$ROOT/initstory-frontend/package.json" 2>/dev/null; then keplr_ok=1; fi
check "Wallet SDK (InterwovenKit) in frontend deps" "$keplr_ok"

# 10. Browser wallet funding — manual, check env hint
fund_ok=0
if grep -q "VITE_MODULE_ADDRESS" "$ROOT/initstory-frontend/.env" 2>/dev/null; then fund_ok=1; fi
check "VITE_MODULE_ADDRESS configured" "$fund_ok"

# 11. create_character entry exists in contract
char_ok=0
if grep -q "public entry fun create_character" "$ROOT/initstory-contract/sources/stories.move"; then char_ok=1; fi
check "create_character entry in contract" "$char_ok"

# 12. DGrid AI — backend .env has real key
dgrid_ok=0
if [ -f "$ROOT/backend/.env" ]; then
  key=$(grep -oP 'DGRID_API_KEY=\K.*' "$ROOT/backend/.env" || true)
  if [ -n "$key" ] && [ "$key" != "REPLACE_WITH_DGRID_API_KEY" ]; then dgrid_ok=1; fi
fi
check "DGrid API key configured" "$dgrid_ok"

# 13. mint_story entry exists
mint_ok=0
if grep -q "public entry fun mint_story" "$ROOT/initstory-contract/sources/stories.move"; then mint_ok=1; fi
check "mint_story entry in contract" "$mint_ok"

# 14. Auto-signing — check native_feature in submission.json
auto_ok=0
if grep -q '"auto-signing"' "$ROOT/.initia/submission.json" 2>/dev/null; then auto_ok=1; fi
check "Auto-signing declared in submission.json" "$auto_ok"

# 15. Level-up logic in contract
lvl_ok=0
if grep -q "EVOLUTION_THRESHOLD" "$ROOT/initstory-contract/sources/stories.move"; then lvl_ok=1; fi
check "Character level-up logic in contract" "$lvl_ok"

# 16-17. Demo video URL present
vid_ok=0
if [ -f "$ROOT/.initia/submission.json" ]; then
  vid=$(grep -oP '"demo_video_url"\s*:\s*"\K[^"]+' "$ROOT/.initia/submission.json")
  if [ -n "$vid" ] && [ "$vid" != "TO_BE_FILLED" ]; then vid_ok=1; fi
fi
check "Demo video URL in submission.json" "$vid_ok"

# 18. submission.json has commit_sha
sha_ok=0
if [ -f "$ROOT/.initia/submission.json" ]; then
  sha=$(grep -oP '"commit_sha"\s*:\s*"\K[^"]+' "$ROOT/.initia/submission.json")
  if [ -n "$sha" ] && [ ${#sha} -ge 7 ]; then sha_ok=1; fi
fi
check "commit_sha set in submission.json" "$sha_ok"

# 19. README exists with required sections
readme_ok=0
if [ -f "$ROOT/README.md" ]; then
  has_sections=0
  grep -qi "architecture\|how.*run\|deploy\|demo" "$ROOT/README.md" && has_sections=1
  if [ "$has_sections" = "1" ]; then readme_ok=1; fi
fi
check "README.md with required sections" "$readme_ok"

# 20. Git repo with remote
git_ok=0
if git -C "$ROOT" remote get-url origin &>/dev/null; then git_ok=1; fi
check "Git repo with GitHub remote" "$git_ok"

# 21. .env not tracked
env_ok=0
if ! git -C "$ROOT" ls-files --error-unmatch backend/.env &>/dev/null 2>&1; then env_ok=1; fi
check ".env files not tracked in git" "$env_ok"

echo
echo "═══════════════════════════════════════════"
printf "  Total: %d  |  \033[32mPass: %d\033[0m  |  \033[31mFail: %d\033[0m\n" $((PASS+FAIL)) "$PASS" "$FAIL"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then exit 1; fi
