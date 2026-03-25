import { watch } from "bun:fs";

function isVexRelatedChange(filename: string | Buffer | null): boolean {
  if (filename == null) {
    return true;
  }
  const name = typeof filename === "string" ? filename : filename.toString("utf8");
  return name.replace(/\\/g, "/").endsWith(".vex");
}

export function startDashboardFileWatch(input: {
  debounceMs: number;
  onDebouncedChange: () => void;
  rootAbs: string;
}): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer != null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      input.onDebouncedChange();
    }, input.debounceMs);
  };

  let watcher: ReturnType<typeof watch> | null = null;
  try {
    watcher = watch(input.rootAbs, { recursive: true }, (_event, filename) => {
      if (!isVexRelatedChange(filename)) {
        return;
      }
      schedule();
    });
  } catch {
    return () => {
      if (timer != null) {
        clearTimeout(timer);
      }
    };
  }

  return () => {
    if (timer != null) {
      clearTimeout(timer);
    }
    watcher.close();
  };
}
