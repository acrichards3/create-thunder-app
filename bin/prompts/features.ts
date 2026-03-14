import { colors } from "../constants";
import { prompt } from "./base";

export const askYesNo = async (question: string, defaultYes = true): Promise<boolean> => {
  const suffix = defaultYes ? "(Y/n)" : "(y/N)";
  const answer = await prompt(colors.purple(`${question} ${suffix} `));
  const a = (answer || "").trim().toLowerCase();
  if (!a) return defaultYes;
  return a === "y" || a === "yes";
};

export const promptIncludeGithub = async (): ReturnType<typeof askYesNo> => {
  return askYesNo("Include GitHub CI/CD pipeline?", true);
};

export const promptIncludeDeploy = async (): ReturnType<typeof askYesNo> => {
  return askYesNo("Include Vex App quick deploy setup?", true);
};

export const promptIncludeSpecFirst = async (): ReturnType<typeof askYesNo> => {
  return askYesNo("Use AI spec-first workflow? (AI writes test paths, you approve, AI builds)", true);
};
