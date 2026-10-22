import {
  bodyClient
} from "./chunk-BBDY2YPP.js";
import "./chunk-MTKP2AW3.js";

// src/pages/account/theme.tsx
import { Head } from "@inertiajs/react";
import { ThemeEditor, UxBuilderProvider } from "@splicewire/beam-ux";
import { useMemo } from "react";
import { toast } from "sonner";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AccountTheme({ entry }) {
  const services = useMemo(
    () => ({
      client: bodyClient,
      notify: (event) => event.type === "success" ? toast.success(event.message) : toast.error(event.message)
    }),
    []
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Theme" }),
    /* @__PURE__ */ jsx("div", { className: "p-6", children: entry ? /* @__PURE__ */ jsx(UxBuilderProvider, { services, children: /* @__PURE__ */ jsx(ThemeEditor, { entryId: entry.id }) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This site is using the default theme \u2014 there is no custom theme to edit yet." }) })
  ] });
}
export {
  AccountTheme as default
};
//# sourceMappingURL=theme-UBRWUY65.js.map