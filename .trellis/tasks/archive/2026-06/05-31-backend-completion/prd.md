# Complete skills-repo production backend foundation

## Goal

在已经完成 MVP 和前端美化的基础上，把 `skills-repo` 从 demo 后端推进到生产化后端基础：真实认证/会话、生产数据库与 schema/migration、细粒度权限、后端读写边界、真实受控 Git ingestion、审计与版本治理、接口契约和测试覆盖。

本阶段仍处于 Trellis PRD 对齐，不直接进入实现。

## User Decision

用户已选择 **Option B: Production backend foundation**。

这意味着此前 PRD 中“继续使用本地 JSON store、demo role header、不实现真实登录/登出、不引入数据库”的 MVP 限制不再成立。当前任务需要围绕生产化后端能力重新定义 scope，并重新检查前端与后端接口对齐。

用户已进一步选择 **Direction 1: Self-contained production foundation**。生产化后端能力应优先落在当前 Next.js 应用内完成，不为本任务新增独立后端服务。

用户已进一步选择 **Auth option 2: internal credential/dev provider first**。本任务先用内部 credential/dev provider 打通 Auth.js、session、logout、RBAC、Prisma schema 与 API 权限边界；企业 OAuth/OIDC/SSO provider 暂不在本任务内接入，但必须保留后续替换边界。

## Current Repo Evidence

* 当前应用是 Next.js / React 项目，根页面使用 `src/components/SkillsConsole.tsx`。
* 后端入口集中在 `src/app/api/**`：
  * `GET /api/skills`
  * `POST /api/skills`
  * `POST /api/skills/import`
  * `PATCH /api/skills/[skillId]`
  * `POST /api/skills/[skillId]/transition`
  * `POST /api/skills/bulk`
  * `POST /api/tracked-versions`
* 当前领域逻辑集中在：
  * `src/lib/domain.ts`
  * `src/lib/skill-service.ts`
  * `src/lib/store.ts`
  * `src/lib/http.ts`
* 当前持久化是 `data/skills-store.json` 本地 JSON store，由 `src/lib/store.ts` 初始化和读写。
* 当前权限由 `x-demo-role` header 模拟，`src/lib/http.ts` 将 `x-demo-role: admin` 映射为管理员，否则为员工。
* 当前测试主要覆盖 domain/service 纯逻辑，未发现 API route、HTTP error、真实认证、数据库或 persistence integration tests。
* `.trellis/spec/backend/api-contracts.md` 已记录 demo API contract；`.trellis/spec/backend/database-guidelines.md` 明确本地 JSON 不是生产数据库决策。
* 部分 backend spec 仍有早期“没有 backend runtime / API error model”的描述，需要随本任务更新。

## Frontend-Backend Interface Audit

### Frontend state and auth assumptions

* `SkillsConsole` 本地维护 `role`，默认 `employee`。
* 初始 `GET /api/skills` 不携带任何认证/角色 header。
* mutation 请求通过 `requestSnapshot()` 自动携带 `x-demo-role: role`。
* 右上角有“角色”下拉框，用户可直接在员工和管理员之间切换。
* 右上角有“登出”按钮，但当前没有 `onClick`，只是前端占位。
* 前端用 `userId = role === "admin" ? "admin-1" : "employee-1"` 本地推导用户身份。

### Frontend read behavior

* 前端拿到完整 snapshot 后，本地把员工可见列表过滤为 `published` 和 `deprecated`。
* summary、category、team/source、tools、audit log 等派生数据仍基于完整 `skills` / `auditLogs` 计算。
* `selectedSkill` 会先从完整 `skills` 中按 `selectedSkillId` 查找，再回退到过滤列表；这意味着员工模式可能继续持有管理员模式下选中的不可见 Skill。
* 最近审计记录直接使用 `snapshot.auditLogs.slice(0, 5)`，没有按当前用户/权限/目标 Skill 做后端过滤。

### Frontend mutation payloads

