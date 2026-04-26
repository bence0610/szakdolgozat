---
name: KTE Jegyportál – Iteration 2 Test Strategy
description: Test coverage plan and implementation details for Iteration 2 (Public Landing & Map) — Playwright E2E + Jest integration tests
type: project
---

Iteration 2 implements: Landing Page (/), Stadium Page (/stadium?matchId=), GET /matches, GET /matches/upcoming, GET /matches/:id, GET /matches/:matchId/seats, POST/DELETE /matches/:matchId/seats/:seatId/lock.

**Why:** This is the first iteration with a real UI. Angular 17 + NgRx store drives page state; all API calls go through the NgRx effects layer. Tests must mock at the HTTP network boundary (Playwright route interceptors), not at the Angular service level.

**How to apply:** Use Playwright route mocks for all E2E tests — the backend is NOT running during frontend tests. Backend integration tests use NestJS TestingModule with repository stubs and an InMemoryRedisMock.

## Test file locations
- E2E: `apps/frontend/e2e/` (landing-page.spec.ts, stadium-page.spec.ts)
- Playwright config: `apps/frontend/e2e/playwright.config.ts`
- Page Objects: `apps/frontend/e2e/pages/` (home.page.ts, stadium.page.ts)
- Fixtures: `apps/frontend/e2e/fixtures/api-mocks.ts`
- Backend integration: `apps/backend/src/modules/matches/matches.controller.spec.ts`
- Backend integration: `apps/backend/src/modules/seats/match-seats.controller.spec.ts`

## Key design decisions
- Playwright is NOT yet in apps/frontend/package.json — must be installed: `npm install -D @playwright/test`
- Run Playwright: `npx playwright test --config apps/frontend/e2e/playwright.config.ts`
- The Angular app uses NgRx store; route mocks intercept `/api/*` paths (the Angular proxy forwards to NestJS on :3000)
- Stadium map sectors are SVG `<g>` elements with role="button" and aria-label containing section name
- Seat grid buttons have CSS classes `.kte-seat--available`, `.kte-seat--locked`, `.kte-seat--sold`, `.kte-seat--accessible`
- Lock countdown appears in `.kte-seat-detail__lock header span` — text: "Hely lefoglalva — MM:SS"
- Snackbar for 409 conflict errors is a Material `mat-snack-bar-container` at document level

## Angular-specific flakiness risks
- ChangeDetectionStrategy.OnPush: state changes only propagate on input changes or explicit markForCheck — tests must wait for stable DOM, not arbitrary timeouts
- The seat detail panel is inside a mat-sidenav (desktop) — on mobile it uses mat-bottom-sheet instead. E2E tests run at desktop viewport by default (Chromium 1280×720) to avoid bottom-sheet complexity.
- The accessibility toggle hides seats via NgRx store selector `selectSeatsForSelectedSector` which filters on `isAccessible`. This is a pure signal-based computation — changes are synchronous after the toggle action is dispatched.

## Backend integration test conventions
- Repository mocks implement `createQueryBuilder` returning a mock QBs with jest.fn().mockReturnThis() chaining
- Ticket aggregation is tested by seeding both PAID and PENDING_PAYMENT tickets and asserting the subtracted count
- CANCELLED/REFUNDED/USED tickets must NOT reduce availableSeats — verified explicitly
- Redis pipeline mock: `makeRedisMock(lockedSeatIds)` returns non-null values for locked IDs

## Existing tests NOT affected by Iteration 2
- `apps/backend/src/redis/seat-lock.service.spec.ts` — tests SeatLockService unit logic; no changes needed
- `apps/backend/src/app.module.spec.ts` — placeholder module smoke tests; unaffected
