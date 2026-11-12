// src/context.tsx
import { usePage } from "@inertiajs/react";
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var BeamMdxContext = createContext(null);
function BeamMdxProvider({
  references,
  resolve,
  children
}) {
  return /* @__PURE__ */ jsx(BeamMdxContext.Provider, { value: { references, resolve }, children });
}
function useBeamMdx() {
  return useContext(BeamMdxContext) ?? {
    references: [],
    resolve: () => void 0
  };
}
function useLinks() {
  const props = usePage().props;
  return props.links ?? {};
}

// src/components/content.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Content({ name }) {
  const { resolve } = useBeamMdx();
  const mod = resolve(name);
  if (!mod) {
    if (import.meta.env?.DEV) {
      console.warn(`<Content name="${name}"> \u2014 no such content file`);
    }
    return null;
  }
  const { Component } = mod;
  return /* @__PURE__ */ jsx2(Component, {});
}

export {
  BeamMdxProvider,
  useBeamMdx,
  useLinks,
  Content
};
//# sourceMappingURL=chunk-RJIJTUAE.js.map