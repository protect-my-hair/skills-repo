# Employee Skill Install Actions MVP

## Goal

员工用户在 Skills Repo 中发现 Skill 后，应能从详情页拿到真实可落地的安装交付物和安装指引，而不是只能“追踪当前版本”。本任务的 MVP 目标是在 Skill 详情页把版本追踪与实际安装动作拆开，新增三个员工可用动作：下载 Skill 包、复制安装命令、查看安装说明。

## What I Already Know

* 用户明确选择第一版 MVP：在详情页把「追踪当前版本」旁边拆出真实动作：下载 Skill 包、复制安装命令、查看安装说明。
* 当前「追踪当前版本」只会调用 `/api/tracked-versions`，保存当前用户追踪的 `skillId + versionId`，并不会下载或安装 Skill。
* 当前 Skill 数据模型已有 `installMethod`、`dependencies`、`readme`、`versions`、`currentVersionId`、`compatibleTools`、`sourceMetadata` 等可生成安装交付物和说明的字段。
* 当前详情页只展示「安装方式」文本，不提供下载、复制命令、安装说明弹窗或安装状态。
* 当前项目是 Next.js App Router + React + TypeScript；前端交互集中在 `src/components/SkillsConsole.tsx`，后端 API 在 `src/app/api/**`。
* 外部市场调研显示，常见安装模式包括：包下载/上传、复制本地安装命令、Git/source install、组织分发、在线直接使用。MVP 先选择包下载 + 命令复制 + 安装说明。
* Skill 包通常由 `SKILL.md`、引用包和脚本包组成；其中 `SKILL.md` 是必须交付物，引用包和脚本包按 Skill 内容需要提供。

## Research References

* [`research/market-install-patterns.md`](research/market-install-patterns.md) - 外部 Skill / plugin / MCP marketplace 安装模式摘要，以及映射到 Skills Repo 的 MVP 结论。

## Assumptions

* MVP 面向员工用户和管理员都可见，但首要体验以员工用户为准。
* MVP 只对状态为 `published` 且存在 `currentVersionId` 的 Skill 开放真实安装动作。
* `deprecated`、`archived`、`draft`、`pending_review` 的 Skill 不允许下载或复制安装命令；详情页应给出清楚的不可安装原因。
* 下载包默认导出当前发布版本，不支持选择历史版本。
* 下载包采用 `.zip` 格式，至少包含 `SKILL.md`。其中 `SKILL.md` 由当前版本内容和 Skill 元数据生成。
* 引用包和脚本包是 Skill 包的可选组成部分；MVP 不新增独立数据模型来管理引用文件或脚本文件，只有当现有数据能安全生成或后续内容已明确提供时才打包。
* `README.md`、`metadata.json` 是推荐附加文件；实现阶段如果成本低可以一起打包，但不作为 MVP 验收阻塞项。
* 复制安装命令先支持 Codex 和 Claude Code 风格的本地 Skill 目录；其他工具先展示通用下载/手动安装说明。
* 服务器不会直接写入员工本机目录，也不会代员工执行命令。

## User Stories

* 作为员工用户，我在详情页看到一个已发布 Skill 后，可以直接下载当前版本的 Skill 包。
* 作为员工用户，我可以复制一条适合目标工具的安装命令，并粘贴到本机终端执行。
* 作为员工用户，我可以打开安装说明，知道这个 Skill 适合哪些工具、有哪些依赖、如何手动安装，以及不可安装时为什么不可安装。
* 作为管理员或维护人，我希望安装动作基于已发布版本，避免员工安装草稿、待审核或已下架内容。
* 作为平台负责人，我希望「追踪当前版本」不再被误解成安装动作。

## Requirements

### 1. Detail panel action model

* 在 Skill 详情页中，将「版本追踪」和「安装」分成两个清晰区域或动作组。
* 保留「追踪当前版本」/「升级追踪版本」能力，但 UI 文案或布局必须降低误解：追踪是记录使用版本，不是安装。
* 在安装动作组中展示三个动作：
  * 下载 Skill 包
  * 复制安装命令
  * 查看安装说明
