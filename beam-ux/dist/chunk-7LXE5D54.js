import {
  ArtifactChrome,
  ProseTemplate,
  entryPageConfig,
  resolveLayout,
  resolveTemplate
} from "./chunk-3GSVPL7Y.js";
import {
  ManifestTable,
  PreviewBoundary,
  SiteClickEventListener,
  SiteNav
} from "./chunk-BPFG2P3I.js";
import {
  EntryBody
} from "./chunk-TYZJNBWG.js";

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
  const serverHead = config.serverHead === true && (props.head?.length ?? 0) > 0;
  const page = /* @__PURE__ */ jsxs(Fragment, { children: [
    !serverHead && /* @__PURE__ */ jsxs(Head, { title: entry.title ?? entry.slug, children: [
      entry.description && /* @__PURE__ */ jsx("meta", { name: "description", content: entry.description }),
      entry.socialImage && /* @__PURE__ */ jsx("meta", { property: "og:image", content: entry.socialImage })
    ] }),
    frame(
      Layout,
      layoutArtifact,
      Passthrough,
      frame(
        Template,
        templateArtifact,
        ProseTemplate,
        editable(/* @__PURE__ */ jsx(EntryBody, { artifact, components, bodyProps: { page: props, bindings: props.bindings, record: props.record } }))
      )
    )
  ] });
  const rendered = config.wrap ? config.wrap(page) : page;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteClickEventListener, { enabled: !props.preview }),
    props.preview ? /* @__PURE__ */ jsx(PreviewBoundary, { preview: props.preview, children: rendered }) : rendered
  ] });
}

export {
  SiteEntry
};
//# sourceMappingURL=chunk-7LXE5D54.js.map