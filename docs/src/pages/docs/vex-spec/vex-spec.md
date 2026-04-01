# Vex spec (.vex)

Vex spec is a small, line-oriented language for writing structured specifications. Files use the `.vex` extension. The workspace ships a VS Code/Cursor extension (`packages/vex-language`) for syntax highlighting, and **vexkit** parses and validates the same grammar for tooling (validation UI, codegen, and tests).

This page describes the **language** as implemented by the parser in `packages/vexkit/src/vex/`. If your file does not match these rules, you will get parse or validation errors.

## What a file expresses

A `.vex` file builds a tree of **describe** blocks. Each describe can contain nested describes and **when** clauses. Under each **when**, you list branches using **and** and **it** to describe behavior in a way that reads like nested examples.

Conceptually:

- **describe** — names a feature, scenario group, or nested scope.
- **when** — a condition or context under that describe.
- **and** — adds a sub-condition or an extra branch; can chain to more **and** or end in **it**.
- **it** — the leaf: the concrete expectation or example for that path.

The AST types in code are `VexDocument` → `VexDescribeBlock` → `VexWhen` → branches of `VexAnd` | `VexIt` (see `packages/vexkit/src/vex/ast.ts`).

## Lines and indentation

- **One construct per line** that participates in the tree (after leading spaces are stripped for classification).
- **Spaces only** — tab characters are rejected.
- **Indentation is in steps of 4 spaces.** Non-zero indents that are not a multiple of 4 spaces are errors.
- **Blank lines** are ignored.

Keywords **`describe`**, **`when`**, **`and`**, and **`it`** are **case-insensitive** when they start a line’s content (after indent). The canonical form in examples is lowercase.

## Top level

- The file must contain **at least one** top-level line of the form `describe: …` (indent **0** spaces).
- Any other top-level line must also be a `describe:` line.

## Describe

Format:

```text
describe: <label>
```

- `<label>` is non-empty text after the colon (leading/trailing spaces around the label are trimmed).
- **Nested describe** — indented **exactly 4 spaces** deeper than its parent describe line. It must sit under an existing describe; you cannot nest a describe under `when` / `and` / `it`.

Sibling **describe** blocks at the same indent cannot reuse the same **label** (duplicate labels among siblings are rejected in validation).

## When, and, it

These lines must be **indented** (they cannot start at column 0). The first **`when`** under a **describe** is indented **4 spaces** more than that **describe** line.

Format:

```text
when: <label>
and: <label>
it: <label>
```

- Each must include **non-empty** text after the colon.

### Placement rules

- **`when`** — only directly under a **describe**, at **exactly** parent describe indent + 4 spaces.
- **`and`** — under a **`when`** or under another **`and`**, at parent indent + 4 spaces. Not directly under **describe** or under **it**.
- **`it`** — under **`when`** or **`and`**, at parent indent + 4 spaces. Not directly under **describe**. You cannot nest **`it`** under another **`it`**.

### Branching under a when

A **`when`** has a list of **branches**. Each branch is either a single **`it`**, or an **`and`** chain that eventually ends in exactly one **`it`**.

- There must be **at least one** branch under each **`when`**.
- At the **same** indent as siblings under that **`when`**, you may have **at most one** direct **`it`**. If you need more outcomes at that level, use **`and`** branches instead.
- Each **`and`** must have exactly **one** child: another **`and`** or an **`it`**. An **`and`** cannot be left incomplete.

Sibling lines at the same indent (another **`when`**, **`and`**, or **`it`**) **close** deeper stack entries according to the parser’s rules — effectively, new siblings at the same level replace or complete prior siblings as you type (see `parse-vex-stack.ts` for the exact pop behavior).

## Minimal valid example

```text
describe: Example
    when: setup is ready
        it: passes the check
```

## Richer nesting

```text
describe: Calculator
    describe: Add two numbers
        when: both operands are numbers
            and: both are positive
                it: returns the sum
    describe: Other behavior
        when: edge case
            it: does something else
```

## Parse vs validate

- **Parse** (`parseVexDocument`) checks line shape, indentation, and builds the tree. It fails if the document is empty of valid describes or if lines are invalid.
- **Validate** (`validateVexDocument`, used after a successful parse) checks **duplicate describe labels** among siblings and **structural** rules for **when** branches (each branch must end with exactly one **it**, **and** chains complete, etc.). Use **`parseAndValidateVexDocument`** when you need both.

## Editor support

The TextMate grammar in `packages/vex-language/syntaxes/vex.tmLanguage.json` highlights comments (`#` to end of line), **describe** / **when** / **and** / **it** lines, and labels. The semantic rules above come from vexkit; the highlighter is best-effort and may not flag invalid files.

## Related code

| Area                     | Location                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| AST types                | `packages/vexkit/src/vex/ast.ts`                                     |
| Line parsing             | `packages/vexkit/src/vex/parse-vex-line.ts`, `parse-vex-handlers.ts` |
| Indent / stack           | `packages/vexkit/src/vex/parse-vex-stack.ts`                         |
| Validation               | `packages/vexkit/src/vex/validate-vex-document.ts`                   |
| VS Code/Cursor extension | `packages/vex-language/`                                             |
