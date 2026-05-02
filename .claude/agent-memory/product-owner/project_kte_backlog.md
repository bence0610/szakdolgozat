---
name: KTE Jegyportál – Backlog Structure
description: Structure, conventions, and key facts about the KTE Jegyportál backlog at /docs/backlog.md
type: project
---

The KTE Jegyportál is a full-stack ticketing and season pass management platform for Kecskeméti TE (Hungarian football club). It is a thesis (szakdolgozat) project.

**Why:** Built as a university thesis demonstrating complex systems design, external API integration, state machine design, and security architecture.

**How to apply:** Scope decisions must prioritize the POC core flow; non-POC features (Apple Wallet, dynamic pricing, 2FA) are already placed in Post-POC iterations and must not crowd early iterations.

## Backlog file
`/docs/backlog.md` — created from scratch, 68 total user stories.

## ID convention
`KTE-001` through `KTE-068`. Post-POC items: KTE-064–KTE-068.

## Epic structure (10 POC epics + 1 post-POC group)
- E1 Foundation & Infrastructure (KTE-001–007)
- E2 Landing Page & Public UI (KTE-008–012) — UI design required
- E3 2.5D Isometric Stadium Map (KTE-013–019) — UI design required (Paper)
- E4 Shopping Cart & Seat Reservation (KTE-020–024)
- E5 Auth & User Profile (KTE-025–031) — UI design required
- E6 Checkout & Stripe Payment (KTE-032–037)
- E7 E-ticket Generation & Email (KTE-038–042)
- E8 Loyalty Points System (KTE-043–048) — UI design required (loyalty dashboard)
- E9 Season Pass Loan Flow (KTE-049–054)
- E10 Advanced Features: Waitlist, AI Chatbot, Weather, Admin (KTE-055–063)
- Post-POC: KTE-064–068 (Apple Wallet, dynamic pricing, 2FA, Google/Apple Pay, gate QR scan)

## Iteration plan (5 iterations)
1. Foundation (E1)
2. Public Landing & Map (E2, E3)
3. Cart, Auth & Checkout (E4, E5, E6)
4. Tickets, Loyalty & Pass Loan (E7, E8, E9)
5. Advanced Features (E10)

## Tech stack
Angular 17+ (standalone, strict TS), NestJS (modular, TS), MySQL 8 + TypeORM, Redis, Stripe, Claude API (claude-sonnet-4-20250514), OpenWeatherMap, Nodemailer.

## UI-dependent epics
E2, E3, E5, E8 (loyalty dashboard) all require Paper UI design before implementation starts.

## Story point scale
Fibonacci: 1, 2, 3, 5, 8. Each story sized for 1–2 days by one developer.

## Completion tracking
- 2026-04-25 (creation): 0% — all 68 stories pending.
- 2026-04-26: Iteration 1 – Foundation DONE. 7/68 stories complete (10%). KTE-001–007 all marked DONE.
- 2026-04-26: Iteration 2 – Public Landing & Map DONE. 17/68 stories complete (25%). KTE-008–010 (E2, 3 of 5 tasks — KTE-011 and KTE-012 not yet done) and KTE-013–019 (E3, all 7 tasks) marked DONE. E3 epic 100% complete; E2 epic 60% complete (KTE-011/012 remain pending for Iteration 3).
- 2026-04-26: Iteration 3 – Cart, Auth & Checkout DONE. 37/68 stories complete (54%). KTE-011, KTE-012 (E2 carry-over), KTE-020–024 (E4), KTE-025–031 (E5), KTE-032–037 (E6) all marked DONE. E2, E4, E5, E6 epics now 100% complete.
- 2026-05-02: Iteration 4 – Tickets, Loyalty & Pass Loan DONE. 54/68 stories complete (79%). KTE-038–042 (E7), KTE-043–048 (E8), KTE-049–054 (E9) all marked DONE. E7, E8, E9 epics now 100% complete. Only Iteration 5 (E10, KTE-055–063) and Post-POC (KTE-064–068) remain.
