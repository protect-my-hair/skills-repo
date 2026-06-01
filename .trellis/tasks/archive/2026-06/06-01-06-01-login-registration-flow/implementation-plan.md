# Login Registration Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build real email/password registration and login for Skills Repo, protect the home page, and redirect logout to `/login`.

**Architecture:** Add a Prisma-backed password credential model and native Node.js password hashing helpers, then route Auth.js credentials through a small account service. Add `/login` as a dedicated `ui-ux-pro-max` client experience while keeping protected page access and RBAC session-derived on the server.

**Tech Stack:** Next.js 16 App Router, React 19, Auth.js / NextAuth v5, Prisma 7 + PostgreSQL, Node.js `crypto.scrypt`, Vitest, global CSS tokens in `src/app/globals.css`.

---

## File Structure

- Modify `prisma/schema.prisma`: add one-to-one password credential storage for `User`.
- Create `prisma/migrations/20260601090000_add_user_password_credentials/migration.sql`: checked-in migration for the credential table.
- Modify `prisma/seed.ts`: optionally attach password credentials to seeded internal users from environment variables.
- Modify `.env.example`: document local seed password env vars without real values.
- Create `src/lib/auth-credentials.ts`: normalize auth input, validate registration input, hash and verify passwords.
- Create `src/lib/auth-credentials.test.ts`: pure tests for validation, normalization, hashing, and constant-time verification behavior.
- Create `src/lib/user-accounts.ts`: register employee accounts and verify credentials against Prisma.
- Create `src/lib/user-accounts.test.ts`: tests using a small in-memory account store interface.
- Modify `src/auth.ts`: route credentials provider through `verifyUserCredentials()` and set `pages.signIn = "/login"`.
- Create `src/app/api/auth/register/route.ts`: registration endpoint.
- Create `src/app/login/page.tsx`: server page that redirects authenticated users to `/`.
- Create `src/components/LoginRegistrationPage.tsx`: client login/register form.
- Modify `src/app/page.tsx`: redirect unauthenticated users to `/login`.
- Modify `src/components/SkillsConsole.tsx`: remove embedded unauthenticated account picker and redirect logout to `/login`.
- Modify `src/app/globals.css`: add login/register page styles using the existing `ui-ux-pro-max` OLED enterprise tokens.
- Modify `src/app/globals.test.ts`: lock the auth page visual direction to existing tokens.
- Modify `README.md`: document local login/register setup and seed password env vars.

---

### Task 1: Prisma Credential Storage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260601090000_add_user_password_credentials/migration.sql`
- Modify: `.env.example`

- [ ] **Step 1: Add the password credential relation to the Prisma schema**

