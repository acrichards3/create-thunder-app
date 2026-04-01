import vexSpecContent from "./vex-spec.md?raw";
import React from "react";
import { DocsContainer } from "../../../components/docsContainer/DocsContainer";
import { Markdown } from "../../../components/markdown/Markdown";

export const VexSpec: React.FC = () => {
  return (
    <DocsContainer>
      <Markdown content={vexSpecContent} />
    </DocsContainer>
  );
};