* `POST /api/skills` 提交 `SkillDraftInput`：name、description、category、tags、compatibleTools、maintainingTeam、maintainers、installMethod、dependencies、readme、version、changelog。
* `POST /api/skills/import` 提交 `GitImportInput`：repositoryUrl、repositoryName、name、description、category、compatibleTools、maintainingTeam、readme、version、changelog。
* `PATCH /api/skills/[skillId]` 提交 `UpdateSkillInput`，前端会把 metadata 与新 readme/version/changelog 一起提交。
* `POST /api/skills/[skillId]/transition` 提交 `{ status, versionId }`，其中 `versionId` 当前固定取 `skill.versions.at(-1)?.id`。
* `POST /api/skills/bulk` 提交 `{ type, skillIds }` 或 `{ type: "change_category", skillIds, category }`。
* `POST /api/tracked-versions` 提交 `{ skillId, versionId }`，versionId 当前取 `getCurrentVersion(skill)?.id`。

### Current backend alignment gaps

* 当前 API 返回完整 `SkillStoreSnapshot`，没有 server-side read model / permission-aware response。
* 生产化后端不能继续依赖前端本地角色下拉或 `x-demo-role` header。
* 生产化后端需要重新定义 GET response：员工、管理员、审计视图、详情视图是否共用同一 snapshot。
* 前端的 role switch 应改为真实 session/user context，或在生产模式下隐藏，仅保留测试/dev fixture。
* 前端 logout button 需要真实 logout endpoint 或由 auth provider session API 驱动。
* 前端 summary/filter/detail/audit 目前假定一次拉全量数据；生产数据库后应明确分页、筛选、排序、详情读取和权限过滤由后端承担到什么程度。
* 前端 version diff 当前本地比较最新两个版本内容；生产后端要决定是否继续下发完整 historical content，还是提供专用 diff/detail endpoint。
* 前端 import 入口当前只提交用户手填元数据；生产化 Git ingestion 需要后端拉取/解析仓库、校验 manifest/Skill.md、记录导入任务状态和错误。

## Production Backend Backlog

### 1. Authentication, session, and logout

* 引入 Auth.js credential/dev provider，替换 `x-demo-role` 与本地 role switch。
* 使用 seeded internal users 验证 admin / employee session 与 RBAC 行为。
* 提供当前用户/session 获取方式，让前端知道当前用户、角色、权限和可用操作。
* 实现真实 logout 行为，接上前端现有登出按钮。
* 明确未登录、会话过期、无权限时的 API status 与前端展示行为。
* 不在日志、错误或测试快照中泄露 token、cookie、session secret。
* 不把 credential/dev provider 视为长期企业 SSO 方案；后续 OAuth/OIDC/SSO provider 应能替换该 provider 边界。

### 2. Authorization and RBAC

* 定义角色与权限模型，至少覆盖 employee、admin，以及可扩展的 maintainer/owner/reviewer。
* 所有读写 API 都必须在服务端执行权限判断。
* 员工只能读取可见 Skills、可见版本、自己的 tracked version 状态和允许公开的审计摘要。
* 管理员可读取完整治理数据并执行 create/import/edit/transition/bulk。
* 后续维护者权限可以按 maintaining team / maintainers 扩展，但本 PRD 需要先定义边界。

### 3. Production persistence

* 引入生产数据库，替换本地 JSON store。
* 定义 schema 和 migration 管理方式。
* 至少建模：
  * users / roles / memberships
  * skills
  * skill versions
  * tracked versions
  * audit logs
  * git import sources / import jobs
* 明确唯一约束：Skill id/slug、version per skill、tracked version per user+skill、repository source identity。
* 明确 seed/dev data 与 production data 的分离。

### 4. API contract redesign

* 从“返回完整 store snapshot”改为 production-friendly API contract。
* 定义列表接口的分页、搜索、筛选、排序和权限过滤。
* 定义详情接口，避免前端为了详情拉全量历史和审计。
* 定义 mutation response：返回更新后的资源、局部 read model，还是重新 fetch。
* 定义统一错误响应 envelope，区分 validation、unauthorized、forbidden、not found、conflict、internal error。
* 对现有前端调用做兼容计划，避免一次性大爆炸式改动。

### 5. Input validation and domain invariants

* 所有 API body、params、query 都需要运行时校验。
* Create/import/edit 防止重复 slug/id 和非法版本号。
* Transition 需要明确允许状态流转、eligible version、currentVersionId、publishedAt/publisher 一致性。
* Bulk 操作需要定义空选择、未知 id、部分失败、事务性和审计行为。
* Tracking API 必须验证 skill/version 存在、目标 Skill 对当前用户可见、版本属于目标 Skill。

