import { config } from "@web42-ai/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];