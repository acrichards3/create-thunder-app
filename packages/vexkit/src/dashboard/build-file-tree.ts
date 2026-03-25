import { readdir } from "bun:fs/promises";
import { join } from "bun:path";

type DashboardFileTreeNode = {
  children?: DashboardFileTreeNode[];
  kind: "directory" | "file";
  name: string;
  relativePath: string;
};

async function readOneDirectory(absDir: string, relDir: string): Promise<DashboardFileTreeNode[]> {
  const entries = await readdir(absDir, { withFileTypes: true });
  const nodes: DashboardFileTreeNode[] = [];

  for (const ent of entries) {
    const rel = relDir === "" ? ent.name : `${relDir}/${ent.name}`;

    if (ent.isDirectory()) {
      const childAbs = join(absDir, ent.name);
      const children = await readOneDirectory(childAbs, rel);
      nodes.push({ children, kind: "directory", name: ent.name, relativePath: rel });
      continue;
    }

    if (ent.isFile()) {
      nodes.push({ kind: "file", name: ent.name, relativePath: rel });
    }
  }

  return nodes.toSorted((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "directory" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });
}

export async function buildDashboardFileTree(rootAbs: string): Promise<DashboardFileTreeNode[]> {
  return readOneDirectory(rootAbs, "");
}
