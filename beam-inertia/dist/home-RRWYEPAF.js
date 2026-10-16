// src/pages/account/home.tsx
import { Head } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AccountHome() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Account" }),
    /* @__PURE__ */ jsxs("div", { style: { padding: 24 }, children: [
      /* @__PURE__ */ jsx(
        "h1",
        {
          style: { fontSize: 28, fontWeight: 700, margin: "0 0 8px" },
          children: "Account home"
        }
      ),
      /* @__PURE__ */ jsx("p", { style: { color: "#64748b", maxWidth: 560, lineHeight: 1.6 }, children: "Manage your profile, security, API tokens and team from the sidebar (behind the menu button on a narrow screen)." })
    ] })
  ] });
}
export {
  AccountHome as default
};
//# sourceMappingURL=home-RRWYEPAF.js.map