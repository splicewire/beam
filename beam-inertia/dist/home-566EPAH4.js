import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/account/home.tsx
import { Head } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AccountHome() {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: messages.t("splicewire-beam-inertia::messages.chrome_account") }),
    /* @__PURE__ */ jsxs("div", { style: { padding: 24 }, children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          style: { fontSize: 28, fontWeight: 700, margin: "0 0 8px" },
          children: messages.t("splicewire-beam-inertia::messages.chrome_account_home")
        }
      ),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", maxWidth: 560, lineHeight: 1.6 }, children: messages.t("splicewire-beam-inertia::messages.chrome_account_home_description") })
    ] })
  ] });
}
export {
  AccountHome as default
};
//# sourceMappingURL=home-566EPAH4.js.map