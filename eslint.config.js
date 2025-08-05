const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-plugin-prettier');

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  js.configs.recommended, // base JS rules

  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node,
    },
    plugins: {
      prettier,
    },
    rules: {
      // Show Prettier issues as ESLint errors
      'prettier/prettier': 'error',
    },
    ignores: ['node_modules', 'dist', '.env'],
  },
];
