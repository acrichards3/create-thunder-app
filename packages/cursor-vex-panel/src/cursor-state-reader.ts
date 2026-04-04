import { execFile } from "node:child_process";
import { resolve } from "node:path";
import type { ExtensionContext } from "vscode";

type ComposerEntry = {
  composerId: string;
  isArchived: boolean;
  isDraft: boolean;
  lastUpdatedAt: number | null;
  name: string;
  unifiedMode: string;
};

export type ComposerTabState = {
  activeId: string | null;
  tabs: ComposerEntry[];
};

type ComposerDataRaw = {
  allComposers?: unknown[];
  lastFocusedComposerIds?: string[];
  selectedComposerIds?: string[];
};

function isComposerDataRaw(value: unknown): value is ComposerDataRaw {
  return typeof value === "object" && value !== null;
}

function isValidComposerRaw(raw: unknown): raw is Record<string, unknown> {
  if (typeof raw !== "object") {
    return false;
  }
  if (raw === null) {
    return false;
  }
  const obj = raw as Record<string, unknown>;
  return typeof obj["composerId"] === "string";
}

function toComposerEntry(obj: Record<string, unknown>): ComposerEntry {
  const lastUpdated = typeof obj["lastUpdatedAt"] === "number" ? obj["lastUpdatedAt"] : null;
  const name = typeof obj["name"] === "string" ? obj["name"] : "";
  const mode = typeof obj["unifiedMode"] === "string" ? obj["unifiedMode"] : "chat";
  return {
    composerId: obj["composerId"] as string,
    isArchived: obj["isArchived"] === true,
    isDraft: obj["isDraft"] === true,
    lastUpdatedAt: lastUpdated,
    name,
    unifiedMode: mode,
  };
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

function parseComposerData(raw: string): ComposerTabState {
  const empty: ComposerTabState = { activeId: null, tabs: [] };
  if (raw.length === 0) {
    return empty;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!isComposerDataRaw(parsed)) {
    return empty;
  }
  const selectedIds = Array.isArray(parsed.selectedComposerIds) ? (parsed.selectedComposerIds as string[]) : [];
  const focusedIds = Array.isArray(parsed.lastFocusedComposerIds) ? (parsed.lastFocusedComposerIds as string[]) : [];
  const allComposers = Array.isArray(parsed.allComposers) ? parsed.allComposers : [];

  const selectedSet = new Set(selectedIds);
  const tabs: ComposerEntry[] = [];
  allComposers.forEach((c) => {
    if (!isValidComposerRaw(c)) {
      return;
    }
    if (!selectedSet.has(c["composerId"] as string)) {
      return;
    }
    tabs.push(toComposerEntry(c));
  });

  let activeId: string | null = null;
  if (focusedIds.length > 0) {
    activeId = focusedIds[0];
  } else if (selectedIds.length > 0) {
    activeId = selectedIds[0];
  }

  return { activeId, tabs };
}

export async function readComposerState(context: ExtensionContext): Promise<ComposerTabState> {
  const empty: ComposerTabState = { activeId: null, tabs: [] };
  const dbPath = resolveDbPath(context);
  if (dbPath.length === 0) {
    return empty;
  }
  const raw = await queryDb(dbPath);
  return parseComposerData(raw);
}
