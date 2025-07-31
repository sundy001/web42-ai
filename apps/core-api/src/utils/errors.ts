// HTTP Status Code Constants
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error Name Constants
export const ERROR_NAMES = {
  API_ERROR: "ApiError",
  BAD_REQUEST_ERROR: "BadRequestError",
  UNAUTHORIZED_ERROR: "UnauthorizedError",
  FORBIDDEN_ERROR: "ForbiddenError",
  NOT_FOUND_ERROR: "NotFoundError",
  CONFLICT_ERROR: "ConflictError",
} as const;

// Error options type for error chaining
export type ErrorOptions = {
  cause?: Error;
};

export class ApiError extends Error {
  public statusCode: number;
  public originalError?: Error;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.statusCode = options?.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.name = ERROR_NAMES.API_ERROR;
    this.originalError = options?.cause;
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, { statusCode: HTTP_STATUS.CONFLICT, cause: options?.cause });
    this.name = ERROR_NAMES.CONFLICT_ERROR;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      cause: options?.cause,
    });
    this.name = ERROR_NAMES.NOT_FOUND_ERROR;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      cause: options?.cause,
    });
    this.name = ERROR_NAMES.BAD_REQUEST_ERROR;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      cause: options?.cause,
    });
    this.name = ERROR_NAMES.UNAUTHORIZED_ERROR;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      cause: options?.cause,
    });
    this.name = ERROR_NAMES.FORBIDDEN_ERROR;
  }
}
