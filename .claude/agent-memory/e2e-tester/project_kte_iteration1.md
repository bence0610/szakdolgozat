---
name: KTE Jegyportál – Iteration 1 Test Strategy
description: Risk analysis, edge cases, and test strategy for KTE-001 through KTE-007 (Foundation iteration)
type: project
---

Iteration 1 covers E1 (Foundation & Infrastructure): monorepo scaffolding, TypeORM entities/migrations, Redis SeatLockService, NestJS module skeleton, Angular routing shell, environment config validation, and GitHub Actions CI.

**Why:** This is a thesis project (szakdolgozat) with a full-stack monorepo (Angular 17+ / NestJS / MySQL 8 / Redis). No UI yet — all E2E tests for this iteration are API-level or infrastructure-level.

**How to apply:** Prioritize backend contract tests and infrastructure reliability tests over UI-layer tests. The foundation must be solid before later iterations build on it.

## Key risk areas identified
- KTE-002: Migration ordering and FK constraint violations are the highest-risk point in this iteration.
- KTE-003: Redis connection failure handling and TTL boundary behavior are the primary flakiness sources.
- KTE-006: Missing env var validation at startup is a silent runtime risk — must be caught by config schema tests.
- KTE-007: CI pipeline under 5-minute budget with parallel jobs is a pipeline design constraint.

## Test framework recommendation
- Backend unit/integration: Jest (NestJS default)
- API-level E2E: Supertest + NestJS testing module (in-process, no real HTTP server needed for unit-level)
- For true API E2E: Supertest against a running app with test database
- Frontend unit: Jest + Angular TestBed (ng test)
- No Playwright/Cypress in Iteration 1 — no UI to test yet
