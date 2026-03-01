import type { ProjectConfig } from "../types";
import { applyStrictEslint } from "./eslint";
import { transformAllPackages } from "./package";
import { transformSourceFiles } from "./source";

export const transformProject = async (config: ProjectConfig): Promise<void> => {
  await transformAllPackages(config);
  await transformSourceFiles(config);
  await applyStrictEslint(config);
};
