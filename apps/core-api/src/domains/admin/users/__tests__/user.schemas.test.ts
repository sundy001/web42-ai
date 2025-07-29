import { describe, expect, it } from "bun:test";
import {
  expectValidationFailure,
  expectValidationSuccess,
} from "../../../../testUtils";
import {
  CreateUserSchema,
  ListUsersQuerySchema,
  ObjectIdSchema,
  PaginationSchema,
  UpdateUserSchema,
  UserFiltersSchema,
} from "../user.schemas";
import testFixtures from "./fixtures/users.json";

describe("User Schemas", () => {
  describe("CreateUserSchema", () => {
    it("should validate correct user data", () => {
      testFixtures.validUsers.forEach((user) => {
        expectValidationSuccess(CreateUserSchema, user);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "",
        "invalid",
        "test@",
        "@example.com",
        "test..email@example.com",
      ];

      invalidEmails.forEach((email) => {
        expectValidationFailure(
          CreateUserSchema,
          {
            email,
            password: "password123",
            name: "Test User",
            role: "user",
          },
          ["Invalid email format"],
        );
      });
    });

    it("should reject short passwords", () => {
      expectValidationFailure(
        CreateUserSchema,
        {
          email: "test@example.com",
          password: "123",
          name: "Test User",
          role: "user",
        },
        ["Password must be at least 6 characters"],
      );
    });

    it("should reject invalid names", () => {
      // Too short
      expectValidationFailure(
        CreateUserSchema,
        {
          email: "test@example.com",
          password: "password123",
          name: "A",
          role: "user",
        },
        ["Name must be at least 2 characters"],
      );

      // Too long
      expectValidationFailure(
        CreateUserSchema,
        {
          email: "test@example.com",
          password: "password123",
          name: "A".repeat(101),
          role: "user",
        },
        ["Name must not exceed 100 characters"],
      );
    });

    it("should reject invalid roles", () => {
      expectValidationFailure(CreateUserSchema, {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "invalid",
      });
    });

    it("should allow optional password", () => {
      expectValidationSuccess(CreateUserSchema, {
        email: "test@example.com",
        name: "Test User",
        role: "user",
      });
    });
  });

  describe("UpdateUserSchema", () => {
    it("should validate correct update data", () => {
      testFixtures.updateData.forEach((update) => {
        expectValidationSuccess(UpdateUserSchema, update);
      });
    });

    it("should reject empty update objects", () => {
      expectValidationFailure(UpdateUserSchema, {}, [
        "At least one field must be provided for update",
      ]);
    });

    it("should reject invalid roles", () => {
      expectValidationFailure(UpdateUserSchema, {
        role: "invalid",
      });
    });

    it("should reject invalid status values", () => {
      expectValidationFailure(UpdateUserSchema, {
        status: "deleted", // Cannot set to deleted via update
      });

      expectValidationFailure(UpdateUserSchema, {
        status: "invalid",
      });
    });

    it("should accept partial updates", () => {
      expectValidationSuccess(UpdateUserSchema, { role: "admin" });
      expectValidationSuccess(UpdateUserSchema, { status: "inactive" });
    });
  });

  describe("ListUsersQuerySchema", () => {
    it("should validate correct query parameters", () => {
      testFixtures.paginationTestCases.forEach(({ page, limit }) => {
        expectValidationSuccess(ListUsersQuerySchema, {
          page: page.toString(),
          limit: limit.toString(),
        });
      });
    });

    it("should handle string-to-number conversion for pagination", () => {
      const result = expectValidationSuccess(ListUsersQuerySchema, {
        page: "2",
        limit: "5",
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(typeof result.page).toBe("number");
      expect(typeof result.limit).toBe("number");
    });

    it("should reject invalid pagination values", () => {
      // Invalid page
      expectValidationFailure(
        ListUsersQuerySchema,
        {
          page: "0",
          limit: "10",
        },
        ["Page must be at least 1"],
      );

      // Invalid limit
      expectValidationFailure(
        ListUsersQuerySchema,
        {
          page: "1",
          limit: "101",
        },
        ["Limit must be between 1 and 100"],
      );

      // Non-numeric values
      expectValidationFailure(ListUsersQuerySchema, {
        page: "abc",
        limit: "10",
      });
    });

    it("should validate filter parameters", () => {
      expectValidationSuccess(ListUsersQuerySchema, {
        role: "admin",
        status: "active",
        email: "test@example.com",
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
        includeDeleted: "true",
      });
    });

    it("should convert includeDeleted string to boolean", () => {
      const result1 = expectValidationSuccess(ListUsersQuerySchema, {
        includeDeleted: "true",
      });
      expect(result1.includeDeleted).toBe(true);

      const result2 = expectValidationSuccess(ListUsersQuerySchema, {
        includeDeleted: "false",
      });
      expect(result2.includeDeleted).toBe(false);
    });

    it("should reject invalid UUID for supabaseUserId", () => {
      expectValidationFailure(ListUsersQuerySchema, {
        supabaseUserId: "invalid-uuid",
      });
    });

    it("should reject invalid enum values", () => {
      expectValidationFailure(ListUsersQuerySchema, {
        role: "invalid",
      });

      expectValidationFailure(ListUsersQuerySchema, {
        status: "invalid",
      });
    });
  });

  describe("ObjectIdSchema", () => {
    it("should validate correct ObjectId formats", () => {
      testFixtures.validObjectIds.forEach((id) => {
        expectValidationSuccess(ObjectIdSchema, id);
      });
    });

    it("should reject invalid ObjectId formats", () => {
      testFixtures.invalidObjectIds.forEach((id) => {
        expectValidationFailure(ObjectIdSchema, id, [
          "Invalid ObjectId format",
        ]);
      });
    });
  });

  describe("UserFiltersSchema", () => {
    it("should validate all filter combinations", () => {
      expectValidationSuccess(UserFiltersSchema, {
        supabaseUserId: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        role: "admin",
        status: "active",
        includeDeleted: true,
      });
    });

    it("should allow partial filters", () => {
      expectValidationSuccess(UserFiltersSchema, { role: "admin" });
      expectValidationSuccess(UserFiltersSchema, { status: "active" });
      expectValidationSuccess(UserFiltersSchema, {});
    });

    it("should reject invalid values", () => {
      expectValidationFailure(UserFiltersSchema, {
        supabaseUserId: "invalid-uuid",
      });

      expectValidationFailure(UserFiltersSchema, {
        role: "invalid",
      });

      expectValidationFailure(UserFiltersSchema, {
        status: "invalid",
      });
    });
  });

  describe("PaginationSchema", () => {
    it("should validate correct pagination values", () => {
      expectValidationSuccess(PaginationSchema, { page: 1, limit: 10 });
      expectValidationSuccess(PaginationSchema, { page: 5, limit: 50 });
      expectValidationSuccess(PaginationSchema, { page: 1, limit: 100 });
    });

    it("should reject invalid pagination values", () => {
      expectValidationFailure(PaginationSchema, { page: 0, limit: 10 }, [
        "Page must be at least 1",
      ]);

      expectValidationFailure(PaginationSchema, { page: 1, limit: 0 }, [
        "Limit must be at least 1",
      ]);

      expectValidationFailure(PaginationSchema, { page: 1, limit: 101 }, [
        "Limit must not exceed 100",
      ]);
    });

    it("should allow optional fields", () => {
      expectValidationSuccess(PaginationSchema, {});
      expectValidationSuccess(PaginationSchema, { page: 2 });
      expectValidationSuccess(PaginationSchema, { limit: 20 });
    });
  });
});
