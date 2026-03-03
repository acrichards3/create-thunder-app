module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "sort-keys", "typescript-sort-keys"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/**", "node_modules/**", "drizzle.config.ts", ".eslintrc.cjs"],
  rules: {
    // Prefer ?? over || when defaulting
    "@typescript-eslint/prefer-nullish-coalescing": [
      "error",
      { ignoreConditionalTests: true, ignoreMixedLogicalExpressions: true },
    ],
    // Flag impossible/always-truthy/always-falsy checks
    "@typescript-eslint/no-unnecessary-condition": "error",
    // Error on unreachable code
    "no-unreachable": "error",
    // Enforce `import type` when only used as types
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "separate-type-imports", prefer: "type-imports" },
    ],
    // Disallow || for value defaulting (allow in boolean test contexts only)
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
        message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
      },
      {
        selector: "BinaryExpression[operator='==='][right.type='Identifier'][right.name='undefined']",
        message: "Avoid explicit === undefined comparisons. Prefer nullish checks or refine types.",
      },
      {
        selector: "BinaryExpression[operator='!=='][right.type='Identifier'][right.name='undefined']",
        message: "Avoid explicit !== undefined comparisons. Prefer nullish checks or refine types.",
      },
      {
        selector: "BinaryExpression[operator='==='][left.type='Identifier'][left.name='undefined']",
        message: "Avoid explicit === undefined comparisons. Prefer nullish checks or refine types.",
      },
      {
        selector: "BinaryExpression[operator='!=='][left.type='Identifier'][left.name='undefined']",
        message: "Avoid explicit !== undefined comparisons. Prefer nullish checks or refine types.",
      },
      {
        selector: "CallExpression[callee.property.name='then']",
        message: "No .then(). Use async/await instead.",
      },
      {
        selector: "CallExpression[callee.property.name='catch']",
        message: "No .catch(). Use try/catch with async/await instead.",
      },
    ],
    // Existing project hygiene
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
    "sort-keys": ["error", "asc", { caseSensitive: false, natural: false }],
    "typescript-sort-keys/interface": "error",
    "typescript-sort-keys/string-enum": "error",
  },
};
