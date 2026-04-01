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

const FUNCTION_NAME_PATTERN = /^[a-zA-Z0-9_/.-]+$/;

export function parseFunctionHeaderFromLine(content: string): { description: string; name: string | null } {
  if (content.startsWith("-")) {
    return { description: "", name: null };
  }

  const colonIdx = content.indexOf(":");
  if (colonIdx < 0) {
    return { description: "", name: null };
  }

  const name = content.slice(0, colonIdx).trim();
  if (name.length === 0 || !FUNCTION_NAME_PATTERN.test(name)) {
    return { description: "", name: null };
  }

  const description = content.slice(colonIdx + 1).trim();
  return { description, name };
}

export type ListKeyword = "AND" | "IT" | "WHEN";

export function parseListLineParts(content: string): {
  keyword: ListKeyword | null;
  label: string;
} {
  const trimmed = content.trimStart();
  const pairs: readonly { keyword: ListKeyword; prefix: string }[] = [
    { keyword: "WHEN", prefix: "WHEN:" },
    { keyword: "AND", prefix: "AND:" },
    { keyword: "IT", prefix: "IT:" },
  ];

  for (const { keyword, prefix } of pairs) {
    if (trimmed.startsWith(prefix)) {
      return { keyword, label: trimmed.slice(prefix.length).trim() };
    }
  }

  return { keyword: null, label: "" };
}
