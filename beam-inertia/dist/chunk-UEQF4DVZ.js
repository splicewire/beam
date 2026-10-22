import {
  frameIcon,
  useFrameManifest
} from "./chunk-WB76RVEA.js";
import {
  getBeamInertiaConfig
} from "./chunk-2XTQOEA4.js";
import {
  toUrl
} from "./chunk-GBIJGQ7E.js";

// src/hooks/use-brand.ts
import { usePage } from "@inertiajs/react";
function useBrand() {
  const { brand, name } = usePage().props;
  return brand ?? { name: name ?? "", logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: "" };
}
function brandTitle(title, brand) {
  if (!title) return brand.name;
  if (brand.titleTemplate) return brand.titleTemplate.replace(":title", title).replace(":name", brand.name);
  return brand.name ? `${title} - ${brand.name}` : title;
}

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

// src/hooks/use-current-url.ts
import { usePage as usePage2 } from "@inertiajs/react";
function useCurrentUrl() {
  const page = usePage2();
  const currentUrlPath = new URL(
    page.url,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  ).pathname;
  const isCurrentUrl = (urlToCheck, currentUrl, startsWith = false) => {
    const urlToCompare = currentUrl ?? currentUrlPath;
    const urlString = toUrl(urlToCheck);
    const comparePath = (path) => startsWith ? urlToCompare.startsWith(path) : path === urlToCompare;
    if (!urlString.startsWith("http")) {
      return comparePath(urlString);
    }
    try {
      const absoluteUrl = new URL(urlString);
      return comparePath(absoluteUrl.pathname);
    } catch {
      return false;
    }
  };
  const isCurrentOrParentUrl = (urlToCheck, currentUrl) => {
    return isCurrentUrl(urlToCheck, currentUrl, true);
  };
  const whenCurrentUrl = (urlToCheck, ifTrue, ifFalse = null) => {
    return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
  };
  return {
    currentUrl: currentUrlPath,
    isCurrentUrl,
    isCurrentOrParentUrl,
    whenCurrentUrl
  };
}

// src/components/frame-rail.tsx
import { Link } from "@inertiajs/react";
import { RealmNav } from "@splicewire/beam-ux/nav";
import { jsx as jsx2 } from "react/jsx-runtime";
var InertiaRailLink = ({ href, className, style, children, ...rest }) => /* @__PURE__ */ jsx2(Link, { href, className, style, ...rest, children });
function FrameRail({ omitHrefs = [] } = {}) {
  const { data: manifest } = useFrameManifest();
  const { isCurrentUrl } = useCurrentUrl();
  const stamp = (node) => {
    const children = node.children.map(stamp);
    const active = node.href !== null && isCurrentUrl(node.href);
    return {
      ...node,
      locked: node.locked ?? null,
      children,
      active,
      activeTrail: active || children.some((child) => child.active || child.activeTrail)
    };
  };
  const items = (manifest?.nav.items ?? []).filter((node) => !(node.children.length === 0 && node.href !== null && omitHrefs.includes(node.href))).map(stamp);
  if (items.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx2(
    RealmNav,
    {
      items,
      variant: "section-groups",
      linkComponent: InertiaRailLink,
      icon: (node, { className }) => {
        const Icon = frameIcon(node.icon);
        return /* @__PURE__ */ jsx2(Icon, { className });
      }
    }
  );
}

export {
  useBrand,
  brandTitle,
  AppLogoIcon,
  useCurrentUrl,
  InertiaRailLink,
  FrameRail
};
//# sourceMappingURL=chunk-UEQF4DVZ.js.map