In `prisma/schema.prisma`, update `model User`:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(EMPLOYEE)
  accounts      Account[]
  sessions      Session[]
  passwordCredential UserPasswordCredential?

  authoredVersions  SkillVersion[]  @relation("VersionAuthor")
  publishedVersions SkillVersion[]  @relation("VersionPublisher")
  trackedVersions   TrackedVersion[]
  auditLogs         AuditLog[]
  importJobs        GitImportJob[]
}
```

Add the new model after `VerificationToken`:

```prisma
model UserPasswordCredential {
  id           String   @id @default(cuid())
  userId       String   @unique
  passwordHash String
  passwordSalt String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Add the migration SQL**

Create `prisma/migrations/20260601090000_add_user_password_credentials/migration.sql`:

```sql
CREATE TABLE "UserPasswordCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPasswordCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPasswordCredential_userId_key" ON "UserPasswordCredential"("userId");

ALTER TABLE "UserPasswordCredential"
ADD CONSTRAINT "UserPasswordCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Document local seed password env vars**

Append to `.env.example`:

```env
# Optional local seed credentials. Use non-production values only in local dev.
SKILLS_REPO_SEED_ADMIN_PASSWORD=
SKILLS_REPO_SEED_EMPLOYEE_PASSWORD=
```

- [ ] **Step 4: Run schema verification**

Run:

```bash
npm run prisma:generate
```

Expected: Prisma Client generation completes and `src/generated/prisma` updates locally without adding generated files to git.

---

### Task 2: Password and Registration Input Helpers

**Files:**
- Create: `src/lib/auth-credentials.ts`
- Create: `src/lib/auth-credentials.test.ts`

- [ ] **Step 1: Write failing tests for auth credential helpers**

Create `src/lib/auth-credentials.test.ts`:

```typescript
import { describe, expect, test } from "vitest";

import {
  hashPassword,
  normalizeEmail,
  validateRegistrationInput,
  verifyPassword,
} from "./auth-credentials";
import { ApiError } from "./api-errors";

describe("auth credentials", () => {
  test("normalizes emails before account lookup", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  test("validates registration input into a normalized shape", () => {
    expect(
      validateRegistrationInput({
        name: "  Dana Ops ",
        email: " DANA@Skills.Local ",
        password: "correct horse",
        confirmPassword: "correct horse",
      }),
    ).toEqual({
      name: "Dana Ops",
      email: "dana@skills.local",
      password: "correct horse",
    });
  });

  test("rejects unsafe registration input with public validation errors", () => {
    expect(() => validateRegistrationInput({})).toThrow(ApiError);
    expect(() =>
      validateRegistrationInput({
        name: "Dana",
        email: "not-email",
        password: "short",
        confirmPassword: "short",
      }),
    ).toThrow("Password must be at least 8 characters");
    expect(() =>
      validateRegistrationInput({
        name: "Dana",
        email: "dana@skills.local",
        password: "correct horse",
        confirmPassword: "different horse",
      }),
    ).toThrow("Passwords do not match");
  });

  test("hashes and verifies passwords without returning the raw password", async () => {
    const secret = await hashPassword("correct horse");

    expect(secret.passwordHash).not.toContain("correct horse");
    expect(secret.passwordSalt).not.toContain("correct horse");
    await expect(verifyPassword("correct horse", secret)).resolves.toBe(true);
    await expect(verifyPassword("wrong horse", secret)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run the helper test and verify it fails**

Run:

```bash
npm run test -- src/lib/auth-credentials.test.ts
```

Expected: FAIL because `src/lib/auth-credentials.ts` does not exist.

- [ ] **Step 3: Implement the credential helpers**

Create `src/lib/auth-credentials.ts`:

```typescript
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { validationError } from "./api-errors";

const scryptAsync = promisify(scrypt);
const PASSWORD_MIN_LENGTH = 8;
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface NormalizedRegistrationInput {
  name: string;
  email: string;
  password: string;
}

export interface PasswordCredentialSecret {
  passwordHash: string;
  passwordSalt: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegistrationInput(
  value: unknown,
): NormalizedRegistrationInput {
  if (!isRegistrationInput(value)) {
    throw validationError("Name, email, password, and confirmation are required");
  }

  const name = value.name.trim();
  const email = normalizeEmail(value.email);
  const password = value.password;
  const confirmPassword = value.confirmPassword;

  if (!name) {
    throw validationError("Name is required");
  }

  if (!email || !email.includes("@")) {
    throw validationError("A valid email is required");
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw validationError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  }

  if (password !== confirmPassword) {
    throw validationError("Passwords do not match");
  }

  return { name, email, password };
}

export async function hashPassword(
  password: string,
): Promise<PasswordCredentialSecret> {
  const passwordSalt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = (await scryptAsync(
    password,
    passwordSalt,
    KEY_LENGTH,
  )) as Buffer;

  return {
    passwordHash: derivedKey.toString("hex"),
    passwordSalt,
  };
}

export async function verifyPassword(
  password: string,
  secret: PasswordCredentialSecret,
): Promise<boolean> {
  const expected = Buffer.from(secret.passwordHash, "hex");
  const actual = (await scryptAsync(
    password,
    secret.passwordSalt,
    KEY_LENGTH,
  )) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function isRegistrationInput(value: unknown): value is RegistrationInput {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "email" in value &&
    "password" in value &&
    "confirmPassword" in value &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.password === "string" &&
    typeof value.confirmPassword === "string"
  );
}
```

- [ ] **Step 4: Run the helper test and verify it passes**

Run:

```bash
npm run test -- src/lib/auth-credentials.test.ts
```

Expected: PASS.

---

### Task 3: User Account Service and Registration API

**Files:**
- Create: `src/lib/user-accounts.ts`
- Create: `src/lib/user-accounts.test.ts`
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Write failing tests for registration and credential verification**

Create `src/lib/user-accounts.test.ts`:

```typescript
import { describe, expect, test } from "vitest";

import { hashPassword } from "./auth-credentials";
import {
  registerUserAccount,
  verifyUserCredentials,
  type UserAccountStore,
} from "./user-accounts";

function createMemoryStore(): UserAccountStore {
  const users = new Map<string, Awaited<ReturnType<UserAccountStore["createEmployee"]>>>();

  return {
    async findByEmail(email) {
      return users.get(email) ?? null;
    },
    async createEmployee(input) {
      const user = {
        id: `user-${users.size + 1}`,
        name: input.name,
        email: input.email,
        role: "EMPLOYEE",
        passwordCredential: {
          passwordHash: input.passwordHash,
          passwordSalt: input.passwordSalt,
        },
      };
      users.set(input.email, user);
      return user;
    },
  };
}

describe("user accounts", () => {
  test("registers a normalized employee account", async () => {
    const store = createMemoryStore();

    await expect(
      registerUserAccount(
        {
          name: "  Dana Ops ",
          email: " DANA@Skills.Local ",
          password: "correct horse",
          confirmPassword: "correct horse",
        },
        store,
      ),
    ).resolves.toEqual({
      id: "user-1",
      name: "Dana Ops",
      email: "dana@skills.local",
      role: "employee",
    });
  });

  test("rejects duplicate emails without exposing account state detail", async () => {
    const store = createMemoryStore();
    const input = {
      name: "Dana Ops",
      email: "dana@skills.local",
      password: "correct horse",
      confirmPassword: "correct horse",
    };

    await registerUserAccount(input, store);
    await expect(registerUserAccount(input, store)).rejects.toThrow(
      "Account already exists",
    );
  });

  test("verifies stored credentials into a session-safe user", async () => {
    const secret = await hashPassword("correct horse");
    const store: UserAccountStore = {
      async findByEmail() {
        return {
          id: "admin-1",
          name: "Mira Admin",
          email: "admin@skills.local",
          role: "ADMIN",
          passwordCredential: secret,
        };
      },
      async createEmployee() {
        throw new Error("not used");
      },
    };

    await expect(
      verifyUserCredentials("ADMIN@skills.local", "correct horse", store),
    ).resolves.toEqual({
      id: "admin-1",
      name: "Mira Admin",
      email: "admin@skills.local",
      role: "admin",
    });
    await expect(
      verifyUserCredentials("admin@skills.local", "wrong horse", store),
    ).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run the account tests and verify they fail**

Run:

```bash
npm run test -- src/lib/user-accounts.test.ts
```

Expected: FAIL because `src/lib/user-accounts.ts` does not exist.

- [ ] **Step 3: Implement the account service**

Create `src/lib/user-accounts.ts`:

```typescript
import { UserRole } from "@/generated/prisma/enums";

import {
  hashPassword,
  normalizeEmail,
  validateRegistrationInput,
  verifyPassword,
  type PasswordCredentialSecret,
} from "./auth-credentials";
import { conflictError } from "./api-errors";
import type { ActorRole } from "./domain";
import { getPrismaClient } from "./prisma";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: ActorRole;
}

interface StoredUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  passwordCredential: PasswordCredentialSecret | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface UserAccountStore {
  findByEmail(email: string): Promise<StoredUser | null>;
  createEmployee(input: CreateEmployeeInput): Promise<StoredUser>;
}

export async function registerUserAccount(
  value: unknown,
  store: UserAccountStore = createPrismaUserAccountStore(),
): Promise<AuthUser> {
  const input = validateRegistrationInput(value);
  const existingUser = await store.findByEmail(input.email);

  if (existingUser) {
    throw conflictError("Account already exists");
  }

  const secret = await hashPassword(input.password);
  const user = await store.createEmployee({
    name: input.name,
    email: input.email,
    passwordHash: secret.passwordHash,
    passwordSalt: secret.passwordSalt,
  });

  return toAuthUser(user);
}

export async function verifyUserCredentials(
  email: string,
  password: string,
  store: UserAccountStore = createPrismaUserAccountStore(),
): Promise<AuthUser | null> {
  const user = await store.findByEmail(normalizeEmail(email));

  if (!user?.passwordCredential) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.passwordCredential);

  return isValidPassword ? toAuthUser(user) : null;
}

export function createPrismaUserAccountStore(): UserAccountStore {
  const prisma = getPrismaClient();

  return {
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
        include: { passwordCredential: true },
      });
    },
    async createEmployee(input) {
      return prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          role: UserRole.EMPLOYEE,
          passwordCredential: {
            create: {
              passwordHash: input.passwordHash,
              passwordSalt: input.passwordSalt,
            },
          },
        },
        include: { passwordCredential: true },
      });
    },
  };
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name ?? user.email ?? user.id,
    email: user.email ?? "",
    role: user.role === "ADMIN" ? "admin" : "employee",
  };
}
```

- [ ] **Step 4: Add the registration route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/http";
import { registerUserAccount } from "@/lib/user-accounts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await registerUserAccount(await request.json());

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 5: Run account tests**

Run:

```bash
npm run test -- src/lib/user-accounts.test.ts
```

Expected: PASS.

---

### Task 4: Auth.js Credentials Provider and Seeded Account Passwords

**Files:**
- Modify: `src/auth.ts`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Update Auth.js to use email/password credentials**

Modify `src/auth.ts` so the credentials provider accepts `email` and `password`, uses `verifyUserCredentials()`, and sets the custom login page:

```typescript
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
```

- [ ] **Step 2: Seed local password credentials from env vars**

Modify `prisma/seed.ts`:

```typescript
import { hashPassword } from "../src/lib/auth-credentials";
```

Add near the existing interfaces:

```typescript
const SEED_PASSWORD_BY_USER_ID: Record<string, string | undefined> = {
  "admin-1": process.env.SKILLS_REPO_SEED_ADMIN_PASSWORD,
  "employee-1": process.env.SKILLS_REPO_SEED_EMPLOYEE_PASSWORD,
};
```

After the existing user upsert loop inside the transaction, add:

```typescript
    for (const user of users) {
      const password = SEED_PASSWORD_BY_USER_ID[user.id];

      if (password) {
        const secret = await hashPassword(password);
        await transaction.userPasswordCredential.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            passwordHash: secret.passwordHash,
            passwordSalt: secret.passwordSalt,
          },
          update: {
            passwordHash: secret.passwordHash,
            passwordSalt: secret.passwordSalt,
          },
        });
      }
    }