### 6. Controlled Git ingestion

* 从“用户手填 metadata/content”升级为真实受控 Git ingestion。
* 只允许受信任 Git host / namespace。
* 后端负责读取仓库中的 Skill manifest / `SKILL.md` / README 内容，并做输入校验。
* 记录 import job 状态、错误、操作者、来源 commit/ref。
* 明确不执行不可信代码，不打印或存储仓库凭据。
* 前端 import form 需要与真实 ingestion contract 对齐：可能从同步 create draft 改为 async job。

### 7. Versioning and release governance

* 版本内容应持久化为不可变快照。
* 发布时把具体 version 标记为 current release，并记录 publisher/time。
* 编辑已发布 Skill 应创建新 draft/pending-review version，不直接改历史 release。
* 版本 diff 需要决定由前端本地计算还是由后端提供。
* pending_review 是否需要 reviewer/approval 表，需要在生产化范围里明确。

### 8. Audit and observability

* 所有高风险 mutation 需要审计：actor、action、target、before/after 摘要、timestamp、request context。
* 审计读取需要权限过滤，避免员工看到不该看到的治理动作。
* 错误日志应包含排查上下文，但不能暴露 secret、cookie、token、内部堆栈给用户。
* 需要基础 health/check 或 diagnostics 策略，便于部署后验证后端可用。

### 9. Frontend integration changes

* 移除或 dev-only 化 role switch，改用当前 session 返回的 user/role。
* 登出按钮接真实 session/logout。
* 初始加载改为携带凭据并处理 401/403。
* 列表、详情、审计、版本历史按新 API contract 分层读取。
* 管理按钮的可见性由服务端返回的 permissions/capabilities 或当前角色判断。
* 前端不再假定自己拥有完整 store，也不再自己承担权限过滤。

### 10. Tests and verification

* 补齐 backend unit tests：domain rules、validation、RBAC decisions。
* 补齐 API integration tests：auth、403、404、409、validation、list/detail permissions、tracking、bulk、Git import。
* 补齐 persistence tests：schema constraints、migration smoke、transaction behavior。
* 补齐 frontend integration tests 或 component tests，验证新 contract 下员工/管理员关键流程。
* 完成后运行 lint、test、typecheck、build。

### 11. Spec and documentation alignment

* 更新 `.trellis/spec/backend/`：
  * directory structure
  * database guidelines
  * API contracts
  * error handling
  * logging/security boundaries
  * quality/testing guidance
* 如果前端 contract 或 auth integration 变化，也要更新 `.trellis/spec/frontend/` 中相关约定。

## Requirements

* 生产化后端保持在当前 Next.js 应用内实现，不新增独立后端服务。
* 采用 Auth.js credential/dev provider 先打通认证、session 和 logout。
* 保留后续接入企业 OAuth/OIDC/SSO provider 的清晰边界。
* 采用 Prisma + PostgreSQL 接入生产数据库与 migration 方案。
* 设计并实现权限模型，替代 demo role header。
* 重新设计 API contract，使前端不依赖完整 store snapshot。
* 将现有 create/import/edit/publish/unpublish/archive/bulk/track 工作流迁移到真实后端。
* 实现真实受控 Git ingestion 的后端边界，至少完成安全的 metadata/content 导入闭环。
* 保持当前前端已有产品能力不回退，但允许为生产化后端调整接口和状态管理。
* 为高风险路径补齐测试与错误处理。
* 更新 Trellis spec，确保后续任务不会读取过期的 demo 后端约定。

## Acceptance Criteria

* [ ] 用户登录态来自真实 session/auth provider，不再依赖 `x-demo-role` 判断权限。
* [ ] 系统存在 seeded admin / employee 用户，可验证登录、session、logout 和 RBAC。
* [ ] 登出按钮触发真实 logout/session clear 流程。
* [ ] Credential/dev provider 不存储明文密码，不向用户暴露 credential 校验细节。
* [ ] Employee API 响应不包含不可见 Skills、治理字段或受限 audit logs。
* [ ] Admin API 响应支持完整治理视图。
* [ ] List/detail/version/audit/tracking 接口契约明确，并与前端调用对齐。
* [ ] 数据持久化迁移到生产数据库，schema/migration 可重复执行。
* [ ] Create/import/edit/publish/unpublish/archive/bulk/track 均使用数据库事务或等价一致性保护。
* [ ] Git import 只允许受控来源，不执行不可信代码，并记录 import job/audit。
* [ ] API 对 validation / unauthorized / forbidden / not found / conflict 返回稳定错误。
* [ ] 后端权限、输入校验、状态流转、数据库约束、Git import、审计路径有测试覆盖。
* [ ] 前端员工/管理员关键流程在新 API contract 下可用。
* [ ] `.trellis/spec/backend/` 和必要的 frontend spec 已同步。
* [ ] `npm run lint`、`npm run test`、`npm run typecheck`、`npm run build` 通过，或阻塞原因被记录。

