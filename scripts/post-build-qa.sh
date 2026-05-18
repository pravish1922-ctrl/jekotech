#!/bin/bash
# Runs after every successful build
# Checks the most common bugs we have encountered

echo "=== POST BUILD QA CHECKS ==="
FAIL=0

# Check 1: No hardcoded /home redirects in auth callback
if grep -n "redirect.*\/home" apps/web/app/auth/callback/route.ts 2>/dev/null; then
  echo "FAIL: Auth callback hardcodes /home redirect — must redirect by role"
  FAIL=1
fi

# Check 2: Admin server components must NOT use raw anon key for DB queries
# (createServerSupabaseClient is fine for auth, but ANON_KEY in server pages is wrong)
ADMIN_PAGES=$(find apps/web/app -path "*/admin/*/page.tsx" 2>/dev/null)
for page in $ADMIN_PAGES; do
  if grep -q "SUPABASE_ANON_KEY" "$page" 2>/dev/null; then
    if ! grep -q "use client" "$page" 2>/dev/null; then
      echo "FAIL: $page uses anon key in server component — use SERVICE_KEY for DB queries"
      FAIL=1
    fi
  fi
done

# Check 3: No mechanics DB queries that reference non-existent columns
# (name, email, phone live in clients — use clients(name) join)
if grep -rn "from.*mechanics" apps/web/app apps/web/lib 2>/dev/null | \
   grep -E "select.*['\"].*name|select.*email|select.*phone" | \
   grep -v "clients(name)"; then
  echo "FAIL: Supabase mechanics query selects name/email/phone directly"
  echo "These columns only exist in clients table — use clients(name) join"
  FAIL=1
fi

# Check 4: roleHome never returns /admin or /mechanic without subpath
if grep -n "return '/admin'" apps/web/middleware.ts 2>/dev/null | grep -v "bookings"; then
  echo "FAIL: roleHome returns /admin without subpath — must be /admin/bookings"
  FAIL=1
fi
if grep -n "return '/mechanic'" apps/web/middleware.ts 2>/dev/null | grep -v "jobs"; then
  echo "FAIL: roleHome returns /mechanic without subpath — must be /mechanic/jobs"
  FAIL=1
fi

# Check 5: Preview banner not in root layout
if grep -n "PreviewBanner\|preview-banner" apps/web/app/layout.tsx 2>/dev/null; then
  echo "FAIL: PreviewBanner in root layout — must only be in (customer)/layout.tsx"
  FAIL=1
fi

# Check 6: Sign out clears preview cookie
SIGNOUT_FILES=$(grep -rl "signOut\(\)" apps/web/components apps/web/app 2>/dev/null)
for file in $SIGNOUT_FILES; do
  if ! grep -q "preview_mode" "$file" 2>/dev/null; then
    echo "WARN: $file has signOut() but does not clear preview_mode cookie"
  fi
done

# Check 7: Status values use 'completed' not 'complete'
if grep -rn "'complete'" apps/web/app apps/web/components 2>/dev/null | \
   grep -v "'completed'" | grep "status"; then
  echo "WARN: Possible use of 'complete' instead of 'completed' for status"
fi

if [ $FAIL -eq 1 ]; then
  echo ""
  echo "POST BUILD QA: FAIL — fix above issues before committing"
  exit 2
fi

echo ""
echo "POST BUILD QA: PASS"
exit 0
