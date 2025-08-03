import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    env: {
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_API_KEY: "test-api-key",
    },
  },
});