* 当 Skill 不可安装时，下载和复制命令应禁用，并展示原因；查看安装说明仍可打开，用于说明当前状态和下一步建议。

### 2. Download Skill package

* 员工点击「下载 Skill 包」后，浏览器下载当前发布版本的 Skill 包。
* 文件名应包含 Skill id 和当前版本号，例如 `rag-helper-1.2.0.zip`。
* 包内容必须由服务端根据当前 Skill 数据生成，不能包含密钥、cookie、账号、内部绝对路径或服务端堆栈信息。
* 包至少包含：
  * `SKILL.md`：可被本地工具识别的 Skill 入口文件。
* 包可以额外包含：
  * `references/`：引用包，用于放置被 `SKILL.md` 引用的说明、模板或资料文件。
  * `scripts/`：脚本包，用于放置 Skill 执行或辅助流程需要的脚本文件。
  * `README.md`：面向员工的使用说明。
  * `metadata.json`：Skill 元数据和版本信息。
* MVP 不要求新增引用包/脚本包上传、编辑或版本管理能力；没有引用包或脚本包时，下载包只包含 `SKILL.md` 也视为合格。
* 当 Skill 不存在、用户无权限、没有当前发布版本或状态不可安装时，API 返回现有风格的安全错误响应。

### 3. Copy install command

* 员工点击「复制安装命令」后，可以复制适合目标工具的安装命令。
* MVP 至少支持 Codex 和 Claude Code 两类本地目录式安装说明：
  * Codex：将下载包展开到用户 Codex skills 目录。
  * Claude Code：将下载包展开到用户 Claude Code skills 目录。
* 如果 Skill 的 `compatibleTools` 不包含上述工具，仍应提供通用手动安装命令或提示用户下载包后按工具说明导入。
* 复制成功后显示明确反馈，例如「安装命令已复制」。
* 命令中不得包含敏感信息；下载 URL 应指向当前 Skill 当前版本的受控下载接口。

### 4. View install instructions

* 员工点击「查看安装说明」后，打开详情面板内的说明区、弹窗或抽屉。
* 说明内容应包含：
  * 当前 Skill 名称、版本、适用工具。
  * 下载包安装步骤。
  * Codex / Claude Code 命令式安装步骤。
  * `installMethod` 原文。
  * `dependencies` 依赖说明。
  * 不可安装状态下的原因和建议。
* 说明内容应可复制关键命令，但不要求整篇说明导出。

### 5. Permissions and visibility

* 员工只能下载自己有权读取的公共已发布 Skill。
* 管理员可下载公共已发布 Skill；是否允许管理员下载草稿不纳入 MVP。
* 个人发布区中未发布内容不对普通仓库员工开放安装动作。
* 现有 RBAC read model 和 API 鉴权边界不能被绕过。

### 6. Audit and state

* MVP 不强制记录“员工已安装”状态。
* 下载和复制命令是否写审计记录作为实现阶段技术决策；若实现成本低，可记录 `download_package` / `copy_install_command`，否则仅保留版本追踪审计。
* 后续如果要做「我的安装」「安装版本」「升级提醒」，应另开任务。

## Acceptance Criteria

* [ ] 员工登录后，在已发布且有当前版本的 Skill 详情页能看到「下载 Skill 包」「复制安装命令」「查看安装说明」三个安装动作。
* [ ] 点击「下载 Skill 包」会下载 `.zip` 格式的当前版本包，文件名包含 Skill id 和版本号，包内至少包含 `SKILL.md`。
* [ ] 点击「复制安装命令」能把安装命令写入剪贴板，并显示成功反馈。
* [ ] 点击「查看安装说明」能看到工具适配、依赖、安装步骤和不可安装原因。
* [ ] 对草稿、待审核、已下架、已归档或无当前版本的 Skill，下载和复制命令不可用，并展示友好原因。
* [ ] 员工不能通过下载接口获取自己无权读取或未发布的 Skill 内容。
* [ ] 当前「追踪当前版本」仍能正常工作，但不会被当作下载或安装入口。
* [ ] 新增或更新的测试覆盖核心前端状态、下载 API 成功路径、权限失败路径和不可安装状态。

