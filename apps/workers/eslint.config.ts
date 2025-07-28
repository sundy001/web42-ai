import { config } from "@web42-ai/eslint-config/base";
import type { Linter } from "eslint";

export default [
  ...config,
  {
    languageOptions: {
      globals: {
        // Cloudflare Workers globals
        addEventListener: "readonly",
        Response: "readonly",
        Request: "readonly",
        fetch: "readonly",
        caches: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        atob: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        FormData: "readonly",
        ReadableStream: "readonly",
        WritableStream: "readonly",
        TransformStream: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
  },
  {
    files: ["worker-configuration.d.ts"],
    rules: {
      "@eslint-community/eslint-comments/require-description": "off",
    },
  },
] satisfies Linter.Config[];