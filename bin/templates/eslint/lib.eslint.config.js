import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import perfectionist from "eslint-plugin-perfectionist";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import describeStructure from "./eslint-rules/describe-structure.js";
import noDuplicateDescribe from "./eslint-rules/no-duplicate-describe.js";
import noEmptyIt from "./eslint-rules/no-empty-it.js";
import noMultipleAssertions from "./eslint-rules/no-multiple-assertions.js";
import noTodoWithoutDescription from "./eslint-rules/no-todo-without-description.js";

const RESTRICTED_SYNTAX = [
  {
    message: "Use ?? for defaulting; || is only allowed in boolean test contexts.",
    selector:
      "LogicalExpression[operator='||']:not([parent.type='IfStatement']):not([parent.type='ConditionalExpression']):not([parent.type='WhileStatement']):not([parent.type='DoWhileStatement']):not([parent.type='ForStatement'])",
  },
  {
    message: "Avoid explicit === undefined comparisons. Prefer nullish checks or refine types.",
    selector: "BinaryExpression[operator='==='][right.type='Identifier'][right.name='undefined']",
  },
  {
    message: "Avoid explicit !== undefined comparisons. Prefer nullish checks or refine types.",
    selector: "BinaryExpression[operator='!=='][right.type='Identifier'][right.name='undefined']",
  },
  {
    message: "Avoid explicit === undefined comparisons. Prefer nullish checks or refine types.",
    selector: "BinaryExpression[operator='==='][left.type='Identifier'][left.name='undefined']",
  },
  {
    message: "Avoid explicit !== undefined comparisons. Prefer nullish checks or refine types.",
    selector: "BinaryExpression[operator='!=='][left.type='Identifier'][left.name='undefined']",
  },
  {
    message: "No for...in loops. Use Object.entries(), Object.keys(), or Object.values() instead.",
    selector: "ForInStatement",
  },
  {
    message: "No for...of loops. Use .map(), .filter(), .reduce(), .forEach(), or Object.entries() instead.",
    selector: "ForOfStatement",
  },
  {
    message: "No object mutation. Use spread { ...obj, key: value } to create a new object.",
    selector: "AssignmentExpression[left.type='MemberExpression'][left.property.name!='current']",
  },
  {
    message: "No .push(). Use spread [...arr, item] or .concat() to create a new array.",
    selector: "CallExpression[callee.property.name='push']",
  },
  {
    message: "No .pop(). Use .slice(0, -1) to create a new array without the last element.",
    selector: "CallExpression[callee.property.name='pop']",
  },
  {
    message: "No .shift(). Use .slice(1) or destructuring to create a new array without the first element.",
    selector: "CallExpression[callee.property.name='shift']",
  },
  {
    message: "No .unshift(). Use spread [item, ...arr] to create a new array.",
    selector: "CallExpression[callee.property.name='unshift']",
  },
  {
    message: "No .splice(). Use .toSpliced() or .slice() + spread to create a new array.",
    selector: "CallExpression[callee.property.name='splice']",
  },
  {
    message: "No .sort() (mutates in place). Use .toSorted() to create a sorted copy.",
    selector: "CallExpression[callee.property.name='sort']",
  },
  {
    message: "No .reverse() (mutates in place). Use .toReversed() to create a reversed copy.",
    selector: "CallExpression[callee.property.name='reverse']",
  },
  {
    message: "No .fill() (mutates in place). Use .map() or Array.from() to create a new array.",
    selector: "CallExpression[callee.property.name='fill']",
  },
  {
    message: "No .then(). Use async/await instead.",
    selector: "CallExpression[callee.property.name='then']",
  },
  {
    message: "No .catch(). Use tryCatchAsync() from the lib workspace instead.",
    selector: "CallExpression[callee.property.name='catch']",
  },
  {
    message: "No try/catch blocks. Use tryCatch() or tryCatchAsync() from the lib workspace instead.",
    selector: "TryStatement",
  },
  {
    message: "expect() is only allowed in spec files (*.spec.ts). Move assertions to a test file.",
    selector: "CallExpression[callee.name='expect']",
  },
];

