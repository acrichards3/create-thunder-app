declare module "bun:fs" {
  export * from "node:fs";
}

declare module "bun:fs/promises" {
  export * from "node:fs/promises";
}

declare module "bun:path" {
  export {
    basename,
    delimiter,
    dirname,
    extname,
    format,
    isAbsolute,
    join,
    normalize,
    parse,
    posix,
    relative,
    resolve,
    sep,
    toNamespacedPath,
    win32,
  } from "node:path";
}

declare module "bun:process" {
  export const argv: string[];
  export function cwd(): string;
}
