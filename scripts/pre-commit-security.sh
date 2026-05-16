#!/bin/bash
echo "=== JEKOTECH SECURITY REVIEW ==="
FAIL=0

# Check 1: Service key in client components
echo "Checking service key exposure in components..."
if grep -r "SUPABASE_SERVICE_KEY" apps/web/components/ 2>/dev/null; then
  echo "FAIL: Service key found in /components/"
  FAIL=1
fi

# Check 2: Service key in files with 'use client'
echo "Checking service key in client files..."
while IFS= read -r -d '' file; do
  if grep -q "use client" "$file" && grep -q "SUPABASE_SERVICE_KEY" "$file"; then
    echo "FAIL: Service key found in client component: $file"
    FAIL=1
  fi
done < <(find apps/web/app -name "*.tsx" -print0 2>/dev/null)

# Check 3: Hardcoded secrets pattern
echo "Checking for hardcoded secrets..."
if grep -rE \
  "(password|secret|api_key|apikey)\s*=\s*['\"][^'\"]{8,}['\"]" \
  apps/web/app apps/web/lib apps/web/components 2>/dev/null | \
  grep -v ".env" | grep -v "placeholder" | grep -v "example"; then
  echo "FAIL: Possible hardcoded secret detected"
  FAIL=1
fi

# Check 4: .env.local not staged
echo "Checking .env.local not staged..."
if git diff --cached --name-only | grep -q ".env.local"; then
  echo "FAIL: .env.local is staged for commit — remove it"
  FAIL=1
fi

# Check 5: Self-referencing RLS patterns in SQL files
echo "Checking for recursive RLS patterns in SQL..."
if grep -r "FROM clients.*WHERE.*auth.uid\|FROM mechanics.*WHERE.*auth.uid" \
   supabase/ 2>/dev/null | grep -v "me.id\|own"; then
  echo "WARN: Possible recursive RLS policy detected — review manually"
fi

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "SECURITY REVIEW: FAIL - Commit blocked"
  echo "Fix all violations above before committing"
  exit 2
fi

echo ""
echo "SECURITY REVIEW: PASS - Commit allowed"
exit 0
