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
* 当前下载包会默认包含 `SKILL.md`、`README.md`、`metadata.json`；用户反馈 MVP 包结构应收敛为 `SKILL.md` 必需，`references/` 和 `scripts/` 仅在用户上传或填写了对应内容时加入。
* 当前新建 Skill 表单中的「分类」是自由文本输入；用户要求系统内置可选分类，并保留后续扩展能力。
* 当前 Markdown 编辑区只覆盖 Skill 主内容；后续需要区分 `SKILL.md`、`references/` 引用文件和 `scripts/` 脚本文件的填写方式。

## Research References

* [`research/market-install-patterns.md`](research/market-install-patterns.md) - 外部 Skill / plugin / MCP marketplace 安装模式摘要，以及映射到 Skills Repo 的 MVP 结论。

## Assumptions

* MVP 面向员工用户和管理员都可见，但首要体验以员工用户为准。
* MVP 只对状态为 `published` 且存在 `currentVersionId` 的 Skill 开放真实安装动作。
* `deprecated`、`archived`、`draft`、`pending_review` 的 Skill 不允许下载或复制安装命令；详情页应给出清楚的不可安装原因。
* 下载包默认导出当前发布版本，不支持选择历史版本。
* 下载包采用 `.zip` 格式，必须包含且至少包含 `SKILL.md`。其中 `SKILL.md` 由编辑器中的 Skill 主内容和必要元数据生成。
* `references/` 和 `scripts/` 是可选包结构；只有当用户在 Skill 信息中填写或上传了对应文件时才加入下载包。
* MVP 不再默认生成或打包 `README.md`、`metadata.json`；如后续需要包级说明或元数据，应另行确认产品范围。
* 分类值由系统内置分类目录提供，底层仍可保存为字符串，以便后续扩展分类时不强依赖数据库枚举迁移。
* 复制安装命令先支持 Codex 和 Claude Code 风格的本地 Skill 目录；其他工具先展示通用下载/手动安装说明。
* 服务器不会直接写入员工本机目录，也不会代员工执行命令。

## User Stories

* 作为员工用户，我在详情页看到一个已发布 Skill 后，可以直接下载当前版本的 Skill 包。
* 作为员工用户，我可以复制一条适合目标工具的安装命令，并粘贴到本机终端执行。
* 作为员工用户，我可以打开安装说明，知道这个 Skill 适合哪些工具、有哪些依赖、如何手动安装，以及不可安装时为什么不可安装。
* 作为管理员或维护人，我希望安装动作基于已发布版本，避免员工安装草稿、待审核或已下架内容。
* 作为平台负责人，我希望「追踪当前版本」不再被误解成安装动作。
* 作为 Skill 创建者，我希望在新建或编辑 Skill 时从系统内置分类中选择分类，避免自由输入导致分类混乱。
* 作为 Skill 创建者，我希望能明确填写 `SKILL.md` 主体内容，并在需要时补充 `references/` 引用文件和 `scripts/` 脚本文件，让员工下载到的包结构符合本地工具预期。

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
* 包可选包含：
  * `references/`：引用包，用于放置被 `SKILL.md` 引用的说明、模板或资料文件。
  * `scripts/`：脚本包，用于放置 Skill 执行或辅助流程需要的脚本文件。
* `references/` 和 `scripts/` 的目录只有在至少存在一个有效文件时才出现在 `.zip` 中；没有对应内容时不创建空目录。
* `README.md`、`metadata.json` 不属于本轮 MVP 的默认打包内容，避免员工下载后误以为这些文件是 Skill 安装所需文件。
* 每个包内文件路径必须是安全相对路径，不能包含绝对路径、`..` 路径穿越、空文件名或重复路径。
* 当 Skill 不存在、用户无权限、没有当前发布版本或状态不可安装时，API 返回现有风格的安全错误响应。

### 3. Category taxonomy

