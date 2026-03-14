import { readdirSync, mkdirSync, type Dirent } from "fs";
import { join } from "path";
import { IGNORE_ALWAYS, SKIP_FILES, SKIP_EXTENSIONS } from "../constants";
import type { ProjectConfig } from "../types";

const shouldIgnore = (name: string, config: ProjectConfig): boolean => {
  if (IGNORE_ALWAYS.has(name)) return true;
  if (name === ".github" && !config.includeGithub) return true;
  if (name === "amplify.yml" && !config.includeDeploy) return true;
  if (name === "Dockerfile" && !config.includeDeploy) return true;
  if (name === ".dockerignore" && !config.includeDeploy) return true;
  return false;
};

const shouldSkipFile = (name: string): boolean => {
  if (SKIP_FILES.has(name)) return true;
  for (const ext of SKIP_EXTENSIONS) {
    if (name.endsWith(ext)) return true;
  }
  return false;
};

export const copyRecursive = async (src: string, dest: string, config: ProjectConfig): Promise<void> => {
  const entries: Dirent[] = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name, config)) continue;

    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      const destExists = await Bun.file(destPath).exists();
      if (!destExists) mkdirSync(destPath, { recursive: true });
      await copyRecursive(srcPath, destPath, config);
    } else {
      if (shouldSkipFile(entry.name)) continue;
      await Bun.write(destPath, Bun.file(srcPath));
    }
  }
};
