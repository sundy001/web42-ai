import { describe, expect, it, vi } from "vitest";
import { getAccessTokenFromCookies } from "../serverUtils";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("serverUtils", () => {
  describe("getAccessTokenFromCookies", () => {
    it("should return access token when cookie exists", async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: "test-access-token" }),
      };

      const { cookies } = await import("next/headers");
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const token = await getAccessTokenFromCookies();

      expect(token).toBe("test-access-token");
      expect(mockCookies.get).toHaveBeenCalledWith("web42_access_token");
    });

    it("should return undefined when cookie does not exist", async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(undefined),
      };

      const { cookies } = await import("next/headers");
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const token = await getAccessTokenFromCookies();

      expect(token).toBeUndefined();
      expect(mockCookies.get).toHaveBeenCalledWith("web42_access_token");
    });
  });
});