export default [
  {
    ignores: ["dist/**", "node_modules/**", "**/*.cjs"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        project: ["./tsconfig.eslint.json"],
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      perfectionist,
      sonarjs,
      unicorn,
    },
    rules: {
      ...tseslint.configs["recommended"].rules,
      ...tseslint.configs["recommended-type-checked"].rules,
      ...sonarjs.configs["recommended"].rules,
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "separate-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowIIFEs: true, allowTypedFunctionExpressions: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
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
      "@typescript-eslint/require-await": "error",
      complexity: ["error", 7],
      curly: ["error", "all"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "func-style": ["error", "expression"],
      "max-depth": ["error", 2],
      "max-nested-callbacks": ["error", 3],
      "max-params": ["error", 2],
      "max-statements": ["error", 15],
      "no-console": "error",
      "no-else-return": "error",
      "no-multi-assign": "error",
      "no-nested-ternary": "error",
      "no-param-reassign": "error",
      "no-restricted-syntax": ["error", ...RESTRICTED_SYNTAX],
      "no-shadow": "off",
      "no-unneeded-ternary": "error",
      "no-unreachable": "error",
      "no-useless-return": "error",
      "perfectionist/sort-interfaces": [
        "error",
        { customGroups: { method: "^on.+" }, groups: ["unknown", "method"], type: "alphabetical" },
      ],
      "perfectionist/sort-object-types": [
        "error",
        { customGroups: { method: "^on.+" }, groups: ["unknown", "method"], type: "alphabetical" },
      ],
      "perfectionist/sort-objects": ["error", { type: "alphabetical" }],
      "prefer-const": "error",
      "sonarjs/cognitive-complexity": ["error", 10],
      "sonarjs/max-switch-cases": ["error", 10],
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-commented-code": "off",
      "sonarjs/no-dead-store": "error",
      "sonarjs/no-duplicated-branches": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/no-nested-conditional": "error",
      "sonarjs/prefer-read-only-props": "off",
      "sonarjs/todo-tag": "off",
      "unicorn/consistent-function-scoping": "error",
      "unicorn/filename-case": "off",
      "unicorn/no-abusive-eslint-disable": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/no-await-expression-member": "error",
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
      "unicorn/prefer-at": "error",
      "unicorn/prefer-logical-operator-over-ternary": "error",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-switch": ["error", { minimumCases: 3 }],
      "unicorn/prefer-ternary": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    files: ["src/utils/objectUtils.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    files: ["src/utils/tryCatch.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["**/*.spec.ts"],
    plugins: {
      local: {
        rules: {
          "describe-structure": describeStructure,
          "no-duplicate-describe": noDuplicateDescribe,
          "no-empty-it": noEmptyIt,
          "no-multiple-assertions": noMultipleAssertions,
          "no-todo-without-description": noTodoWithoutDescription,
        },
      },
    },
    rules: {
      complexity: "off",
      "local/describe-structure": "error",
      "local/no-duplicate-describe": "error",
      "local/no-empty-it": "error",
      "local/no-multiple-assertions": "error",
      "local/no-todo-without-description": "error",
      "max-nested-callbacks": "off",
      "max-statements": "off",
      "no-param-reassign": "off",
      "no-restricted-syntax": [
        "error",
        { message: "Use it() instead of test().", selector: "CallExpression[callee.name='test']" },
        {
          message: "No it.skip() — remove or fix the test instead.",
          selector: "CallExpression[callee.object.name='it'][callee.property.name='skip']",
        },
        {
          message: "No describe.skip() — remove or fix the test instead.",
          selector: "CallExpression[callee.object.name='describe'][callee.property.name='skip']",
        },
      ],
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-identical-functions": "off",
      "unicorn/consistent-function-scoping": "off",
    },
  },
];
