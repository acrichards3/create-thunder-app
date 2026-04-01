import type { VexDocument, VexParseError, VexParseResult } from "./ast";
import { processVexLine, type ParseContext } from "./parse-vex-handlers";

function pushError(errors: VexParseError[], line: number, message: string): void {
  errors.push({ line, message });
}

export function parseVexDocument(source: string): VexParseResult {
  const errors: VexParseError[] = [];
  const document: VexDocument = { describes: [] };
  const ctx: ParseContext = { document, errors, stack: [] };

  const lines = source.split(/\r?\n/);
  let lineNo = 0;

  for (const rawLine of lines) {
    lineNo += 1;
    processVexLine({ ctx, line: { lineNo, rawLine } });
  }

  if (document.describes.length === 0 && errors.length === 0) {
    pushError(errors, 1, 'Expected at least one describe block (a line like "describe: Label").');
  }

  const ok = errors.length === 0;
  const documentOut = ok ? document : undefined;
  return { document: documentOut, errors, ok };
}