* 新建 Skill 和编辑 Skill 表单中的「分类」必须从系统内置分类中选择，而不是自由文本输入。
* 首批系统分类为：
  * `Tools`
  * `Research`
  * `DevOps`
  * `Development`
  * `Testing&Security`
  * `Content&Media`
  * `Documentation`
  * `Databases`
  * `Data&AI`
* 分类目录应封装为应用层可复用配置或常量，供新建/编辑表单、筛选器、批量分类更新和后续导入逻辑共用。
* 分类值保存时仍使用字符串，避免后续新增分类必须修改数据库枚举；但所有由 UI 创建或编辑的分类值必须来自当前分类目录。
* 现有历史数据或导入数据如果存在目录外分类，列表和详情页仍应可读；是否迁移到新目录分类作为实现阶段数据清理决策。

### 4. Authoring SKILL.md, references, and scripts

* 编辑器中的「Markdown 内容」应明确表达为 `SKILL.md` 内容，这是 Skill 包的必填主入口。
* `SKILL.md` 内容应继续支持编辑/预览模式，并作为下载包中的根目录 `SKILL.md` 写入。
* 编辑器应提供两个可选资源文件组：`references/` 和 `scripts/`。每个文件组都可以包含多个文件，文件组为空时不进入下载包。
* 每个资源文件条目使用统一结构设计：
  * `path`：必填，相对路径，不包含顶层目录前缀；例如 `usage-guide.md`、`templates/prompt.md`、`install.ps1`、`helpers/validate.js`。
  * `content`：必填，UTF-8 文本内容；MVP 不支持二进制文件。
  * `description`：可选，用于给维护人标注文件用途，不写入下载包，除非后续明确需要。
  * `language`：可选，由扩展名推断或手工选择，用于编辑器高亮；不影响打包。
* `references/` 文件组用于维护说明、模板、示例、提示词或其他被 `SKILL.md` 引用的文本资料：
  * 推荐扩展名包括 `.md`、`.txt`、`.json`、`.yaml`、`.yml`、`.csv`。
  * 下载包写入路径为 `references/<path>`。
  * 示例：`references/usage-guide.md`、`references/templates/prompt.md`、`references/examples/input.json`。
* `scripts/` 文件组用于维护 Skill 执行或辅助流程需要的脚本文本：
  * 推荐扩展名包括 `.sh`、`.ps1`、`.py`、`.js`、`.ts`、`.mjs`、`.bat`。
  * 下载包写入路径为 `scripts/<path>`。
  * 示例：`scripts/install.ps1`、`scripts/helpers/validate.js`、`scripts/run.sh`。
  * MVP 只保存和打包脚本，不负责执行、调试、依赖安装、权限设置或安全扫描。
* 资源文件组的 UI 建议：
  * 在 `SKILL.md` 编辑器下方增加两个折叠面板：`references/` 和 `scripts/`。
  * 每个面板顶部展示文件数量、总大小和「新增文件」按钮。
  * 面板内使用文件列表 + 当前文件编辑器的结构：左侧/顶部选择文件，右侧/下方编辑 `path`、可选说明和内容。
  * 每个文件支持新增、重命名、删除、复制路径；删除需要明确二次确认或可撤销反馈。
  * 文件路径错误、内容为空、重复路径时，在对应文件条目旁直接展示校验错误，不等到提交后才失败。
* 资源文件组的保存模型建议：
  * 将 `SKILL.md`、`references[]`、`scripts[]` 作为 Skill 当前草稿内容的一部分保存。
  * 发布版本时，把三者固化到 `SkillVersion` 快照中，下载包只读取当前发布版本快照，避免后续编辑草稿影响已发布包。
  * 不新增独立文件资产库；`references[]` 和 `scripts[]` 是随 Skill 版本保存的结构化文本文件数组。
