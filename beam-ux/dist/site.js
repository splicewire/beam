import {
  ManifestTable,
  ManifestTableView,
  PreviewBar,
  PreviewBoundary,
  SiteClickEventListener,
  SiteNav,
  fetchManifest,
  installClickEventListener,
  reportEvent
} from "./chunk-BPFG2P3I.js";
import {
  EntryBody,
  PROSE_CSS,
  Prose,
  componentFromArtifact,
  useEntryArtifact
} from "./chunk-TN4K5YMZ.js";
import "./chunk-FWRFSTBG.js";
import "./chunk-EMFVKUTK.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";

// src/site/SiteLayout.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function SiteLayout({
  children,
  brand,
  nav,
  footerBrand,
  footerLinks,
  linkComponent,
  header,
  footer,
  head,
  className,
  style,
  headerClassName,
  headerStyle,
  mainClassName,
  mainStyle,
  footerClassName,
  footerStyle,
  footerLinkClassName,
  footerLinkStyle
}) {
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    head,
    /* @__PURE__ */ jsxs("div", { className, style, children: [
      header ?? /* @__PURE__ */ jsxs("header", { className: headerClassName, style: headerStyle, children: [
        brand,
        nav
      ] }),
      /* @__PURE__ */ jsx("main", { className: mainClassName, style: mainStyle, children }),
      footer ?? /* @__PURE__ */ jsxs("footer", { className: footerClassName, style: footerStyle, children: [
        footerBrand ?? brand,
        footerLinks && footerLinks.length > 0 && /* @__PURE__ */ jsx("div", { children: footerLinks.map(
          (link) => link.external ? /* @__PURE__ */ jsx(
            "a",
            {
              href: link.href,
              className: footerLinkClassName,
              style: footerLinkStyle,
              children: link.title
            },
            link.href
          ) : /* @__PURE__ */ jsx(
            Link,
            {
              href: link.href,
              className: footerLinkClassName,
              style: footerLinkStyle,
              children: link.title
            },
            link.href
          )
        ) })
      ] })
    ] })
  ] });
}
export {
  EntryBody,
  ManifestTable,
  ManifestTableView,
  PROSE_CSS,
  PreviewBar,
  PreviewBoundary,
  Prose,
  SiteClickEventListener,
  SiteLayout,
  SiteNav,
  componentFromArtifact,
  fetchManifest,
  installClickEventListener,
  reportEvent,
  useEntryArtifact
};
//# sourceMappingURL=site.js.map