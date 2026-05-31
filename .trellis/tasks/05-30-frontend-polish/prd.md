# Skills Repo Frontend Polish

## Goal

把现有 `Skills Repo` 前端从“功能已经跑通的管理台”打磨成更成熟、更可信、更好扫读的内部 Skills 仓库界面。重点服务两个用户路径：员工快速发现、判断并跟踪 Skill；管理员高效完成导入、编辑、上架/下架、批量治理和审计查看。

## What I Already Know

- 当前项目已有可运行的 Next.js / React 前端，不是从零开始。
- 首页入口是 `src/app/page.tsx`，核心界面集中在 `src/components/SkillsConsole.tsx`。
- 当前界面已有员工/管理员角色切换、搜索筛选、分类/状态/工具/版本状态筛选、Grid/Table 视图、Skill 详情、版本历史、审计记录、管理员批量操作、新建/导入/编辑弹窗、Markdown 编辑/预览/分屏。
- 全局样式在 `src/app/globals.css`，当前基调是深色命令台风格，使用绿色、蓝色、琥珀色、红色表达状态。
- 之前已经从白色主题切换到黑色主题，但部分原生下拉框或下拉选项仍可能残留白色背景，需要作为本次美化的明确检查项。
- 项目已有 `npm run lint`、`npm run test`、`npm run typecheck`、`npm run build` 验证链。
- 根目录已有多张 `qa-*.png` 截图，说明此前已经做过一定视觉 QA。
- 之前的 skills 管理平台研究结论显示：可借鉴统一 Dashboard、筛选与统计、详情页、编辑/预览、批量操作；企业版需要突出版本、审批、审计、权限和可信来源边界。

## Assumptions

- 本 task 的主线是前端美化和体验整理，不默认改后端 API、存储模型或权限机制。
- 保留现有产品能力，不因为视觉重做造成行为回退。
- 优先使用现有 Next.js、React、CSS 和 lucide-react，不主动引入新的 UI 框架或动画库。
- PRD 完成并得到确认后，再进入实现阶段。

## Requirements

- Latest browser feedback: the hero content area must not feel empty after the
  top-page redesign. Under the product name, add a compact project-description
  treatment with oversized quote marks and a denser group of non-interactive
  tags. Tags should reuse existing scope or derived counts, such as collected
  SKILL.md files, current results, controlled Git sources, and version/audit
  history. This remains visual polish only: no new routes, filters, buttons,
  data fields, backend calls, or logout behavior.

- 本轮追加要求使用项目内 `.codex/skills/ui-ux-pro-max` 作为设计指导来源，只做页面视觉设计美化。
- 不得修改原后端代码；如果实施过程中发现必须修改后端/API/数据模型/服务逻辑，必须先停止并向用户申请权限。
- 前端页面美化不得影响原有功能，不得新增功能、按钮、流程、接口、数据字段或新的用户操作路径。
- 提升首屏信息层级，让用户一眼理解这是公司内部 Skills 仓库、当前角色、当前结果规模和主要操作。
- 优化 Skills 列表的可读性，使名称、描述、来源、分类、状态、版本和维护团队更容易扫读比较。
- 优化详情面板的信息组织，使基础信息、README、版本历史、版本差异和审计记录层次清楚。
- 保持员工视角和管理员视角的差异清晰：员工偏发现和跟踪，管理员偏治理和发布操作。
- 维护 Grid/Table 两种视图，并确保筛选区域在桌面和移动端都不拥挤、不遮挡。
- 统一所有下拉框的暗黑主题表现，包括角色切换、分类、状态、团队/来源、工具、版本状态等所有 `select` 控件；默认态、hover、focus、disabled 和展开选项应尽量与暗色界面一致。
- 编辑器弹窗需要继续支持新建、导入、编辑，以及 Markdown 编辑/预览/分屏模式。
- 所有关键 UI 在桌面和移动端都应避免文字溢出、按钮挤压、内容重叠和横向破版。
- 视觉风格应符合内部企业工具：专业、可信、信息密度高，但不能显得模板化或杂乱。
- 根据浏览器标注反馈，首屏 Header 需要比当前版本更有视觉冲击力：可参考用户上传的终端风格图，把 hero 区域纵向适当拉高，强化大标题、终端代码块、网格/扫描线/光效等视觉层级，但不新增功能模块或营销式说明文案。
- 根据最新浏览器标注反馈，删除 Header 中的“刷新”模块。
- 将 Header 的角色选择放到右上角，并按可扩展的水平按钮组设计；本轮先在同一行放置一个“登出”前端占位按钮，参考用户提供的按钮视觉。登出后端能力暂不实现，不接 API，不新增真实退出流程。
- 根据最新浏览器标注反馈，顶部页面参考用户上传的 Skills Marketplace 图片重新设计为模块化结构：顶部细导航条承载品牌与右上角操作；中间居中 hero 展示产品名、内部仓库标识和现有统计；底部保留代码统计卡。借鉴参考图的模块划分、暗色终端质感、巨大背景字和胶囊信息，但不照搬其 Search / Creators / Occupations / Docs 等外部站点功能。
- 页面中所有下拉框需要进一步统一重设计：闭合态、hover、focus、disabled、箭头、边框、背景、阴影要与 OLED 暗色控制台一致；展开选项在浏览器允许范围内保持暗色。

## Candidate Design Directions

### Option A: Enterprise Operations Console (Recommended)

以“内部治理工作台”为核心，保留深色专业基调，但减少装饰噪声，强化层级、状态、表格/卡片可读性、管理员操作效率和审计可信感。

### Option B: Internal Marketplace

以“员工发现 Skills”为核心，视觉更像精品应用市场，卡片更有吸引力，详情页更偏介绍和安装引导，管理员操作收敛到次级区域。

