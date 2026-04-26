# Architektúra áttekintés - Iteration 1

## Monorepo

```
apps/
  backend/   NestJS 10 + TypeORM + ioredis + Stripe + Anthropic
  frontend/  Angular 17 standalone + Material + NgRx
.github/workflows/  CI pipeline
docs/      Tervezési és architektúra dokumentumok
```

## Backend modulok (NestJS)

| Modul       | Felelősség                                           | Iter. 1 állapot     |
| ----------- | ---------------------------------------------------- | ------------------- |
| `Health`    | Liveness, DB és Redis ping                            | Implementálva       |
| `Auth`      | JWT, register/login, 2FA                             | Skeleton            |
| `Users`     | Felhasználói profil, beállítások                      | Skeleton + count    |
| `Matches`   | Mérkőzések CRUD, listázás                            | Skeleton + read     |
| `Seats`     | Lelátó, székmaster                                    | Skeleton + read     |
| `Tickets`   | Egyedi jegy, QR, Apple Wallet                         | Skeleton            |
| `Loyalty`   | Pontok, szintek, jutalmak                            | Skeleton            |
| `Waitlist`  | Várólista értesítéssel                                | Skeleton            |
| `Admin`     | Admin panel végpontok                                 | Skeleton            |
| `Chatbot`   | Claude (claude-sonnet-4-20250514) integráció         | Skeleton            |

## Adatbázis entitások

| Entitás               | Kulcs kapcsolatok                              |
| --------------------- | ---------------------------------------------- |
| `User`                | hasMany Ticket, SeasonPass, LoyaltyTransaction |
| `Match`               | hasMany Ticket, Waitlist                       |
| `Seat`                | hasMany Ticket                                 |
| `Ticket`              | belongsTo Match, Seat, User, SeasonPass        |
| `SeasonPass`          | belongsTo User, Seat; hasMany PassLoan, Ticket |
| `PassLoan`            | belongsTo SeasonPass, Match, User (lender + borrower) |
| `LoyaltyTransaction`  | belongsTo User                                 |
| `Waitlist`            | belongsTo User, Match                          |

## Redis kulcsok

| Kulcs minta                          | TTL    | Cél                                            |
| ------------------------------------ | ------ | ---------------------------------------------- |
| `seat-lock:{matchId}:{seatId}`       | 300 s  | Atomikus székzárolás checkout idejére          |
| `refresh:{userId}:{jti}`             | 7 d    | Refresh token metaadatok (Iter. 2)             |
| `rate:{scope}:{identifier}`          | változó | Rate limiter sliding window (Iter. 2)         |

A kulcs prefix `kte:` (env-ből konfigurálható), tehát a teljes kulcs pl.
`kte:seat-lock:m1:s1`.

## Frontend útvonalak

| Útvonal       | Komponens         | Megjegyzés         |
| ------------- | ----------------- | ------------------ |
| `/`           | `HomePage`        | Lazy, eager UI     |
| `/stadium`    | `StadiumPage`     | Lazy               |
| `/cart`       | `CartPage`        | Lazy               |
| `/checkout`   | `CheckoutPage`    | Lazy               |
| `/profile`    | `ProfilePage`     | Lazy               |
| `/admin`      | `AdminPage`       | Lazy, később guard |
| `**`          | `NotFoundPage`    | 404                |

Minden komponens **standalone**, **OnPush** changeDetection, NgRx Store
globálisan provide-olva (üres reducer map jelenleg).
