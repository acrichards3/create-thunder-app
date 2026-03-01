import { applyTemplates } from "./templates";
import { BANNER, colors } from "./constants";
import { closeReadline, gatherConfig } from "./prompts";
import { transformProject } from "./transform";
import { runInstall } from "./utils";
import type { ProjectConfig } from "./types";

const printBanner = (): void => {
  console.log();
  console.log(BANNER);
};

const printSuccess = (config: ProjectConfig, installed: boolean): void => {
  console.log();
  console.log(colors.green(colors.bold(`✓ Project initialized as "${config.name}"`)));
  console.log(colors.yellow(colors.bold("🚀 Thunder App template initialized!")));
  console.log();
  console.log(colors.cyan(colors.bold("📍 Project location:")), colors.gray(config.targetDir));
  console.log();
  console.log(colors.cyan(colors.bold("Next steps:")));

  if (installed) {
    console.log(`  1. cd ${config.name}`);
    console.log("  2. bun run dev");
  } else {
    console.log(`  1. cd ${config.name}`);
    console.log("  2. bun install    # installs all workspaces (frontend, lib, backend)");
    console.log("  3. bun run build:lib");
    console.log("  4. bun run dev");
  }

  console.log();
};

export async function main(): Promise<void> {
  const argName = (Bun.argv[2] || "").trim();

  try {
    printBanner();

    // Gather configuration from user
    const config = await gatherConfig(argName);

    // Copy template files
    await applyTemplates(config);

    // Transform package.json and source files
    await transformProject(config);

    // Optionally run install
    const installed = await runInstall(config);

    // Print success message
    printSuccess(config, installed);
  } finally {
    closeReadline();
  }
}
