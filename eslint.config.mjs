// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from "eslint-config-prettier";


const files = ["src/**/*.ts"]
const ignores = ["src/yarn_spinner.ts"]

export default tseslint.config(
  {
    files,
    ignores,
    ...eslint.configs.recommended,

  },
  ...tseslint.configs.recommendedTypeChecked.map(c => {
    return {
      ...c,
      files,
      ignores
    }
  }),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files,
    ignores,
    ...eslintConfigPrettier
  },
);