import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { isInternalAuthEnabled } from "@/lib/auth-config";
import { getInternalUserByEmail } from "@/lib/internal-users";
import { getPrismaClient } from "@/lib/prisma";

const isPrismaAdapterEnabled = Boolean(process.env.DATABASE_URL);
const isInternalProviderEnabled = isInternalAuthEnabled();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: isPrismaAdapterEnabled
    ? PrismaAdapter(getPrismaClient())
    : undefined,
  session: {
    strategy: "jwt",
  },
  providers: isInternalProviderEnabled
    ? [
        Credentials({
          id: "credentials",
          name: "Internal development account",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            const email =
              typeof credentials?.email === "string" ? credentials.email : "";
            const user = getInternalUserByEmail(email);

            if (!user) {
              return null;
            }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          },
        }),
      ]
    : [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role =
          token.role === "admin" ? "admin" : "employee";
      }

      return session;
    },
  },
});
