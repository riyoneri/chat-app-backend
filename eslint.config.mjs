// @ts-check
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default [
  ...[
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    eslintPluginUnicorn.configs["flat/recommended"],
    eslintConfigPrettier,
  ].map((config) => ({ ...config, ignores: ["dist/**/*"] })),
  {
    ignores: ["dist/**/*"],
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: false,
        },
      ],
      "arrow-body-style": ["error", "as-needed"],
      eqeqeq: ["error", "always"],
      "no-constructor-return": "error",
      "no-duplicate-imports": "error",
      "no-self-compare": "error",
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          functions: true,
          classes: true,
          variables: true,
          allowNamedExports: true,
        },
      ],
      "no-else-return": "error",
      "no-lonely-if": "error",
      "no-negated-condition": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "operator-assignment": ["error", "always"],
      "prefer-arrow-callback": "error",
      "unicorn/no-array-reduce": "off",
    },
  },
];
