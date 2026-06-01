import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginRegistrationPage } from "@/components/LoginRegistrationPage";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  return <LoginRegistrationPage />;
}
