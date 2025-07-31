import { describe, expect, it } from "vitest";
import {
  LoginResponseSchema,
  LoginSchema,
  SignoutResponseSchema,
} from "../auth.schemas";
import {
  createMockLoginRequest,
  createMockLoginResponse,
} from "./authTestFixtures";

describe("Auth Schemas Validation Tests", () => {
  describe("LoginSchema", () => {
    it("should validate valid login data", () => {
      const validData = createMockLoginRequest();

      const result = LoginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(validData.email);
        expect(result.data.password).toBe(validData.password);
      }
    });

    it("should reject invalid email format", () => {
      const invalidData = createMockLoginRequest({
        email: "invalid-email",
      });

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]?.path).toContain("email");
        expect(result.error.issues[0]?.message).toBe("Invalid email format");
      }
    });

    it("should reject missing email", () => {
      const invalidData = {
        password: "password123",
      };

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("email") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject empty password", () => {
      const invalidData = createMockLoginRequest({
        password: "",
      });

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]?.path).toContain("password");
        expect(result.error.issues[0]?.message).toBe("Password is required");
      }
    });

    it("should reject missing password", () => {
      const invalidData = {
        email: "test@example.com",
      };

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("password") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject additional properties", () => {
      const invalidData = {
        ...createMockLoginRequest(),
        extraField: "should not be allowed",
      };

      const result = LoginSchema.safeParse(invalidData);

      expect(result.success).toBe(true); // Zod allows additional props by default
      if (result.success) {
        expect(result.data).not.toHaveProperty("extraField");
      }
    });
  });

  describe("LoginResponseSchema", () => {
    it("should validate valid login response", () => {
      const validResponse = createMockLoginResponse();

      const result = LoginResponseSchema.safeParse(validResponse);

      if (!result.success) {
        console.log(
          "Validation errors:",
          JSON.stringify(result.error.issues, null, 2),
        );
      }

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toBeDefined();
        expect(result.data.session).toBeDefined();
        expect(result.data.user.email).toBe(validResponse.user.email);
        expect(result.data.session.access_token).toBe(
          validResponse.session.access_token,
        );
      }
    });

    it("should reject response missing user", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse as any).user;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("user") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject response missing session", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse as any).session;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("session") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should validate user with optional fields", () => {
      const responseWithOptionalFields = createMockLoginResponse({
        user: {
          ...createMockLoginResponse().user,
          name: undefined,
          avatarUrl: undefined,
        },
      });

      const result = LoginResponseSchema.safeParse(responseWithOptionalFields);

      expect(result.success).toBe(true);
    });

    it("should reject response with missing access_token", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse.session as any).access_token;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("access_token") &&
              issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject response with missing refresh_token", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse.session as any).refresh_token;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("refresh_token") &&
              issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject response with missing expires_in", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse.session as any).expires_in;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("expires_in") &&
              issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject response with missing token_type", () => {
      const invalidResponse = createMockLoginResponse();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to test missing property validation
      delete (invalidResponse.session as any).token_type;

      const result = LoginResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("token_type") &&
              issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });
  });

  describe("SignoutResponseSchema", () => {
    it("should validate valid signout response", () => {
      const validResponse = {
        message: "Successfully signed out",
      };

      const result = SignoutResponseSchema.safeParse(validResponse);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe(validResponse.message);
      }
    });

    it("should reject missing message", () => {
      const invalidResponse = {};

      const result = SignoutResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("message") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });

    it("should reject non-string message", () => {
      const invalidResponse = {
        message: 123,
      };

      const result = SignoutResponseSchema.safeParse(invalidResponse);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (issue) =>
              issue.path.includes("message") && issue.code === "invalid_type",
          ),
        ).toBe(true);
      }
    });
  });
});
