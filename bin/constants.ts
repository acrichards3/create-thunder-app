// ANSI color codes (no external dependency needed)
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

export const colors = { cyan, green, yellow, red, gray, bold };

export const BANNER = cyan(`
             ===    ████████╗██╗  ██╗██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗ 
           ====     ╚══██╔══╝██║  ██║██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
         =====         ██║   ███████║██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
        =====          ██║   ██╔══██║██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
      =======          ██║   ██║  ██║╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║
    ++++++++++++       ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
        ++++++                                                                    
       *++++*                          █████╗  ██████╗ ██████ 
       ****                           ██╔══██╗██╔══██╗██╔══██╗
      ***                             ███████║██████╔╝██████╔╝
     **                               ██╔══██║██╔═══╝ ██╔═══╝ 
                                      ██║  ██║██║     ██║     
                                      ╚═╝  ╚═╝╚═╝     ╚═╝     
`);

export const DEFAULT_PROJECT_NAME = "thunder-app";

export const IGNORE_ALWAYS = new Set([
  "node_modules",
  ".git",
  ".DS_Store",
  "bin",
  "dist",
  "docs",
  ".vite",
  ".cache",
  "coverage",
  ".nyc_output",
  "bun.lock",
]);

export const SKIP_FILES = new Set([".env", "LICENSE"]);

export const SKIP_EXTENSIONS = [".tsbuildinfo"] as const;
