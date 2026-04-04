import { execFile } from "node:child_process";
import { resolve } from "node:path";
import type { ExtensionContext } from "vscode";

export type ComposerTab = {
  composerId: string;
  name: string;
};

export type ComposerState = {
  activeId: string | null;
  tabs: ComposerTab[];
};

const EMPTY_STATE: ComposerState = { activeId: null, tabs: [] };

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function isValidComposerEntry(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null) {
    return false;
  }
  return typeof (raw as Record<string, unknown>)["composerId"] === "string";
}

function resolveDbPath(context: ExtensionContext): string {
  const storageUri = context.storageUri;
  if (storageUri == null) {
    return "";
  }
  return resolve(storageUri.fsPath, "..", "state.vscdb");
}

function queryDb(dbPath: string): Promise<string> {
  return new Promise((res, rej) => {
    const query = "SELECT value FROM ItemTable WHERE key='composer.composerData'";
    execFile("/usr/bin/sqlite3", [dbPath, query], { timeout: 5000 }, (err, stdout) => {
      if (err != null) {
        rej(err);
        return;
      }
      res(stdout.trim());
    });
  });
}

function parseComposerData(raw: string): ComposerState {
  if (raw.length === 0) {
    return EMPTY_STATE;
  }
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    return EMPTY_STATE;
  }
  const data = parsed as Record<string, unknown>;
  const selectedIds = toStringArray(data["selectedComposerIds"]);
  const focusedIds = toStringArray(data["lastFocusedComposerIds"]);
  const allComposers = Array.isArray(data["allComposers"]) ? data["allComposers"] : [];

  const selectedSet = new Set(selectedIds);
  const tabs: ComposerTab[] = allComposers
    .filter(isValidComposerEntry)
    .filter((c) => selectedSet.has((c as Record<string, unknown>)["composerId"] as string))
    .map((c) => {
      const obj = c as Record<string, unknown>;
      const composerId = obj["composerId"] as string;
      const name = typeof obj["name"] === "string" ? obj["name"] : "";
      return { composerId, name };
    });

  let activeId: string | null = null;
  if (focusedIds.length > 0) {
    activeId = focusedIds[0];
  } else if (selectedIds.length > 0) {
    activeId = selectedIds[0];
  }

  return { activeId, tabs };
}

export async function readComposerState(context: ExtensionContext): Promise<ComposerState> {
  const dbPath = resolveDbPath(context);
  if (dbPath.length === 0) {
    return EMPTY_STATE;
  }
  const raw = await queryDb(dbPath);
  return parseComposerData(raw);
}
