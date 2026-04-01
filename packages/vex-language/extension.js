const vscode = require("vscode");
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const DIAGNOSTIC_SOURCE = "vex-language";
const VALIDATION_DEBOUNCE_MS = 300;

/**
 * @param {string} workspaceRoot
 * @returns {string | null}
 */
function resolveVexkitCli(workspaceRoot) {
  const candidate = path.join(workspaceRoot, "packages", "vexkit", "src", "cli.ts");
  return fs.existsSync(candidate) ? candidate : null;
}

/**
 * @param {string} text
 * @param {string} workspaceRoot
 * @param {string} cliPath
 * @returns {{ ok: true, document: unknown } | { ok: false, errors: { line: number, message: string }[] }}
 */
function runVexkitParseJson(text, workspaceRoot, cliPath) {
  const result = spawnSync("bun", [cliPath, "parse", "--json", "-"], {
    cwd: workspaceRoot,
    encoding: "utf8",
    input: text,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    return {
      errors: [
        {
          line: 1,
          message: `vex-language: could not run Bun (${result.error.message}). Install Bun and ensure it is on PATH.`,
        },
      ],
      ok: false,
    };
  }

  const out = result.stdout ?? "";
  try {
    const parsed = JSON.parse(out);
    if (parsed && typeof parsed === "object" && "ok" in parsed) {
      if (parsed.ok === true) {
        return { document: parsed.document, ok: true };
      }

      if (Array.isArray(parsed.errors)) {
        return { errors: parsed.errors, ok: false };
      }
    }
  } catch {
    const errTail = (result.stderr ?? "").slice(0, 200);
    return {
      errors: [
        {
          line: 1,
          message: `vex-language: invalid JSON from vexkit (exit ${String(result.status ?? 0)}). stdout: ${out.slice(0, 120)} stderr: ${errTail}`,
        },
      ],
      ok: false,
    };
  }

  return {
    errors: [
      {
        line: 1,
        message: `vex-language: unexpected vexkit output (exit ${String(result.status ?? 0)}).`,
      },
    ],
    ok: false,
  };
}

/**
 * @param {vscode.TextDocument} doc
 * @param {string} workspaceRoot
 * @param {string} cliPath
 * @returns {vscode.Diagnostic[]}
 */
function getDiagnostics(doc, workspaceRoot, cliPath) {
  const text = doc.getText();
  const parsed = runVexkitParseJson(text, workspaceRoot, cliPath);
  if (parsed.ok) {
    return [];
  }

  const lineCount = doc.lineCount;
  const lastIdx = Math.max(0, lineCount - 1);

  return parsed.errors.map((err) => {
    let lineIndex = err.line > 0 ? err.line - 1 : 0;
    if (lineIndex >= lineCount) {
      lineIndex = lastIdx;
    }

    const line = doc.lineAt(lineIndex);
    const firstLine = doc.lineAt(0);
    const fallbackRange = new vscode.Range(0, 0, 0, firstLine.text.length);
    const range = err.line > 0 ? line.range : fallbackRange;
    const d = new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
    d.source = DIAGNOSTIC_SOURCE;
    return d;
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const collection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
  context.subscriptions.push(collection);

  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  const pending = new Map();

  context.subscriptions.push({
    dispose: () => {
      [...pending.values()].forEach((t) => {
        clearTimeout(t);
      });
      pending.clear();
    },
  });

  /**
   * @param {vscode.TextDocument} doc
   */
  const refreshNow = (doc) => {
    if (doc.languageId !== "vex" || doc.uri.scheme !== "file") {
      return;
    }

    const folder = vscode.workspace.getWorkspaceFolder(doc.uri);
    if (!folder) {
      const w = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        "vex-language: open a folder workspace so packages/vexkit can be found.",
        vscode.DiagnosticSeverity.Warning,
      );
      w.source = DIAGNOSTIC_SOURCE;
      collection.set(doc.uri, [w]);
      return;
    }

    const root = folder.uri.fsPath;
    const cli = resolveVexkitCli(root);
    if (!cli) {
      const w = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        "vex-language: packages/vexkit/src/cli.ts not found in this workspace.",
        vscode.DiagnosticSeverity.Warning,
      );
      w.source = DIAGNOSTIC_SOURCE;
      collection.set(doc.uri, [w]);
      return;
    }

    collection.set(doc.uri, getDiagnostics(doc, root, cli));
  };

  /**
   * @param {vscode.TextDocument} doc
   * @param {boolean} immediate
   */
  const scheduleRefresh = (doc, immediate) => {
    if (doc.languageId !== "vex" || doc.uri.scheme !== "file") {
      return;
    }

    if (immediate) {
      const prev = pending.get(doc.uri.toString());
      if (prev) {
        clearTimeout(prev);
        pending.delete(doc.uri.toString());
      }

      refreshNow(doc);
      return;
    }

    const id = doc.uri.toString();
    const prev = pending.get(id);
    if (prev) {
      clearTimeout(prev);
    }

    pending.set(
      id,
      setTimeout(() => {
        pending.delete(id);
        refreshNow(doc);
      }, VALIDATION_DEBOUNCE_MS),
    );
  };

  [...vscode.workspace.textDocuments].forEach((doc) => {
    scheduleRefresh(doc, true);
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      scheduleRefresh(doc, true);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      scheduleRefresh(e.document, false);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      const id = doc.uri.toString();
      const t = pending.get(id);
      if (t) {
        clearTimeout(t);
        pending.delete(id);
      }

      collection.delete(doc.uri);
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
