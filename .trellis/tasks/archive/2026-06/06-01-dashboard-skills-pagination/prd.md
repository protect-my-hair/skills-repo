# Dashboard Skills 分页

## 目标

在 Skills dashboard 的列表区域底部加入分页能力，让员工和管理员在结果数量变多时仍然能高效浏览、扫读和批量治理 Skills。分页需要同时覆盖 Grid 视图和 Table 视图，并在员工界面和管理员界面都可用。

本任务只补齐 dashboard 列表分页体验，不改变现有搜索、筛选、详情、角色权限、管理员批量操作和后端数据语义。

## 当前已知

- 当前应用是一个 Next.js / React 的内部 Skills 管理控制台。
- 根页面通过 `src/components/SkillsConsole.tsx` 渲染真实 dashboard。
- dashboard 已支持员工/管理员角色、搜索、筛选、Grid/Table 视图切换、Skill 详情、版本状态和管理员批量操作。
- 当前列表区域在筛选后直接渲染完整 `filteredSkills`：
  - Grid 视图直接遍历 `filteredSkills`；
  - Table 视图接收同一份 `filteredSkills`。
- 员工/管理员的数据可见性已经在 UI 列表渲染前处理，本任务不重新定义权限边界。
- 本任务默认是前端范围；不修改后端 API、持久化、权限、seed 数据或领域规则，除非实现阶段发现不改无法完成，并先向用户确认。

## 前端设计技能要求

- 凡涉及前端页面设计的判断，都必须使用 `ui-ux-pro-max` 技能作为设计指导来源，包括但不限于：
  - 分页控件的布局、层级和状态；
  - Grid/Table 底部区域的视觉衔接；
  - 桌面端和移动端响应式表现；
  - hover、focus、disabled、active 等交互状态；
  - 暗黑控制台风格、可读性和可访问性细节。
- 实施前需要优先读取项目 frontend spec，尤其是 `.trellis/spec/frontend/index.md` 和 `.trellis/spec/frontend/component-guidelines.md`。
- 如果实施时当前环境找不到可加载的 `ui-ux-pro-max` 技能文件，必须暂停并向用户说明，不得静默改用其他设计技能或凭空替代。
- `ui-ux-pro-max` 只用于页面设计和视觉体验判断，不得借此扩大功能范围、增加新业务流程或引入新的 UI 框架。

## 已确认决策

- Grid 和 Table 使用不同分页大小。
- Grid 视图每页展示 12 条 Skill。
- Table 视图每页展示 20 条 Skill。
- 切换 Grid/Table 视图后，当前页重置为第 1 页。
- 修改搜索、筛选条件或员工/管理员角色后，当前页重置为第 1 页。
- 管理员翻页时保留已选 Skill。
- 管理员修改搜索、筛选条件或角色时清空已选 Skill。
- 分页控件采用完整形态：
  - 当前展示范围 / 总数；
  - 首页；
  - 上一页；
  - 页码；
  - 下一页；
  - 末页。

## 需求

### 功能需求

- 在 Skills dashboard 列表区域底部加入分页控件。
- 分页必须发生在搜索和筛选之后，即对当前 `filteredSkills` 结果集分页。
- Grid 视图只渲染当前页数据，每页最多 12 条 Skill。
- Table 视图只渲染当前页数据，每页最多 20 条 Skill。
- 分页在员工角色和管理员角色下都必须可用。
- 切换 Grid/Table 视图时，当前页重置为第 1 页。
- 修改任何会影响结果集的输入时，当前页重置为第 1 页：
  - 搜索关键词；
  - 分类筛选；
  - 状态筛选；
  - 团队/来源筛选；
  - 工具筛选；
  - 版本状态筛选；
  - 当前角色/用户。
- 当过滤后的结果数量变化导致当前页超出有效范围时，页面必须回到有效页；对于明确的搜索、筛选、角色变化，优先回到第 1 页。
- 分页底部需要展示清晰的范围摘要，例如 `1-12 / 37`。
- 首页、上一页、下一页、末页按钮需要在第一页或最后一页呈现正确 disabled 状态。
- 页码控件需要支持直接跳转到可见的附近页码。
- 空结果状态需要保持清晰；当当前筛选结果为 0 时，不展示容易误导用户的分页控件。
- Skill 详情面板需要保持合理选中状态：
  - 如果当前选中的 Skill 仍在过滤结果中，则继续保持选中；
  - 如果当前选中的 Skill 已不在过滤结果中，则回退到过滤结果中的第一条 Skill。
- 管理员跨页翻页时，已选 Skill id 必须保留。
- 管理员搜索、筛选或角色变化时，已选 Skill id 必须清空。
- 管理员批量操作继续作用于所有已选 Skill，包括来自其他分页页码的已选项。
- 现有“已选 N 个”的计数代表全部已选项，而不是当前页已选项。

### 非功能需求

- 实现范围默认保持在前端展示层。
- 不新增分页依赖。
- 分页逻辑需要简单、清晰、可测试。
- 视觉上沿用当前 dashboard 的暗黑控制台风格，并遵循 `ui-ux-pro-max` 设计指导。
- 分页控件在桌面端和移动端都不能出现横向滚动、控件重叠、文字截断或按钮不可操作。
- 保留现有搜索、筛选、详情、角色、管理员批量操作行为；除分页相关的预期变化外，不引入行为回退。

## 候选方案

### 方案 A：共享分页状态 + 视图专属 page size（推荐）

