# KTE Jegyportál

Hivatalos jegyértékesítési és bérletkezelő platform a Kecskeméti TE számára.

## Monorepo struktúra

```
.
├── apps
│   ├── backend     # NestJS API (TypeScript, TypeORM, MySQL, Redis, Stripe)
│   └── frontend    # Angular 17+ standalone components
├── docs            # Architektúra és tervezési dokumentumok
├── .github         # CI / GitHub Actions
└── package.json    # Root npm workspaces
```

## Tech stack

| Réteg          | Technológia                                         |
| -------------- | --------------------------------------------------- |
| Frontend       | Angular 17+ standalone, Angular Material, NgRx      |
| Backend        | NestJS 10+, TypeORM, class-validator                |
| Adatbázis      | MySQL 8+                                            |
| Cache / Lock   | Redis (ioredis)                                     |
| Fizetés        | Stripe (server-side)                                |
| AI             | Anthropic Claude (claude-sonnet-4-20250514)         |
| Email          | Nodemailer + SMTP                                   |
| Auth           | JWT (access + refresh) + opcionális TOTP 2FA        |

## Előfeltételek

- Node.js >= 20.10
- npm >= 10
- MySQL 8+ futó instance
- Redis 7+ futó instance

## Indítás

```bash
# Telepítés
npm run install:all

# Környezeti változók
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Adatbázis migráció és seed
npm run migration:run
npm run seed

# Indítás (backend + frontend párhuzamosan)
npm run start:all
```

- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Frontend: http://localhost:4200

## Szkriptek

| Parancs                  | Leírás                                       |
| ------------------------ | -------------------------------------------- |
| `npm run start:all`      | Backend + frontend egyszerre                 |
| `npm run build:all`      | Mindkét app build                            |
| `npm run lint:all`       | ESLint mindkét appra                         |
| `npm run test:all`       | Unit tesztek mindkét appra                   |
| `npm run migration:run`  | TypeORM migrációk futtatása                  |
| `npm run seed`           | Seed adat betöltése (1 mérkőzés + székek)    |

## CI

A GitHub Actions pipeline (`.github/workflows/ci.yml`) lefuttatja a lint és unit teszt fázisokat mindkét appon, push és pull request eseményekre.
