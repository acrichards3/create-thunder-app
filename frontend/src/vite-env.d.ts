/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PORT: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
