export function stripLeadingDescribePlanningPreamble(raw) {
  const trimmed = raw.trimStart();
  if (/^(?:Here['\u2019]s|Here is)\s+/i.test(trimmed)) {
    return raw;
  }
  if (/^##\s+/i.test(trimmed)) {
    return raw;
  }
  const patterns = [/\n\nHere['\u2019]s\s+/i, /\n\nHere is\s+/i, /\n\n##\s+Questions for you\b/i, /\n\n##\s+/];
  let best = -1;
  for (let i = 0; i < patterns.length; i += 1) {
    const m = patterns[i].exec(raw);
    if (m != null && m.index !== undefined) {
      if (best === -1 || m.index < best) {
        best = m.index;
      }
    }
  }
  if (best === -1) {
    return raw;
  }
  return raw.slice(best + 2);
}

function truncateIfUnclosedOpenTag(text, openPattern, closeLiteral) {
  const m = openPattern.exec(text);
  if (m == null || m.index === undefined) {
    return text;
  }
  const start = m.index;
  const afterOpen = text.slice(start + m[0].length);
  if (afterOpen.includes(closeLiteral)) {
    return text;
  }
  return text.slice(0, start);
}

const THINKING_PAIRS = [
  [/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, /<thinking\b[^>]*>/i, "</thinking>"],
  [/<think\b[^>]*>[\s\S]*?<\/think>/gi, /<think\b[^>]*>/i, "</think>"],
  [/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, /<reasoning\b[^>]*>/i, "</reasoning>"],
  [/<thought\b[^>]*>[\s\S]*?<\/thought>/gi, /<thought\b[^>]*>/i, "</thought>"],
  [/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, /<analysis\b[^>]*>/i, "</analysis>"],
  [/<scratchpad\b[^>]*>[\s\S]*?<\/scratchpad>/gi, /<scratchpad\b[^>]*>/i, "</scratchpad>"],
  [/<redacted_reasoning\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, /<redacted_reasoning\b[^>]*>/i, "</think>"],
];

export function stripAssistantThinkingVisible(raw) {
  let out = raw;
  for (const [pairRe, openRe, closeLiteral] of THINKING_PAIRS) {
    out = out.replace(pairRe, "");
    out = truncateIfUnclosedOpenTag(out, openRe, closeLiteral);
  }
  return out;
}

function stripWorkflowSignals(text) {
  return text.replace(/---(?:SCOPE_READY|SPECS_DONE|BUILD_DONE|NEED_SPEC_CHANGE)---/g, "");
}

function stripHugeFencedBlocks(text) {
  return text.replace(/```[^\n]*\n([\s\S]*?)```/g, (full, inner) => {
    if (inner.length > 6000) {
      return "\n```\n_(Large fenced block omitted in chat view.)_\n```\n";
    }
    return full;
  });
}

const MAX_ASSISTANT_DISPLAY_CHARS = 10000;

function truncateForDisplay(text) {
  if (text.length <= MAX_ASSISTANT_DISPLAY_CHARS) {
    return text;
  }
  const tail = text.slice(-MAX_ASSISTANT_DISPLAY_CHARS);
  return `_(Earlier assistant output omitted.)_\n\n${tail}`;
}

export function finalizeAssistantVisibleText(raw) {
  const stripped = stripAssistantThinkingVisible(stripWorkflowSignals(raw));
  const withoutHugeFences = stripHugeFencedBlocks(stripped);
  const cleaned = stripLeadingDescribePlanningPreamble(withoutHugeFences);
  return truncateForDisplay(cleaned);
}
