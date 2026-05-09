#!/usr/bin/env node
/**
 * wiki-save — Jekotech session notes → SPAK-vault
 */

import { execSync }                                           from 'child_process';
import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join }                                               from 'path';

const ROOT         = 'C:\\Users\\conta\\OneDrive\\Documents\\jekotech';
const VAULT        = 'C:\\Users\\conta\\OneDrive\\Documents\\SPAK-vault';
const SESSIONS_DIR = join(VAULT, 'Jekotech', 'sessions');
const HOT_MD       = join(VAULT, 'Jekotech', 'hot.md');

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim(); }
  catch { return ''; }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nextSessionNumber(dateStr) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const prefix   = `${dateStr}-session-`;
  const existing = existsSync(SESSIONS_DIR)
    ? readdirSync(SESSIONS_DIR).filter(f => f.startsWith(prefix))
    : [];
  return existing.length + 1;
}

function getCommits(dateStr) {
  const since = `${dateStr}T00:00:00`;
  const until  = `${dateStr}T23:59:59`;
  const log    = sh(`git log --oneline --since="${since}" --until="${until}" --format="%h %s"`);
  return log ? log.split('\n').filter(Boolean) : [];
}

function buildSessionNote(dateStr, n, commits) {
  const ts          = new Date().toISOString();
  const commitLines = commits.length
    ? commits.map(c => `- \`${c}\``).join('\n')
    : '- (no commits yet today)';

  return `---
type: session
title: "Jekotech Session ${dateStr}-${n}"
date: ${dateStr}
session: ${n}
updated: ${ts}
tags:
  - session
  - jekotech
related:
  - "[[hot]]"
  - "[[Jekotech-Instructions]]"
---

# Jekotech Session ${dateStr}-${n}

## Commits This Session

${commitLines}

## Notes

_Add session notes here._

---

_Jekotech Car Services Ltd — SPAK-powered session log_
`;
}

function buildHotMd(dateStr, n, commits) {
  const ts          = new Date().toISOString();
  const commitLines = commits.length
    ? commits.map(c => `- \`${c}\``).join('\n')
    : '- (no commits yet today)';

  return `---
type: meta
title: "Jekotech Hot Cache"
updated: ${ts}
tags: [meta, hot-cache, jekotech]
status: evergreen
---

# Jekotech — Recent Context

## Last Session
${dateStr} (session ${n}) — auto-saved via \`npm run wiki-save\`.

## Commits Today (${dateStr})
${commitLines}

## Project State
- **Site:** Jekotech PWA — automotive garage Mauritius
- **Deploy:** Netlify
- **Stack:** Next.js, Tailwind, Supabase
- **MVP:** MVP 1 done (WhatsApp booking) → MVP 2 (AI chat) → MVP 3 (Airtable + QuickBooks)

## Active Threads
- MVP 2: AI chat via Netlify proxy
- Owner dashboard improvements
- Cousin outstanding questions
`;
}

async function main() {
  const dateStr   = todayISO();
  const n         = nextSessionNumber(dateStr);
  const commits   = getCommits(dateStr);

  const sessionFile = join(SESSIONS_DIR, `${dateStr}-session-${n}.md`);
  writeFileSync(sessionFile, buildSessionNote(dateStr, n, commits), 'utf-8');
  console.log(`✓ Session note → SPAK-vault/Jekotech/sessions/${dateStr}-session-${n}.md`);

  writeFileSync(HOT_MD, buildHotMd(dateStr, n, commits), 'utf-8');
  console.log(`✓ hot.md updated`);

  console.log(`\nCommits captured (${commits.length}):`);
  for (const c of commits) console.log(`  ${c}`);
  console.log('\nWiki save complete.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
