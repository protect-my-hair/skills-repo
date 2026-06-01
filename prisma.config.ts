import "dotenv/config";
import { defineConfig } from "prisma/config";

const DEFAULT_DATABASE_URL =
  "postgresql://invalid.localhost/skills_repo?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Allow generate/typecheck to run without requiring a real DB URL in every shell.
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
