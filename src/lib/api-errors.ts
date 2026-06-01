export type ApiErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict";

export interface ApiErrorPayload {
  status: number;
  body: {
    code: ApiErrorCode | "internal";
    error: string;
  };
}

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  validation: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
};

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function validationError(message: string): ApiError {
  return new ApiError("validation", message);
}

export function unauthorizedError(): ApiError {
  return new ApiError("unauthorized", "Authentication required");
}

export function forbiddenError(): ApiError {
  return new ApiError("forbidden", "Permission denied");
}

export function notFoundError(resource: string): ApiError {
  return new ApiError("not_found", `${resource} not found`);
}

export function conflictError(message: string): ApiError {
  return new ApiError("conflict", message);
}

export function toErrorPayload(error: unknown): ApiErrorPayload {
  if (error instanceof ApiError) {
    return {
      status: STATUS_BY_CODE[error.code],
      body: {
        code: error.code,
        error: error.message,
      },
    };
  }

  if (isPrismaUniqueConstraintError(error)) {
    return {
      status: STATUS_BY_CODE.conflict,
      body: {
        code: "conflict",
        error: "Resource already exists",
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "internal",
      error: "Request failed",
    },
  };
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
