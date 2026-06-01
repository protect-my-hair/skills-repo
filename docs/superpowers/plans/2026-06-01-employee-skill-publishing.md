# Employee Skill Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let employees create, personally publish, manage, and submit Skills for admin review before public repository visibility.

**Architecture:** Extend the existing domain/service/read-model layer first, then map the new fields through Prisma and repository persistence, then expose the new workspace panels in the existing `SkillsConsole`. Keep route handlers thin and reuse existing mutation endpoints where possible.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Prisma 7, PostgreSQL, existing JSON fallback store.

---

### Task 1: Domain, Service, And Read Model Behavior

**Files:**
- Modify: `src/lib/domain.ts`
- Modify: `src/lib/skill-service.ts`
- Modify: `src/lib/read-model.ts`
- Test: `src/lib/skill-service.test.ts`
- Test: `src/lib/read-model.test.ts`
- Test: `src/lib/domain.test.ts`

- [ ] **Step 1: Write failing service tests**

Add tests proving employees can create/import personal Skills, personally publish their own Skills, submit them for review, withdraw them, and cannot manage other employees' Skills.

Run: `npm.cmd run test -- src/lib/skill-service.test.ts`
Expected: FAIL because employee creation is still blocked by admin-only checks and personal visibility fields do not exist.

- [ ] **Step 2: Write failing read-model tests**

Add tests proving employees receive public repository Skills in `skills`, their own created Skills in `mySkills`, and admins receive a `reviewQueue`.

Run: `npm.cmd run test -- src/lib/read-model.test.ts`
Expected: FAIL because `mySkills`, `reviewQueue`, and visibility filtering do not exist.

- [ ] **Step 3: Implement minimal domain/service/read-model changes**

Add `SkillVisibility`, ownership fields, review metadata, employee mutation permissions, personal publish/submit/withdraw transitions, and read-model slices.

- [ ] **Step 4: Verify green**

Run: `npm.cmd run test -- src/lib/skill-service.test.ts src/lib/read-model.test.ts src/lib/domain.test.ts`
Expected: PASS.

### Task 2: Persistence And Mapper Support

**Files:**
- Modify: `prisma/schema.prisma`
- Add: `prisma/migrations/20260601093000_employee_skill_publishing/migration.sql`
- Modify: `src/lib/prisma-mappers.ts`
- Modify: `src/lib/skill-repository.ts`
- Modify: `src/lib/seed-data.ts`
- Test: `src/lib/prisma-mappers.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Add tests for `SkillVisibility` and new review audit actions.

Run: `npm.cmd run test -- src/lib/prisma-mappers.test.ts`
Expected: FAIL because mapper functions and enum entries do not exist.

- [ ] **Step 2: Update schema and repository mapping**

Add `SkillVisibility`, owner/review fields, audit enum values, read mapping, write mapping, and seed ownership data.

- [ ] **Step 3: Verify persistence-facing tests**

Run: `npm.cmd run test -- src/lib/prisma-mappers.test.ts src/lib/read-model.test.ts src/lib/skill-service.test.ts`
Expected: PASS.

### Task 3: Employee And Admin UI Workspaces

**Files:**
- Modify: `src/components/SkillsConsole.tsx`
- Modify: `src/lib/ui-copy.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add UI state and copy**

Add repository/my-published/review workspace state, readable labels, and action text. Use the existing dark console visual system.

- [ ] **Step 2: Wire employee actions**

Show create/import actions for employees in `我的发布`; keep public repository browsing separate; allow personal publish, submit review, edit, and withdraw actions only for owned Skills.

- [ ] **Step 3: Wire admin review actions**

Show a review queue for admins and add approve/reject controls. Require a rejection reason before rejecting.

- [ ] **Step 4: Verify UI compile**

Run: `npm.cmd run typecheck`
Expected: PASS.

### Task 4: Final Verification

**Files:**
- Modify only if verification reveals issues in files above.

- [ ] **Step 1: Run focused tests**

Run: `npm.cmd run test`
Expected: PASS.

- [ ] **Step 2: Run lint and typecheck**

Run: `npm.cmd run lint`
Run: `npm.cmd run typecheck`
Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm.cmd run build`
Expected: PASS.

