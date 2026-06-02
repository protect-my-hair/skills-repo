ALTER TABLE "Skill"
  ADD COLUMN "referenceFiles" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "scriptFiles" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "SkillVersion"
  ADD COLUMN "referenceFiles" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "scriptFiles" JSONB NOT NULL DEFAULT '[]';
