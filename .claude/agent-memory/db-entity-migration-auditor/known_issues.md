---
name: Known Issues — 2026-05-09 Audit (Final Re-audit)
description: All 7 previously reported issues are resolved; one cosmetic comment mislabel remains (no SQL impact)
type: project
---

## Status: CLEAN — Final audit 2026-05-09 PASS

### All Issues Resolved

- W1: `IDX_users_email_unique` orphaned index — FIXED by FixSchemaDiscrepancies migration `up()` DROP INDEX
- W2: `IDX_tickets_qr` orphaned named index — FIXED: `@Index('IDX_tickets_qr', ['qrCode'], { unique: true })` on ticket.entity.ts; inline `unique: true` removed from `qr_code` column
- W3: `IDX_season_passes_qr` orphaned named index — FIXED: `@Index('IDX_season_passes_qr', ['qrCode'], { unique: true })` on season-pass.entity.ts; inline `unique: true` removed from `qr_code` column
- W4: `pass_loans.qr_jti` missing `unique: true` in entity — FIXED: `unique: true` added to `@Column` in pass-loan.entity.ts line 50
- I1/W8: `tickets.scanned_by_user_id` missing FK — FIXED: `fk_tickets_scanned_by` added in FixSchemaDiscrepancies; `@ManyToOne` + `@JoinColumn` added to ticket.entity.ts
- NEW-1: `ticket.entity.ts` `qr_jti` had inline `unique: true` duplicating migration unique index — FIXED: removed inline `unique: true` from `@Column` at line 58
- NEW-2: `user.entity.ts` `email` had inline `unique: true` duplicating class-level `@Index` — FIXED: removed inline `unique: true` from `@Column` at line 24

### Remaining (Non-SQL, Informational Only)

- NEW-3: `1714500000000-FixSchemaDiscrepancies.ts` JSDoc comment labels the FK fix as "I1" but the original audit classified the missing FK as "W8". Comment-only cosmetic issue, no SQL impact. Not worth a migration change.