```

- [ ] **Step 3: Run auth-related tests**

Run:

```bash
npm run test -- src/lib/auth-config.test.ts src/lib/session-actor.test.ts src/lib/auth-credentials.test.ts src/lib/user-accounts.test.ts
```

Expected: PASS.

---

### Task 5: Protected Home Page and `ui-ux-pro-max` Login/Register Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/components/LoginRegistrationPage.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`

- [ ] **Step 1: Protect the home page on the server**

Replace `src/app/page.tsx` with:

```typescript
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SkillsConsole } from "@/components/SkillsConsole";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <SkillsConsole />;
}
```

- [ ] **Step 2: Add the login route server wrapper**

Create `src/app/login/page.tsx`:

```typescript
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
```

- [ ] **Step 3: Add the client login/register form**

Create `src/components/LoginRegistrationPage.tsx`:

```typescript
"use client";

import { KeyRound, LogIn, Mail, ShieldCheck, User, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PRODUCT_NAME } from "@/lib/ui-copy";

type AuthMode = "login" | "register";

const GENERIC_AUTH_ERROR = "登录信息有误，请检查后重试。";
const GENERIC_REGISTER_ERROR = "注册失败，请检查信息后重试。";

export function LoginRegistrationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, confirmPassword }),
        });

        if (!response.ok) {
          setError(GENERIC_REGISTER_ERROR);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(GENERIC_AUTH_ERROR);
        return;
      }

      setMessage(mode === "register" ? "注册成功，正在进入系统。" : "登录成功，正在进入系统。");
      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-stage" aria-label={`${PRODUCT_NAME} 认证入口`}>
        <div className="auth-copy">
          <div className="auth-kicker">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Secure Skills Gateway</span>
          </div>
          <h1>{PRODUCT_NAME}</h1>
          <p>
            统一进入内部 Skills 管理台。注册后默认获得员工权限，管理能力仍由后端 RBAC 控制。
          </p>
          <div className="auth-code-card" aria-hidden="true">
            <span>session.role</span>
            <strong>{mode === "register" ? "employee" : "verified"}</strong>
          </div>
        </div>

        <form className="auth-card" onSubmit={(event) => void submitAuth(event)}>
          <div className="auth-tabs" aria-label="认证模式">
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => setMode("login")}
            >
              <LogIn size={17} aria-hidden="true" />
              登录
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => setMode("register")}
            >
              <UserPlus size={17} aria-hidden="true" />
              注册
            </button>
          </div>

          {mode === "register" ? (
            <label className="auth-field">
              <span>姓名</span>
              <div>
                <User size={17} aria-hidden="true" />
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </label>
          ) : null}

          <label className="auth-field">
            <span>邮箱</span>
            <div>
              <Mail size={17} aria-hidden="true" />
              <input
                autoComplete="email"
                inputMode="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>密码</span>
            <div>
              <KeyRound size={17} aria-hidden="true" />
              <input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {mode === "register" ? (
            <label className="auth-field">
              <span>确认密码</span>
              <div>
                <KeyRound size={17} aria-hidden="true" />
                <input
                  autoComplete="new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </label>
          ) : null}

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {mode === "register" ? "创建账号并进入系统" : "进入系统首页"}
          </button>

          {error ? <p className="notice error">{error}</p> : null}
          {message ? <p className="notice success">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add `ui-ux-pro-max` auth page CSS**

Append auth-specific styles to `src/app/globals.css`. Use existing tokens and keep the page full-screen, operational, dark, and terminal-inspired:

```css
.auth-shell {
  min-height: 100vh;
  padding: 48px;
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(34, 197, 94, 0.08), transparent 34%),
    linear-gradient(225deg, rgba(56, 189, 248, 0.1), transparent 32%),
    var(--bg);
}

