export const raise = (x: unknown): never => {
  throw new Error(String(x));
};
