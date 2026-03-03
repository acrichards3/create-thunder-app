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
  plugins: ["@typescript-eslint", "perfectionist", "unicorn"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:sonarjs/recommended-legacy",
  ],
  ignorePatterns: ["dist/**", "node_modules/**", "drizzle.config.ts", ".eslintrc.cjs"],
  overrides: [
    {
      files: ["src/security/rateLimit.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
            message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
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
        "@typescript-eslint/strict-boolean-expressions": "off",
        curly: "off",
        "max-lines-per-function": "off",
        "max-statements": "off",
        "no-param-reassign": "off",
      },
    },
    {
      files: ["src/security/secureAdapter.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
            message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
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
        "@typescript-eslint/strict-boolean-expressions": "off",
        "@typescript-eslint/unbound-method": "off",
        complexity: "off",
        "max-lines-per-function": "off",
        "max-statements": "off",
        "sonarjs/cognitive-complexity": "off",
      },
    },
    {
      files: ["src/security/crypto.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
            message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
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
        "@typescript-eslint/strict-boolean-expressions": "off",
        complexity: "off",
        "max-depth": "off",
        "max-statements": "off",
        "no-param-reassign": "off",
        "sonarjs/cognitive-complexity": "off",
      },
    },
    {
      files: ["src/env/env.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
            message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
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
        "unicorn/no-process-exit": "off",
      },
    },
  ],
  rules: {
    // ─── Complexity bounds ───────────────────────────────────
    complexity: ["error", 7],
    "max-depth": ["error", 2],
    "max-lines": ["error", { max: 200, skipBlankLines: true, skipComments: true }],
    "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
    "max-nested-callbacks": ["error", 3],
    "max-params": ["error", 2],
    "max-statements": ["error", 15],

    // ─── Flat code style ─────────────────────────────────────
    "func-style": ["error", "expression"],
    curly: ["error", "all"],
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-console": "error",
    "no-else-return": "error",
    "no-multi-assign": "error",
    "no-nested-ternary": "error",
    "no-param-reassign": "error",
    "no-shadow": "off",
    "no-unneeded-ternary": "error",
    "no-unreachable": "error",
    "no-useless-return": "error",
    "prefer-const": "error",

    // ─── Restricted syntax ──────────────────────────────────
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
        selector: "TSPropertySignature[optional=true]",
        message: "Use `prop: T | undefined` instead of `prop?: T` to avoid accidental omission during refactors.",
      },
      {
        selector: "BinaryExpression[operator='==='][right.value='']",
        message: 'Don\'t compare to "". Use .length === 0 or .length > 0 instead.',
      },
      {
        selector: "BinaryExpression[operator='!=='][right.value='']",
        message: 'Don\'t compare to "". Use .length === 0 or .length > 0 instead.',
      },
      {
        selector: "BinaryExpression[operator='==='][left.value='']",
        message: 'Don\'t compare to "". Use .length === 0 or .length > 0 instead.',
      },
      {
        selector: "BinaryExpression[operator='!=='][left.value='']",
        message: 'Don\'t compare to "". Use .length === 0 or .length > 0 instead.',
      },
      {
        selector: "ForInStatement",
        message: "No for...in loops. Use Object.entries(), Object.keys(), or Object.values() instead.",
      },
      {
        selector: "ForOfStatement",
        message: "No for...of loops. Use .map(), .filter(), .reduce(), .forEach(), or Object.entries() instead.",
      },
      {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.property.name!='current']",
        message: "No object mutation. Use spread { ...obj, key: value } to create a new object.",
      },
      {
        selector: "CallExpression[callee.property.name='push']",
        message: "No .push(). Use spread [...arr, item] or .concat() to create a new array.",
      },
      {
        selector: "CallExpression[callee.property.name='pop']",
        message: "No .pop(). Use .slice(0, -1) to create a new array without the last element.",
      },
      {
        selector: "CallExpression[callee.property.name='shift']",
        message: "No .shift(). Use .slice(1) or destructuring to create a new array without the first element.",
      },
      {
        selector: "CallExpression[callee.property.name='unshift']",
        message: "No .unshift(). Use spread [item, ...arr] to create a new array.",
      },
      {
        selector: "CallExpression[callee.property.name='splice']",
        message: "No .splice(). Use .toSpliced() or .slice() + spread to create a new array.",
      },
      {
        selector: "CallExpression[callee.property.name='sort']",
        message: "No .sort() (mutates in place). Use .toSorted() to create a sorted copy.",
      },
      {
        selector: "CallExpression[callee.property.name='reverse']",
        message: "No .reverse() (mutates in place). Use .toReversed() to create a reversed copy.",
      },
      {
        selector: "CallExpression[callee.property.name='fill']",
        message: "No .fill() (mutates in place). Use .map() or Array.from() to create a new array.",
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

    // ─── Unicorn ─────────────────────────────────────────────
    "unicorn/consistent-function-scoping": "error",
    "unicorn/filename-case": "off",
    "unicorn/no-abusive-eslint-disable": "off",
    "unicorn/no-array-for-each": "off",
    "unicorn/no-for-loop": "error",
    "unicorn/no-lonely-if": "error",
    "unicorn/no-negated-condition": "error",
    "unicorn/no-negation-in-equality-check": "error",
    "unicorn/no-nested-ternary": "error",
    "unicorn/no-null": "off",
    "unicorn/no-process-exit": "off",
    "unicorn/no-useless-spread": "error",
    "unicorn/no-useless-undefined": "error",
    "unicorn/prefer-array-find": "error",
    "unicorn/prefer-array-flat": "error",
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/prefer-array-some": "error",
    "unicorn/prefer-logical-operator-over-ternary": "error",
    "unicorn/prefer-module": "off",
    "unicorn/prefer-switch": ["error", { minimumCases: 3 }],
    "unicorn/prefer-ternary": "off",
    "unicorn/prefer-top-level-await": "off",
    "unicorn/prevent-abbreviations": "off",

    // ─── SonarJS ─────────────────────────────────────────────
    "sonarjs/cognitive-complexity": ["error", 10],
    "sonarjs/max-switch-cases": ["error", 10],
    "sonarjs/no-collapsible-if": "error",
    "sonarjs/no-commented-code": "off",
    "sonarjs/no-duplicated-branches": "error",
    "sonarjs/no-identical-functions": "error",
    "sonarjs/no-nested-conditional": "error",
    "sonarjs/prefer-read-only-props": "off",
    "sonarjs/todo-tag": "off",

    // ─── Sorting (perfectionist) ────────────────────────────
    "perfectionist/sort-interfaces": [
      "error",
      {
        type: "alphabetical",
        groups: ["unknown", "method"],
        customGroups: { method: "^on.+" },
      },
    ],
    "perfectionist/sort-object-types": [
      "error",
      {
        type: "alphabetical",
        groups: ["unknown", "method"],
        customGroups: { method: "^on.+" },
      },
    ],
    "perfectionist/sort-objects": [
      "error",
      {
        type: "alphabetical",
      },
    ],

    // ─── TypeScript ──────────────────────────────────────────
    "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "separate-type-imports", prefer: "type-imports" },
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      { allowExpressions: true, allowTypedFunctionExpressions: true, allowIIFEs: true },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
    "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "@typescript-eslint/no-unsafe-argument": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/only-throw-error": "error",
    "@typescript-eslint/prefer-nullish-coalescing": [
      "error",
      { ignoreConditionalTests: true, ignoreMixedLogicalExpressions: true },
    ],
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      { allowNullableBoolean: true, allowNullableObject: false, allowNullableString: false, allowNumber: false },
    ],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
  },
};
