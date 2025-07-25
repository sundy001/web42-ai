import eslintCommentsPlugin from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import onlyWarn from "eslint-plugin-only-warn";
import promisePlugin from "eslint-plugin-promise";
import securityPlugin from "eslint-plugin-security";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import turboPlugin from "eslint-plugin-turbo";
import unicornPlugin from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      unicorn: unicornPlugin,
      sonarjs: sonarjsPlugin,
      security: securityPlugin,
      promise: promisePlugin,
      import: importPlugin,
      "@eslint-community/eslint-comments": eslintCommentsPlugin,
      onlyWarn,
    },
    rules: {
      // Turbo rules
      "turbo/no-undeclared-env-vars": "warn",

      // Import rules
      "import/no-unresolved": "off", // TypeScript handles this
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // Unicorn rules - only non-default configurations
      "unicorn/no-unused-properties": "warn",
      "unicorn/prefer-switch": "error",
      "unicorn/prefer-ternary": "error",

      // SonarJS rules
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],

      // Security rules - only severity changes from default
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-child-process": "warn",
      "security/detect-possible-timing-attacks": "warn",

      // Promise rules - only non-default configurations
      "promise/no-native": "off",
      "promise/no-nesting": "warn",
      "promise/no-promise-in-callback": "warn",
      "promise/no-callback-in-promise": "warn",
      "promise/avoid-new": "off",
      "promise/no-return-in-finally": "warn",
      "promise/valid-params": "warn",

      // ESLint comments rules - only non-default configurations
      "@eslint-community/eslint-comments/no-use": "off",
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: ["eslint-enable"] },
      ],

      // Disable import order rule
      "import/order": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "*.min.js",
    ],
  },
];
