#!/usr/bin/env bun
import { resolve } from "path";
import type { Subprocess } from "bun";

const colors = {
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
} as const;

const rootDir = resolve(import.meta.dir, "..");

const SCREEN_CLEAR_RE = /\x1b\[2J|\x1b\[3J|\x1b\[H/g;

interface ServiceConfig {
  emoji: string;
  color: (s: string) => string;
  name: string;
  port: string | null;
}

interface CrashedService {
  service: string;
  exitCode: number;
  stderr: string;
}

const services = {
  frontend: {
    emoji: "⚛️",
    color: colors.cyan,
    name: "Frontend",
    port: "5173",
  },
  lib: {
    emoji: "📦",
    color: colors.yellow,
    name: "Lib",
    port: null,
  },
  backend: {
    emoji: "🚀",
    color: colors.green,
    name: "Backend",
    port: "3000",
  },
} as const satisfies Record<string, ServiceConfig>;

const crashedServices: CrashedService[] = [];

function spawnWithLabel(service: string, command: string[], cwd: string): Subprocess {
  const config = services[service];
  const label = colors.bold(config.color(`[${config.emoji} ${config.name}]`));

  console.log(`${label} ${colors.gray(`Starting ${config.name.toLowerCase()}...`)}`);

  const proc = Bun.spawn(command, {
    cwd,
    stdin: "inherit",
    stdout: "pipe",
    stderr: "pipe",
  });

  const stderrPromise = new Response(proc.stderr).text();

  (async () => {
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(SCREEN_CLEAR_RE, "");
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          console.log(`${label} ${line}`);
        }
      }
    }

    if (buffer.trim()) {
      console.log(`${label} ${buffer}`);
    }
  })();

  proc.exited.then(async (exitCode) => {
    if (exitCode !== 0) {
      const stderr = await stderrPromise;
      crashedServices.push({ service, exitCode, stderr });
    }
  });

  return proc;
}

console.log();
console.log(colors.bold(colors.blue("╔════════════════════════════════════════╗")));
console.log(colors.bold(colors.blue("║   Starting Development Servers         ║")));
console.log(colors.bold(colors.blue("╚════════════════════════════════════════╝")));
console.log();

const libProc = spawnWithLabel("lib", ["bun", "run", "dev"], resolve(rootDir, "lib"));
const backendProc = spawnWithLabel("backend", ["bun", "run", "dev"], resolve(rootDir, "backend"));
const frontendProc = spawnWithLabel("frontend", ["bun", "run", "dev"], resolve(rootDir, "frontend"));

setTimeout(() => {
  console.log();

  if (crashedServices.length > 0) {
    console.log(colors.bold(colors.red("✖ Some services failed to start")));
    console.log();

    for (const crashed of crashedServices) {
      const config = services[crashed.service];
      const label = colors.bold(config.color(`[${config.emoji} ${config.name}]`));
      console.log(`${label} ${colors.red(`Exited with code ${String(crashed.exitCode)}`)}`);
      if (crashed.stderr.trim()) {
        for (const line of crashed.stderr.trim().split("\n")) {
          console.log(`${label} ${colors.red(line)}`);
        }
      }
      console.log();
    }

    const crashedNames = new Set(crashedServices.map((c) => c.service));
    const running = Object.entries(services).filter(([key]) => !crashedNames.has(key));

    if (running.length > 0) {
      console.log(colors.bold("Services still running:"));
      for (const [, config] of running) {
        const portInfo = config.port ? `→ http://localhost:${config.port}` : "→ Watching for changes";
        console.log(`  ${config.emoji} ${colors.bold(config.color(config.name))}  ${portInfo}`);
      }
      console.log();
      console.log(colors.gray("Press Ctrl+C to stop all services"));
      console.log();
    }
  } else {
    console.log(colors.bold(colors.green("✓ All services started!")));
    console.log();
    console.log(colors.bold("Services running:"));
    console.log(
      `  ${services.frontend.emoji}  ${colors.bold(colors.cyan("Frontend"))}  → http://localhost:${services.frontend.port}`,
    );
    console.log(
      `  ${services.backend.emoji} ${colors.bold(colors.green("Backend"))}  → http://localhost:${services.backend.port}`,
    );
    console.log(`  ${services.lib.emoji} ${colors.bold(colors.yellow("Lib"))}      → Watching for changes`);
    console.log();
    console.log(colors.gray("Press Ctrl+C to stop all services"));
    console.log();
  }
}, 2000);

process.on("SIGINT", () => {
  console.log();
  console.log(colors.yellow("Stopping all services..."));
  libProc.kill();
  backendProc.kill();
  frontendProc.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  libProc.kill();
  backendProc.kill();
  frontendProc.kill();
  process.exit(0);
});
