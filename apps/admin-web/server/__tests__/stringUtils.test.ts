import { describe, expect, it } from "vitest";
import { capitalizeWords, slugify } from "../stringUtils";

describe("stringUtils", () => {
  describe("capitalizeWords", () => {
    it("should capitalize the first letter of each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
      expect(capitalizeWords("the quick brown fox")).toBe(
        "The Quick Brown Fox",
      );
    });

    it("should handle single words", () => {
      expect(capitalizeWords("hello")).toBe("Hello");
      expect(capitalizeWords("WORLD")).toBe("World");
    });

    it("should handle empty strings and invalid inputs", () => {
      expect(capitalizeWords("")).toBe("");
      expect(capitalizeWords("   ")).toBe("   ");
      expect(capitalizeWords(null as any)).toBe("");
      expect(capitalizeWords(undefined as any)).toBe("");
      expect(capitalizeWords(123 as any)).toBe("");
    });

    it("should handle strings with extra spaces", () => {
      expect(capitalizeWords("  hello   world  ")).toBe("  Hello   World  ");
    });

    it("should handle special characters", () => {
      expect(capitalizeWords("hello-world test_case")).toBe(
        "Hello-world Test_case",
      );
    });
  });

  describe("slugify", () => {
    it("should convert strings to URL-friendly slugs", () => {
      expect(slugify("Hello World")).toBe("hello-world");
      expect(slugify("The Quick Brown Fox")).toBe("the-quick-brown-fox");
    });

    it("should remove special characters", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
      expect(slugify("Test@#$%^&*()String")).toBe("teststring");
    });

    it("should handle multiple spaces and underscores", () => {
      expect(slugify("hello    world")).toBe("hello-world");
      expect(slugify("hello___world")).toBe("hello-world");
      expect(slugify("hello---world")).toBe("hello-world");
    });

    it("should trim leading and trailing dashes", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
      expect(slugify("---hello world---")).toBe("hello-world");
    });

    it("should handle empty strings and invalid inputs", () => {
      expect(slugify("")).toBe("");
      expect(slugify("   ")).toBe("");
      expect(slugify(null as any)).toBe("");
      expect(slugify(undefined as any)).toBe("");
      expect(slugify(123 as any)).toBe("");
    });

    it("should handle strings with only special characters", () => {
      expect(slugify("!@#$%^&*()")).toBe("");
      expect(slugify("---")).toBe("");
    });
  });
});
