#!/bin/bash
echo "=== BUILD CHECK START ==="
echo "Node: $(node -v) | npm: $(npm -v)"
echo "=== CHECKING KEY FILES ==="
for f in lib/supabase-browser.ts lib/supabase-server.ts lib/auth.ts middleware.ts; do
  [ -f "$f" ] && echo "✅ $f" || echo "❌ MISSING: $f"
done
echo "=== CHECKING GIT STATUS ==="
git ls-files lib/ | head -20
echo "=== RUNNING BUILD ==="
npm run build 2>&1
BUILD_EXIT=$?
echo "=== BUILD EXIT: $BUILD_EXIT ==="
exit $BUILD_EXIT
