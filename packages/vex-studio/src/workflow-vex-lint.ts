import { readFileSync } from "node:fs";
import * as vscode from "vscode";
import { parseAndValidateVexDocument } from "./vex-parse";

export type VexLintResult = {
  errors: string[];
  ok: boolean;
};

export async function lintAllVexFiles(): Promise<VexLintResult> {
  const files = await vscode.workspace.findFiles("**/*.vex", "**/node_modules/**");
  const errors: string[] = [];

  files.forEach((uri) => {
    const content = safeRead(uri.fsPath);
    if (content.length === 0) {
      return;
    }
    const result = parseAndValidateVexDocument(content);
    if (result.ok) {
      return;
    }
    const relativePath = vscode.workspace.asRelativePath(uri);
    result.errors.forEach((err) => {
      errors.push(`${relativePath}:${String(err.line)}: ${err.message}`);
    });
  });

  return { errors, ok: errors.length === 0 };
}

function safeRead(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}