* 资源文件路径校验规则：
  * 统一使用 `/` 作为目录分隔符；用户输入 `\` 时可以自动规范化为 `/` 或提示修正。
  * 禁止绝对路径、Windows 盘符、`..` 路径穿越、空路径段、末尾 `/`、控制字符和隐藏的 NUL 字符。
  * 同一文件组内路径大小写不敏感地去重；`references/Guide.md` 和 `references/guide.md` 视为重复。
  * `references/` 和 `scripts/` 两个文件组之间也不能产生相同最终包路径。
  * 文件名长度、单文件大小、文件数量和总包大小应使用命名常量限制；建议 MVP 初始限制为每组最多 20 个文件、单文件最多 200KB、两组总内容最多 2MB。
* 当 `references/` 或 `scripts/` 中的文件路径和内容均有效时，下载包按 `references/<path>` 或 `scripts/<path>` 写入。
* 空白文件、重复路径、不安全路径、只有文件名没有内容的条目，不能保存为可发布版本，也不能进入下载包。
* `SKILL.md` 中引用 `references/` 或 `scripts/` 的方式由 Skill 作者负责；系统不自动重写 Markdown 中的相对链接。

### 5. Copy install command

* 员工点击「复制安装命令」后，可以复制适合目标工具的安装命令。
* MVP 至少支持 Codex 和 Claude Code 两类本地目录式安装说明：
  * Codex：将下载包展开到用户 Codex skills 目录。
  * Claude Code：将下载包展开到用户 Claude Code skills 目录。
* 如果 Skill 的 `compatibleTools` 不包含上述工具，仍应提供通用手动安装命令或提示用户下载包后按工具说明导入。
* 复制成功后显示明确反馈，例如「安装命令已复制」。
* 命令中不得包含敏感信息；下载 URL 应指向当前 Skill 当前版本的受控下载接口。

### 6. View install instructions

* 员工点击「查看安装说明」后，打开详情面板内的说明区、弹窗或抽屉。
* 说明内容应包含：
  * 当前 Skill 名称、版本、适用工具。
  * 下载包安装步骤。
  * Codex / Claude Code 命令式安装步骤。
  * `installMethod` 原文。
  * `dependencies` 依赖说明。
  * 不可安装状态下的原因和建议。
* 说明内容应可复制关键命令，但不要求整篇说明导出。

### 7. Permissions and visibility

* 员工只能下载自己有权读取的公共已发布 Skill。
* 管理员可下载公共已发布 Skill；是否允许管理员下载草稿不纳入 MVP。
* 个人发布区中未发布内容不对普通仓库员工开放安装动作。
* 现有 RBAC read model 和 API 鉴权边界不能被绕过。

### 8. Audit and state

* MVP 不强制记录“员工已安装”状态。
* 下载和复制命令是否写审计记录作为实现阶段技术决策；若实现成本低，可记录 `download_package` / `copy_install_command`，否则仅保留版本追踪审计。
* 后续如果要做「我的安装」「安装版本」「升级提醒」，应另开任务。

## Acceptance Criteria

* [ ] 员工登录后，在已发布且有当前版本的 Skill 详情页能看到「下载 Skill 包」「复制安装命令」「查看安装说明」三个安装动作。
* [ ] 点击「下载 Skill 包」会下载 `.zip` 格式的当前版本包，文件名包含 Skill id 和版本号，包内必须包含 `SKILL.md`。
* [ ] 当 Skill 没有填写 `references/` 或 `scripts/` 文件时，下载包不包含空的 `references/` / `scripts/` 目录，也不默认包含 `README.md` 或 `metadata.json`。
* [ ] 当 Skill 填写了有效 `references/` 或 `scripts/` 文件时，下载包按对应相对路径包含这些文件。
* [ ] 新建和编辑 Skill 时，「分类」字段是选择控件，选项来自系统封装的分类目录，首批包含 `Tools`、`Research`、`DevOps`、`Development`、`Testing&Security`、`Content&Media`、`Documentation`、`Databases`、`Data&AI`。
* [ ] 编辑器能明确区分必填 `SKILL.md` 内容和可选 `references/` / `scripts/` 文件内容，并对空内容、重复路径和不安全路径给出校验反馈。
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
* 不做二进制引用附件上传、脚本依赖安装、脚本执行、脚本运行沙箱或脚本安全扫描。
* 不做 `references/` / `scripts/` 的独立资产库、跨 Skill 复用、文件级审批或单独版本历史；这些文件随 Skill 当前版本内容一起保存和发布。
* 不自动解析或重写 `SKILL.md` 中对 `references/` / `scripts/` 的相对链接。

## Technical Notes

* Likely frontend files:
  * `src/components/SkillsConsole.tsx` - 详情页动作区、说明弹窗/抽屉、复制命令交互。
  * `src/lib/skill-categories.ts` or equivalent - 封装系统分类目录，供表单、筛选和批量更新复用。
  * `src/lib/ui-copy.ts` - 新增中文 UI 文案。
  * `src/app/globals.css` - 安装动作组和说明区域样式。
* Frontend design workflow:
  * 所有涉及前端页面设计、布局、交互呈现或视觉样式修改的操作，都必须先使用 `ui-ux-pro-max` 技能形成设计依据，再进入代码修改。
  * 本任务的前端实现应以当前 Skills Repo 控制台风格为基础，使用 `ui-ux-pro-max` 辅助安装动作组、说明弹窗/抽屉和按钮反馈的设计判断。
* Likely backend files:
  * `src/app/api/skills/[skillId]/package/route.ts` - 下载当前版本 Skill 包。
  * `src/lib/skill-package.ts` - 生成仅包含 `SKILL.md` 和可选 `references/` / `scripts/` 文件的包描述。
  * `src/lib/skill-service.ts` or a new focused helper - 判断 Skill 是否可安装、校验分类、保存 `SKILL.md` 与可选文件内容。
  * `src/lib/read-model.ts` may need schema changes if the editor must load/save optional references/scripts content.
  * `prisma/schema.prisma` and persistence mappers may need changes if optional files are stored as structured version data instead of being derived from existing text fields.
* Current code evidence:
  * `trackCurrentVersion` posts to `/api/tracked-versions`; this is version tracking, not installation.
  * `Skill` already has `installMethod`, `dependencies`, `readme`, `versions`, `currentVersionId`, and `compatibleTools`.
  * Detail panel currently renders `installMethod` as plain text only.
  * `skill-package.ts` currently generates `SKILL.md` plus `README.md` and `metadata.json`; this behavior must be changed to match the revised package structure.
  * `SkillsConsole.tsx` currently renders the editor category field as a text input; this should become a select backed by the shared category directory.
  * `SkillsConsole.tsx` currently has one Markdown content editor; it should be clarified as `SKILL.md` and extended with optional file editors for `references/` and `scripts/`.
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

* MVP 下载包采用 `.zip`，包内必须包含 `SKILL.md`。
* MVP 不默认打包 `README.md` 或 `metadata.json`；当前截图中的三文件输出应调整为只输出必需和用户提供的文件。
* Skill 包结构按 `SKILL.md` 必需、`references/` 和 `scripts/` 可选来设计；可选目录只有在用户填写了有效文件时才打包。
* 分类首批目录确定为 `Tools`、`Research`、`DevOps`、`Development`、`Testing&Security`、`Content&Media`、`Documentation`、`Databases`、`Data&AI`，并应封装为可复用、可扩展的应用层目录。
* 编辑器应把当前 Markdown 主体明确为 `SKILL.md` 内容，并为 `references/` / `scripts/` 提供可选文件填写入口。
* 涉及前端页面设计修改时，必须使用 `ui-ux-pro-max` 技能。

## Definition Of Done

* PRD 经用户确认。
* 相关前后端实现完成。
* 测试覆盖新增安装动作、下载接口、权限边界和不可安装状态。
* 运行相关最小验证集，至少包括 `npm run test`、`npm run typecheck`，并按改动范围决定是否运行 `npm run lint` / `npm run build`。
* 如沉淀出新的安装包格式或 API 约定，更新 `.trellis/spec/` 中对应规范。
