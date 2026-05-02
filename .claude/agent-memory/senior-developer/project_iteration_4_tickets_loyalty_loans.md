---
name: Iteration 4 scope (Tickets, Loyalty, Pass Loan)
description: Decisions made for Iteration 4 (KTE-038..054 except KTE-051) - tier system, QR signing, email retry, cron framework
type: project
---

Iteration 4 implements EPIC E7 (E-ticket), E8 (Loyalty), E9 (Season Pass Loan).

**Why:** Builds the post-purchase fan experience on top of the iteration 3 checkout, gives KTE a continuous engagement loop and reduces no-shows via shareable passes.

**How to apply:**

Decisions baked in (do not relitigate without explicit user approval):
- Tier enum stays `bronze/silver/gold/platinum` in DB; frontend `TIER_LABELS` maps to `Kék/Ezüst/Arany/KTE Legenda`.
- QR payload is JWT signed with separate `QR_SIGNING_SECRET`, JTI persisted on row, revocation via Redis denylist (`qr:deny:{jti}`).
- Email is HTML via Handlebars + Nodemailer; no Puppeteer/PDF.
- Cron uses `@nestjs/schedule` plus dynamic `CronJob` from `cron` for env-driven expressions; no Bull/BullMQ.
- Email retry is in-process `setTimeout` (single retry, configurable delay); no queue worker.
- Loan QR rotation: Redis denylist + DB `qr_jti` rewrite.
- Stripe webhook → email is fire-and-forget Promise (`.catch()` logs only, never rethrows from background).
- Tier discount is applied at PaymentIntent.amount level; `Ticket.pricePaid` always stores the original list price for accounting.

Idempotency contract for `LoyaltyService.award`:
- Pass `referenceId` for every awardable event. DB unique `(source, reference_id)` enforces single-fire.
- Reference ID conventions: `ticket:<ticketId>`, `profile_completion:<userId>`, `registration:<userId>`, `loan:<loanId>`, `season:<YYYY-MM-DD>:<userId>`.
- Duplicate award returns `{ duplicate: true }` instead of throwing.

Cron schedule:
- `@Cron('0 3 30 6 *')` season carryover (June 30 03:00 Europe/Budapest), keeps `LOYALTY_CARRYOVER_PERCENT`% of points, expires the rest.
- Hourly `loanReleaseSweep` expires pending invitations and completes accepted loans for matches finished >4h ago.
- Daily `ticketExpireSweep` (default 04:00) marks paid-but-unscanned tickets as EXPIRED for finished matches.

Stripe raw body: `/api/webhooks/stripe` mounted with `express.raw()` middleware in main.ts; everything else uses `express.json()`.
