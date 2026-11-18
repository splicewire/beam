import {
  cn
} from "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/components/ui/spinner.tsx
import { Loader2Icon } from "lucide-react";
import { jsx } from "react/jsx-runtime";
function Spinner({ className, ...props }) {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsx(
    Loader2Icon,
    {
      role: "status",
      "aria-label": messages.t("splicewire-beam-inertia::messages.chrome_loading"),
      className: cn("size-4 animate-spin", className),
      ...props
    }
  );
}

export {
  Spinner
};
//# sourceMappingURL=chunk-2ENPYRHF.js.map