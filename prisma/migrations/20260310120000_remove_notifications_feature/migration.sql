DROP TABLE IF EXISTS "notifications";

DO $$
BEGIN
  DROP TYPE "NotificationType";
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;