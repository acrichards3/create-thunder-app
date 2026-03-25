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

export function stripAssistantThinkingVisible(raw) {
  let out = raw;
  out = out.replace(/<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi, "");
  out = out.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "");
  out = out.replace(/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, "");
  out = truncateIfUnclosedOpenTag(out, /<thinking\b[^>]*>/i, "</thinking>");
  out = truncateIfUnclosedOpenTag(out, /<think\b[^>]*>/i, "</think>");
  out = truncateIfUnclosedOpenTag(out, /<reasoning\b[^>]*>/i, "</reasoning>");
  return out;
}

export function finalizeAssistantVisibleText(raw) {
  return stripLeadingDescribePlanningPreamble(stripAssistantThinkingVisible(raw));
}
