CREATE TABLE IF NOT EXISTS "user_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  "organization_id" uuid NOT NULL
    REFERENCES "organizations"("id") ON DELETE CASCADE,

  "email" text NOT NULL,

  "role" text NOT NULL
    CHECK ("role" IN ('admin', 'worker', 'viewer')),

  "invited_by_user_id" uuid NOT NULL
    REFERENCES "users"("id") ON DELETE RESTRICT,

  "status" text NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'accepted', 'expired')),

  "token" text NOT NULL UNIQUE,

  "expires_at" timestamptz NOT NULL,

  "created_at" timestamptz NOT NULL DEFAULT now(),
  "accepted_at" timestamptz,

  CONSTRAINT "uq_user_invitations_org_email_active" UNIQUE ("organization_id", "email", "status")
);

CREATE INDEX IF NOT EXISTS "idx_user_invitations_org" ON "user_invitations" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_token" ON "user_invitations" ("token");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_org_email" ON "user_invitations" ("organization_id", "email");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_status" ON "user_invitations" ("status");
CREATE INDEX IF NOT EXISTS "idx_user_invitations_expires_at" ON "user_invitations" ("expires_at");