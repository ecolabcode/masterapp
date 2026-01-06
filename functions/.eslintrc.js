module.exports = {
  root: true,
  env: { es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['lib/**', 'node_modules/**'],
  rules: {
    // ✅ do not block deploy for "any"
    '@typescript-eslint/no-explicit-any': 'off',
    // optional: don't block deploy for unused vars
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};