.auth-stage {
  width: min(1100px, 100%);
  min-height: 620px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(340px, 440px);
  gap: 28px;
  align-items: stretch;
}

.auth-copy,
.auth-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96)),
    var(--surface);
  box-shadow: var(--shadow);
}

.auth-copy {
  position: relative;
  overflow: hidden;
  padding: 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.auth-copy::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 100% 18px;
  opacity: 0.28;
  pointer-events: none;
}

.auth-kicker {
  width: fit-content;
  display: inline-flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  border-radius: 999px;
  color: var(--green-strong);
  background: var(--green-soft);
}

.auth-copy h1 {
  position: relative;
  max-width: 720px;
  margin: 42px 0 18px;
  font-size: clamp(42px, 8vw, 92px);
  line-height: 0.92;
}

.auth-copy p {
  position: relative;
  max-width: 620px;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.7;
}

.auth-code-card {
  position: relative;
  width: min(360px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  color: var(--muted);
  font-family: "SFMono-Regular", Consolas, monospace;
}

.auth-code-card strong {
  color: var(--green-strong);
}

.auth-card {
  padding: 28px;
  align-self: center;
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 24px;
  padding: 4px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.45);
}

.auth-tabs button,
.auth-submit {
  min-height: 44px;
  border-radius: 6px;
}

