#!/usr/bin/env bun
import { argv } from "bun:process";
import { runDashboardCommand } from "./cli-dashboard";
import { runParseCommand } from "./cli-parse";
import { VEXKIT_VERSION } from "./index";

async function printUsage(): Promise<void> {
  await Bun.write(
    Bun.stdout,
    `vexkit ${VEXKIT_VERSION}\n\nUsage:\n  vexkit              Show version\n  vexkit parse [--json] <file|->   Parse and validate (.vex); use - for stdin\n  vexkit dashboard [--port 8888]   Spec dashboard (file tree + .vex logic tree)\n`,
  );
}

async function main(): Promise<void> {
  const args = argv.slice(2);
  if (args.length === 0) {
    await Bun.write(Bun.stdout, `vexkit ${VEXKIT_VERSION}\n`);
    return;
  }

  const sub = args[0];
  if (sub === "parse") {
    await runParseCommand(args.slice(1));
    return;
  }

  if (sub === "dashboard") {
    runDashboardCommand(args.slice(1));
    return;
  }

  if (sub === "--help" || sub === "-h") {
    await printUsage();
    return;
  }

  await Bun.write(Bun.stderr, `Unknown command: ${sub}\n`);
  await printUsage();
  process.exitCode = 1;
}

await main();
