-- NOTE:
-- Schema objects (tables/indexes/constraints/seed data) are managed by Prisma migrations.
-- This init script is intentionally limited to PostgreSQL extensions required by migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
