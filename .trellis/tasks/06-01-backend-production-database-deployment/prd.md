# Deploy backend production database environment

## Goal

为 `skills-repo` 后端补齐生产数据库环境，使当前已完成的 Auth.js、RBAC、Git import、审计和 Skill 工作流不再只在本地 JSON fallback 模式下验收，而是在配置 `DATABASE_URL` 后通过 PostgreSQL 路径完成迁移、读写、约束和关键业务流补验。

## What I Already Know

* 本任务是 `.trellis/tasks/05-31-backend-completion` 的子任务，目标来自其 `acceptance-checklist.md` 中所有数据库相关 `pending` 项。
* 父任务已完成本地无数据库 fallback 模式验收；待补的是 PostgreSQL 环境准备、migration 现场执行、数据库读写链路和一致性验收。
* 当前仓库已包含 Prisma v7 + PostgreSQL schema：`prisma/schema.prisma`、`prisma/migrations/20260601011500_init/migration.sql`。
* 当前持久化边界在 `src/lib/skill-repository.ts`：没有 `DATABASE_URL` 时使用本地 JSON store；有 `DATABASE_URL` 时走 Prisma/PostgreSQL。
* 当前 `src/lib/prisma.ts` 在缺少 `DATABASE_URL` 时会抛错，数据库路径不会静默降级。
* `.env.example` 已声明 `AUTH_SECRET`、`DATABASE_URL`、`SKILLS_REPO_ENABLE_INTERNAL_AUTH`。
* `package.json` 现有脚本中 `prisma:migrate` 是 `prisma migrate dev`，适合开发迁移生成；生产部署应使用 Prisma 当前文档推荐的 `prisma migrate deploy`。
* 已有模型覆盖 `User / Account / Session / VerificationToken / Skill / SkillVersion / TrackedVersion / AuditLog / GitImportSource / GitImportJob`，并包含关键唯一约束。

## Assumptions (Temporary)

* 本任务不重新设计业务 schema，优先验证现有 migration 能在目标 PostgreSQL 环境中可重复部署。
* 不把真实数据库连接串、密码、token、cookie 或 Auth secret 写入仓库、日志、测试快照或 PRD。
* 数据库目标使用用户已有的生产/准生产 PostgreSQL 实例。
* 本机执行所需 `DATABASE_URL` / `AUTH_SECRET` 通过交互式终端输入，避免写入聊天、PRD 或 `.env.local`。
* 数据初始化采用当前 demo/seed 技能数据 + bootstrap 用户，以便复用父任务已通过的业务验收链路。

## Requirements

* 准备一个可用 PostgreSQL 环境，并通过交互式终端输入临时环境变量向 Codex 本机命令注入 `DATABASE_URL`。
* 配置生产运行必需的 `AUTH_SECRET`，并明确 `SKILLS_REPO_ENABLE_INTERNAL_AUTH` 在该环境中的取值。
* 使用非交互式生产迁移流程应用已提交的 Prisma migrations；不能在生产数据库上使用 `prisma migrate dev` 或 `db push`。
* 生成 Prisma client，并保证 Next.js build/typecheck 使用的 generated client 与当前 schema 匹配。
* 初始数据策略为导入当前 demo/seed 技能数据，并创建必要 admin/employee/bootstrap 用户。
* 在 `DATABASE_URL` 存在时验证读写链路确实走 PostgreSQL，而不是本地 JSON fallback。
* 验证 `users / skills / skill versions / tracked versions / audit logs / git import sources / jobs` 均能正确落库和读回。
* 验证关键唯一约束有效，至少覆盖 `TrackedVersion(userId, skillId)`、`SkillVersion(skillId, version)`、`GitImportSource(repositoryUrl)`。
* 在数据库路径下重新跑通 create / import / edit / transition / bulk / track 关键业务流。
* 补验错误处理中的 `conflict` 和可控 `internal` 错误结构，不泄露内部路径、堆栈、secret、cookie 或 token。
* 更新父任务验收清单，把通过数据库环境补验的 `pending` 项改为明确结果。

## Acceptance Criteria

* [x] 目标环境存在可访问的 PostgreSQL 实例，连接信息只通过交互式终端输入注入 Codex 本机命令。
* [x] 部署和验收命令由 Codex 在本机执行，`DATABASE_URL` / `AUTH_SECRET` 不写入仓库或任务文档。
* [x] `DATABASE_URL` 配置后，应用启动、Auth.js provider、API 读写均走 PostgreSQL 路径。
* [x] Prisma migration 使用生产部署流程成功执行，重复执行不会破坏已有数据。
* [x] Prisma client 生成成功，`npm run typecheck` 能验证 generated types 与代码一致。
* [x] 当前 demo/seed 技能数据和必要 bootstrap 用户成功写入数据库。
* [x] `User / Skill / SkillVersion / TrackedVersion / AuditLog / GitImportSource / GitImportJob` 数据能在关键业务流后正确落库。
* [x] 数据库唯一约束能产生稳定 `conflict` 行为或被服务层转成稳定错误响应。
* [x] create / import / edit / transition / bulk / track 在数据库路径下与本地验收结果一致。
* [x] 构造一个可控 internal failure，验证用户响应不暴露敏感细节。
* [x] 父任务 `acceptance-checklist.md` 中数据库相关 pending 项被更新为 `pass` 或记录明确阻塞原因。
* [x] 完成后运行最小验证集：`npm run prisma:generate`、生产迁移命令、数据库 smoke 验证、`npm run lint`、`npm run test`、`npm run typecheck`、`npm run build`，或记录无法运行的原因。

