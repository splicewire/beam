import {
  frameIcon,
  useFrameManifest
} from "./chunk-N5WTRHC3.js";
import {
  toUrl
} from "./chunk-GBIJGQ7E.js";

// src/components/frame-rail.tsx
import { Link } from "@inertiajs/react";
import { RealmNav } from "@splicewire/beam-ux/nav";

// src/hooks/use-current-url.ts
import { usePage } from "@inertiajs/react";
function useCurrentUrl() {
  const page = usePage();
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
import { jsx } from "react/jsx-runtime";
var InertiaRailLink = ({ href, className, style, children, ...rest }) => /* @__PURE__ */ jsx(Link, { href, className, style, ...rest, children });
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
  const items = (manifest?.nav?.items ?? []).filter((node) => !(node.children.length === 0 && node.href !== null && omitHrefs.includes(node.href))).map(stamp);
  if (items.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    RealmNav,
    {
      items,
      variant: "section-groups",
      linkComponent: InertiaRailLink,
      icon: (node, { className }) => {
        const Icon = frameIcon(node.icon);
        return /* @__PURE__ */ jsx(Icon, { className });
      }
    }
  );
}

export {
  useCurrentUrl,
  InertiaRailLink,
  FrameRail
};
//# sourceMappingURL=chunk-EOJIG22E.js.map