import { describe, expect, it } from "bun:test";
import {
  finalizeAssistantVisibleText,
  stripAssistantThinkingVisible,
  stripLeadingDescribePlanningPreamble,
} from "./static/strip-assistant-visible-text.js";

describe("stripAssistantThinkingVisible", () => {
  describe("WHEN there are no thinking markers", () => {
    it("returns the same string", () => {
      expect(stripAssistantThinkingVisible("Hello world.")).toBe("Hello world.");
    });
  });

  describe("WHEN there is a complete thinking element", () => {
    it("removes the element and keeps surrounding text", () => {
      expect(stripAssistantThinkingVisible("A<thinking>secret</thinking>B")).toBe("AB");
    });
  });

  describe("WHEN there is an unclosed thinking element at the end", () => {
    it("truncates from the opening tag", () => {
      expect(stripAssistantThinkingVisible("Visible<thinking>hidden")).toBe("Visible");
    });
  });
});

describe("stripLeadingDescribePlanningPreamble", () => {
  describe("WHEN internal monologue precedes Here's", () => {
    it("keeps from the first Heres paragraph onward", () => {
      const raw = "The user wants help.\n\nHere's a tight scope.\n\nBody.";
      expect(stripLeadingDescribePlanningPreamble(raw)).toBe("Here's a tight scope.\n\nBody.");
    });
  });

  describe("WHEN Questions heading starts user-visible content", () => {
    it("keeps from that heading onward", () => {
      const raw = "Planning text.\n\n## Questions for you\n\n- One?";
      expect(stripLeadingDescribePlanningPreamble(raw)).toBe("## Questions for you\n\n- One?");
    });
  });
});

describe("finalizeAssistantVisibleText", () => {
  describe("WHEN planning precedes Heres", () => {
    it("returns visible user content only", () => {
      const raw = "Internal plan.\n\nHere's the scope.\n\nDetails here.";
      expect(finalizeAssistantVisibleText(raw)).toBe("Here's the scope.\n\nDetails here.");
    });
  });
});
