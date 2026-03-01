import { colors } from "../constants";
import type { ProjectConfig } from "../types";
import { askYesNo } from "../prompts";

// Blue color helper (not in base colors)
const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

export const runInstall = async (config: ProjectConfig): Promise<boolean> => {
  const doInstall = await askYesNo("Run bun install for all workspaces now?", true);

  if (!doInstall) return false;

  console.log(colors.bold(blue("\n› Installing dependencies (root workspace)...\n")));

  const installResult = Bun.spawnSync(["bun", "install"], {
    cwd: config.targetDir,
    stdio: ["inherit", "inherit", "inherit"],
  });

  if (installResult.exitCode !== 0) {
    console.error(colors.red("bun install failed. You can run it manually later."));
    return false;
  }

  console.log(colors.bold(blue("\n› Building lib...\n")));

  const buildResult = Bun.spawnSync(["bun", "run", "build:lib"], {
    cwd: config.targetDir,
    stdio: ["inherit", "inherit", "inherit"],
  });

  if (buildResult.exitCode !== 0) {
    console.error(colors.red("lib build failed. You can run 'bun run build:lib' later."));
    return false;
  }

  return true;
};