### Option C: Executive Demo Showcase

以“给领导或评审展示平台能力”为核心，首屏更有冲击力，统计和关键能力更醒目，适合演示，但日常高频管理效率可能弱一些。

## Decisions

- 视觉基调确认采用暗黑系风格，不回退到白色主题。
- 原生下拉框白底残留属于本次前端美化范围，实施时必须逐一检查和修复。
- 二次美化采用 `ui-ux-pro-max` 的 Enterprise Gateway / Dark Mode (OLED) 方向，但只转译为工作台视觉语言；不改信息架构、不增加营销式落地页模块。
- 本任务的代码范围限定为前端展示层。禁止修改 `src/app/api/**`、后端服务/存储逻辑、数据模型和 seed 数据，除非用户另行批准。
- 针对浏览器反馈继续沿用 `ui-ux-pro-max` 的 Dark Mode (OLED) + terminal/code visual hierarchy 方向：使用现有内容做更强的 hero 表达和控件质感，不新增业务数据、文案段落或用户流程。
- “登出”只作为用户明确要求的前端占位按钮存在，不实现后端登出、会话清理、路由跳转或权限状态变化。
- 顶部重设计允许调整 `SkillsConsole` 的 header DOM 结构和全局 CSS，但业务状态、筛选、列表、详情、编辑器、API 调用和后端代码保持不变。

## Open Questions

- 当前 PRD 已对齐；本轮继续按 A 企业治理工作台方向执行，只做视觉美化。

## Acceptance Criteria

- [ ] Header hero includes a designed project-description element below the
  product name and a denser tag group, so the central area no longer feels
  empty while preserving the dark terminal marketplace style.
- [ ] New hero tags are non-interactive visual labels only and do not introduce
  new product functionality, navigation, filtering, backend calls, or fake
  external marketplace claims.

- [ ] 桌面端主要界面清晰呈现首屏、筛选区、列表区和详情区。
- [ ] Header 首屏比上一版更有视觉重心，具备 terminal/code 风格的暗黑视觉冲击，同时仍保持内部工作台属性。
- [ ] Header 中不再展示“刷新”模块。
- [ ] Header 右上角展示角色选择和“登出”占位按钮，二者水平对齐，并为后续扩展同排按钮留下清晰样式。
- [ ] Header 按参考图形成清晰的顶部导航条、居中 hero、信息胶囊/代码统计模块，视觉上比之前的左右分栏控制面板更聚焦。
- [ ] 移动端无明显文字溢出、按钮遮挡、内容重叠或不可操作区域。
- [ ] 员工视角可以完成搜索、筛选、查看详情、跟踪/升级版本。
- [ ] 管理员视角可以完成新建、导入、编辑、批量上架/下架/归档和分类变更。
- [ ] 所有下拉框在暗黑主题下无白底残留，包含角色、分类、状态、团队/来源、工具、版本状态等筛选控件。
- [ ] 下拉框的默认态、hover、focus、disabled、展开选项在主流浏览器中尽量保持暗色一致；若原生控件存在平台限制，需要在实现说明中记录。
- [ ] 搜索/筛选区域的下拉框视觉统一，箭头、边框、焦点和背景层级与 header 角色选择一致。
- [ ] Grid 和 Table 视图都保持可读、可点击、状态明确。
- [ ] 编辑弹窗在常见桌面和移动视口下可用，Markdown 预览不破版。
- [ ] 本轮改动不触碰后端/API/数据模型/服务逻辑文件。
- [ ] 页面功能、交互入口和用户流程保持不变，没有新增功能。
- [ ] 视觉 QA 至少覆盖桌面和移动端截图。
- [ ] `npm run lint`、`npm run test`、`npm run typecheck`、`npm run build` 完成或明确说明阻塞原因。

## Definition Of Done

- PRD 已得到用户确认。
- 实现前读取相关 Trellis frontend spec。
- 前端改动保持现有业务行为不回退。
- 相关测试或验证命令已运行。
- 视觉 QA 截图已生成或复核。
- 若实现中沉淀了新的前端约定，更新 `.trellis/spec/frontend/`。

## Out Of Scope

- 不实现真实登录、企业 SSO、细粒度 RBAC 或审批流后端。
- 不改真实数据库设计、版本表、审计表或发布状态机。
- 不接入真实 Git 仓库扫描、供应链校验或安装执行链路。
- 不新增独立设计系统包或第三方 UI 组件库，除非后续 PRD 明确改口。
- 不做部署、域名、内网访问配置。
- 不新增前端功能、业务操作、筛选条件、统计指标或导航页面。
- 不实现登出后端、会话失效、跳转登录页或真实认证状态变化；“登出”按钮仅作前端占位。
- 不修改 `src/app/api/**`、服务层、存储层、domain 合约或 seed 数据；如确需修改，先向用户申请权限。

## Technical Notes

- Context notes: `research/local-context-and-prior-art.md`。
- Main UI file: `src/components/SkillsConsole.tsx`。
- Main style file: `src/app/globals.css`。
- Copy/constants: `src/lib/ui-copy.ts`。
- Frontend spec index: `.trellis/spec/frontend/index.md`。
- Dropdown audit targets currently visible in UI: role switch `select`, category `select`, status `select`, team/source `select`, tool `select`, version state `select`。
- `ui-ux-pro-max` design-system query: `enterprise SaaS dashboard internal skills registry dark professional governance`。
- Adopted visual guidance: OLED dark background, slate surfaces, green positive/action indicators, high contrast, visible focus states, hover feedback, no horizontal scroll on mobile.
- Current frontend spec appears older than the app source, so implementation结束后要判断是否需要刷新 spec。
