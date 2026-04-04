export type LabelSpan = {
  end: number;
  start: number;
};

export type ItNode = {
  kind: "it";
  label: string;
  labelSpan: LabelSpan;
  line: number;
};

export type AndNode = {
  child: BranchNode | undefined;
  kind: "and";
  label: string;
  labelSpan: LabelSpan;
  line: number;
};

export type BranchNode = ItNode | AndNode;

export type WhenNode = {
  branches: BranchNode[];
  label: string;
  labelSpan: LabelSpan;
  line: number;
};

export type DescribeBlock = {
  label: string;
  labelSpan: LabelSpan;
  line: number;
  nestedDescribes: DescribeBlock[];
  whens: WhenNode[];
};

export type VexDocument = {
  describes: DescribeBlock[];
};

export type ParseError = {
  line: number;
  message: string;
};

export type StackFrameDescribe = {
  indent: number;
  kind: "describe";
  node: DescribeBlock;
};

export type StackFrameWhen = {
  indent: number;
  kind: "when";
  node: WhenNode;
};

export type StackFrameAnd = {
  indent: number;
  kind: "and";
  node: AndNode;
};

export type StackFrameIt = {
  indent: number;
  kind: "it";
  node: ItNode;
};

export type StackFrame = StackFrameAnd | StackFrameDescribe | StackFrameIt | StackFrameWhen;

export type ParseContext = {
  document: VexDocument;
  errors: ParseError[];
  stack: StackFrame[];
};
