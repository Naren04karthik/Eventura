ALTER TABLE "users"
  DROP COLUMN IF EXISTS "emailVerified",
  DROP COLUMN IF EXISTS "isActive",
  DROP COLUMN IF EXISTS "lastLoginAt";

ALTER TABLE "events"
  DROP COLUMN IF EXISTS "publishedAt";