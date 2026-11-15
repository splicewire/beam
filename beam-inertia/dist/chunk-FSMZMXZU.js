import {
  useBrand
} from "./chunk-IHHHPJVP.js";
import {
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";

// src/components/app-logo-icon.tsx
import { jsx } from "react/jsx-runtime";
function AppLogoIcon(props) {
  const brand = useBrand();
  const Logo = getBeamInertiaConfig().logo;
  if (brand.logo) {
    return /* @__PURE__ */ jsx("img", { src: brand.logo, alt: brand.name, className: props.className });
  }
  if (Logo) {
    return /* @__PURE__ */ jsx(Logo, { ...props });
  }
  const initial = brand.name.trim().charAt(0).toUpperCase();
  return initial ? /* @__PURE__ */ jsx(
    "span",
    {
      "aria-hidden": "true",
      className: `${props.className ?? ""} inline-flex items-center justify-center font-semibold leading-none`,
      children: initial
    }
  ) : null;
}

export {
  AppLogoIcon
};
//# sourceMappingURL=chunk-FSMZMXZU.js.map