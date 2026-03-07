import { resolve } from "path";
import type { ProjectConfig } from "../types";
import { applyDeployCi } from "./ci";
import { applyStrictEslint } from "./eslint";
import { transformAllPackages } from "./package";
import { transformSourceFiles } from "./source";

const SPEC_FIRST_TEMPLATE = resolve(import.meta.dir, "../templates/cursor/spec-first.mdc");

const makeHooksExecutable = (config: ProjectConfig): void => {
  const hooksDir = resolve(config.targetDir, ".cursor", "hooks");

  try {
    const glob = new Bun.Glob("*.sh");
    const matches = glob.scanSync({ cwd: hooksDir });
    for (const name of matches) {
      Bun.spawnSync(["chmod", "+x", resolve(hooksDir, name)]);
    }
  } catch {
    // hooks dir doesn't exist (user opted out of AI settings)
  }
};

const applySpecFirst = async (config: ProjectConfig): Promise<void> => {
  if (!config.includeSpecFirst) {
    return;
  }

  const dest = resolve(config.targetDir, ".cursor", "rules", "spec-first.mdc");
  await Bun.write(dest, Bun.file(SPEC_FIRST_TEMPLATE));
};

export const transformProject = async (config: ProjectConfig): Promise<void> => {
  await transformAllPackages(config);
  await transformSourceFiles(config);
  await applyStrictEslint(config);
  await applyDeployCi(config);
  await applySpecFirst(config);
  makeHooksExecutable(config);
};
