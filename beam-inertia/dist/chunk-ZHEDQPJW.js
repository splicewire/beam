import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/text-link.tsx
import { Link } from "@inertiajs/react";
import { jsx } from "react/jsx-runtime";
function TextLink({
  className = "",
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Link,
    {
      className: cn(
        "text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500",
        className
      ),
      ...props,
      children
    }
  );
}

export {
  TextLink
};
//# sourceMappingURL=chunk-ZHEDQPJW.js.map