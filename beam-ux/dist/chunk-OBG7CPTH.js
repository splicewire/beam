import {
  ManifestTable,
  SiteNav
} from "./chunk-PVM3HEE6.js";
import {
  ArtifactChrome,
  ProseTemplate,
  entryPageConfig,
  resolveLayout,
  resolveTemplate
} from "./chunk-MPYP64WF.js";
import {
  EntryBody
} from "./chunk-TNJW77N2.js";

// src/pages/SiteEntry.tsx
import { Head } from "@inertiajs/react";
import { useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Passthrough({ children }) {
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function SiteEntry(props) {
  const { entry, artifact, nav } = props;
  const config = entryPageConfig();
  const components = useMemo(
    () => ({
      ManifestTable,
      SiteNav: (navProps) => /* @__PURE__ */ jsx(SiteNav, { nav, linkComponent: config.linkComponent, ...navProps }),
      ...config.components ?? {}
    }),
    [nav, config.components, config.linkComponent]
  );
  const declaredLayout = resolveLayout(entry.layout ?? config.defaultLayout);
  const layoutArtifact = declaredLayout ? null : props.chrome?.layout ?? null;
  const Layout = declaredLayout ?? (layoutArtifact ? null : resolveLayout(config.defaultLayout));
  const declaredTemplate = resolveTemplate(entry.template ?? config.defaultTemplate ?? "ProseTemplate");
  const templateArtifact = declaredTemplate ? null : props.chrome?.template ?? null;
  const Template = declaredTemplate ?? (templateArtifact ? null : resolveTemplate(config.defaultTemplate));
  const slots = typeof config.slots === "function" ? config.slots(entry) : config.slots;
  const chrome = {
    entry,
    nav,
    linkComponent: config.linkComponent,
    currentHref: entry.url ?? void 0,
    slots,
    classNames: config.classNames,
    page: props
  };
  const frame = (Component, chromeArtifact, fallback, children) => {
    if (Component) {
      return /* @__PURE__ */ jsx(Component, { ...chrome, children });
    }
    if (chromeArtifact?.url) {
      return /* @__PURE__ */ jsx(ArtifactChrome, { artifact: chromeArtifact, components, ...chrome, children });
    }
    const Fallback = fallback;
    return /* @__PURE__ */ jsx(Fallback, { ...chrome, children });
  };
  const EditableBody = config.editableBody;
  const editable = (body) => EditableBody ? /* @__PURE__ */ jsx(EditableBody, { entry, children: body }) : body;
  const page = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: entry.title ?? entry.slug }),
    frame(
      Layout,
      layoutArtifact,
      Passthrough,
      frame(
        Template,
        templateArtifact,
        ProseTemplate,
        editable(/* @__PURE__ */ jsx(EntryBody, { artifact, components, bodyProps: { page: props } }))
      )
    )
  ] });
  return /* @__PURE__ */ jsx(Fragment, { children: config.wrap ? config.wrap(page) : page });
}

export {
  SiteEntry
};
//# sourceMappingURL=chunk-OBG7CPTH.js.map