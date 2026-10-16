import {
  DocsPublishingPanel
} from "./chunk-IUVX4TYA.js";

// src/pages/DocsPublishingPage.tsx
import { Head } from "@inertiajs/react";
import { jsx, jsxs } from "react/jsx-runtime";
function DocsPublishingPage({ publicationsEndpoint, docsUrl }) {
  const back = docsUrl?.startsWith("/") && !docsUrl.startsWith("//") ? docsUrl : null;
  return /* @__PURE__ */ jsxs("main", { className: "beam-docs-publishing-page", children: [
    /* @__PURE__ */ jsx(Head, { title: "Documentation publishing" }),
    /* @__PURE__ */ jsxs("header", { children: [
      back && /* @__PURE__ */ jsx("a", { className: "beam-docs-back", href: back, children: "Back to documentation" }),
      /* @__PURE__ */ jsx("h1", { children: "Documentation publishing" }),
      /* @__PURE__ */ jsx("p", { children: "Publish a release to Scalar Registry and track each attempt." })
    ] }),
    /* @__PURE__ */ jsx(DocsPublishingPanel, { endpoint: publicationsEndpoint })
  ] });
}

export {
  DocsPublishingPage
};
//# sourceMappingURL=chunk-OW5D3CXC.js.map