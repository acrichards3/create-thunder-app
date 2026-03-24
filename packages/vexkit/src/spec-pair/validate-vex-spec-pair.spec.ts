import { describe, expect, it } from "bun:test";
import { validateVexSpecPair } from "./validate-vex-spec-pair";

const minimalVex = `bar:
  - WHEN: hello
    - IT: works
`;

const minimalSpec = `import { describe, it } from "bun:test";

describe("bar", () => {
  describe("WHEN hello", () => {
    it("works", () => {});
  });
});
`;

describe("validateVexSpecPair", () => {
  describe("WHEN the .vex and .spec.ts structures match", () => {
    describe("AND the validation result is inspected", () => {
      it("returns ok true", () => {
        const r = validateVexSpecPair({ specSource: minimalSpec, vexSource: minimalVex });
        expect(r.ok).toBe(true);
      });
    });
  });

  describe("WHEN the spec omits a WHEN block", () => {
    describe("AND the validation result is inspected", () => {
      it("returns ok false", () => {
        const badSpec = `import { describe, it } from "bun:test";

describe("bar", () => {
  it("works", () => {});
});
`;
        const r = validateVexSpecPair({ specSource: badSpec, vexSource: minimalVex });
        expect(r.ok).toBe(false);
      });
    });
  });
});