.auth-tabs button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  color: var(--muted);
  background: transparent;
}

.auth-tabs button.active {
  color: var(--bg-strong);
  background: var(--green);
}

.auth-field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 13px;
}

.auth-field div {
  min-height: 46px;
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
}

.auth-field svg {
  color: var(--cyan);
}

.auth-field input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
}

.auth-field:focus-within div {
  border-color: rgba(34, 197, 94, 0.76);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
}

.auth-submit {
  width: 100%;
  margin-top: 6px;
  border: 1px solid var(--green);
  color: var(--bg-strong);
  background: var(--green);
  font-weight: 800;
}

.auth-submit:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (max-width: 860px) {
  .auth-shell {
    padding: 18px;
  }

  .auth-stage {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .auth-copy {
    min-height: 360px;
    padding: 28px;
  }

  .auth-copy h1 {
    font-size: 42px;
  }
}
```

- [ ] **Step 5: Add CSS regression checks for the auth visual direction**

Append to `src/app/globals.test.ts`:

```typescript
  test("keeps login and registration aligned with ui-ux-pro-max", () => {
    expect(css).toMatch(/\.auth-shell\s*\{[\s\S]*?var\(--bg\);/);
    expect(css).toMatch(/\.auth-copy,[\s\S]*?\.auth-card\s*\{[\s\S]*?var\(--surface\);/);
    expect(css).toMatch(/\.auth-kicker\s*\{[\s\S]*?var\(--green-soft\);/);
    expect(css).toMatch(/\.auth-tabs button\.active\s*\{[\s\S]*?background:\s*var\(--green\);/);
    expect(css).toMatch(/\.auth-field:focus-within div\s*\{[\s\S]*?rgba\(34, 197, 94, 0\.76\);/);
  });
```

- [ ] **Step 6: Run CSS tests**

Run:

```bash
npm run test -- src/app/globals.test.ts
```

Expected: PASS.

---

### Task 6: Console Auth State Cleanup and Logout Redirect

**Files:**
- Modify: `src/components/SkillsConsole.tsx`

- [ ] **Step 1: Remove embedded unauthenticated login UI**

In `src/components/SkillsConsole.tsx`, remove:

```typescript
import { signIn, signOut, useSession } from "next-auth/react";
import { INTERNAL_AUTH_USERS } from "@/lib/internal-users";
```

Replace with:

```typescript
import { signOut, useSession } from "next-auth/react";
```

Delete the `loginAs()` function and the `authStatus === "unauthenticated"` branch that renders internal user buttons. Keep a small loading state for non-authenticated transitions:

```typescript
  if (authStatus !== "authenticated") {
    return (
      <main className="console-shell">
        <section className="loading-panel">{UI_COPY.loading}</section>
      </main>
    );
  }
```

- [ ] **Step 2: Redirect logout to `/login`**

Replace the `logout()` function with:

```typescript
  async function logout() {
    setSnapshot(null);
    setSelectedIds([]);
    await signOut({ redirectTo: "/login" });
  }
```

- [ ] **Step 3: Run type-check for NextAuth client options**

Run:

```bash
npm run typecheck
```

Expected: PASS. If the installed `next-auth/react` type expects `callbackUrl` rather than `redirectTo`, change the call to `signOut({ callbackUrl: "/login" })` and rerun type-check.

---

### Task 7: Documentation, Verification, and Visual QA

**Files:**
- Modify: `README.md`
- Modify: `.trellis/spec/frontend/component-guidelines.md` only if the final UI establishes a reusable auth-page convention not already captured there.
- Modify: `.trellis/spec/backend/api-contracts.md` only if registration becomes a stable API contract beyond this task.

- [ ] **Step 1: Update README auth setup**

In `README.md`, update the local login section to state:

````markdown
## 本地登录与注册

`/login` 提供邮箱密码登录和注册。注册用户默认是 `employee`。

如需使用 seeded admin / employee 账号登录本地数据库，请在运行 seed 前设置：

```env
SKILLS_REPO_SEED_ADMIN_PASSWORD=your-local-admin-password
SKILLS_REPO_SEED_EMPLOYEE_PASSWORD=your-local-employee-password
```

这些值只用于本地开发，不要提交真实密码。
````

- [ ] **Step 2: Run focused tests**

Run:

```bash
npm run test -- src/lib/auth-credentials.test.ts src/lib/user-accounts.test.ts src/lib/auth-config.test.ts src/lib/session-actor.test.ts src/app/globals.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Expected: all commands PASS.

- [ ] **Step 4: Run browser visual QA**

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000/login` in the in-app Browser and verify:

- Login mode renders without overflow at desktop and mobile widths.
- Register mode renders name, email, password, and confirm password fields.
- The page uses existing `ui-ux-pro-max` dark OLED tokens, green primary action, and terminal-inspired details.
- There is no marketing hero, white form panel, decorative gradient orb, or unrelated color palette.
- Logout from `/` clears the session and lands on `/login`.

Stop the dev server after visual QA.

---

## Plan Self-Review

- PRD coverage: login, registration, home protection, logout redirect, session-derived RBAC, secret handling, and `ui-ux-pro-max` login/register visual direction are covered by Tasks 1-7.
- Scope control: no SSO, password reset, email verification, MFA, user management screen, or Skills CRUD changes are included.
- Type consistency: registration input, auth user, credential secret, and store method names are defined before being used.
- Verification: focused Vitest checks, full lint/test/typecheck/build, and browser visual QA are included.
