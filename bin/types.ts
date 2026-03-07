export interface ProjectConfig {
  name: string;
  targetDir: string;
  includeDeploy: boolean;
  includeGithub: boolean;
  includeAiSettings: boolean;
  includeSpecFirst: boolean;
}

export interface PackageJson {
  name?: string;
  private?: boolean;
  postinstall?: string;
  bin?: Record<string, string>;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}
