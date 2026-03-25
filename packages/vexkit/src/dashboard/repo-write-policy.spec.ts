import { describe, expect, it } from "bun:test";
import { getRepoWriteDenialReason } from "./repo-write-policy";

describe("getRepoWriteDenialReason", () => {
  describe("WHEN phase is spec and path is a .vex file", () => {
    describe("AND the result is checked", () => {
      it("returns empty string", () => {
        expect(getRepoWriteDenialReason("spec", "features/foo.vex").length).toBe(0);
      });
    });
  });

  describe("WHEN phase is spec and path is not .vex", () => {
    describe("AND the result is checked", () => {
      it("returns a denial message", () => {
        expect(getRepoWriteDenialReason("spec", "features/foo.ts").length).toBeGreaterThan(0);
      });
    });
  });

  describe("WHEN phase is build and path is .vex", () => {
    describe("AND the result is checked", () => {
      it("returns a denial message", () => {
        expect(getRepoWriteDenialReason("build", "a.vex").length).toBeGreaterThan(0);
      });
    });
  });

  describe("WHEN phase is verify and path is .vex", () => {
    describe("AND the result is checked", () => {
      it("returns a denial message", () => {
        expect(getRepoWriteDenialReason("verify", "a.vex").length).toBeGreaterThan(0);
      });
    });
  });

  describe("WHEN path is under .vexkit", () => {
    describe("AND phase is spec", () => {
      it("denies", () => {
        expect(getRepoWriteDenialReason("spec", ".vexkit/workflow.json").length).toBeGreaterThan(0);
      });
    });
  });
});
