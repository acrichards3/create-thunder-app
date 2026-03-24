import { describe, expect, it } from "bun:test";
import { parseAndValidateVexDocument } from "./vex/parse-and-validate-vex-document";

const fixturePath = `${import.meta.dirname}/parse-and-validate-vex-document.fixture.vex`;

describe("parseAndValidateVexDocument", () => {
  describe("WHEN the source is empty", () => {
    it("returns ok false with an error", () => {
      const result = parseAndValidateVexDocument("");
      expect(result.ok).toBe(false);
    });
  });

  describe("WHEN the source is the co-located .vex fixture", () => {
    describe("AND the parse result is checked for success", () => {
      it("returns ok true", async () => {
        const source = await Bun.file(fixturePath).text();
        const result = parseAndValidateVexDocument(source);
        expect(result.ok).toBe(true);
      });
    });

    describe("AND the document is inspected after a successful parse", () => {
      it("contains two WHEN blocks under the function", async () => {
        const source = await Bun.file(fixturePath).text();
        const result = parseAndValidateVexDocument(source);
        const fn0 = result.document?.functions[0];
        expect(result.ok === true && fn0 != null ? fn0.whens.length : 0).toBe(2);
      });
    });
  });

  describe("WHEN a WHEN is missing an IT", () => {
    describe("AND the WHEN has no branches", () => {
      it("returns ok false", () => {
        const result = parseAndValidateVexDocument(`fn:\n  - WHEN: only when\n`);
        expect(result.ok).toBe(false);
      });
    });
  });
});
