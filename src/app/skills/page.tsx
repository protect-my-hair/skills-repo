import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SkillsConsole } from "@/components/SkillsConsole";

export default async function SkillsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SkillsConsole />;
}
