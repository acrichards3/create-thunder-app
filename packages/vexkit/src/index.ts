export const VEXKIT_VERSION = "0.0.0" as const;

export { parseAndValidateVexDocument, parseVexDocument, validateVexDocument } from "./vex";
export type {
  VexAnd,
  VexBody,
  VexDescribeBlock,
  VexDocument,
  VexIt,
  VexParseError,
  VexParseResult,
  VexWhen,
} from "./vex";
