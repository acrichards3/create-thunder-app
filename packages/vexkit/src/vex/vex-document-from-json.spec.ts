import { describe, expect, it } from "bun:test";
import { vexDocumentFromUnknown } from "./vex-document-from-json";

describe("vexDocumentFromUnknown", () => {
  describe("WHEN data is null", () => {
    describe("AND the document field is inspected", () => {
      it("is null", () => {
        const r = vexDocumentFromUnknown(null);
        expect(r.document).toBeNull();
      });
    });
  });

  describe("WHEN data is a valid minimal document object", () => {
    describe("AND the first function name is inspected", () => {
      it("is x", () => {
        const r = vexDocumentFromUnknown({
          functions: [
            {
              line: 1,
              name: "x",
              whens: [
                {
                  branches: [{ kind: "it", label: "t", line: 3 }],
                  label: "a",
                  line: 2,
                },
              ],
            },
          ],
        });
        if (r.document == null) {
          throw new Error("expected document");
        }
        expect(r.document.functions[0]?.name).toBe("x");
      });
    });
  });
});
