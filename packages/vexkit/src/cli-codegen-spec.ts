import { generateSpecTsFromVexDocument } from "./spec-pair/codegen-spec-ts";
import { pairedSpecRelativePath } from "./spec-pair/spec-step-shape";
import { parseAndValidateVexDocument } from "./vex/parse-and-validate-vex-document";

export async function runCodegenSpecCommand(argvAfter: string[]): Promise<void> {
  let overwrite = false;
  let vexPath = "";
  for (const a of argvAfter) {
    if (a === "--force") {
      overwrite = true;
      continue;
    }
    if (!a.startsWith("-") && vexPath === "") {
      vexPath = a;
    }
  }
  if (vexPath === "" || !vexPath.endsWith(".vex")) {
    await Bun.write(Bun.stderr, "vexkit codegen-spec [--force] <file.vex>\n");
    process.exitCode = 1;
    return;
  }
  const specPath = pairedSpecRelativePath(vexPath);
  const specFile = Bun.file(specPath);
  if ((await specFile.exists()) && !overwrite) {
    await Bun.write(Bun.stderr, `Spec exists: ${specPath} (use --force to overwrite)\n`);
    process.exitCode = 1;
    return;
  }
  const vexSource = await Bun.file(vexPath).text();
  const parsed = parseAndValidateVexDocument(vexSource);
  if (!parsed.ok || parsed.document == null) {
    await Bun.write(Bun.stderr, "Invalid .vex file.\n");
    process.exitCode = 1;
    return;
  }
  const content = generateSpecTsFromVexDocument(parsed.document);
  await Bun.write(specPath, content);
  await Bun.write(Bun.stdout, `Wrote ${specPath}\n`);
}
