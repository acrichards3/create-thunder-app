/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VEX_API_KEY?: string;
  readonly VITE_VEX_API_URL?: string;
}

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "../content/*.md?raw" {
  const content: string;
  export default content;
}

declare module "../../content/*.md?raw" {
  const content: string;
  export default content;
}
