#!/usr/bin/env bun
import { argv } from "bun:process";
import { runCodegenSpecCommand } from "./cli-codegen-spec";
import { runDashboardCommand } from "./cli-dashboard";
import { runParseCommand } from "./cli-parse";
import { runTestSpecCommand } from "./cli-test-spec";
import { runVerifyCommand } from "./cli-verify";
import { VEXKIT_VERSION } from "./index";

async function printUsage(): Promise<void> {
  await Bun.write(
    Bun.stdout,
    `vexkit ${VEXKIT_VERSION}\n\nUsage:\n  vexkit              Show version\n  vexkit parse [--json] <file|->   Parse and validate (.vex); use - for stdin\n  vexkit verify <file.vex>       Check .vex vs co-located .spec.ts structure\n  vexkit codegen-spec [--force] <file.vex>   Emit paired .spec.ts skeleton\n  vexkit test-spec <file.vex>    Run bun test on paired spec (no it.todo)\n  vexkit dashboard [--port 8888]   Spec dashboard (workflow under .vexkit/; chat assistant)\n  In-browser docs: /docs on the same origin\n\nDashboard env:\n  VEXKIT_USE_CURSOR_AGENT=1 and CURSOR_API_KEY   Cursor CLI agent via ACP\n  VEXKIT_CURSOR_AGENT_BIN   Optional path to agent binary\n`,
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
    await runDashboardCommand(args.slice(1));
    return;
  }

  if (sub === "verify") {
    await runVerifyCommand(args[1] ?? "");
    return;
  }

  if (sub === "codegen-spec") {
    await runCodegenSpecCommand(args.slice(1));
    return;
  }

  if (sub === "test-spec") {
    await runTestSpecCommand(args[1] ?? "");
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
