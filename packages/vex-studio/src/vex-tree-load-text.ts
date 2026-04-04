import * as vscode from "vscode";

export async function loadVexFileText(uri: vscode.Uri): Promise<string> {
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    return doc.getText();
  } catch {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
  }
}
