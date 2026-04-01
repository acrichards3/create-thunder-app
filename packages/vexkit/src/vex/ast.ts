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

export type VexDescribeBlock = {
  label: string;
  line: number;
  nestedDescribes: VexDescribeBlock[];
  whens: VexWhen[];
};

export type VexDocument = {
  describes: VexDescribeBlock[];
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
