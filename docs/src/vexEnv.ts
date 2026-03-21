export const getVexProviderProps = (): {
  apiKey: string | undefined;
  baseUrl: string | undefined;
} => {
  const rawKey = import.meta.env.VITE_VEX_API_KEY;
  const rawBase = import.meta.env.VITE_VEX_API_URL;
  return {
    apiKey: typeof rawKey === "string" && rawKey.length > 0 ? rawKey : undefined,
    baseUrl: typeof rawBase === "string" && rawBase.length > 0 ? rawBase : undefined,
  };
};