## Out Of Scope

* 不做一键写入员工本机工具目录。
* 不做浏览器插件、桌面代理或本地后台服务。
* 不做组织级批量分发、管理员推送安装或审批流。
* 不做安装状态记录、安装遥测、使用量统计或升级提醒。
* 不做多个历史版本选择下载。
* 不做 Skill 套件 / bundle 批量安装。
* 不引入真实外部 marketplace 发布。
* 不新增 Skill 引用包/脚本包的上传、编辑、版本管理或资产存储模型；MVP 只从现有元数据和当前版本内容生成安装包。

## Technical Notes

* Likely frontend files:
  * `src/components/SkillsConsole.tsx` - 详情页动作区、说明弹窗/抽屉、复制命令交互。
  * `src/lib/ui-copy.ts` - 新增中文 UI 文案。
  * `src/app/globals.css` - 安装动作组和说明区域样式。
* Frontend design workflow:
  * 所有涉及前端页面设计、布局、交互呈现或视觉样式修改的操作，都必须先使用 `ui-ux-pro-max` 技能形成设计依据，再进入代码修改。
  * 本任务的前端实现应以当前 Skills Repo 控制台风格为基础，使用 `ui-ux-pro-max` 辅助安装动作组、说明弹窗/抽屉和按钮反馈的设计判断。
* Likely backend files:
  * `src/app/api/skills/[skillId]/package/route.ts` - 下载当前版本 Skill 包。
  * `src/lib/skill-service.ts` or a new focused helper - 判断 Skill 是否可安装、生成包内容。
  * `src/lib/read-model.ts` may not need schema changes unless install metadata needs to be surfaced centrally.
* Current code evidence:
  * `trackCurrentVersion` posts to `/api/tracked-versions`; this is version tracking, not installation.
  * `Skill` already has `installMethod`, `dependencies`, `readme`, `versions`, `currentVersionId`, and `compatibleTools`.
  * Detail panel currently renders `installMethod` as plain text only.
* Relevant specs for implementation phase:
  * `.trellis/spec/frontend/index.md`
  * `.trellis/spec/frontend/component-guidelines.md`
  * `.trellis/spec/frontend/state-management.md`
  * `.trellis/spec/frontend/type-safety.md`
  * `.trellis/spec/frontend/quality-guidelines.md`
  * `.trellis/spec/backend/index.md`
  * `.trellis/spec/backend/api-contracts.md`
  * `.trellis/spec/backend/error-handling.md`
  * `.trellis/spec/backend/quality-guidelines.md`
  * `.trellis/spec/guides/cross-layer-thinking-guide.md`

## Resolved Decisions

* MVP 下载包采用 `.zip`，包内至少包含 `SKILL.md`。`README.md`、`metadata.json` 可作为推荐附加文件，但不作为 MVP 必需项。
* Skill 包结构按 `SKILL.md` 必需、引用包和脚本包可选来设计；MVP 不为了可选组成部分新增数据模型。
* 涉及前端页面设计修改时，必须使用 `ui-ux-pro-max` 技能。

## Definition Of Done

* PRD 经用户确认。
* 相关前后端实现完成。
* 测试覆盖新增安装动作、下载接口、权限边界和不可安装状态。
* 运行相关最小验证集，至少包括 `npm run test`、`npm run typecheck`，并按改动范围决定是否运行 `npm run lint` / `npm run build`。
* 如沉淀出新的安装包格式或 API 约定，更新 `.trellis/spec/` 中对应规范。
