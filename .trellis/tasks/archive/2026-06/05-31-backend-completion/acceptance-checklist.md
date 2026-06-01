# backend-completion 验收清单

最后更新时间：2026-06-01

状态说明：

- `pass`：已现场验收通过
- `pending`：当前环境未具备，后续补验
- `todo`：尚未开始验收
- `fail`：已验收但未通过

## 1. 前置环境

- `pass` `npm run prisma:generate` 可成功执行
- `pass` 本地 dev server 可启动并监听 `http://localhost:3000`
- `pass` `/api/auth/providers` 可返回 `200`
- `pass` 本地验收可通过临时 `AUTH_SECRET` 跑通 Auth.js
- `pass` 已通过交互式临时环境变量配置可用 `DATABASE_URL`，未写入仓库或任务文档
- `pass` PostgreSQL migration 链路已现场执行并通过：`npm run prisma:deploy` 返回 no pending migrations

## 2. 认证与会话

- `pass` 未登录访问 `/api/skills` 返回 `401`，且错误结构稳定
- `pass` seeded admin 用户可登录
- `pass` seeded employee 用户可登录
- `pass` 登录态来自真实 session，而不是本地 role switch
- `pass` 登出可清空 session
- `pass` credential provider 不暴露敏感校验细节

## 3. RBAC 与前端行为

- `pass` admin 能看到完整 `skills`、`trackedVersions`、`auditLogs`
- `pass` employee 只能看到 `published` / `deprecated` Skills
- `pass` employee 看不到受限 `auditLogs`
- `pass` employee 只能看到自己的 `trackedVersions`
- `pass` employee 看不到 admin 操作入口

## 4. 核心业务流程

- `pass` create draft 正常
- `pass` edit 已发布 Skill 时生成新版本，不破坏历史版本
- `pass` publish 正常
- `pass` unpublish / deprecate 正常
- `pass` archive 正常
- `pass` bulk 操作正常
- `pass` track 当前版本正常
- `pass` detail / version / audit 展示与新 API contract 对齐

## 5. Git import 与安全边界

- `pass` 仅允许 `https://git.company.local/` 受控来源
- `pass` 非受控来源返回稳定 `400`
- `pass` 成功导入时记录 import source / import job / audit
- `pass` 导入过程中不暴露凭证或执行不可信代码

## 6. 数据库与一致性

- `pass` 配置 `DATABASE_URL` 后读写链路走 PostgreSQL，`prisma/smoke.ts` 已现场验证
- `pass` Prisma schema 与 migration 可重复执行，`prisma migrate deploy` 返回 no pending migrations
- `pass` `users / skills / skill versions / tracked versions / audit logs / git import sources / jobs` 均正确落库；smoke 临时写入后计数为 users=6、skills=7、skillVersions=9、trackedVersions=2、auditLogs=8、gitImportSources=1、gitImportJobs=1
- `pass` 唯一约束有效，已覆盖 tracked version、skill version、git import source repository URL，并映射为稳定 `409 conflict`
- `pass` create / import / edit / transition / bulk / track 在数据库路径下保持一致性，smoke 结束后恢复 seed 基线

## 7. 错误处理

- `pass` `validation / unauthorized / forbidden / not_found` 错误结构稳定
- `pass` `conflict` 数据库路径现场注入通过：PostgreSQL 唯一约束错误映射为 `409 {"code":"conflict","error":"Resource already exists"}`
- `pass` `internal` 现场注入通过：未知异常返回 `500 {"code":"internal","error":"Request failed"}`，未泄露内部细节
- `pass` 越权读取受限 Skill 返回安全 `404`
- `pass` 已验用户响应未泄露路径、堆栈、secret、cookie、token

## 8. 质量门禁

- `pass` `npm run lint` 通过
- `pass` `npm run test` 通过
- `pass` `npm run typecheck` 通过
- `pass` `npm run build` 通过
- `pass` backend / frontend Trellis spec 已同步更新

## 当前说明

- 当前验收已完成两轮：先跑通本地无数据库 fallback 模式，再通过 `06-01-backend-production-database-deployment` 子任务补验 PostgreSQL 数据库路径。
- 数据库补验使用交互式临时 `DATABASE_URL` / `AUTH_SECRET`，真实连接串和 secret 未写入仓库、任务文档或日志。
- 本轮已现场跑通 RBAC、CRUD/transition/bulk、track、Git import，并在 PostgreSQL 路径下通过 smoke 复验 create / import / edit / transition / bulk / track。
- `detail / version / audit` 以当前 API contract 与前端绑定逻辑验收通过，未单独做浏览器可视化截图点验。