在 `SkillsConsole` 中维护一个当前页状态，根据当前 `viewMode` 推导 page size，再从 `filteredSkills` 派生 `paginatedSkills`。Grid 和 Table 都只消费 `paginatedSkills`，底部分页控件共用一套。

优点：

- 心智模型简单。
- Grid/Table 行为一致。
- 避免在两个视图里重复分页逻辑。
- 贴合当前组件结构，因为两个视图现在都消费同一份 `filteredSkills`。

缺点：

- 切换视图后会回到第一页，用户不会停留在原来附近的 item。

### 方案 B：Grid 和 Table 分别记页码

分别维护 Grid 页码和 Table 页码，同时使用不同 page size。

优点：

- 用户切回某个视图时可以恢复之前页码。

缺点：

- 不符合已确认的“切换视图回到第 1 页”规则。
- 状态更多，边界情况更多，当前收益不大。

### 方案 C：Grid/Table 组件各自内部分页

把分页逻辑分别放进 Grid 渲染区和 Table 组件内部。

优点：

- 每个视图可以独立优化自己的控件。

缺点：

- 容易重复逻辑。
- 跨视图重置、筛选重置和管理员跨页选择规则更难统一。

## 决策

采用方案 A：在 dashboard 层维护共享分页状态，并根据当前视图使用不同 page size。

dashboard 层派生：

- `pageSize`：由当前 `viewMode` 决定；
- `totalPages`：由 `filteredSkills.length` 决定；
- `paginatedSkills`：由当前页和 page size 从 `filteredSkills` 切片得到。

Grid 和 Table 都渲染 `paginatedSkills`。分页控件放在列表区域底部，保证员工界面、管理员界面、Grid 视图和 Table 视图行为一致。

## 验收标准

- [ ] 员工 Grid 视图每页最多展示 12 条 Skill。
- [ ] 员工 Table 视图每页最多展示 20 条 Skill。
- [ ] 管理员 Grid 视图每页最多展示 12 条 Skill。
- [ ] 管理员 Table 视图每页最多展示 20 条 Skill。
- [ ] Grid 和 Table 视图在结果超过单页容量时，列表底部都展示分页控件。
- [ ] 分页控件展示当前可见范围和过滤后的总数。
- [ ] 分页控件包含首页、上一页、页码、下一页、末页。
- [ ] 第一页时，首页和上一页不可用。
- [ ] 最后一页时，下一页和末页不可用。
- [ ] 切换 Grid/Table 视图时，当前页回到第 1 页。
- [ ] 修改搜索、筛选或角色时，当前页回到第 1 页。
- [ ] 空结果状态清晰，不展示误导性的分页控件。
- [ ] 管理员跨页翻页时，已选 Skill 保留。
- [ ] 管理员修改搜索、筛选或角色时，已选 Skill 清空。
- [ ] 管理员批量操作仍作用于所有跨页已选 Skill。
- [ ] 现有 Skill 详情、搜索、筛选、角色、管理员工作流不回退。
- [ ] 分页控件的视觉设计遵循 `ui-ux-pro-max`，并与当前 OLED 暗黑控制台风格一致。
- [ ] 桌面端和移动端分页区域无控件重叠、文字溢出、横向滚动或不可点击区域。
- [ ] 相关测试或验证覆盖分页切片、页码重置和管理员跨页选择行为。
- [ ] `npm run lint`、`npm run test`、`npm run typecheck`、`npm run build` 通过；如果无法运行，需要明确记录阻塞原因。

## 不在本次范围

- 后端分页或服务端 query 参数。
- 数据库、Prisma、seed data 或 API 合约变化。
- 无限滚动或虚拟列表。
- 将页码状态持久化到 URL。
- Grid 和 Table 分别记住页码。
- 修改角色权限或管理员授权逻辑。
- 修改现有筛选语义。
- 新增 dashboard 指标或新的 Skill 数据字段。
- 引入新的 UI 组件库、样式框架或动画库。

## Definition Of Done

- PRD 已经由用户确认。
- 实现前已读取相关 frontend Trellis spec。
- 凡涉及前端页面设计判断，已使用 `ui-ux-pro-max` 技能；如果技能不可用，已先向用户说明并等待确认。
- 员工和管理员界面的 dashboard 列表都完成分页。
- Grid/Table page size 和重置规则符合本 PRD。
- 管理员跨页选择和清空规则符合本 PRD。
- 已运行相关测试和验证命令。
- 如果实现中沉淀新的前端约定，已评估是否需要更新 `.trellis/spec/frontend/`。

## 技术备注

- 主要 UI 文件：`src/components/SkillsConsole.tsx`。
- 主要文案文件：`src/lib/ui-copy.ts`。
- 主要样式文件：`src/app/globals.css`。
- 前端规范入口：`.trellis/spec/frontend/index.md`。
- 当前组件规范已记录：暗黑主题遵循 `ui-ux-pro-max` Enterprise Gateway / OLED 方向。
- 当前列表渲染使用 `filteredSkills`；实现时建议在 Grid/Table 渲染前派生 `paginatedSkills`。
- 建议常量：
  - `GRID_PAGE_SIZE = 12`；
  - `TABLE_PAGE_SIZE = 20`。
- 建议测试重点：
  - page-size 切片；
  - 搜索、筛选、角色、视图切换后的回到第 1 页；
  - 空结果不展示误导性分页；
  - 管理员跨页翻页时 selected ids 保留；
  - 管理员搜索、筛选、角色变化时 selected ids 清空。
