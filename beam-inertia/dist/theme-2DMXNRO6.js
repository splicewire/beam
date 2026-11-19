import {
  bodyClient
} from "./chunk-MUHE33WK.js";
import "./chunk-XP5YRUDH.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/account/theme.tsx
import { Head } from "@inertiajs/react";
import { ThemeEditor, UxBuilderProvider } from "@splicewire/beam-ux";
import { useMemo } from "react";
import { toast } from "sonner";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AccountTheme({ entry }) {
  const messages = useBeamMessages();
  const services = useMemo(
    () => ({
      client: bodyClient,
      notify: (event) => event.type === "success" ? toast.success(event.message) : toast.error(event.message)
    }),
    []
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: messages.t("splicewire-beam-inertia::messages.chrome_theme") }),
    /* @__PURE__ */ jsx("div", { className: "p-6", children: entry ? /* @__PURE__ */ jsx(UxBuilderProvider, { services, children: /* @__PURE__ */ jsx(ThemeEditor, { entryId: entry.id }) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: messages.t("splicewire-beam-inertia::messages.chrome_default_theme") }) })
  ] });
}
export {
  AccountTheme as default
};
//# sourceMappingURL=theme-2DMXNRO6.js.map