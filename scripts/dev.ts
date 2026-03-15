#!/usr/bin/env bun
import { resolve } from "path";

const colors = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
} as const;

const rootDir = resolve(import.meta.dir, "..");

const SCREEN_CLEAR_RE = /\x1b\[2J|\x1b\[3J|\x1b\[H/g;

// Vite: "Local:   http://localhost:5174/"
// Bun HTTP server: "Listening on http://localhost:3001/" or "Listening on port 3001"
const VITE_PORT_RE = /Local:\s+http:\/\/localhost:(\d+)/;
const BUNO_PORT_RE = /Listening on (?:http:\/\/localhost:|port )(\d+)/;

interface ServiceConfig {
  color: (s: string) => string;
  defaultPort: number | null;
  emoji: string;
  name: string;
  portPattern: RegExp | null;
  restart: boolean;
}

interface CrashedService {
  exitCode: number;
  service: ServiceKey;
}

const services = {
  backend: {
    color: colors.green,
    defaultPort: 3000,
    emoji: "🚀",
    name: "Backend",
    portPattern: BUNO_PORT_RE,
    restart: true,
  },
  frontend: {
    color: colors.cyan,
    defaultPort: 5173,
    emoji: "⚛️",
    name: "Frontend",
    portPattern: VITE_PORT_RE,
    restart: false,
  },
  lib: {
    color: colors.yellow,
    defaultPort: null,
    emoji: "📦",
    name: "Lib",
    portPattern: null,
    restart: false,
  },
} as const satisfies Record<string, ServiceConfig>;

type ServiceKey = keyof typeof services;

let shuttingDown = false;
const activeProcs = new Map<ServiceKey, ReturnType<typeof Bun.spawn>>();

const detectedPorts: Record<ServiceKey, number | null> = {
  backend: null,
  frontend: null,
  lib: null,
};

const crashedServices: CrashedService[] = [];

const spawnWithLabel = (key: ServiceKey, command: string[], cwd: string): ReturnType<typeof Bun.spawn> => {
  const config = services[key];
  const label = colors.bold(config.color(`[${config.emoji} ${config.name}]`));

  console.log(`${label} ${colors.gray(`Starting ${config.name.toLowerCase()}...`)}`);

  const proc = Bun.spawn(command, {
    cwd,
    stdin: "inherit",
    stdout: "pipe",
    stderr: "pipe",
  });

  activeProcs.set(key, proc);

  const scanStream = async (stream: ReadableStream<Uint8Array>, isStdout: boolean): Promise<void> => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(SCREEN_CLEAR_RE, "");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        if (isStdout) {
          console.log(`${label} ${line}`);
        } else {
          console.log(`${label} ${colors.red(line)}`);
        }

        if (config.portPattern !== null && detectedPorts[key] === null) {
          const match = config.portPattern.exec(line);
          if (match !== null) {
            detectedPorts[key] = Number(match[1]);
          }
        }
      }
    }

    if (buffer.trim()) {
      if (isStdout) {
        console.log(`${label} ${buffer}`);
      } else {
        console.log(`${label} ${colors.red(buffer)}`);
      }

      if (config.portPattern !== null && detectedPorts[key] === null) {
        const match = config.portPattern.exec(buffer);
        if (match !== null) {
          detectedPorts[key] = Number(match[1]);
        }
      }
    }
  };

  scanStream(proc.stdout, true).catch(() => {});
  scanStream(proc.stderr, false).catch(() => {});

  void proc.exited.then(async (exitCode): Promise<void> => {
    if (shuttingDown) return;
    if (exitCode !== 0) {
      crashedServices.push({ exitCode, service: key });
      if (config.restart) {
        console.log(`${label} ${colors.yellow(`Exited with code ${String(exitCode)} — restarting in 1s...`)}`);
        await Bun.sleep(1000);
        if (!shuttingDown) spawnWithLabel(key, command, cwd);
      }
    }
  });

  return proc;
};

console.log();
console.log(colors.bold(colors.blue("╔════════════════════════════════════════╗")));
console.log(colors.bold(colors.blue("║   Starting Development Servers         ║")));
console.log(colors.bold(colors.blue("╚════════════════════════════════════════╝")));
console.log();

spawnWithLabel("lib", ["bun", "run", "dev"], resolve(rootDir, "lib"));
spawnWithLabel("backend", ["bun", "run", "dev"], resolve(rootDir, "backend"));
spawnWithLabel("frontend", ["bun", "run", "dev"], resolve(rootDir, "frontend"));

const resolvePort = (key: ServiceKey): number | null => detectedPorts[key] ?? services[key].defaultPort;

const waitForPorts = (): Promise<void> =>
  new Promise((portResolve) => {
    const portedKeys = (Object.keys(services) as ServiceKey[]).filter((k) => services[k].defaultPort !== null);

    const interval = setInterval(() => {
      const allDetected = portedKeys.every((k) => detectedPorts[k] !== null);
      if (allDetected) {
        clearInterval(interval);
        portResolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      portResolve();
    }, 10_000);
  });

await waitForPorts();

console.log();

if (crashedServices.length > 0) {
  console.log(colors.bold(colors.red("✖ Some services failed to start")));
  console.log();

  for (const crashed of crashedServices) {
    const config = services[crashed.service];
    const label = colors.bold(config.color(`[${config.emoji} ${config.name}]`));
    console.log(`${label} ${colors.red(`Exited with code ${String(crashed.exitCode)}`)}`);
    console.log();
  }

  const crashedKeys = new Set(crashedServices.map((c) => c.service));
  const runningEntries = (Object.entries(services) as [ServiceKey, ServiceConfig][]).filter(
    ([k]) => !crashedKeys.has(k),
  );

  if (runningEntries.length > 0) {
    console.log(colors.bold("Services still running:"));
    for (const [k, config] of runningEntries) {
      const port = resolvePort(k);
      const portInfo = port !== null ? `→ http://localhost:${String(port)}` : "→ Watching for changes";
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
    `  ${services.frontend.emoji}  ${colors.bold(colors.cyan("Frontend"))}  → http://localhost:${String(resolvePort("frontend"))}`,
  );
  console.log(
    `  ${services.backend.emoji} ${colors.bold(colors.green("Backend"))}  → http://localhost:${String(resolvePort("backend"))}`,
  );
  console.log(`  ${services.lib.emoji} ${colors.bold(colors.yellow("Lib"))}      → Watching for changes`);
  console.log();
  console.log(colors.gray("Press Ctrl+C to stop all services"));
  console.log();
}

process.on("SIGINT", () => {
  shuttingDown = true;
  console.log();
  console.log(colors.yellow("Stopping all services..."));
  for (const proc of activeProcs.values()) {
    proc.kill();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  for (const proc of activeProcs.values()) {
    proc.kill();
  }
  process.exit(0);
});
