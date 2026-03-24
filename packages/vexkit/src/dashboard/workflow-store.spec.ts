import { describe, expect, it } from "bun:test";
import { parseWorkflowJson } from "./workflow-store";

describe("parseWorkflowJson", () => {
  describe("WHEN the text is not valid JSON", () => {
    describe("AND the default phase is inspected", () => {
      it("is spec", () => {
        const state = parseWorkflowJson("{");
        expect(state.phase).toBe("spec");
      });
    });
  });

  describe("WHEN the text is valid JSON with phase build", () => {
    describe("AND the parsed phase is inspected", () => {
      it("is build", () => {
        const state = parseWorkflowJson('{"phase":"build","currentVexPath":"","approvalsByPath":{}}');
        expect(state.phase).toBe("build");
      });
    });
  });

  describe("WHEN approvalsByPath contains duplicate strings", () => {
    describe("AND the normalized list for that path is inspected", () => {
      it("deduplicates entries", () => {
        const state = parseWorkflowJson(
          '{"phase":"spec","currentVexPath":"a.vex","approvalsByPath":{"a.vex":["x","x","y"]}}',
        );
        expect(state.approvalsByPath["a.vex"]).toEqual(["x", "y"]);
      });
    });
  });
});
