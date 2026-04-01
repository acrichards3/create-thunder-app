export function countLeadingSpaces(rawLine: string): number {
  let n = 0;
  for (let i = 0; i < rawLine.length; i += 1) {
    if (rawLine[i] !== " ") {
      return n;
    }

    n += 1;
  }

  return n;
}

export function parseDescribeHeaderFromLine(content: string): { label: string | null } {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith("describe")) {
    return { label: null };
  }

  const afterKeyword = trimmed.slice(8).trimStart();
  if (!afterKeyword.startsWith(":")) {
    return { label: null };
  }

  const label = afterKeyword.slice(1).trim();
  return { label: label.length > 0 ? label : null };
}

export type ListKeyword = "AND" | "IT" | "WHEN";

function labelAfterKeywordPrefix(trimmed: string, keywordLen: number): readonly [boolean, string] {
  const after = trimmed.slice(keywordLen).trimStart();
  if (!after.startsWith(":")) {
    return [false, ""];
  }

  return [true, after.slice(1).trim()];
}

export function parseListLineParts(content: string): {
  keyword: ListKeyword | null;
  label: string;
} {
  const trimmed = content.trimStart();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("when")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 4);
    if (ok) {
      return { keyword: "WHEN", label };
    }
  }

  if (lower.startsWith("and")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 3);
    if (ok) {
      return { keyword: "AND", label };
    }
  }

  if (lower.startsWith("it")) {
    const [ok, label] = labelAfterKeywordPrefix(trimmed, 2);
    if (ok) {
      return { keyword: "IT", label };
    }
  }

  return { keyword: null, label: "" };
}
