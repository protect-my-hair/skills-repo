-- Employee-owned personal publishing and admin review workflow.
CREATE TYPE "SkillVisibility" AS ENUM ('PERSONAL', 'PUBLIC');

ALTER TYPE "AuditAction" ADD VALUE 'APPROVE_REVIEW';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT_REVIEW';

ALTER TABLE "Skill"
  ADD COLUMN "visibility" "SkillVisibility" NOT NULL DEFAULT 'PUBLIC',
  ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT 'admin-1',
  ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT 'Mira Admin',
  ADD COLUMN "reviewSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewReviewerName" TEXT,
  ADD COLUMN "reviewReviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewRejectionReason" TEXT;

CREATE INDEX "Skill_visibility_idx" ON "Skill"("visibility");
CREATE INDEX "Skill_ownerId_idx" ON "Skill"("ownerId");

