export type TryCatchResult<T> = [T, null] | [null, Error];

export const tryCatch = <T>(fn: () => T): TryCatchResult<T> => {
  try {
    return [fn(), null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [null, new Error(String(error))];
  }
};

export const tryCatchAsync = async <T>(fn: () => Promise<T>): Promise<TryCatchResult<T>> => {
  try {
    return [await fn(), null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [null, new Error(String(error))];
  }
};
