import * as vscode from "vscode";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isVexApplyLabelEdit(
  value: unknown,
): value is { end: number; start: number; text: string; type: "vexApplyLabelEdit" } {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type !== "vexApplyLabelEdit") {
    return false;
  }
  if (typeof value.start !== "number") {
    return false;
  }
  if (typeof value.end !== "number") {
    return false;
  }
  if (typeof value.text !== "string") {
    return false;
  }
  return value.start <= value.end;
}

export async function applyVexLabelReplace(uri: vscode.Uri, start: number, end: number, text: string): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(uri);
  const len = doc.getText().length;
  if (start < 0) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  if (end > len) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  if (start > end) {
    await vscode.window.showErrorMessage("Invalid label range.");
    return;
  }
  const range = new vscode.Range(doc.positionAt(start), doc.positionAt(end));
  if (doc.getText(range) === text) {
    return;
  }
  const edit = new vscode.WorkspaceEdit();
  edit.replace(uri, range, text);
  const applied = await vscode.workspace.applyEdit(edit);
  if (!applied) {
    return;
  }
  const saved = await doc.save();
  if (!saved) {
    await vscode.window.showErrorMessage("Could not save the .vex file to disk.");
  }
}
