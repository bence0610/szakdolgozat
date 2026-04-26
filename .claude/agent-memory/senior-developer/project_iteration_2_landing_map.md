---
name: Iteration 2 — Public Landing & Map
description: Public landing page (E2) and stadium seat-map (E3) tasks for KTE Jegyportál
type: project
---

Iteration 2 implements the public-facing entry to KTE Jegyportál.

**Scope (delivered):**
- Backend: `GET /matches`, `GET /matches/upcoming`, `GET /matches/:id` enriched with availableSeats + isHome (HOME_TEAM_NAME=Kecskeméti TE).
- Backend: `MatchSeatsController` at `/matches/:matchId/seats` with pipeline-based Redis seat-lock status merge, plus POST/DELETE lock endpoints wrapping SeatLockService.
- Frontend shared layer: `shared/models/{match,seat}.model.ts`, `shared/services/{matches,seats}.api.service.ts`, `shared/pipes/{time-until,huf-currency}.pipe.ts`.
- NgRx feature stores in `state/matches/` and `state/seats/` registered via `provideMatchesFeature()` / `provideSeatsFeature()` in `app.config.ts`.
- E2 Landing: `HeroSectionComponent`, `MatchCountdownComponent`, `MatchListComponent` + `MatchListItemComponent`, orchestrated by `HomePage`.
- E3 Stadium: `MatchSelectorComponent`, `StadiumMapComponent` (4 sector SVG: A=Észak, B=Dél, C=Kelet, VIP=Nyugat), `SeatGridComponent`, `SeatDetailPanelComponent`, `SectorSummaryComponent`, `AccessibilityToggleComponent`, `ColorLegendComponent`, mobile `SeatDetailBottomSheetComponent`.
- Lock flow: `SeatsActions.lockSeat` → effect → POST lock → success stores ownerToken + 300s countdown in panel; 409 conflict surfaces "Ez a szék már foglalt" snackbar.

**Why:** Iteration 2 is the user-visible foundation — without these screens, the rest of the funnel (cart, checkout, season-pass) cannot start. Hungarian copy and KTE brand (#0a3d62 / #ffc905, Barlow Condensed display font) are required for the public face of the project.

**How to apply:** When extending these flows, reuse the shared services / state slices rather than re-fetching directly. New seat-status flows must respect the SeatAvailability discriminated union: available / locked / sold / disabled.
