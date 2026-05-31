"use client";

import {
  Archive,
  Ban,
  Code2,
  Columns3,
  CalendarDays,
  Download,
  Eye,
  GitBranch,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Table2,
  Tag,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  filterSkills,
  getCurrentVersion,
  getSkillSummary,
  getVersionState,
  type ActorRole,
  type AuditLog,
  type Skill,
  type SkillStatus,
} from "@/lib/domain";
import type { GitImportInput, SkillDraftInput, UpdateSkillInput } from "@/lib/skill-service";
import type { SkillStoreSnapshot } from "@/lib/seed-data";
import { PRODUCT_NAME, ROLE_LABELS, STATUS_LABELS, UI_COPY } from "@/lib/ui-copy";

type ViewMode = "grid" | "table";
type EditorMode = "create" | "edit" | "import";
type PreviewMode = "edit" | "preview" | "split";
type VersionFilter = "all" | "current" | "upgrade_available" | "not_tracked";

interface SkillFormState {
  name: string;
  description: string;
  category: string;
  tags: string;
  compatibleTools: string;
  maintainingTeam: string;
  maintainers: string;
  installMethod: string;
  dependencies: string;
  readme: string;
  version: string;
  changelog: string;
  repositoryUrl: string;
  repositoryName: string;
}

const EMPTY_FORM: SkillFormState = {
  name: "",
  description: "",
  category: "",
  tags: "",
  compatibleTools: "Codex",
  maintainingTeam: "",
  maintainers: "",
  installMethod: "从内部 Registry 安装",
  dependencies: "",
  readme: "## 使用说明\n描述员工何时以及如何使用这个 Skill。",
  version: "0.1.0",
  changelog: "初始草稿",
  repositoryUrl: "https://git.company.local/skills/",
  repositoryName: "",
};

