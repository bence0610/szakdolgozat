---
name: Iteration 1 - Foundation
description: KTE-001-KTE-007 monorepo + alaprendszer scaffold állapota
type: project
---

Az Iteration 1 foundation feladatok (KTE-001 - KTE-007) 2026-04-26-án kerültek
implementálásra. Létrehozott struktúra:

- npm workspaces monorepo: `apps/backend` (NestJS), `apps/frontend` (Angular 17+)
- 8 core entitás migrációval: User, Match, Seat, Ticket, SeasonPass, PassLoan,
  LoyaltyTransaction, Waitlist
- TypeORM data-source migrációkkal és seed runnerrel (admin + fan user, 1 demo
  mérkőzés KTE vs FTC, ~370 szék 4 szektorban: A/B/C/VIP)
- Redis modul ioredis-szel + `SeatLockService` 300s TTL, Lua-alapú safe release
  és extend, owner-token védelem; unit tesztek `seat-lock.service.spec.ts`-ben
- 9 NestJS modul skeleton + Health modul (DB+Redis ping)
- Globális `ValidationPipe` (whitelist, forbidNonWhitelisted, transform)
- `GlobalHttpExceptionFilter` strukturált errorral, `LoggingInterceptor`
- Swagger `/api/docs` minden tag-gel
- Angular 17 standalone, OnPush, NgRx provideStore + Effects + DevTools
- Lazy-loaded route-ok: `/`, `/stadium`, `/cart`, `/checkout`, `/profile`,
  `/admin`, `**` (NotFoundPage)
- `AppShellComponent` Material Toolbar + Sidenav + responsive nav
- HTTP interceptorok: `apiBaseUrlInterceptor`, `errorInterceptor` (snackbar)
- KTE brand SCSS palette (kék #0a3d62 + sárga #ffc905)
- GitHub Actions CI: backend + frontend párhuzamos lint + unit teszt, 5 perc timeout
- `.env.example` mindkét appban, gitignore `.env`-re

**Why:** Ez az alapréteg minden további iteráció kiindulópontja - a payment,
auth, AI chatbot, loyalty stb. mind erre épülnek.

**How to apply:** Iteration 2+ feladatoknál ezekre a meglévő struktúrákra
építkezz - ne hozz létre új modulokat ugyanarra a felelősségre, hanem bővítsd
a már létrehozottakat. A SeatLockService-t használd közvetlenül a checkout
flow-hoz, ne implementálj új zárolási logikát.
