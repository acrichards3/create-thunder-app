import React from "react";
import { VexFlag } from "vexapp-sdk";

export const FeatureFlagCallout: React.FC = () => {
  return (
    <VexFlag
      defaultEnabled={false}
      fallback={
        <p className="text-gray-500 max-w-xl text-center text-sm">
          Create a <span className="text-gray-400">welcome-beta</span> flag in the Vex dashboard to see the alternate
          message.
        </p>
      }
      name="welcome-beta"
    >
      <p className="text-emerald-400/90 max-w-xl text-center text-sm">
        Vex Flags are connected — this copy is served when the flag is on.
      </p>
    </VexFlag>
  );
};
