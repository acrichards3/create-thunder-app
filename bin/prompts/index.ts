import { resolve } from "path";
import type { ProjectConfig } from "../types";
import { promptProjectName } from "./project";
import { promptIncludeAiSettings, promptIncludeGithub } from "./features";

export { closeReadline } from "./base";
export { askYesNo } from "./features";

export const gatherConfig = async (argName: string): Promise<ProjectConfig> => {
  const name = await promptProjectName(argName);
  const includeGithub = await promptIncludeGithub();
  const includeAiSettings = await promptIncludeAiSettings();

  const cwd = process.cwd();
  const targetDir = resolve(cwd, name);

  return {
    includeAiSettings,
    includeGithub,
    name,
    targetDir,
  };
};
