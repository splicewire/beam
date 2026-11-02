import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/password-input.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function PasswordInput({
  className,
  ref,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        type: showPassword ? "text" : "password",
        className: cn("pr-10", className),
        ref,
        ...props
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setShowPassword((prev) => !prev),
        className: "absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none",
        "aria-label": showPassword ? "Hide password" : "Show password",
        tabIndex: -1,
        children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsx(Eye, { className: "size-4" })
      }
    )
  ] });
}

export {
  PasswordInput
};
//# sourceMappingURL=chunk-EFVFQ3JO.js.map