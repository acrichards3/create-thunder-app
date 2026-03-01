export const isKey = <T extends object>(x: T, k: PropertyKey): k is keyof T => k in x;

export const objectEntries = <T extends object>(obj: T): Array<[keyof T, T[keyof T]]> => {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
};

export const objectFromEntries = <T extends object>(entries: Iterable<readonly [keyof T, T[keyof T]]>): T => {
  return Object.fromEntries(entries) as T;
};

export const objectKeys = <T extends object>(obj: T): (keyof T & string)[] => {
  return Object.keys(obj).filter((k): k is keyof T & string => isKey(obj, k));
};
