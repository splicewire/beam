import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/ui/spinner.tsx
import { Loader2Icon } from "lucide-react";
import { jsx } from "react/jsx-runtime";
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    Loader2Icon,
    {
      role: "status",
      "aria-label": "Loading",
      className: cn("size-4 animate-spin", className),
      ...props
    }
  );
}

export {
  Spinner
};
//# sourceMappingURL=chunk-3T56CRQW.js.map