## Technical Research Needed

实现前必须先按 AGENTS.md 使用 Context7 获取当前文档，至少覆盖：

* Next.js App Router route handlers、cookies/session、server actions 或 API route 约定。
* 认证/会话方案候选的当前文档。
* 数据库/ORM/migration 方案候选的当前文档。
* 如接入 Git provider API，也需要查当前官方 API/SDK 文档。

## Research References

* [`research/self-contained-production-stack.md`](research/self-contained-production-stack.md) 记录 Direction 1 下 Next.js App Router、Auth.js、Prisma 的当前文档调研结论。

## Research Notes

### Recommended stack direction

* Next.js App Router route handlers 继续作为 API 层。
* Auth.js 作为认证、session、logout 和 provider 集成层；本任务先使用 credential/dev provider。
* Prisma + PostgreSQL 作为生产数据库、schema、migration 和 Auth.js adapter 基础。
* Route handlers 通过共享 RBAC helper 执行服务端权限判断。
* 前端从完整 `SkillStoreSnapshot` 改为消费权限感知 read models。

## Candidate Architecture Directions

### Direction 1: Self-contained production foundation (Selected)

在当前 Next.js 应用内加入认证、数据库、migration、route-level RBAC 和 Git ingestion。优点是改动集中、交付快；缺点是生产边界仍与 Next.js 应用强绑定。

### Direction 2: Next.js frontend + separate backend service

保留 Next.js 作为前端/BFF，新增独立后端服务负责认证回调、数据库、Git ingestion、审计和 RBAC。优点是后端边界清晰；缺点是任务更大，需要多服务开发、配置和测试。

### Direction 3: Adapter-first migration

先定义 auth/db/git/audit adapter 接口，把现有 JSON/demo 实现替换为 production-ready contracts，再逐步接真实实现。优点是风险可控；缺点是用户选择的 Option B 需要确保不要停留在空 adapter。

## Open Questions

* PRD 是否确认无误，可以进入实现阶段？

## Decision (ADR-lite)

**Context**: 当前 MVP 使用本地 JSON store、`x-demo-role` header 和前端本地角色切换，已经能展示产品流程，但无法作为生产化后端边界。

**Decision**: 在当前 Next.js 应用内实现生产化后端基础。采用 Auth.js credential/dev provider 打通认证、session、logout 和 RBAC；采用 Prisma + PostgreSQL 建立生产数据库、schema、migration、审计与 Git ingestion 持久化基础；前端改为消费权限感知 API/read models。

**Consequences**: 本任务会比 MVP hardening 更大，但能形成真实后端架构。Credential/dev provider 降低外部 SSO 配置阻塞，同时必须保留后续接入企业 OAuth/OIDC/SSO 的 provider 边界，不能把内部 credential auth 设计成长期身份战略。

## Implementation Plan

* PR1: Auth.js + Prisma/PostgreSQL scaffolding, seeded users, session/logout, env validation.
* PR2: Database schema/migrations for skills, versions, tracked versions, audit logs, import jobs, and RBAC memberships.
* PR3: API contract migration from full store snapshot to permission-aware list/detail/mutation read models.
* PR4: Controlled Git ingestion backend boundary and audit logging.
* PR5: Frontend integration updates for real session, permissions, logout, and new API contracts.
* PR6: Tests, spec updates, and final verification.

## Definition of Done

* PRD 经用户确认。
* 实现前完成必要技术文档调研，并把结论写入任务 `research/`。
* 实现前读取相关 Trellis backend/frontend specs。
* 后端行为、前端调用和 API contract 保持一致。
* 相关测试覆盖新增规则。
* lint / test / typecheck / build 通过。
* 必要的 backend/frontend spec 更新完成。
