import type { ActorRole } from "@/lib/domain";

declare module "next-auth" {
  interface User {
    id: string;
    role: ActorRole;
  }

  interface Session {
    user: {
      id: string;
      role: ActorRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: ActorRole;
  }
}
