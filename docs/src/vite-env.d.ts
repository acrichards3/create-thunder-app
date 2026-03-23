/// <reference types="vite/client" />

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
