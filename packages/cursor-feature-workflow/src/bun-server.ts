import { spawn } from "child_process";
import { homedir } from "os";
import { delimiter, join } from "path";
import { randomUUID } from "crypto";

const DASHBOARD_PORT = "3847";
const READY_PATTERN = /http:\/\/localhost:\d+/;
const START_TIMEOUT_MS = 45_000;

function bunExecutable(): string {
  const fromEnv = process.env.BUN_PATH;
  if (fromEnv !== undefined && fromEnv.length > 0) {
    return fromEnv;
  }
  return "bun";
}

function spawnEnv(): NodeJS.ProcessEnv {
  const base = { ...process.env };
  const bunBin = join(homedir(), ".bun", "bin");
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const prev = base[pathKey] ?? "";
  if (!prev.includes(bunBin)) {
    return { ...base, [pathKey]: `${bunBin}${delimiter}${prev}` };
  }
  return base;
}

export class BunServer {
  private proc: ReturnType<typeof spawn> | undefined;
  baseUrl: string = "";
  sessionId: string = "";

  async start(workspaceRoot: string): Promise<void> {
    const entry = join(workspaceRoot, "packages/vexkit/src/cli.ts");
    this.sessionId = randomUUID();

    return new Promise((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const clearTimer = (): void => {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
        }
      };

      const finish = (fn: () => void): void => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimer();
        fn();
      };

      timer = setTimeout(() => {
        finish(() => {
          reject(
            new Error(
              `Dashboard did not start within ${String(START_TIMEOUT_MS / 1000)}s. Is packages/vexkit present under the open folder?`,
            ),
          );
        });
      }, START_TIMEOUT_MS);

      this.proc = spawn(bunExecutable(), [entry, "dashboard", "--port", DASHBOARD_PORT], {
        stdio: ["ignore", "pipe", "pipe"],
        env: spawnEnv(),
        cwd: workspaceRoot,
      });

      let output = "";

      const onChunk = (chunk: Buffer): void => {
        output += chunk.toString();
        const match = output.match(READY_PATTERN);
        if (match) {
          const url = match[0];
          this.baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;
          finish(() => {
            resolve();
          });
        }
      };

      this.proc.stdout?.on("data", onChunk);
      this.proc.stderr?.on("data", onChunk);

      this.proc.on("error", (err) => {
        finish(() => {
          reject(err);
        });
      });

      this.proc.on("close", (code) => {
        if (code !== 0 && code !== null && !settled) {
          finish(() => {
            reject(
              new Error(
                `Bun server exited with code ${String(code)}. Ensure Bun is installed and this repo is open at its root (packages/vexkit must exist).`,
              ),
            );
          });
        }
      });
    });
  }

  stop(): void {
    this.proc?.kill();
    this.proc = undefined;
  }
}
