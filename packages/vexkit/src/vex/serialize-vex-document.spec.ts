import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAndValidateVexDocument } from "./parse-and-validate-vex-document";
import { serializeVexDocument } from "./serialize-vex-document";

describe("serializeVexDocument", () => {
  describe("WHEN the sample fixture is parsed and round-tripped through serialize", () => {
    describe("AND the reparsed document is checked for success", () => {
      it("returns ok true", () => {
        const fixturePath = join(import.meta.dir, "../../fixtures/sample.vex");
        const source = readFileSync(fixturePath, "utf8");
        const first = parseAndValidateVexDocument(source);
        if (!first.ok || first.document == null) {
          throw new Error("fixture parse failed");
        }
        const serialized = serializeVexDocument(first.document);
        const second = parseAndValidateVexDocument(serialized);
        expect(second.ok).toBe(true);
      });
    });

    describe("AND the reparsed function names are compared to the original", () => {
      it("preserves function names in order", () => {
        const fixturePath = join(import.meta.dir, "../../fixtures/sample.vex");
        const source = readFileSync(fixturePath, "utf8");
        const first = parseAndValidateVexDocument(source);
        if (!first.ok || first.document == null) {
          throw new Error("fixture parse failed");
        }
        const serialized = serializeVexDocument(first.document);
        const second = parseAndValidateVexDocument(serialized);
        if (!second.ok || second.document == null) {
          throw new Error("round-trip parse failed");
        }
        const namesA = first.document.functions.map((f) => f.name);
        const namesB = second.document.functions.map((f) => f.name);
        expect(namesB).toEqual(namesA);
      });
    });
  });
});
