# Skills Repo

Skills Repo 是一个内部 Skill 管理台，用来集中管理团队可复用的 AI/Agent 技能：发现、维护、评审、发布、版本跟踪、受控 Git 导入和审计记录。

这个仓库面向开发协作者。README 重点说明如何理解项目结构、启动本地环境、配置数据存储，以及运行质量检查。

## 当前能力

- Skill 列表、筛选、详情查看和版本状态展示
- 管理员创建草稿、编辑内容、发布、下架、归档
- 从受控 Git 来源导入 Skill 元数据
- 用户跟踪当前使用的 Skill 版本，并识别可升级版本
- 批量发布、下架、归档和分类调整
- 审计记录、导入来源和导入任务记录
- 内置开发账号登录，便于本地演示和验证
- PostgreSQL/Prisma 持久化；未配置数据库时可使用本地 JSON fallback

## 技术栈

- Next.js App Router
- React
- TypeScript
- Auth.js / NextAuth
- Prisma + PostgreSQL
- Vitest
- ESLint
- lucide-react

## 目录结构

```text
src/app/                  Next.js 页面、布局和 API routes
src/components/           前端交互组件
src/lib/                  领域逻辑、服务、仓储、认证和读模型
src/types/                类型补充
prisma/schema.prisma      Prisma 数据模型
prisma/migrations/        数据库迁移
prisma/seed.ts            PostgreSQL 演示数据写入脚本
prisma/smoke.ts           数据库 smoke 验证脚本
data/                     本地 JSON fallback 数据目录
.trellis/                 Trellis 任务、规范和协作上下文
AGENTS.md                 AI/Agent 协作约定
```

## 本地启动

安装依赖：

```bash
npm install
```

创建本地环境变量文件：

```bash
cp .env.example .env.local
```

至少设置：

```env
AUTH_SECRET=replace-with-a-local-secret
SKILLS_REPO_ENABLE_INTERNAL_AUTH=true
```

如果只是本地体验，可以先不设置 `DATABASE_URL`。应用会使用 `data/skills-store.json` 作为本地 JSON fallback；该文件是运行时数据，不提交到 Git。

启动开发服务器：

```bash
npm run dev
```

然后访问本地 Next.js 地址，默认通常是 `http://localhost:3000`。

## 本地登录账号

启用 `SKILLS_REPO_ENABLE_INTERNAL_AUTH=true` 后，可以使用内置开发账号登录：

| 角色 | 邮箱 |
| --- | --- |
| 管理员 | `admin@skills.local` |
| 员工 | `employee@skills.local` |

当前 credentials provider 只校验邮箱，不需要密码。

## 数据库与 Prisma

### JSON fallback

未设置 `DATABASE_URL` 时，应用使用本地 JSON store：

```text
data/skills-store.json
```

首次读取时会根据 `src/lib/seed-data.ts` 自动生成种子数据。这个模式适合快速本地开发和 UI/业务流程验证。

### PostgreSQL

如果要验证生产形态的数据链路，需要提供 PostgreSQL 连接串：

```env
DATABASE_URL=postgresql://user:password@localhost:5432/skills_repo?schema=public
```

常用命令：

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed-demo
npm run prisma:smoke
```

注意：直接执行 `tsx prisma/seed.ts` / `tsx prisma/smoke.ts` 时，需要确保当前 shell 能读到 `DATABASE_URL`，并且 smoke 验证还需要 `AUTH_SECRET`。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 构建生产包 |
| `npm run start` | 启动生产构建后的服务 |
| `npm run lint` | 运行 ESLint，禁止 warning |
| `npm run test` | 运行 Vitest 测试 |
| `npm run typecheck` | 生成 Prisma Client 后运行 TypeScript 类型检查 |
| `npm run prisma:generate` | 生成 Prisma Client 到 `src/generated/prisma` |
| `npm run prisma:migrate` | 本地开发迁移 |
| `npm run prisma:deploy` | 应用已存在迁移，适合部署流程 |
| `npm run prisma:seed-demo` | 向 PostgreSQL 写入演示数据 |
| `npm run prisma:smoke` | 验证数据库约束和核心工作流 |

## 质量检查

提交前至少运行与改动相关的最小检查。常规组合：

```bash
npm run lint
npm run test
npm run typecheck
```

如果改动涉及 Prisma schema、迁移或数据库仓储逻辑，再补充：

```bash
npm run prisma:generate
npm run prisma:smoke
```

## 协作约定

这个项目由 Trellis 管理任务和项目规范：

- 开发前先查看 `.trellis/tasks/` 中的当前任务和 PRD。
- 写代码前参考 `.trellis/spec/` 中对应前端、后端或共享指南。
- AI/Agent 协作约定见 `AGENTS.md`。
- 不要把本地运行数据、密钥、生成产物或个人工作区元数据提交到 Git。

提交信息使用英文，格式为：

```text
type(scope): description
```

例如：

```text
docs(readme): add developer onboarding guide
```
