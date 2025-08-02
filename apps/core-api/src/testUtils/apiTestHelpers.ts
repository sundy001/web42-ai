import type { Application } from "express";
import type { Response } from "supertest";
import request from "supertest";
import { expect } from "vitest";

/**
 * Helper for making GET requests with supertest
 */
export function getRequest(app: Application, path: string) {
  return request(app).get(path);
}

/**
 * Helper for making POST requests with supertest
 */
export function postRequest(app: Application, path: string, body?: unknown) {
  const req = request(app).post(path);
  return body ? req.send(body) : req;
}

/**
 * Helper for making PUT requests with supertest
 */
export function putRequest(app: Application, path: string, body?: unknown) {
  const req = request(app).put(path);
  return body ? req.send(body) : req;
}

/**
 * Helper for making DELETE requests with supertest
 */
export function deleteRequest(app: Application, path: string) {
  return request(app).delete(path);
}

/**
 * Assertion helper for successful responses
 */
export function expectSuccess(response: Response, statusCode = 200) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toBeDefined();
  return response.body;
}

/**
 * Assertion helper for error responses
 */
export function expectError(
  response: Response,
  statusCode: number,
  errorType?: string,
  message?: string,
) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty("error");

  if (errorType) {
    expect(response.body.error).toBe(errorType);
  }

  if (message) {
    expect(response.body.message).toBe(message);
  }

  return response.body;
}

/**
 * Assertion helper for validation error responses
 */
export function expectValidationError(
  response: Response,
  expectedFields?: string[],
) {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty("error", "Validation Failed");

  if (expectedFields) {
    expect(response.body).toHaveProperty("details");
    expect(Array.isArray(response.body.details)).toBe(true);

    const fields = response.body.details.map(
      (detail: { field: string }) => detail.field,
    );
    expectedFields.forEach((field) => {
      expect(fields).toContain(field);
    });
  }

  return response.body;
}

/**
 * Assertion helper for paginated responses
 */
export function expectPaginatedResponse(
  response: Response,
  expectedPage = 1,
  expectedLimit = 10,
) {
  const body = expectSuccess(response);

  expect(body).toHaveProperty("items");
  expect(body).toHaveProperty("total");
  expect(body).toHaveProperty("page", expectedPage);
  expect(body).toHaveProperty("limit", expectedLimit);
  expect(body).toHaveProperty("totalPages");

  expect(Array.isArray(body.items)).toBe(true);
  expect(typeof body.total).toBe("number");
  expect(typeof body.totalPages).toBe("number");

  return body;
}

/**
 * Assertion helper for user object structure (User type fields)
 */
export function expectUserStructure(user: unknown) {
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("email");
  expect(user).toHaveProperty("name");
  expect(user).toHaveProperty("role");
  expect(user).toHaveProperty("status");
  expect(user).toHaveProperty("emailVerified");
  expect(user).toHaveProperty("createdAt");
  expect(user).toHaveProperty("updatedAt");

  // Optional auth provider fields
  const userObj = user as Record<string, unknown>;
  if (userObj.avatarUrl !== undefined) {
    expect(typeof userObj.avatarUrl).toBe("string");
  }
  if (userObj.lastSignInAt !== undefined) {
    expect(typeof userObj.lastSignInAt).toBe("string");
  }

  return user;
}
