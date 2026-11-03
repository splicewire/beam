import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/input-error.tsx
import { jsx } from "react/jsx-runtime";
function InputError({
  message,
  className = "",
  ...props
}) {
  return message ? /* @__PURE__ */ jsx(
    "p",
    {
      ...props,
      className: cn("text-sm text-red-600 dark:text-red-400", className),
      children: message
    }
  ) : null;
}

export {
  InputError
};
//# sourceMappingURL=chunk-UJ2MQHRA.js.map