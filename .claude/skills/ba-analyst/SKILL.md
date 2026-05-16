# Skill: BA Analyst

**Trigger:** `/ba-analyst`  
**Purpose:** Write business analysis artifacts before any code is written for a new batch or feature.

---

## What This Skill Produces

For any feature or batch scope provided:

1. **User Stories** — AS A [role], I WANT [action], SO THAT [benefit]
2. **Acceptance Criteria** — GIVEN/WHEN/THEN format, one per story
3. **Gap Analysis** — what's unknown, what needs owner sign-off before build
4. **DB Impact** — new tables, new columns, RLS implications
5. **API Impact** — new routes, modified routes, auth requirements

---

## Roles to Consider

Always write stories for all affected roles:
- `customer` — vehicle owner, mobile-first, books via PWA
- `owner` — garage proprietor (Pravish's cousin), full admin access
- `delegate` — trusted manager, all admin except settings
- `staff` — counter staff, confirm/cancel bookings only
- `mechanic` — workshop technician, assigned jobs only

---

## Story Template

```
AS A [role]
I WANT [specific action or information]
SO THAT [business value or user benefit]

Acceptance Criteria:
- GIVEN [context]
  WHEN [trigger]
  THEN [expected outcome]
```

---

## Gap Analysis Categories

Flag any item that falls into:
- **Owner input needed** — requires data only the owner can provide (Airtable schema, WhatsApp template names, QB credentials)
- **External dependency** — third-party approval required (Meta template approval, QB sandbox)
- **DB migration needed** — new column or table required before build can start
- **RLS review needed** — new table or access pattern requires policy definition

---

## Checklist Before Handing to Developer

- [ ] All roles that interact with the feature have at least one user story
- [ ] Every story has at least one acceptance criterion
- [ ] Gap analysis is complete — no hidden unknowns
- [ ] DB changes are specified (or confirmed as none needed)
- [ ] API routes are listed with method, path, auth requirement
- [ ] No story is marked DRAFT — all have owner sign-off

---

## Output Format

Write output directly into the relevant `docs/batches/batch-X-spec.md` file, filling in the Feature Breakdown sections. Update the Pre-Build Checklist with any new blocking items identified.