## Definition of Done

* PRD 经用户确认。
* 部署目标、Codex 本机执行边界、demo/seed 数据初始化策略和验收环境边界已明确。
* 数据库连接和认证 secret 均不落盘、不提交、不在输出中泄露。
* Prisma 生产迁移、生成、数据库 smoke 验证完成并有命令记录。
* 父任务验收清单已同步更新。
* 如实现中发现新的部署约定或坑位，更新 `.trellis/spec/backend/database-guidelines.md` 或相关 spec。

## Candidate Approaches

### Approach A: Existing PostgreSQL instance (Selected)

使用公司或部署平台已提供的 PostgreSQL 实例，只在本任务内完成 `DATABASE_URL`/secret 配置、migration deploy、seed/bootstrap 和数据库路径验收。

Pros: 最贴近真实生产环境，PRD 范围清晰，不引入云服务选择问题。

Cons: 需要用户提供实例、权限和网络访问方式；如果环境尚未准备好，任务会被外部依赖阻塞。

### Approach B: Managed PostgreSQL staging first

先用托管 PostgreSQL 或生产等价 staging 数据库跑完整部署链路，再把生产实例切换列为后续上线动作。

Pros: 可快速完成可重复部署和验收，避免等待正式生产资源。

Cons: 不能完全代表最终生产网络、权限、备份和容量策略。

### Approach C: Local Docker PostgreSQL as deployment rehearsal

用本机 Docker PostgreSQL 只验证 migration、schema、约束和业务流，把真正生产环境部署留到下一任务。

Pros: 最快解除代码层不确定性。

Cons: 不满足“后端生产环境”部署目标，只适合作为预演，不应作为本任务最终验收。

## Open Questions

* None. User confirmed the PRD can enter implementation.

## Research References

* [`research/prisma-production-migrations.md`](research/prisma-production-migrations.md) - Prisma 当前生产迁移与部署命令要点。
* 父任务研究：`.trellis/tasks/05-31-backend-completion/research/self-contained-production-stack.md` - 生产化后端栈选择背景。

## Technical Notes

* 父任务验收清单中数据库相关 pending 集中在前置环境、数据库一致性、错误处理和数据库路径质量补验。
* Prisma 当前文档建议生产环境使用已提交 migrations + `prisma migrate deploy`，并在 CI/CD 中通过 secret 注入 `DATABASE_URL`。
* Next.js 部署前需要确保 Prisma client 已生成；当前仓库已有 `pretypecheck` 运行 `prisma generate`，但生产 build 流程是否需要显式前置 generate 需要在实现阶段检查。
* 当前 repository 写入 PostgreSQL 的方式是把 snapshot 读出、经 domain/service 更新后整体写回，数据库 smoke 验证应覆盖事务写入和约束失败路径。

## Decision (ADR-lite)

**Context**: 父任务已经在本地 JSON fallback 模式完成后端验收，但所有依赖 `DATABASE_URL` 的数据库项仍是 pending。

**Decision**: 采用 Approach A，直接对接用户已有的生产/准生产 PostgreSQL 实例。部署和验收命令由 Codex 在本机执行，所需 `DATABASE_URL` / `AUTH_SECRET` 通过交互式终端输入并仅作为临时环境变量注入。

**Consequences**: 本任务更贴近真实上线条件，但会依赖目标数据库的网络、权限和 secret 注入方式。真实连接串不得写入仓库或对话输出。

## Data Initialization Decision

**Decision**: 采用“导入当前 demo/seed 技能数据 + bootstrap 用户”的初始化策略。

**Reasoning**: 本任务目标是补验父任务中数据库路径的 pending 项，导入现有 seed 数据可以直接复用已通过的 create / import / edit / transition / bulk / track 验收链路，并覆盖 Skill、版本、追踪、审计和 Git import jobs 等核心表。

## Out of Scope

* 本任务不选择或采购长期数据库供应商，除非用户明确要求。
* 本任务不接入企业 OAuth/OIDC/SSO。
* 本任务不做 schema 大改或新业务能力扩展，除非数据库部署暴露出必须修复的 schema 问题。
* 本任务不提交真实生产密钥、连接串或账号凭证。
