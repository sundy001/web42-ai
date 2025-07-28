import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./index.js";

describe("Chat API", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("services");
  });

  it("should return API status", async () => {
    const response = await request(app).get("/api/v1/status").expect(200);

    expect(response.body).toHaveProperty("message", "Chat API is running");
    expect(response.body).toHaveProperty("version");
    expect(response.body).toHaveProperty("timestamp");
  });

  it("should send a chat message", async () => {
    const response = await request(app)
      .post("/api/v1/chat/send")
      .send({
        message: "Hello, I want to build a website",
      })
      .expect(200);

    expect(response.body).toHaveProperty("sessionId");
    expect(response.body).toHaveProperty("userMessage");
    expect(response.body).toHaveProperty("aiMessage");
    expect(response.body.userMessage.content).toBe(
      "Hello, I want to build a website",
    );
    expect(response.body.userMessage.isUser).toBe(true);
    expect(response.body.aiMessage.isUser).toBe(false);
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body).toHaveProperty("error", "Not Found");
  });
});
