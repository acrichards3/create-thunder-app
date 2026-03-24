import { pairedSpecRelativePath } from "./spec-pair/spec-step-shape";
import { specSourceContainsItTodo } from "./spec-pair/scan-it-todo";

export async function runTestSpecCommand(vexArg: string): Promise<void> {
  if (vexArg === "" || !vexArg.endsWith(".vex")) {
    await Bun.write(Bun.stderr, "vexkit test-spec: path to a .vex file is required.\n");
    process.exitCode = 1;
    return;
  }
  const specPath = pairedSpecRelativePath(vexArg);
  const specFile = Bun.file(specPath);
  if (!(await specFile.exists())) {
    await Bun.write(Bun.stderr, `Missing paired spec: ${specPath}\n`);
    process.exitCode = 1;
    return;
  }
  const specSource = await specFile.text();
  if (specSourceContainsItTodo(specSource)) {
    await Bun.write(Bun.stderr, "Spec still contains it.todo; replace todos with real tests first.\n");
    process.exitCode = 1;
    return;
  }
  const proc = Bun.spawn(["bun", "test", specPath], { stderr: "inherit", stdout: "inherit" });
  const code = await proc.exited;
  if (code !== 0) {
    process.exitCode = 1;
  }
}
