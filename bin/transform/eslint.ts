import { resolve } from "path";
import { mkdirSync } from "fs";
import type { ProjectConfig, PackageJson } from "../types";

const STRICT_ESLINT_DIR = resolve(import.meta.dir, "../templates/eslint");
const ESLINT_RULES_DIR = resolve(import.meta.dir, "../templates/eslint-rules");

const EXTRA_DEV_DEPS: Record<string, string> = {
  "@typescript-eslint/eslint-plugin": "^8",
  "@typescript-eslint/parser": "^8",
  eslint: "^9",
  "eslint-plugin-perfectionist": "^5",
  "eslint-plugin-sonarjs": "^4",
  "eslint-plugin-unicorn": "^63",
};

const WORKSPACE_CONFIGS: Array<{ eslintTemplate: string; workspace: string }> = [
  { eslintTemplate: "frontend.eslint.config.js", workspace: "frontend" },
  { eslintTemplate: "backend.eslint.config.js", workspace: "backend" },
  { eslintTemplate: "lib.eslint.config.js", workspace: "lib" },
];

const WORKSPACES_WITH_CUSTOM_RULES = ["backend", "lib"] as const satisfies readonly string[];

const RULE_FILES = [
  "describe-structure.js",
  "no-duplicate-describe.js",
  "no-empty-it.js",
  "no-multiple-assertions.js",
  "no-todo-without-description.js",
] as const satisfies readonly string[];

const makeTestSetupContent = (projectName: string): string =>
  [
    'import { drizzle } from "drizzle-orm/bun-sql";',
    'import { migrate } from "drizzle-orm/bun-sql/migrator";',
    'import { SQL } from "bun";',
    `import { raise, tryCatchAsync } from "@${projectName}/lib";`,
    'import { readdirSync } from "fs";',
    'import { resolve } from "path";',
    "",
    "Object.assign(Bun.env, {",
    '  AUTH_SECRET: "test-secret-for-testing-only",',
    '  DATABASE_URL: "postgres://postgres:test@localhost:5433/test",',
    '  GOOGLE_CLIENT_ID: "test-client-id",',
    '  GOOGLE_CLIENT_SECRET: "test-client-secret",',
    "});",
    "",
    'const migrationsFolder = resolve(import.meta.dir, "db/migrations");',
    'const migrationFiles = readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql"));',
    "",
    "if (migrationFiles.length === 0) {",
    "  process.stderr.write(",
    '    "\\n[test-setup] No migration files found in backend/src/db/migrations/\\n" +',
    '      "Run `bun run db:generate` first to generate the initial migration, then re-run tests.\\n\\n",',
    "  );",
    "  process.exit(1);",
    "}",
    "",
    'const client = new SQL(Bun.env.DATABASE_URL ?? raise("DATABASE_URL not set"));',
    "",
    "const [, pingError] = await tryCatchAsync(async (): Promise<void> => {",
    "  await client`SELECT 1`;",
    "});",
    "if (pingError !== null) {",
    "  process.stderr.write(",
    '    "\\n[test-setup] Could not connect to the test database.\\n" +',
    '      "Make sure the Docker test container is running: bun run test:db:up\\n" +',
    "      `Details: ${pingError.message}\\n\\n`,",
    "  );",
    "  process.exit(1);",
    "}",
    "",
    "const db = drizzle({ client });",
    "",
    "await migrate(db, { migrationsFolder });",
    "await client.end();",
    "",
  ].join("\n");

const DOCKER_COMPOSE_TEST_CONTENT = [
  "services:",
  "  postgres-test:",
  "    image: postgres:16-alpine",
  "    environment:",
  "      POSTGRES_DB: test",
  "      POSTGRES_PASSWORD: test",
  "      POSTGRES_USER: postgres",
  "    healthcheck:",
  "      interval: 2s",
  "      retries: 10",
  '      test: ["CMD-SHELL", "pg_isready -U postgres"]',
  "      timeout: 5s",
  "    ports:",
  '      - "5433:5432"',
  "",
].join("\n");

const BUNFIG_BACKEND_CONTENT = '[test]\nroot = "src"\npreload = ["./src/test-setup.ts"]\n';
const BUNFIG_LIB_CONTENT = '[test]\nroot = "src"\n';

