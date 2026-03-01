import { resolve } from "path";
import type { ProjectConfig, PackageJson } from "../types";

const STRICT_ESLINT_DIR = resolve(import.meta.dir, "../templates/eslint");

const EXTRA_DEV_DEPS: Record<string, string> = {
  "eslint-plugin-no-comments": "latest",
  "eslint-plugin-perfectionist": "^3",
  "eslint-plugin-sonarjs": "latest",
  "eslint-plugin-unicorn": "^56",
};

const WORKSPACE_CONFIGS: Array<{ eslintTemplate: string; workspace: string }> = [
  { eslintTemplate: "frontend.eslintrc.cjs", workspace: "frontend" },
  { eslintTemplate: "backend.eslintrc.cjs", workspace: "backend" },
  { eslintTemplate: "lib.eslintrc.cjs", workspace: "lib" },
];

async function overwriteEslintConfig(targetDir: string, workspace: string, templateName: string): Promise<void> {
  const src = resolve(STRICT_ESLINT_DIR, templateName);
  const dest = resolve(targetDir, workspace, ".eslintrc.cjs");
  await Bun.write(dest, Bun.file(src));
}

async function injectDeps(targetDir: string, workspace: string): Promise<void> {
  const pkgPath = resolve(targetDir, workspace, "package.json");
  const pkgFile = Bun.file(pkgPath);

  if (!(await pkgFile.exists())) {
    return;
  }

  const pkg: PackageJson = await pkgFile.json();
  const devDeps = pkg.devDependencies ?? {};

  const merged = { ...devDeps, ...EXTRA_DEV_DEPS };
  const sorted = Object.fromEntries(Object.entries(merged).toSorted(([a], [b]) => a.localeCompare(b)));

  pkg.devDependencies = sorted;

  const removeDeps = ["eslint-plugin-sort-keys", "eslint-plugin-typescript-sort-keys"];
  removeDeps.forEach((dep) => {
    delete pkg.devDependencies?.[dep];
  });

  await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

export async function applyStrictEslint(config: ProjectConfig): Promise<void> {
  if (!config.includeAiSettings) {
    return;
  }

  const tasks = WORKSPACE_CONFIGS.map(async ({ eslintTemplate, workspace }) => {
    await overwriteEslintConfig(config.targetDir, workspace, eslintTemplate);
    await injectDeps(config.targetDir, workspace);
  });

  await Promise.all(tasks);

  const rootPkgPath = resolve(config.targetDir, "package.json");
  const rootPkgFile = Bun.file(rootPkgPath);

  if (await rootPkgFile.exists()) {
    const pkg: PackageJson = await rootPkgFile.json();
    const devDeps = pkg.devDependencies ?? {};
    delete devDeps["eslint-plugin-sort-keys"];
    delete devDeps["eslint-plugin-typescript-sort-keys"];
    pkg.devDependencies = devDeps;
    await Bun.write(rootPkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
}
