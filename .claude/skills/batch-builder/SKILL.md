---
name: batch-builder
description: Invoked when starting a new batch or feature build. Orchestrates all agents in the correct order. Never skips a step.
---
# Batch Builder — Master Orchestrator

## Trigger
Use when: "start batch", "build batch", "begin batch", or any new feature build request.

## Workflow — Follow This Exactly

### Step 1: BA Agent
Invoke ba-agent to write the batch spec.
Wait for human to confirm the spec before proceeding.
Do not write any code until confirmed.

### Step 2: Build
Build each feature one at a time.
After writing each file, invoke code-reviewer.
If code-reviewer returns FAIL, fix all issues before moving to next file.
Never proceed with a failing file.

### Step 3: Build Check
Run: cd apps/web && npx next build
If build fails, fix all errors before proceeding.
Do not commit a broken build under any circumstances.

### Step 4: QA Agent
Invoke qa-agent to generate and run test cases.
Review any failures.
Fix failures and re-run build before proceeding.

### Step 5: Security Review
Invoke security-reviewer on all changed files.
If FAIL, fix all violations.
Re-run security-reviewer until PASS.

### Step 6: Commit and Push
Only after all above steps pass:
git add -A
git commit -m "[type]: [description]"
git push

## Commit Message Format
feat: new feature added
fix: bug fix
chore: infrastructure or config change
docs: documentation only
