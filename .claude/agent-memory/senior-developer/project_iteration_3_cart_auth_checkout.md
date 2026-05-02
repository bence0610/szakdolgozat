---
name: Iteration 3 — Cart, Auth, Checkout
description: KTE-020..037 — auth, cart, Stripe checkout, weather, profile
type: project
---

Iteration 3 (2026-04-26) delivers the full purchase funnel for KTE Jegyportál.

**Backend additions:**
- `AuthModule` — `POST /api/auth/{register,login,refresh,logout}`. JWT access (15m) + refresh (7d) with rotation, refresh JTI persisted in Redis (`refresh:{userId}:{jti}`). HttpOnly cookie `kte_refresh_token` on path `/api/auth`, body fallback for tooling. Registration awards 100 loyalty points (LoyaltyTransaction PROMOTION). Bcrypt 12 rounds. JwtStrategy ('jwt') + JwtAuthGuard + OptionalJwtAuthGuard + `@CurrentUser()` decorator.
- `UsersModule` — `GET /api/users/me`, `PATCH /api/users/me`, `GET /api/users/me/tickets?limit&offset`. JwtAuthGuard protected. ProfileDto + ProfileTicketDto + UpdateProfileDto.
- `MatchSeatsController` — `POST /matches/:matchId/seats/:seatId/lock` now uses `OptionalJwtAuthGuard` + stores `userId` in `seat-lock-owner:{matchId}:{userId}` Redis hash when authenticated. New `POST :seatId/lock/extend?ownerToken=&ttlSeconds=` for KTE-037 retry flow.
- `PaymentsModule` — `POST /api/payments/create-intent` (auth-required) verifies each seat's ownerToken against Redis lock, server-authoritative pricing. Idempotency key derived from userId + matchId + sorted seatIds. `POST /api/payments/webhook` raw-body verification via `stripe.webhooks.constructEvent`. `payment_intent.succeeded` → TypeORM transaction creates `Ticket` rows + releases locks. `payment_intent.payment_failed` → extends locks 120s.
- `WeatherModule` — `GET /api/weather/match/:matchId`. OpenWeatherMap 5-day/3-hour forecast, finds entry closest to kickoffAt, computes mm/h from 3h accumulation, sets `rainWarning` when > 0.5 mm/h. Cached at `weather:match:{matchId}` for 1h. Graceful fallback when API key missing.
- `main.ts` — registered `cookie-parser`, raw body parser scoped to `/api/payments/webhook`, `rawBody: true` on Nest factory.

**Frontend additions:**
- `core/auth/AuthService` — access token + user signal in memory, refresh token in HttpOnly cookie + sessionStorage fallback, silent-refresh timer 60s before expiry, `restoreSession()` invoked from `provideAuthInitializer()` (APP_INITIALIZER) so reload preserves login.
- `core/interceptors/auth.interceptor.ts` — attaches Bearer token + `withCredentials`, single-flight 401 retry through `auth.refresh()`.
- `core/auth/auth.guard.ts` — `authGuard` + `guestGuard` functional CanActivateFn. Applied to `/checkout`, `/checkout/confirmation`, `/profile`, `/admin`, `/login`, `/register`.
- `state/cart` NgRx slice + `core/cart/CartFacade` — sessionStorage persistence (`kte_cart_v1`), max 6 items, 1-Hz `tick$` effect drives countdown + auto-expiry. `add(seat, match)` POSTs lock + writes item; `remove(seatId)` DELETEs lock; `applyLockExtension` for KTE-037.
- `core/stripe/StripeService` — lazy `loadStripe()`, KTE-themed Elements appearance (#0a3d62 / #ffc905, Inter, 8px radius, locale `hu`).
- `features/auth/{login,register}.page.ts` — Material Reactive Forms, password strength regex, `returnUrl` query param plumbed into both directions.
- `features/profile/profile.page.ts` — fetches `/users/me` + `/users/me/tickets`, splits Active vs History tabs, loyalty tier chip with KTE colors.
- `features/cart/cart.page.ts` — per-row mm:ss via `CountdownPipe`, expiry snackbar via `effect()`, `proceedToCheckout()` redirects guests to `/login?returnUrl=/checkout`.
- `features/checkout/checkout.page.ts` — calls `payments/create-intent`, mounts Stripe `payment` Element with `confirmPayment({ redirect: 'if_required' })`, on success `router.navigate('/checkout/confirmation', { state })` + clears cart locally. On failure increments `failureCount`; after 3 attempts shows support contact (jegy@kte.hu); per-attempt extends lock 120s via `seatsApi.extendLock`.
- `features/checkout/components/weather-banner.component.ts` — only renders when `forecast.rainWarning && !fallback && uncovered sectors in cart`. Covered sectors = `{VIP}` per current stadium model.
- `features/checkout/confirmation.page.ts` — reads `paymentIntentId/seats/totalPaid` from `router.getCurrentNavigation().extras.state` (or `window.history.state` after reload guard); shows summary + Profile/Home CTAs.
- `app-shell` — toolbar Cart icon with `MatBadge` count, Logout in user dropdown, Login button when anonymous.

**Why:** Iteration 3 closes the funnel from "browsing the seat map" (Iteration 2) to "owning a paid ticket". Every later iteration (e-ticket QR delivery E7, season passes E8, loyalty E11, admin E13) consumes Tickets created in this flow.

**How to apply:**
- New protected routes go through `authGuard`; `current user` exposed as a signal via `AuthService.user()`.
- New seat-lock owners should call `seatLockService.acquire({ matchId, seatId, userId })` so the user-scoped Redis hash is populated.
- Stripe webhook raw-body bypass is registered for `/api/payments/webhook` ONLY — any new webhook route must be added explicitly to `main.ts`.
- Cart additions must go through `CartFacade.add` (never direct `CartActions.addItem`) so the Redis lock is created and the ownerToken stored on the row.
- Don't read tokens from localStorage — access token lives only in `AuthService` memory; sessionStorage fallback is for refresh token only.
- Webhook idempotency: `payment_intent.succeeded` checks for existing tickets by `stripePaymentIntentId` before creating — required because Stripe retries failed deliveries.
