import pluginJs from "@eslint/js";
import globals from "globals";
import esImport from "eslint-plugin-import"
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/**/*/tsconfig.json'
        ]
      },
      globals: { ...globals.browser, ...globals.node }
    },
    plugins: { import: esImport },
    // extends: ['plugin:import/recommended'],
    rules: {
      "import/order": [
        "error",
        {
          "groups": [
            "index",
            "sibling",
            "parent",
            "internal",
            "external",
            "builtin",
            "object",
            "type"
          ]
        }
      ],
      // Allow ignoring underscore-prefixed arguments
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          // "caughtErrors": "all",
          // "caughtErrorsIgnorePattern": "^_",
          // "destructuredArrayIgnorePattern": "^_",
          // "varsIgnorePattern": "^_",
          // "ignoreRestSiblings": true
        }
      ]
    }

  },
  // esImport.configs,
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
).map(c => {
  return {
    ...c,
    files: ["packages/*/src/*.ts", "packages/*/tests/*.ts",],
    ignores: ["**/generated/*"]

  }
});