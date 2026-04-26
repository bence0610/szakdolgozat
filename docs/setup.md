# Helyi telepítés

## Előfeltételek

- Node.js 20.10+
- npm 10+
- MySQL 8 fut
- Redis 7 fut

## Lépések

```bash
# 1. Telepítés
npm run install:all

# 2. Környezeti változók
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Töltsd ki a DB jelszót, JWT secreteket, Stripe és Anthropic kulcsokat.

# 3. Adatbázis létrehozása (egyszer)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS kte_jegyportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Migrációk + seed
npm run migration:run
npm run seed
# Létrejön: 1 mérkőzés (KTE vs FTC), ~370 szék 4 szektorban,
# admin@kte.hu (Admin123!), fan@kte.hu (Fan12345!).

# 5. Indítás
npm run start:all
# Backend  : http://localhost:3000
# Swagger  : http://localhost:3000/api/docs
# Frontend : http://localhost:4200
```

## Egészségellenőrzés

```bash
curl http://localhost:3000/health
# { "status": "ok", "checks": { "database": "up", "redis": "up" }, ... }
```
