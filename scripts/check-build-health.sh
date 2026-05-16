#!/usr/bin/env bash
# Run from repo root: bash scripts/check-build-health.sh
set -e

cd apps/web

echo "=== JEKOTECH Build Health Check ==="
echo ""

# TypeScript check
echo "1. TypeScript (tsc --noEmit)..."
TS_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || true)

if [ "$TS_ERRORS" -eq 0 ]; then
  echo "   ✓ No TypeScript errors"
else
  echo "   ✗ $TS_ERRORS TypeScript error(s) found:"
  echo "$TS_OUTPUT" | grep "error TS" | head -20
fi

echo ""

# Next.js build check
echo "2. Next.js build (npx next build)..."
if npx next build > /dev/null 2>&1; then
  echo "   ✓ Build succeeded"
else
  echo "   ✗ Build failed — run 'npx next build' for full output"
fi

echo ""
echo "=== Done ==="
