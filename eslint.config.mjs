import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    languageOptions: {
      parserOptions: {
        project: [
          './packages/*/tsconfig.json'
        ]
      },
      globals: { ...globals.browser, ...globals.node }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
).map(c => {
  return {
    ...c,
    files: ["packages/*/src/*.ts"],
    ignores: ["**/yarn_spinner.ts"]

  }
});