import { pairedSpecRelativePath } from "./spec-pair/spec-step-shape";
import { validateVexSpecPair } from "./spec-pair/validate-vex-spec-pair";

export async function runVerifyCommand(vexArg: string): Promise<void> {
  if (vexArg === "" || !vexArg.endsWith(".vex")) {
    await Bun.write(Bun.stderr, "vexkit verify: path to a .vex file is required.\n");
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
  const vexSource = await Bun.file(vexArg).text();
  const specSource = await specFile.text();
  const result = validateVexSpecPair({ specSource, vexSource });
  if (!result.ok) {
    await Bun.write(Bun.stderr, `${result.message}\n`);
    process.exitCode = 1;
    return;
  }
  await Bun.write(Bun.stdout, "OK — .vex structure matches paired .spec.ts\n");
}
