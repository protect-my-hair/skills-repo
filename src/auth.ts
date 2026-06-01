import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { isInternalAuthEnabled } from "@/lib/auth-config";
import { getPrismaClient } from "@/lib/prisma";
import { verifyUserCredentials } from "@/lib/user-accounts";

const isPrismaAdapterEnabled = Boolean(process.env.DATABASE_URL);
const isCredentialProviderEnabled =
  isPrismaAdapterEnabled || isInternalAuthEnabled();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: isPrismaAdapterEnabled
    ? PrismaAdapter(getPrismaClient())
    : undefined,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: isCredentialProviderEnabled
    ? [
        Credentials({
          id: "credentials",
          name: "Email and password",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const email =
              typeof credentials?.email === "string" ? credentials.email : "";
            const password =
              typeof credentials?.password === "string"
                ? credentials.password
                : "";

            if (!email || !password || !isPrismaAdapterEnabled) {
              return null;
            }

            return verifyUserCredentials(email, password);
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
