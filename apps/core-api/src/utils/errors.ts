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

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.name = ERROR_NAMES.API_ERROR;
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT);
    this.name = ERROR_NAMES.CONFLICT_ERROR;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.NOT_FOUND);
    this.name = ERROR_NAMES.NOT_FOUND_ERROR;
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.name = ERROR_NAMES.BAD_REQUEST_ERROR;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
    this.name = ERROR_NAMES.UNAUTHORIZED_ERROR;
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string) {
    super(message, HTTP_STATUS.FORBIDDEN);
    this.name = ERROR_NAMES.FORBIDDEN_ERROR;
  }
}
