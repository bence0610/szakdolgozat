---
name: KTE Iteration 3 Test Strategy
description: E2E test coverage plan and file map for Iteration 3 (Cart, Auth, Checkout, Profile)
type: project
---

Iteration 3 introduced EPIC E4 (Cart & Seat Reservation), EPIC E5 (Authentication), and EPIC E6 (Checkout & Stripe). All new and modified pages now have full E2E coverage.

**New spec files created:**
- `apps/frontend/e2e/auth.spec.ts` — Login, Registration, route guard tests
- `apps/frontend/e2e/cart.spec.ts` — Cart page, badge, countdown, remove, checkout redirect
- `apps/frontend/e2e/checkout.spec.ts` — Checkout page, weather banner, Stripe loader, Confirmation page
- `apps/frontend/e2e/profile.spec.ts` — Profile page, ticket tabs, logout
- `apps/frontend/e2e/app-shell.spec.ts` — Toolbar cart badge, user menu, sidenav, auth state

**New Page Objects created:**
- `apps/frontend/e2e/pages/app-shell.page.ts`
- `apps/frontend/e2e/pages/auth.page.ts`
- `apps/frontend/e2e/pages/cart.page.ts` — includes `CartPage.seedSessionCart()` static helper
- `apps/frontend/e2e/pages/checkout.page.ts`
- `apps/frontend/e2e/pages/profile.page.ts`

**New setup file:**
- `apps/frontend/e2e/auth.setup.ts` — saves `.auth/user.json` storage state via `auth-setup` project

**Updated files:**
- `apps/frontend/e2e/fixtures/api-mocks.ts` — added auth, cart, payment, weather fixtures
- `apps/frontend/e2e/playwright.config.ts` — added `auth-setup` project, other projects depend on it
- `apps/frontend/e2e/stadium-page.spec.ts` — added test 11: cart badge increments after seat lock

**Why:** Iteration 3 connected CartFacade to StadiumPage (seat locks add to NgRx cart), added JWT auth with route guards, and introduced the Cart/Checkout/Confirmation/Profile pages.

**How to apply:** When adding Iteration 4+ tests, import from the existing fixtures and extend the Page Objects rather than writing inline locators. The `auth.setup.ts` / storageState pattern handles authenticated E2E flows without network round-trips.

**Key patterns used:**
- Cart state seeded via `CartPage.seedSessionCart()` writing to `kte_cart_v1` in sessionStorage before `page.goto()`
- Auth state: `mockRefreshSuccess/Fail` helpers stub `/auth/refresh` (called by APP_INITIALIZER)
- Stripe: `injectStripeMock()` via `page.addInitScript()` replaces `window.Stripe` with a no-op object
- Confirmation page state: `page.evaluate(() => window.history.replaceState(...))` + `page.reload()` replicates router navigation state
