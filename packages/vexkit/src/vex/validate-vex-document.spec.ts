import { describe, expect, it } from "bun:test";
import { parseAndValidateVexDocument } from "./parse-and-validate-vex-document";
import { parseVexDocument } from "./parse-vex-document";
import { validateVexDocument } from "./validate-vex-document";

const twoSiblingItsSource = "todo:\n  - WHEN: x\n    - IT: first\n    - IT: second\n";

describe("validateVexDocument", () => {
  describe("WHEN a WHEN has two IT lines at the same list level", () => {
    describe("AND the text is parsed successfully", () => {
      it("yields a document", () => {
        const parsed = parseVexDocument(twoSiblingItsSource);
        expect(parsed.ok === true && parsed.document != null).toBe(true);
      });
    });

    describe("AND validateVexDocument runs on that document", () => {
      describe("AND the error list length is checked", () => {
        it("is one", () => {
          const parsed = parseVexDocument(twoSiblingItsSource);
          const errors = parsed.ok === true && parsed.document != null ? validateVexDocument(parsed.document) : [];
          expect(errors.length).toBe(1);
        });
      });

      describe("AND the first error line is checked", () => {
        it("is the second IT line", () => {
          const parsed = parseVexDocument(twoSiblingItsSource);
          const errors = parsed.ok === true && parsed.document != null ? validateVexDocument(parsed.document) : [];
          expect(errors[0]?.line).toBe(4);
        });
      });
    });

    describe("AND parseAndValidateVexDocument runs on the same text", () => {
      it("returns ok false", () => {
        const result = parseAndValidateVexDocument(twoSiblingItsSource);
        expect(result.ok).toBe(false);
      });
    });
  });
});
