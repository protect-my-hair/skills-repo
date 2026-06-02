import { notFoundError, validationError } from "@/lib/api-errors";
import { errorResponse, getActorFromSession } from "@/lib/http";
import { canReadSkill } from "@/lib/read-model";
import { readSkillsSnapshot } from "@/lib/skill-repository";
import {
  createSkillPackageArchive,
  getSkillInstallAvailability,
  skillInstallUnavailableMessage,
} from "@/lib/skill-package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{
    skillId: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const actor = await getActorFromSession();
    const { skillId } = await params;
    const snapshot = await readSkillsSnapshot();
    const skill = snapshot.skills.find((item) => item.id === skillId);

    if (!skill || !canReadSkill(actor, skill)) {
      throw notFoundError("Skill");
    }

    const availability = getSkillInstallAvailability(skill);

    if (!availability.isInstallable) {
      throw validationError(skillInstallUnavailableMessage(availability.reason));
    }

    const archive = await createSkillPackageArchive(skill);

    return new Response(new Uint8Array(archive.buffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${archive.fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
