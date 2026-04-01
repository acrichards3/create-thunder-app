export type VexIt = {
  kind: "it";
  label: string;
  line: number;
};

export type VexAnd = {
  child: VexBody | undefined;
  kind: "and";
  label: string;
  line: number;
};

export type VexBody = VexAnd | VexIt;

export type VexWhen = {
  branches: VexBody[];
  label: string;
  line: number;
};

export type VexFunction = {
  description: string;
  line: number;
  name: string;
  whens: VexWhen[];
};

export type VexDocument = {
  functions: VexFunction[];
};

export type VexParseError = {
  line: number;
  message: string;
};

export type VexParseResult = {
  document: VexDocument | undefined;
  errors: readonly VexParseError[];
  ok: boolean;
};
