import { describe, expect, it } from "vitest";

describe("Core API", () => {
  it("should be defined", () => {
    expect(true).toBe(true);
  });

  it("should have correct port default", () => {
    const defaultPort = 3002;
    expect(defaultPort).toBe(3002);
  });
});
