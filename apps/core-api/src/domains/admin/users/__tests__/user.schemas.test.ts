import { ObjectIdSchema } from "@/utils/schemas";
import { describe, expect, it } from "vitest";
import {
  CreateUserSchema,
  ErrorResponseSchema,
  ListUsersQuerySchema,
  PaginationSchema,
  UpdateUserSchema,
  UserFiltersSchema,
  UserListResponseSchema,
  UserSchema,
} from "../user.schemas";

// Test constants
const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_EMAIL = "user@example.com";
const NEW_USER_EMAIL = "newuser@example.com";
const VALID_OBJECT_ID = "68842630e5d48662e0313589";
const VALID_DATETIME = "2024-01-26T12:00:00.000Z";
const DEFAULT_USER_ROLE = "user";

describe("User Schemas", () => {
  describe("UserSchema", () => {
    it("should validate a complete valid user object", () => {
      const validUser = {
        _id: VALID_OBJECT_ID,
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: DEFAULT_USER_ROLE,
        status: "active",
        createdAt: VALID_DATETIME,
        updatedAt: VALID_DATETIME,
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it("should validate user with optional fields omitted", () => {
      const minimalUser = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: DEFAULT_USER_ROLE,
        status: "active",
      };

      const result = UserSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });

    it("should require role to be specified", () => {
      const userWithoutRole = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        status: "active",
      };

      const result = UserSchema.safeParse(userWithoutRole);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.path.includes("role")),
        ).toBe(true);
      }
    });

    it("should reject invalid email format", () => {
      const invalidUser = {
        supabaseUserId: VALID_UUID,
        email: "invalid-email",
        role: "user",
        status: "active",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid email format");
      }
    });

    it("should reject invalid UUID for supabaseUserId", () => {
      const invalidUser = {
        supabaseUserId: "not-a-uuid",
        email: VALID_EMAIL,
        role: "user",
        status: "active",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Invalid uuid");
      }
    });

    it("should reject invalid role", () => {
      const invalidUser = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: "superadmin",
        status: "active",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should reject invalid status", () => {
      const invalidUser = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: "user",
        status: "banned",
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("should allow all valid status values", () => {
      const statuses = ["active", "inactive", "deleted"];
      statuses.forEach((status) => {
        const user = {
          supabaseUserId: VALID_UUID,
          email: VALID_EMAIL,
          role: "user",
          status,
        };

        const result = UserSchema.safeParse(user);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("CreateUserSchema", () => {
    it("should validate a complete create user request", () => {
      const validRequest = {
        email: NEW_USER_EMAIL,
        password: "password123",
        name: "John Doe",
        role: "user",
      };

      const result = CreateUserSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it("should validate request without optional password", () => {
      const validRequest = {
        email: NEW_USER_EMAIL,
        name: "John Doe",
        role: "user",
      };

      const result = CreateUserSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should reject short password", () => {
      const invalidRequest = {
        email: NEW_USER_EMAIL,
        password: "12345",
        name: "John Doe",
        role: "user",
      };

      const result = CreateUserSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Password must be at least 6 characters",
        );
      }
    });

    it("should reject short name", () => {
      const invalidRequest = {
        email: NEW_USER_EMAIL,
        name: "J",
        role: "user",
      };

      const result = CreateUserSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Name must be at least 2 characters",
        );
      }
    });

    it("should reject long name", () => {
      const invalidRequest = {
        email: NEW_USER_EMAIL,
        name: "A".repeat(101),
        role: "user",
      };

      const result = CreateUserSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "Name must not exceed 100 characters",
        );
      }
    });

    it("should reject missing required fields", () => {
      const invalidRequest = {};

      const result = CreateUserSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues).toHaveLength(3); // email, name, role
        expect(issues.map((i) => i.path[0])).toEqual(
          expect.arrayContaining(["email", "name", "role"]),
        );
      }
    });
  });

  describe("UpdateUserSchema", () => {
    it("should validate update with role only", () => {
      const validUpdate = {
        role: "admin",
      };

      const result = UpdateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    it("should validate update with status only", () => {
      const validUpdate = {
        status: "inactive",
      };

      const result = UpdateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    it("should validate update with both fields", () => {
      const validUpdate = {
        role: "admin",
        status: "active",
      };

      const result = UpdateUserSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    it("should reject empty update object", () => {
      const emptyUpdate = {};

      const result = UpdateUserSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "At least one field must be provided for update",
        );
      }
    });

    it("should reject deleted status in update", () => {
      const invalidUpdate = {
        status: "deleted",
      };

      const result = UpdateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("should allow active and inactive status", () => {
      const statuses = ["active", "inactive"];
      statuses.forEach((status) => {
        const update = { status };
        const result = UpdateUserSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("ListUsersQuerySchema", () => {
    it("should validate and transform page string to number", () => {
      const query = {
        page: "2",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(typeof result.data.page).toBe("number");
      }
    });

    it("should validate and transform limit string to number", () => {
      const query = {
        limit: "25",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("should transform includeDeleted string to boolean", () => {
      const queryTrue = { includeDeleted: "true" };
      const queryFalse = { includeDeleted: "false" };

      const resultTrue = ListUsersQuerySchema.safeParse(queryTrue);
      const resultFalse = ListUsersQuerySchema.safeParse(queryFalse);

      expect(resultTrue.success).toBe(true);
      expect(resultFalse.success).toBe(true);

      if (resultTrue.success) {
        expect(resultTrue.data.includeDeleted).toBe(true);
        expect(typeof resultTrue.data.includeDeleted).toBe("boolean");
      }

      if (resultFalse.success) {
        expect(resultFalse.data.includeDeleted).toBe(false);
        expect(typeof resultFalse.data.includeDeleted).toBe("boolean");
      }
    });

    it("should reject non-numeric page", () => {
      const query = {
        page: "abc",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject page less than 1", () => {
      const query = {
        page: "0",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Page must be at least 1");
      }
    });

    it("should reject limit outside valid range", () => {
      const queryTooSmall = { limit: "0" };
      const queryTooLarge = { limit: "101" };

      const resultSmall = ListUsersQuerySchema.safeParse(queryTooSmall);
      const resultLarge = ListUsersQuerySchema.safeParse(queryTooLarge);

      expect(resultSmall.success).toBe(false);
      expect(resultLarge.success).toBe(false);

      if (!resultSmall.success) {
        expect(resultSmall.error.issues[0]?.message).toBe(
          "Limit must be between 1 and 100",
        );
      }

      if (!resultLarge.success) {
        expect(resultLarge.error.issues[0]?.message).toBe(
          "Limit must be between 1 and 100",
        );
      }
    });

    it("should validate filter parameters", () => {
      const query = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: "admin",
        status: "active",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject(query);
      }
    });

    it("should reject invalid UUID in query", () => {
      const query = {
        supabaseUserId: "not-a-uuid",
      };

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should allow all optional fields to be omitted", () => {
      const query = {};

      const result = ListUsersQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });

  describe("ObjectIdSchema", () => {
    it("should validate valid MongoDB ObjectId", () => {
      const validIds = [
        "507f1f77bcf86cd799439011",
        VALID_OBJECT_ID,
        "AABBCCDDEEFF112233445566",
        "aabbccddeeff112233445566",
      ];

      validIds.forEach((id) => {
        const result = ObjectIdSchema.safeParse(id);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid ObjectId formats", () => {
      const invalidIds = [
        "507f1f77bcf86cd79943901", // Too short
        "507f1f77bcf86cd7994390111", // Too long
        "507f1f77bcf86cd79943901g", // Invalid character
        "not-an-objectid",
        "",
        "123",
      ];

      invalidIds.forEach((id) => {
        const result = ObjectIdSchema.safeParse(id);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            "Invalid ObjectId format",
          );
        }
      });
    });
  });

  describe("PaginationSchema", () => {
    it("should validate valid pagination", () => {
      const validPagination = {
        page: 1,
        limit: 10,
      };

      const result = PaginationSchema.safeParse(validPagination);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPagination);
      }
    });

    it("should allow optional fields", () => {
      const pageOnly = { page: 2 };
      const limitOnly = { limit: 20 };
      const empty = {};

      expect(PaginationSchema.safeParse(pageOnly).success).toBe(true);
      expect(PaginationSchema.safeParse(limitOnly).success).toBe(true);
      expect(PaginationSchema.safeParse(empty).success).toBe(true);
    });

    it("should enforce minimum page", () => {
      const invalidPagination = {
        page: 0,
      };

      const result = PaginationSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Page must be at least 1");
      }
    });

    it("should enforce limit range", () => {
      const tooSmall = { limit: 0 };
      const tooLarge = { limit: 101 };

      const resultSmall = PaginationSchema.safeParse(tooSmall);
      const resultLarge = PaginationSchema.safeParse(tooLarge);

      expect(resultSmall.success).toBe(false);
      expect(resultLarge.success).toBe(false);

      if (!resultSmall.success) {
        expect(resultSmall.error.issues[0]?.message).toBe(
          "Limit must be at least 1",
        );
      }

      if (!resultLarge.success) {
        expect(resultLarge.error.issues[0]?.message).toBe(
          "Limit must not exceed 100",
        );
      }
    });

    it("should reject non-integer values", () => {
      const floatPage = { page: 1.5 };
      const floatLimit = { limit: 10.7 };

      expect(PaginationSchema.safeParse(floatPage).success).toBe(false);
      expect(PaginationSchema.safeParse(floatLimit).success).toBe(false);
    });
  });

  describe("UserFiltersSchema", () => {
    it("should validate all filter fields", () => {
      const validFilters = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: "admin",
        status: "inactive",
        includeDeleted: true,
      };

      const result = UserFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFilters);
      }
    });

    it("should allow partial filters", () => {
      const emailOnly = { email: "test@example.com" };
      const roleOnly = { role: "user" };
      const statusOnly = { status: "active" };

      expect(UserFiltersSchema.safeParse(emailOnly).success).toBe(true);
      expect(UserFiltersSchema.safeParse(roleOnly).success).toBe(true);
      expect(UserFiltersSchema.safeParse(statusOnly).success).toBe(true);
    });

    it("should allow empty filters", () => {
      const emptyFilters = {};

      const result = UserFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should not accept status as deleted", () => {
      const filters = {
        status: "deleted",
      };

      const result = UserFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });
  });

  describe("UserListResponseSchema", () => {
    it("should validate complete list response", () => {
      const validResponse = {
        users: [
          {
            supabaseUserId: VALID_UUID,
            email: "user1@example.com",
            role: "user",
            status: "active",
          },
          {
            _id: VALID_OBJECT_ID,
            supabaseUserId: "650e8400-e29b-41d4-a716-446655440001",
            email: "user2@example.com",
            role: "admin",
            status: "inactive",
            createdAt: VALID_DATETIME,
            updatedAt: VALID_DATETIME,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const result = UserListResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.users).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }
    });

    it("should validate empty user list", () => {
      const emptyResponse = {
        users: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      const result = UserListResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const incompleteResponse = {
        users: [],
        total: 0,
        // Missing page, limit, totalPages
      };

      const result = UserListResponseSchema.safeParse(incompleteResponse);
      expect(result.success).toBe(false);
    });

    it("should reject invalid user in array", () => {
      const invalidResponse = {
        users: [
          {
            // Missing required fields
            email: VALID_EMAIL,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const result = UserListResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe("ErrorResponseSchema", () => {
    it("should validate simple error response", () => {
      const simpleError = {
        error: "Not found",
      };

      const result = ErrorResponseSchema.safeParse(simpleError);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(simpleError);
      }
    });

    it("should validate error with message", () => {
      const errorWithMessage = {
        error: "Validation failed",
        message: "Email is required",
      };

      const result = ErrorResponseSchema.safeParse(errorWithMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(errorWithMessage);
      }
    });

    it("should validate error with details", () => {
      const errorWithDetails = {
        error: "Validation failed",
        message: "Multiple validation errors",
        details: [
          {
            field: "email",
            message: "Invalid email format",
          },
          {
            field: "password",
            message: "Password is too short",
          },
        ],
      };

      const result = ErrorResponseSchema.safeParse(errorWithDetails);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.details).toHaveLength(2);
      }
    });

    it("should reject missing error field", () => {
      const invalidError = {
        message: "Something went wrong",
      };

      const result = ErrorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });

    it("should allow optional fields to be omitted", () => {
      const minimalError = {
        error: "Internal Server Error",
      };

      const result = ErrorResponseSchema.safeParse(minimalError);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBeUndefined();
        expect(result.data.details).toBeUndefined();
      }
    });
  });

  describe("Edge cases and special scenarios", () => {
    it("should handle datetime validation correctly", () => {
      const validDateTimes = [
        VALID_DATETIME,
        "2024-01-26T00:00:00.000Z",
        "2024-12-31T23:59:59.999Z",
      ];

      validDateTimes.forEach((datetime) => {
        const user = {
          supabaseUserId: VALID_UUID,
          email: VALID_EMAIL,
          role: "user",
          status: "active",
          createdAt: datetime,
          updatedAt: datetime,
        };

        const result = UserSchema.safeParse(user);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid datetime formats", () => {
      const invalidDateTimes = [
        "2024-01-26",
        "2024-01-26 12:00:00",
        "not-a-date",
        "2024-13-01T12:00:00.000Z", // Invalid month
      ];

      invalidDateTimes.forEach((datetime) => {
        const user = {
          supabaseUserId: VALID_UUID,
          email: VALID_EMAIL,
          role: "user",
          status: "active",
          createdAt: datetime,
        };

        const result = UserSchema.safeParse(user);
        expect(result.success).toBe(false);
      });
    });

    it("should handle special characters in email validation", () => {
      const validEmails = [
        "user+tag@example.com",
        "user.name@example.com",
        "user_name@example.com",
        "user@sub.example.com",
      ];

      validEmails.forEach((email) => {
        const request = {
          email,
          name: "Test User",
          role: "user",
        };

        const result = CreateUserSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it("should handle unicode characters in name", () => {
      const unicodeNames = [
        "José García",
        "李明",
        "Мария Иванова",
        "محمد الأحمد",
        "Σωκράτης",
      ];

      unicodeNames.forEach((name) => {
        const request = {
          email: VALID_EMAIL,
          name,
          role: "user",
        };

        const result = CreateUserSchema.safeParse(request);
        expect(result.success).toBe(true);
      });
    });

    it("should handle boundary values for pagination", () => {
      const boundaryValues = [
        { page: 1, limit: 1 },
        { page: 1, limit: 100 },
        { page: 999999, limit: 50 },
      ];

      boundaryValues.forEach((pagination) => {
        const result = PaginationSchema.safeParse(pagination);
        expect(result.success).toBe(true);
      });
    });

    it("should strip unknown fields", () => {
      const userWithExtra = {
        supabaseUserId: VALID_UUID,
        email: VALID_EMAIL,
        role: "user",
        status: "active",
        unknownField: "should be stripped",
        anotherUnknown: 123,
      };

      const result = UserSchema.safeParse(userWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("unknownField");
        expect(result.data).not.toHaveProperty("anotherUnknown");
      }
    });
  });
});
