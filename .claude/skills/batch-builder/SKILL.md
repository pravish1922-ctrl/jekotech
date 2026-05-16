# Skill: Batch Builder

**Trigger:** `/batch-builder`  
**Purpose:** Orchestrate a full build cycle for a new batch — from spec to commit.

---

## Build Cycle (in order)

### Phase 0 — Gate Check

Before writing a single line of code:

- [ ] Batch spec exists in `docs/batches/batch-[X]-spec.md`
- [ ] All user stories have acceptance criteria (no DRAFT markers remaining)
- [ ] Pre-build checklist in spec is fully checked
- [ ] Any required env vars are confirmed available in `.env.local`
- [ ] Any required DB migrations have been run in Supabase

If any gate is not met → **STOP** and surface the blocker. Do not proceed.

---

### Phase 1 — Read Before Writing

For each file that will be modified:
1. Read the current file
2. Identify the exact insertion/modification point
3. Confirm the surrounding code pattern (service role usage, import style, etc.)

Never write to a file without reading it first.

---

### Phase 2 — Implementation Order

Build in dependency order:
1. DB migrations (if any) — document the SQL, note it requires manual Supabase run
2. API routes first — these have no UI dependencies
3. Server components — depend on API routes and DB
4. Client components — depend on server components
5. Layout changes last — affect all pages in the route group

---

### Phase 3 — Build Verification

After implementation:

```powershell
cd apps/web
npx next build
```

Build must pass with zero errors. If it fails:
1. Read the exact error message
2. Identify the file and line
3. Fix the specific error
4. Re-run build
5. Do not proceed to commit until build is clean

Common build failures to check:
- TypeScript ternary type mismatch with Supabase responses → use typed empty array fallback
- Missing `'use client'` directive on components using hooks
- Relative import path errors (no `@/` aliases)
- Service role key used in client component

---

### Phase 4 — Commit

```bash
git add [specific files — never git add -A blindly]
git commit -m "[type]: [description]"
git push
```

Commit message format:
- `feat: [what was built]` for new features
- `fix: [what was broken]` for bug fixes
- `chore: [infrastructure]` for non-feature work

Do NOT include `.env.local` or any file containing secrets.

---

### Phase 5 — Spec Update

After successful commit, update the batch spec:
- Change `**Status:** NOT STARTED` → `**Status:** COMPLETE`
- Add `**Merged:** main branch`
- List commits: `first-hash → last-hash`
- Document any bugs found and fixed during build
- Record any key technical decisions made

---

## Checklist Summary

```
[ ] Spec gate passed
[ ] All files read before modification
[ ] Implementation order followed (API → server → client → layout)
[ ] npx next build passes clean
[ ] Commit message follows convention
[ ] No secrets in committed files
[ ] Batch spec updated to COMPLETE
```
