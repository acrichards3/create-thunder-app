import type { CustomDocument, Uri } from "vscode";

export class VexTreeCustomDocument implements CustomDocument {
  constructor(public readonly uri: Uri) {}

  dispose(): void {}
}
