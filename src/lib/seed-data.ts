import type {
  AuditLog,
  GitImportJob,
  GitImportSource,
  Skill,
  TrackedVersion,
} from "./domain";

export interface SkillStoreSnapshot {
  skills: Skill[];
  trackedVersions: TrackedVersion[];
  auditLogs: AuditLog[];
  gitImportSources: GitImportSource[];
  gitImportJobs: GitImportJob[];
}

export const seededStore: SkillStoreSnapshot = {
  skills: [
    {
      id: "rag-helper",
      name: "RAG Helper",
      description: "Retrieval checklist and prompt structure for knowledge agents.",
      category: "Knowledge",
      tags: ["rag", "support", "retrieval"],
      compatibleTools: ["Codex", "Claude"],
      status: "published",
      maintainingTeam: "AI Platform",
      source: "Controlled Git",
      sourceMetadata: {
        repositoryUrl: "https://git.company.local/skills/rag-helper",
        repositoryName: "rag-helper",
      },
      updatedAt: "2026-05-28T10:00:00.000Z",
      maintainers: ["Ada Chen", "Noah Liu"],
      installMethod: "Install from internal registry after approval.",
      dependencies: ["vector-index", "knowledge-base-access"],
      readme:
        "## Usage\nUse this Skill when answering support or product knowledge questions.\n\n- Confirm the user's intent\n- Retrieve relevant internal context\n- Cite the source system\n- Escalate when evidence is missing",
      currentVersionId: "rag-v2",
      versions: [
        {
          id: "rag-v1",
          version: "1.0.0",
          content:
            "## Usage\nUse this Skill for retrieval-assisted answers.\n\n- Search first\n- Answer with citations",
          changelog: "Initial release with basic retrieval guidance.",
          createdAt: "2026-05-01T10:00:00.000Z",
          author: "Ada Chen",
          publishedAt: "2026-05-01T10:00:00.000Z",
          publisher: "Ada Chen",
        },
        {
          id: "rag-v2",
          version: "1.2.0",
          content:
            "## Usage\nUse this Skill when answering support or product knowledge questions.\n\n- Confirm the user's intent\n- Retrieve relevant internal context\n- Cite the source system\n- Escalate when evidence is missing",
          changelog: "Added source confidence checks and escalation guidance.",
          createdAt: "2026-05-28T10:00:00.000Z",
          author: "Ada Chen",
          publishedAt: "2026-05-28T10:00:00.000Z",
          publisher: "Ada Chen",
        },
      ],
    },
    {
      id: "incident-triage",
      name: "Incident Triage",
      description: "Step-by-step operational checklist for high-priority incidents.",
      category: "Operations",
      tags: ["incident", "sre"],
      compatibleTools: ["Codex"],
      status: "pending_review",
      maintainingTeam: "SRE",
      source: "Manual",
      updatedAt: "2026-05-30T08:00:00.000Z",
      maintainers: ["Mira Admin"],
      installMethod: "Available after publication.",
      dependencies: ["pager-policy", "runbook-index"],
      readme:
        "## Usage\nRun this Skill when an incident channel is opened.\n\n- Capture impact\n- Identify owner\n- Build first timeline\n- Prepare customer-facing summary",
      currentVersionId: null,
      versions: [
        {
          id: "incident-v1",
          version: "0.1.0",
          content:
            "## Usage\nRun this Skill when an incident channel is opened.\n\n- Capture impact\n- Identify owner\n- Build first timeline",
          changelog: "Drafted first incident triage workflow.",
          createdAt: "2026-05-30T08:00:00.000Z",
          author: "Mira Admin",
        },
      ],
    },
    {
      id: "finance-review",
      name: "Finance Review",
      description: "Review operating expense anomalies before month-end close.",
      category: "Finance",
      tags: ["finance", "review"],
      compatibleTools: ["Claude"],
      status: "draft",
      maintainingTeam: "Finance Ops",
      source: "Manual",
      updatedAt: "2026-05-29T09:00:00.000Z",
      maintainers: ["Lin Zhao"],
      installMethod: "Draft only.",
      dependencies: ["expense-export"],
      readme:
        "## Usage\nUse for reviewing operating expense anomalies.\n\n- Group expenses by vendor\n- Flag unusual month-over-month changes\n- Prepare reviewer notes",
      currentVersionId: null,
      versions: [
        {
          id: "finance-v1",
          version: "0.1.0",
          content:
            "## Usage\nUse for reviewing operating expense anomalies.\n\n- Group expenses by vendor\n- Flag unusual month-over-month changes",
          changelog: "Initial draft.",
          createdAt: "2026-05-29T09:00:00.000Z",
          author: "Lin Zhao",
        },
      ],
    },
    {
      id: "legacy-crm-sync",
      name: "Legacy CRM Sync",
      description: "Deprecated workflow for older CRM enrichment tasks.",
      category: "Sales",
      tags: ["crm", "legacy"],
      compatibleTools: ["Codex", "Copilot"],
      status: "deprecated",
      maintainingTeam: "Revenue Systems",
      source: "Controlled Git",
      sourceMetadata: {
        repositoryUrl: "https://git.company.local/skills/legacy-crm-sync",
        repositoryName: "legacy-crm-sync",
      },
      updatedAt: "2026-05-24T15:00:00.000Z",
      maintainers: ["Iris Wong"],
      installMethod: "Deprecated. Use Account Research instead.",
      dependencies: ["crm-readonly-token"],
      readme:
        "## Usage\nThis Skill is deprecated and kept for historical reference.",
      currentVersionId: "crm-v1",
      versions: [
        {
          id: "crm-v1",
          version: "1.0.0",
          content:
            "## Usage\nThis Skill is deprecated and kept for historical reference.",
          changelog: "Deprecated after CRM migration.",
          createdAt: "2026-04-20T09:00:00.000Z",
          author: "Iris Wong",
          publishedAt: "2026-04-20T09:00:00.000Z",
          publisher: "Iris Wong",
        },
      ],
    },
    {
      id: "design-critique",
      name: "Design Critique",
      description: "Structured UX review rubric for product design feedback.",
      category: "Design",
      tags: ["ux", "review"],
      compatibleTools: ["Claude", "Codex"],
      status: "archived",
      maintainingTeam: "Design Systems",
      source: "Manual",
      updatedAt: "2026-05-10T11:00:00.000Z",
      maintainers: ["Rhea Kumar"],
      installMethod: "Archived.",
      dependencies: [],
      readme:
        "## Usage\nArchived critique checklist. Kept for version history.",
      currentVersionId: "design-v1",
      versions: [
        {
          id: "design-v1",
          version: "0.9.0",
          content:
            "## Usage\nArchived critique checklist. Kept for version history.",
          changelog: "Archived after design process refresh.",
          createdAt: "2026-03-12T11:00:00.000Z",
          author: "Rhea Kumar",
          publishedAt: "2026-03-12T11:00:00.000Z",
          publisher: "Rhea Kumar",
        },
      ],
    },
  ],
  trackedVersions: [
    {
      userId: "employee-1",
      skillId: "rag-helper",
      versionId: "rag-v1",
    },
    {
      userId: "employee-1",
      skillId: "legacy-crm-sync",
      versionId: "crm-v1",
    },
  ],
  auditLogs: [
    {
      id: "seed-audit-rag",
      actorId: "admin-1",
      actorName: "Mira Admin",
      action: "publish",
      targetId: "rag-helper",
      targetName: "RAG Helper",
      createdAt: "2026-05-28T10:00:00.000Z",
      summary: "Mira Admin published RAG Helper 1.2.0",
    },
  ],
  gitImportSources: [],
  gitImportJobs: [],
};