export function SkillsConsole() {
  const [snapshot, setSnapshot] = useState<SkillStoreSnapshot | null>(null);
  const [role, setRole] = useState<ActorRole>("employee");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<SkillStatus | "all">("all");
  const [teamOrSource, setTeamOrSource] = useState("all");
  const [tool, setTool] = useState("all");
  const [versionState, setVersionState] = useState<VersionFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("split");
  const [form, setForm] = useState<SkillFormState>(EMPTY_FORM);
  const [bulkCategory, setBulkCategory] = useState("平台");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const userId = role === "admin" ? "admin-1" : "employee-1";
  const isAdmin = role === "admin";

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSnapshot() {
      const response = await fetch("/api/skills", { method: "GET" });
      const data = (await response.json()) as SkillStoreSnapshot;

      if (isMounted) {
        setSnapshot(data);
      }
    }

    void loadInitialSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  const skills = snapshot?.skills ?? [];
  const employeeVisibleSkills = isAdmin
    ? skills
    : skills.filter((skill) => ["published", "deprecated"].includes(skill.status));

  const filteredSkills = useMemo(
    () =>
      filterSkills(employeeVisibleSkills, {
        query,
        category: category === "all" ? undefined : category,
        status,
        teamOrSource: teamOrSource === "all" ? undefined : teamOrSource,
        tool: tool === "all" ? undefined : tool,
        versionState,
        userId,
        trackedVersions: snapshot?.trackedVersions ?? [],
      }),
    [
      category,
      employeeVisibleSkills,
      query,
      snapshot?.trackedVersions,
      status,
      teamOrSource,
      tool,
      userId,
      versionState,
    ],
  );

  const selectedSkill =
    skills.find((skill) => skill.id === selectedSkillId) ?? filteredSkills[0] ?? null;
  const summary = getSkillSummary(skills);
  const categories = unique(skills.map((skill) => skill.category));
  const teamsAndSources = unique(
    skills.flatMap((skill) => [skill.maintainingTeam, skill.source]),
  );
  const tools = unique(skills.flatMap((skill) => skill.compatibleTools));
  const recentAuditLogs = snapshot?.auditLogs.slice(0, 5) ?? [];
  const heroTags = [
    { label: `${ROLE_LABELS[role]}视图` },
    {
      value: filteredSkills.length.toLocaleString("en-US"),
      label: UI_COPY.header.tags.currentResults,
    },
    {
      value: summary.total.toLocaleString("en-US"),
      label: UI_COPY.header.tags.collectedSkills,
    },
    { label: UI_COPY.header.tags.controlledSources },
    { label: UI_COPY.header.tags.versionAudit },
  ];

  async function requestSnapshot(url: string, init: RequestInit) {
    setError("");
    const response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-demo-role": role,
        ...(init.headers ?? {}),
      },
    });
    const data = (await response.json()) as
      | (SkillStoreSnapshot & { selectedSkillId?: string })
      | { error?: string };

    if (!response.ok) {
      const apiError = data as { error?: string };
      throw new Error(apiError.error ?? UI_COPY.feedback.requestFailed);
    }

    const snapshotData = data as SkillStoreSnapshot & { selectedSkillId?: string };
    setSnapshot(snapshotData);
    setSelectedSkillId(snapshotData.selectedSkillId ?? selectedSkillId);
    setMessage(UI_COPY.feedback.saved);
  }

  async function runAction(action: () => Promise<void>) {
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : UI_COPY.feedback.actionFailed);
    }
  }

  function openCreateEditor() {
    setEditorMode("create");
    setForm(EMPTY_FORM);
    setPreviewMode("split");
  }

  function openImportEditor() {
    setEditorMode("import");
    setForm(EMPTY_FORM);
    setPreviewMode("split");
  }

  function openEditEditor(skill: Skill) {
    const latestVersion = skill.versions.at(-1);
    setEditorMode("edit");
    setForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      tags: skill.tags.join(", "),
      compatibleTools: skill.compatibleTools.join(", "),
      maintainingTeam: skill.maintainingTeam,
      maintainers: skill.maintainers.join(", "),
      installMethod: skill.installMethod,
      dependencies: skill.dependencies.join(", "),
      readme: skill.readme,
      version: incrementPatch(latestVersion?.version ?? "0.1.0"),
      changelog: "",
      repositoryUrl: skill.sourceMetadata?.repositoryUrl ?? EMPTY_FORM.repositoryUrl,
      repositoryName: skill.sourceMetadata?.repositoryName ?? "",
    });
    setPreviewMode("split");
  }

  async function submitEditor() {
    const draftInput = toDraftInput(form);

    if (editorMode === "create") {
      await requestSnapshot("/api/skills", {
        method: "POST",
        body: JSON.stringify(draftInput),
      });
    }

    if (editorMode === "import") {
      const importInput: GitImportInput = {
        repositoryUrl: form.repositoryUrl,
        repositoryName: form.repositoryName || form.name,
        name: form.name,
        description: form.description,
        category: form.category,
        compatibleTools: splitList(form.compatibleTools),
        maintainingTeam: form.maintainingTeam,
        readme: form.readme,
        version: form.version,
        changelog: form.changelog,
      };

      await requestSnapshot("/api/skills/import", {
        method: "POST",
        body: JSON.stringify(importInput),
      });
    }

    if (editorMode === "edit" && selectedSkill) {
      const updateInput: UpdateSkillInput = {
        ...draftInput,
        readme: form.readme,
        version: form.version,
        changelog: form.changelog,
      };

      await requestSnapshot(`/api/skills/${selectedSkill.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateInput),
      });
    }

    setEditorMode(null);
  }

  async function transition(skill: Skill, targetStatus: SkillStatus) {
    const versionId = skill.versions.at(-1)?.id;
    await requestSnapshot(`/api/skills/${skill.id}/transition`, {
      method: "POST",
      body: JSON.stringify({ status: targetStatus, versionId }),
    });
  }

  async function applyBulk(type: "publish" | "unpublish" | "archive") {
    await requestSnapshot("/api/skills/bulk", {
      method: "POST",
      body: JSON.stringify({ type, skillIds: selectedIds }),
    });
    setSelectedIds([]);
  }

  async function applyBulkCategory() {
    await requestSnapshot("/api/skills/bulk", {
      method: "POST",
      body: JSON.stringify({
        type: "change_category",
        skillIds: selectedIds,
        category: bulkCategory,
      }),
    });
    setSelectedIds([]);
  }

  async function trackCurrentVersion(skill: Skill) {
    const currentVersion = getCurrentVersion(skill);

    if (!currentVersion) {
      return;
    }

    await requestSnapshot("/api/tracked-versions", {
      method: "POST",
      body: JSON.stringify({
        skillId: skill.id,
        versionId: currentVersion.id,
      }),
    });
  }

  function toggleSelected(skillId: string) {
    setSelectedIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  }

  if (!snapshot) {
    return (
      <main className="console-shell">
        <section className="loading-panel">{UI_COPY.loading}</section>
      </main>
    );
  }

  return (
    <main className="console-shell">
      <header className="console-header">
        <div className="header-topbar">
          <div className="header-brand">
            <span className="header-chrome" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-path">~/skillsrepo</span>
            <span className="brand-cursor" aria-hidden="true" />
          </div>
          <div className="header-actions">
            <label className="role-switch">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>{UI_COPY.header.role}</span>
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value as ActorRole);
                  setSelectedIds([]);
                }}
              >
                <option value="employee">{ROLE_LABELS.employee}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </select>
            </label>
            <button className="icon-text-button auth-button" type="button">
              <LogOut size={17} aria-hidden="true" />
              {UI_COPY.actions.logout}
            </button>
          </div>
        </div>
        <div className="header-hero">
          <span className="hero-watermark" aria-hidden="true">
            SKILLS REPO
          </span>
          <div className="hero-kicker">
            <span />
            <span>{UI_COPY.header.eyebrow} / {PRODUCT_NAME}</span>
          </div>
          <h1>{PRODUCT_NAME}</h1>
          <p className="hero-description">{UI_COPY.header.description}</p>
          <div className="header-metrics hero-tags" aria-label="Hero highlights">
            {heroTags.map((tag) => (
              <span key={`${tag.value ?? ""}${tag.label}`}>
                {tag.value ? <strong>{tag.value}</strong> : null}
                {tag.value ? " " : null}
                {tag.label}
              </span>
            ))}
          </div>
          <div className="header-code" aria-label={UI_COPY.stats.totalSkills}>
            <span>const skills =</span>
            <strong>{summary.total}</strong>
            <span>;</span>
          </div>
        </div>
      </header>

      <section className="workspace">
        <div className="list-panel">
          <div className="panel-heading">
            <div>
              <h2>{UI_COPY.list.title}</h2>
              <p>
                {filteredSkills.length} / {employeeVisibleSkills.length}
              </p>
            </div>
          </div>
          <div className="toolbar">
            <label className="filter-field search-field">
              <span>{UI_COPY.filters.search}</span>
              <div className="search-box">
                <Search size={18} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={UI_COPY.filters.searchPlaceholder}
                />
              </div>
            </label>
            <label className="filter-field">
              <span>{UI_COPY.filters.category}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">{UI_COPY.filters.allCategories}</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>{UI_COPY.filters.status}</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as SkillStatus | "all")}
              >
                <option value="all">{UI_COPY.filters.allStatuses}</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>{UI_COPY.filters.teamOrSource}</span>
              <select value={teamOrSource} onChange={(event) => setTeamOrSource(event.target.value)}>
                <option value="all">{UI_COPY.filters.allTeamsOrSources}</option>
                {teamsAndSources.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>{UI_COPY.filters.tool}</span>
              <select value={tool} onChange={(event) => setTool(event.target.value)}>
                <option value="all">{UI_COPY.filters.allTools}</option>
                {tools.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>{UI_COPY.filters.versionState}</span>
              <select
                value={versionState}
                onChange={(event) => setVersionState(event.target.value as VersionFilter)}
              >
                <option value="all">{UI_COPY.filters.allVersionStates}</option>
                <option value="upgrade_available">{UI_COPY.filters.upgradeAvailable}</option>
                <option value="current">{UI_COPY.filters.current}</option>
                <option value="not_tracked">{UI_COPY.filters.notTracked}</option>
              </select>
            </label>
            <div className="view-tools">
              <span>{UI_COPY.filters.viewMode}</span>
              <div className="segmented-control" aria-label={UI_COPY.filters.viewMode}>
              <button
                className={viewMode === "grid" ? "active" : ""}
                type="button"
                title={UI_COPY.filters.gridView}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={17} aria-hidden="true" />
              </button>
              <button
                className={viewMode === "table" ? "active" : ""}
                type="button"
                title={UI_COPY.filters.tableView}
                onClick={() => setViewMode("table")}
              >
                <Table2 size={17} aria-hidden="true" />
              </button>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <div className="admin-bar">
              <span className="admin-bar-title">{UI_COPY.admin.console}</span>
              <div className="admin-actions">
                <button className="icon-text-button" type="button" onClick={openCreateEditor}>
                  <Plus size={17} aria-hidden="true" />
                  {UI_COPY.actions.newSkill}
                </button>
                <button className="icon-text-button" type="button" onClick={openImportEditor}>
                  <GitBranch size={17} aria-hidden="true" />
                  {UI_COPY.actions.importGit}
                </button>
                <span className="selection-count">
                  {selectedIds.length} {UI_COPY.admin.selected}
                </span>
                <button
                  className="icon-text-button"
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => void runAction(() => applyBulk("publish"))}
                >
                  <Upload size={17} aria-hidden="true" />
                  {UI_COPY.actions.publish}
                </button>
                <button
                  className="icon-text-button"
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => void runAction(() => applyBulk("unpublish"))}
                >
                  <Ban size={17} aria-hidden="true" />
                  {UI_COPY.actions.deprecate}
                </button>
                <button
                  className="icon-text-button"
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => void runAction(() => applyBulk("archive"))}
                >
                  <Archive size={17} aria-hidden="true" />
                  {UI_COPY.actions.archive}
                </button>
                <label className="bulk-category">
                  <span>{UI_COPY.admin.category}</span>
                  <input value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} />
                </label>
                <button
                  className="icon-text-button"
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => void runAction(applyBulkCategory)}
                >
                  <Tag size={17} aria-hidden="true" />
                  {UI_COPY.actions.apply}
                </button>
              </div>
            </div>
          ) : null}

          {message || error ? (
            <div className={error ? "notice error" : "notice"}>{error || message}</div>
          ) : null}

          {viewMode === "grid" ? (
            <div className="skill-grid">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isAdmin={isAdmin}
                  isSelected={selectedIds.includes(skill.id)}
                  isActive={selectedSkill?.id === skill.id}
                  versionState={getVersionState(
                    skill,
                    snapshot.trackedVersions,
                    userId,
                  ).state}
                  onSelect={() => setSelectedSkillId(skill.id)}
                  onToggleSelected={() => toggleSelected(skill.id)}
                />
              ))}
            </div>
          ) : (
            <SkillTable
              skills={filteredSkills}
              isAdmin={isAdmin}
              selectedIds={selectedIds}
              selectedSkillId={selectedSkill?.id ?? null}
              trackedVersions={snapshot.trackedVersions}
              userId={userId}
              onSelect={(skillId) => setSelectedSkillId(skillId)}
              onToggleSelected={toggleSelected}
            />
          )}
        </div>

        <aside className="detail-panel">
          {selectedSkill ? (
            <SkillDetail
              skill={selectedSkill}
              auditLogs={recentAuditLogs}
              isAdmin={isAdmin}
              versionState={getVersionState(selectedSkill, snapshot.trackedVersions, userId)}
              onEdit={() => openEditEditor(selectedSkill)}
              onTrack={() => void runAction(() => trackCurrentVersion(selectedSkill))}
              onTransition={(targetStatus) =>
                void runAction(() => transition(selectedSkill, targetStatus))
              }
            />
          ) : (
            <div className="empty-state">{UI_COPY.detail.noMatches}</div>
          )}
        </aside>
      </section>

      {editorMode ? (
        <div className="editor-backdrop" role="dialog" aria-modal="true">
          <section className="editor-panel">
            <div className="editor-header">
              <div>
                <p className="eyebrow">
                  {editorMode === "import" ? UI_COPY.editor.controlledGit : UI_COPY.editor.adminEditor}
                </p>
                <h2>{editorTitle(editorMode)}</h2>
              </div>
              <button className="icon-button" type="button" title={UI_COPY.actions.close} onClick={() => setEditorMode(null)}>
                <Ban size={18} aria-hidden="true" />
              </button>
            </div>
            <SkillEditorForm
              form={form}
              mode={editorMode}
              previewMode={previewMode}
              onChange={setForm}
              onPreviewModeChange={setPreviewMode}
              onSubmit={() => void runAction(submitEditor)}
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}

function SkillCard({
  skill,
  isAdmin,
  isSelected,
  isActive,
  versionState,
  onSelect,
  onToggleSelected,
}: {
  skill: Skill;
  isAdmin: boolean;
  isSelected: boolean;
  isActive: boolean;
  versionState: string;
  onSelect: () => void;
  onToggleSelected: () => void;
}) {
  const currentVersion = getCurrentVersion(skill);
  const sourceName = skill.sourceMetadata?.repositoryName ?? skill.source;

  return (
    <article className={`skill-card ${skill.status} ${isActive ? "active" : ""}`}>
      <div className="skill-card-chrome">
        <div className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className={`status-pill ${skill.status}`}>{STATUS_LABELS[skill.status]}</span>
      </div>
      <div className="skill-card-header">
        {isAdmin ? (
          <input
            aria-label={`选择 ${skill.name}`}
            checked={isSelected}
            type="checkbox"
            onChange={onToggleSelected}
          />
        ) : null}
        <div className="skill-card-main">
          <div className="skill-identity-row">
            <div className="skill-avatar" aria-hidden="true">
              {skill.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="source-line">
                {UI_COPY.list.source} <strong>{sourceName}</strong>
              </span>
              <button className="card-title-button" type="button" onClick={onSelect}>
                <strong>{skill.name}</strong>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="skill-description">{skill.description}</p>
      <div className="tag-rail" aria-label="Skill 标签">
        {skill.tags.slice(0, 3).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
        {skill.tags.length > 3 ? <span>+{skill.tags.length - 3}</span> : null}
      </div>
      <div className="metadata-grid">
        <span>
          <small>{UI_COPY.detail.category}</small>
          {skill.category}
        </span>
        <span>
          <small>{UI_COPY.detail.tools}</small>
          {skill.compatibleTools.join(", ")}
        </span>
        <span>
          <small>{UI_COPY.list.currentVersion}</small>
          {currentVersion?.version ?? UI_COPY.detail.noRelease}
        </span>
        <span>
          <small>{UI_COPY.detail.maintainingTeam}</small>
          {skill.maintainingTeam}
        </span>
      </div>
      <div className="card-footer">
        <span title={UI_COPY.list.versions}>
          <Star size={15} aria-hidden="true" />
          {skill.versions.length}
        </span>
        <span title={UI_COPY.list.maintainers}>
          <Users size={15} aria-hidden="true" />
          {skill.maintainers.length}
        </span>
        <span title={UI_COPY.detail.tools}>
          <Code2 size={15} aria-hidden="true" />
          {skill.compatibleTools.length}
        </span>
        <span title={UI_COPY.list.updatedAt}>
          <CalendarDays size={15} aria-hidden="true" />
          {formatDate(skill.updatedAt)}
        </span>
        <span className={`version-chip ${versionState}`}>{versionLabel(versionState)}</span>
      </div>
    </article>
  );
}

function SkillTable({
  skills,
  isAdmin,
  selectedIds,
  selectedSkillId,
  trackedVersions,
  userId,
  onSelect,
  onToggleSelected,
}: {
  skills: Skill[];
  isAdmin: boolean;
  selectedIds: string[];
  selectedSkillId: string | null;
  trackedVersions: SkillStoreSnapshot["trackedVersions"];
  userId: string;
  onSelect: (skillId: string) => void;
  onToggleSelected: (skillId: string) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {isAdmin ? <th>选择</th> : null}
            <th>名称</th>
            <th>分类</th>
            <th>工具</th>
            <th>版本</th>
            <th>状态</th>
            <th>团队</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const currentVersion = getCurrentVersion(skill);
            const state = getVersionState(skill, trackedVersions, userId).state;

            return (
              <tr key={skill.id} className={selectedSkillId === skill.id ? "active-row" : ""}>
                {isAdmin ? (
                  <td>
                    <input
                      aria-label={`选择 ${skill.name}`}
                      checked={selectedIds.includes(skill.id)}
                      type="checkbox"
                      onChange={() => onToggleSelected(skill.id)}
                    />
                  </td>
                ) : null}
                <td>
                  <button type="button" onClick={() => onSelect(skill.id)}>
                    {skill.name}
                  </button>
                </td>
                <td>{skill.category}</td>
                <td>{skill.compatibleTools.join(", ")}</td>
                <td>
                  {currentVersion?.version ?? UI_COPY.detail.noRelease}
                  <span className={`version-dot ${state}`} title={versionLabel(state)} />
                </td>
                <td>
                  <span className={`status-pill ${skill.status}`}>{STATUS_LABELS[skill.status]}</span>
                </td>
                <td>{skill.maintainingTeam}</td>
                <td>{formatDate(skill.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SkillDetail({
  skill,
  auditLogs,
  isAdmin,
  versionState,
  onEdit,
  onTrack,
  onTransition,
}: {
  skill: Skill;
  auditLogs: AuditLog[];
  isAdmin: boolean;
  versionState: ReturnType<typeof getVersionState>;
  onEdit: () => void;
  onTrack: () => void;
  onTransition: (status: SkillStatus) => void;
}) {
  const currentVersion = getCurrentVersion(skill);

  return (
    <>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">{UI_COPY.detail.eyebrow}</p>
          <h2>{skill.name}</h2>
        </div>
        <span className={`status-pill ${skill.status}`}>{STATUS_LABELS[skill.status]}</span>
      </div>
      <p className="detail-description">{skill.description}</p>
      <div className="detail-actions">
        {isAdmin ? (
          <>
            <button className="icon-text-button" type="button" onClick={onEdit}>
              <Pencil size={17} aria-hidden="true" />
              {UI_COPY.actions.edit}
            </button>
            <button className="icon-text-button" type="button" onClick={() => onTransition("published")}>
              <Upload size={17} aria-hidden="true" />
              {UI_COPY.actions.publish}
            </button>
            <button className="icon-text-button" type="button" onClick={() => onTransition("deprecated")}>
              <Ban size={17} aria-hidden="true" />
              {UI_COPY.actions.deprecate}
            </button>
            <button className="icon-text-button" type="button" onClick={() => onTransition("archived")}>
              <Archive size={17} aria-hidden="true" />
              {UI_COPY.actions.archive}
            </button>
          </>
        ) : (
          <button
            className="icon-text-button strong"
            type="button"
            disabled={!currentVersion}
            onClick={onTrack}
          >
            <Download size={17} aria-hidden="true" />
            {versionState.state === "upgrade_available"
              ? UI_COPY.actions.upgradeTrackedVersion
              : UI_COPY.actions.trackCurrentVersion}
          </button>
        )}
      </div>

      {versionState.state === "upgrade_available" ? (
        <div className="upgrade-callout">
          <strong>{UI_COPY.detail.upgradeTitle}</strong>
          <span>
            {UI_COPY.detail.upgradeText
              .replace("{trackedVersion}", versionState.trackedVersion ?? "-")
              .replace("{currentVersion}", versionState.currentVersion ?? "-")}
          </span>
        </div>
      ) : null}

      <section className="detail-section">
        <h3>{UI_COPY.detail.basicInformation}</h3>
        <dl className="info-list">
          <div>
            <dt>{UI_COPY.detail.category}</dt>
            <dd>{skill.category}</dd>
          </div>
          <div>
            <dt>{UI_COPY.detail.tools}</dt>
            <dd>{skill.compatibleTools.join(", ")}</dd>
          </div>
          <div>
            <dt>{UI_COPY.detail.maintainingTeam}</dt>
            <dd>{skill.maintainingTeam}</dd>
          </div>
          <div>
            <dt>{UI_COPY.detail.maintainers}</dt>
            <dd>{skill.maintainers.join(", ")}</dd>
          </div>
          <div>
            <dt>{UI_COPY.detail.installMethod}</dt>
            <dd>{skill.installMethod}</dd>
          </div>
          <div>
            <dt>{UI_COPY.detail.dependencies}</dt>
            <dd>{skill.dependencies.length > 0 ? skill.dependencies.join(", ") : UI_COPY.detail.none}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-section">
        <h3>{UI_COPY.detail.readme}</h3>
        <MarkdownPreview content={skill.readme} />
      </section>

      <section className="detail-section">
        <h3>{UI_COPY.detail.versionHistory}</h3>
        <div className="version-list">
          {skill.versions.map((version) => (
            <div key={version.id} className="version-row">
              <strong>{version.version}</strong>
              <span>{version.changelog}</span>
              <small>
                {version.publishedAt
                  ? `${UI_COPY.detail.published} ${formatDate(version.publishedAt)}`
                  : UI_COPY.detail.draft}
                {version.publisher
                  ? ` ${UI_COPY.detail.by} ${version.publisher}`
                  : ` ${UI_COPY.detail.by} ${version.author}`}
              </small>
            </div>
          ))}
        </div>
        <VersionDiff skill={skill} />
      </section>

      <section className="detail-section">
        <h3>{UI_COPY.detail.recentAuditTrail}</h3>
        <div className="audit-list">
          {auditLogs.map((log) => (
            <div key={log.id}>
              <span>{log.summary}</span>
              <small>{formatDate(log.createdAt)}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SkillEditorForm({
  form,
  mode,
  previewMode,
  onChange,
  onPreviewModeChange,
  onSubmit,
}: {
  form: SkillFormState;
  mode: EditorMode;
  previewMode: PreviewMode;
  onChange: (form: SkillFormState) => void;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onSubmit: () => void;
}) {
  function updateField(field: keyof SkillFormState, value: string) {
    onChange({ ...form, [field]: value });
  }

  return (
    <form
      className="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {mode === "import" ? (
        <div className="form-grid two">
          <label>
            {UI_COPY.editor.repositoryUrl}
            <input value={form.repositoryUrl} onChange={(event) => updateField("repositoryUrl", event.target.value)} />
          </label>
          <label>
            {UI_COPY.editor.repositoryName}
            <input value={form.repositoryName} onChange={(event) => updateField("repositoryName", event.target.value)} />
          </label>
        </div>
      ) : null}
      <div className="form-grid two">
        <label>
          {UI_COPY.editor.skillName}
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </label>
        <label>
          {UI_COPY.editor.category}
          <input value={form.category} onChange={(event) => updateField("category", event.target.value)} />
        </label>
      </div>
      <label>
        {UI_COPY.editor.description}
        <input value={form.description} onChange={(event) => updateField("description", event.target.value)} />
      </label>
      <div className="form-grid two">
        <label>
          {UI_COPY.editor.compatibleTools}
          <input value={form.compatibleTools} onChange={(event) => updateField("compatibleTools", event.target.value)} />
        </label>
        <label>
          {UI_COPY.editor.maintainingTeam}
          <input value={form.maintainingTeam} onChange={(event) => updateField("maintainingTeam", event.target.value)} />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          {UI_COPY.editor.tags}
          <input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} />
        </label>
        <label>
          {UI_COPY.editor.maintainers}
          <input value={form.maintainers} onChange={(event) => updateField("maintainers", event.target.value)} />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          {UI_COPY.editor.version}
          <input value={form.version} onChange={(event) => updateField("version", event.target.value)} />
        </label>
        <label>
          {UI_COPY.editor.dependencies}
          <input value={form.dependencies} onChange={(event) => updateField("dependencies", event.target.value)} />
        </label>
      </div>
      <label>
        {UI_COPY.editor.installMethod}
        <input value={form.installMethod} onChange={(event) => updateField("installMethod", event.target.value)} />
      </label>
      <label>
        {UI_COPY.editor.changelog}
        <input value={form.changelog} onChange={(event) => updateField("changelog", event.target.value)} />
      </label>
      <div className="editor-mode-bar">
        <span>{UI_COPY.editor.markdown}</span>
        <div className="segmented-control">
          <button
            className={previewMode === "edit" ? "active" : ""}
            type="button"
            title={UI_COPY.editor.editMode}
            onClick={() => onPreviewModeChange("edit")}
          >
            <Pencil size={17} aria-hidden="true" />
          </button>
          <button
            className={previewMode === "preview" ? "active" : ""}
            type="button"
            title={UI_COPY.editor.previewMode}
            onClick={() => onPreviewModeChange("preview")}
          >
            <Eye size={17} aria-hidden="true" />
          </button>
          <button
            className={previewMode === "split" ? "active" : ""}
            type="button"
            title={UI_COPY.editor.splitMode}
            onClick={() => onPreviewModeChange("split")}
          >
            <Columns3 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={`markdown-editor ${previewMode}`}>
        {previewMode !== "preview" ? (
          <textarea value={form.readme} onChange={(event) => updateField("readme", event.target.value)} />
        ) : null}
        {previewMode !== "edit" ? <MarkdownPreview content={form.readme} /> : null}
      </div>
      <div className="editor-footer">
        <button className="primary-button" type="submit">
          {mode === "edit" ? UI_COPY.actions.saveDraftVersion : UI_COPY.actions.createDraft}
        </button>
      </div>
    </form>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="markdown-preview">
      {content.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return <h4 key={`${line}-${index}`}>{line.replace("## ", "")}</h4>;
        }

        if (line.startsWith("- ")) {
          return <li key={`${line}-${index}`}>{line.replace("- ", "")}</li>;
        }

        if (!line.trim()) {
          return <br key={`blank-${index}`} />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function VersionDiff({ skill }: { skill: Skill }) {
  if (skill.versions.length < 2) {
    return <div className="diff-box">{UI_COPY.version.noPreviousDiff}</div>;
  }

  const previous = skill.versions.at(-2);
  const latest = skill.versions.at(-1);

  if (!previous || !latest) {
    return null;
  }

  const previousLines = new Set(previous.content.split("\n"));
  const latestLines = new Set(latest.content.split("\n"));
  const added = latest.content.split("\n").filter((line) => !previousLines.has(line));
  const removed = previous.content.split("\n").filter((line) => !latestLines.has(line));

  return (
    <div className="diff-box">
      <strong>
        {UI_COPY.version.diff}: {previous.version} → {latest.version}
      </strong>
      {added.map((line) => (
        <span key={`add-${line}`} className="diff-add">
          + {line}
        </span>
      ))}
      {removed.map((line) => (
        <span key={`remove-${line}`} className="diff-remove">
          - {line}
        </span>
      ))}
      {added.length === 0 && removed.length === 0 ? <span>{UI_COPY.version.noContentChanges}</span> : null}
    </div>
  );
}

function toDraftInput(form: SkillFormState): SkillDraftInput {
  return {
    name: form.name,
    description: form.description,
    category: form.category,
    tags: splitList(form.tags),
    compatibleTools: splitList(form.compatibleTools),
    maintainingTeam: form.maintainingTeam,
    maintainers: splitList(form.maintainers),
    installMethod: form.installMethod,
    dependencies: splitList(form.dependencies),
    readme: form.readme,
    version: form.version,
    changelog: form.changelog,
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function versionLabel(value: string): string {
  if (value === "upgrade_available") {
    return UI_COPY.version.upgrade;
  }

  if (value === "current") {
    return UI_COPY.version.current;
  }

  return UI_COPY.version.notTracked;
}

function incrementPatch(version: string): string {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  const patch = (parts[2] ?? 0) + 1;

  return `${major}.${minor}.${patch}`;
}

function editorTitle(mode: EditorMode): string {
  if (mode === "import") {
    return UI_COPY.editor.importTitle;
  }

  if (mode === "edit") {
    return UI_COPY.editor.editTitle;
  }

  return UI_COPY.editor.createTitle;
}