const TSCONFIG_ESLINT_CONTENT = `{ "extends": "./tsconfig.json", "include": ["src/**/*"], "exclude": [] }
`;

async function applyTestSetup(targetDir: string, projectName: string): Promise<void> {
  await Promise.all([
    Bun.write(resolve(targetDir, "backend", "bunfig.toml"), BUNFIG_BACKEND_CONTENT),
    Bun.write(resolve(targetDir, "lib", "bunfig.toml"), BUNFIG_LIB_CONTENT),
    Bun.write(resolve(targetDir, "backend", "src", "test-setup.ts"), makeTestSetupContent(projectName)),
    Bun.write(resolve(targetDir, "backend", "tsconfig.eslint.json"), TSCONFIG_ESLINT_CONTENT),
    Bun.write(resolve(targetDir, "lib", "tsconfig.eslint.json"), TSCONFIG_ESLINT_CONTENT),
    Bun.write(resolve(targetDir, "docker-compose.test.yml"), DOCKER_COMPOSE_TEST_CONTENT),
  ]);
}

async function overwriteEslintConfig(targetDir: string, workspace: string, templateName: string): Promise<void> {
  const src = resolve(STRICT_ESLINT_DIR, templateName);
  const dest = resolve(targetDir, workspace, "eslint.config.js");
  await Bun.write(dest, Bun.file(src));
}

async function copyEslintRules(targetDir: string, workspace: string): Promise<void> {
  const rulesDestDir = resolve(targetDir, workspace, "eslint-rules");
  mkdirSync(rulesDestDir, { recursive: true });
  await Promise.all(
    RULE_FILES.map(async (file) => {
      await Bun.write(resolve(rulesDestDir, file), Bun.file(resolve(ESLINT_RULES_DIR, file)));
    }),
  );
}

async function injectDeps(targetDir: string, workspace: string): Promise<void> {
  const pkgPath = resolve(targetDir, workspace, "package.json");
  const pkgFile = Bun.file(pkgPath);

  if (!(await pkgFile.exists())) {
    return;
  }

  const pkg: PackageJson = await pkgFile.json();
  const devDeps = pkg.devDependencies ?? {};

  const merged = { ...devDeps, ...EXTRA_DEV_DEPS };
  const entries: Array<[string, string]> = Object.entries(merged);
  const sortedEntries = entries.slice().sort(([a], [b]) => a.localeCompare(b));
  const sorted = Object.fromEntries(sortedEntries);

  pkg.devDependencies = sorted;

  const removeDeps = ["eslint-plugin-sort-keys", "eslint-plugin-typescript-sort-keys"];
  removeDeps.forEach((dep) => {
    delete pkg.devDependencies?.[dep];
  });

  await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

export async function applyStrictEslint(config: ProjectConfig): Promise<void> {
  const tasks = WORKSPACE_CONFIGS.map(async ({ eslintTemplate, workspace }) => {
    await overwriteEslintConfig(config.targetDir, workspace, eslintTemplate);
    await injectDeps(config.targetDir, workspace);
    if ((WORKSPACES_WITH_CUSTOM_RULES as readonly string[]).includes(workspace)) {
      await copyEslintRules(config.targetDir, workspace);
    }
  });

  await Promise.all(tasks);

  await applyTestSetup(config.targetDir, config.name);

  const rootPkgPath = resolve(config.targetDir, "package.json");
  const rootPkgFile = Bun.file(rootPkgPath);

  if (await rootPkgFile.exists()) {
    const pkg: PackageJson = await rootPkgFile.json();
    const devDeps = pkg.devDependencies ?? {};
    delete devDeps["eslint-plugin-sort-keys"];
    delete devDeps["eslint-plugin-typescript-sort-keys"];
    pkg.devDependencies = devDeps;

    const scripts = pkg.scripts ?? {};
    pkg.scripts = {
      ...scripts,
      "test:db:down": "docker compose -f docker-compose.test.yml down",
      "test:db:up": "docker compose -f docker-compose.test.yml up -d --wait",
    };

    await Bun.write(rootPkgPath, JSON.stringify(pkg, null, 2) + "\n");
  }
}
