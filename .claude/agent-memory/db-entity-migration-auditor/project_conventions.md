---
name: Project Conventions
description: Naming conventions, base entity pattern, and DB defaults for KTE Jegyportál backend
type: project
---

## Migration file naming
Timestamp prefix (13-digit Unix ms) + PascalCase description.
Examples: `1714050000000-InitialSchema.ts`, `1714400000000-Iteration4Schema.ts`
Class name mirrors file: `InitialSchema1714050000000`, `Iteration4Schema1714400000000`.
`name` property = class name string.

## Base entity (abstract class, not a table)
File: `apps/backend/src/database/entities/base.entity.ts`
Columns contributed to every entity:
- `id` varchar(36) PK (UUID, PrimaryGeneratedColumn)
- `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- `version` int NOT NULL DEFAULT 1

## DB defaults
- Engine: InnoDB
- Charset: utf8mb4 / utf8mb4_unicode_ci
- MySQL 8+, timezone UTC ('Z')
- synchronize: false — all schema via explicit migrations

## Entity files location
`apps/backend/src/database/entities/*.entity.ts`

## Migration files location
`apps/backend/src/database/migrations/*.ts`

## Seed files location
`apps/backend/src/database/seeds/`

## Boolean mapping
TypeORM boolean => MySQL tinyint (0/1). All migrations correctly use tinyint.

## UUID FK columns
All FK columns use varchar(36) in both entities and migrations.
