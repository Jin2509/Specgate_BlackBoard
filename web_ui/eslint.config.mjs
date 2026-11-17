// Configures ESLint: Next.js rules plus import order, feature boundaries and type-only imports.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FEATURE_DEEP_IMPORT = {
  group: ["@/features/*/*", "!@/features/*/server"],
  message:
    "Import another feature only through its public entries: @/features/<name> or, on the server, @/features/<name>/server.",
};
const ROUTE_IMPORT = { group: ["@/app/*"], message: "Only routes live in app/; nothing imports them." };
const DEEP_RELATIVE_IMPORT = {
  group: ["../../*"],
  message: "Relative imports stay inside one feature and climb at most one level; use the @/ alias.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-namespace": "error",
      "import/no-cycle": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "no-restricted-imports": ["error", { patterns: [FEATURE_DEEP_IMPORT, ROUTE_IMPORT, DEEP_RELATIVE_IMPORT] }],
    },
  },
  {
    files: ["src/components/**", "src/hooks/**", "src/lib/**", "src/utils/**", "src/types/**", "src/config/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ROUTE_IMPORT,
            DEEP_RELATIVE_IMPORT,
            { group: ["@/features/*", "@/features/**"], message: "Shared code must not depend on features." },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
