import { config } from "@web42-ai/eslint-config/base";
import type { Linter } from "eslint";

export default [
  ...config,
  {
    languageOptions: {
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
  },
] satisfies Linter.Config[];
