import { describe, expect, test } from "vitest";

import {
  forbiddenError,
  notFoundError,
  toErrorPayload,
  unauthorizedError,
  validationError,
} from "./api-errors";

describe("api errors", () => {
  test("maps known application errors to stable status codes and public messages", () => {
    expect(toErrorPayload(unauthorizedError())).toEqual({
      status: 401,
      body: { code: "unauthorized", error: "Authentication required" },
    });
    expect(toErrorPayload(forbiddenError())).toEqual({
      status: 403,
      body: { code: "forbidden", error: "Permission denied" },
    });
    expect(toErrorPayload(notFoundError("Skill"))).toEqual({
      status: 404,
      body: { code: "not_found", error: "Skill not found" },
    });
    expect(toErrorPayload(validationError("Skill name is required"))).toEqual({
      status: 400,
      body: { code: "validation", error: "Skill name is required" },
    });
  });

  test("hides unknown error details from API callers", () => {
    const payload = toErrorPayload(new Error("C:/secret/path leaked"));

    expect(payload).toEqual({
      status: 500,
      body: { code: "internal", error: "Request failed" },
    });
  });

  test("maps Prisma unique constraint errors to conflict responses", () => {
    expect(toErrorPayload({ code: "P2002" })).toEqual({
      status: 409,
      body: { code: "conflict", error: "Resource already exists" },
    });
  });
});
