import {
  surfaceMessage
} from "./chunk-VXVLZYD3.js";
import "./chunk-3GD6IGMJ.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/operator/dashboard.tsx
import { Head, Link } from "@inertiajs/react";
import { StatTile } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function OperatorDashboard({ staff, stats, surfaces }) {
  const m = useBeamMessages();
  const s = staff ?? { name: m.t("splicewire-beam-inertia::messages.surfaces_operator"), email: "operator@example.test" };
  const st = stats ?? { users: 0, sitemaps: 0, entries: 0 };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-6 py-10", children: [
    /* @__PURE__ */ jsx(Head, { title: m.t("splicewire-beam-inertia::messages.surfaces_operator") }),
    /* @__PURE__ */ jsx("h1", { className: "font-serif text-3xl font-semibold", children: m.t("splicewire-beam-inertia::messages.surfaces_operator") }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_signed_in", { name: s.name, email: s.email }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(StatTile, { label: m.t("splicewire-beam-inertia::messages.surfaces_users"), value: st.users }),
      /* @__PURE__ */ jsx(StatTile, { label: m.t("splicewire-beam-inertia::messages.surfaces_sitemaps"), value: st.sitemaps }),
      /* @__PURE__ */ jsx(StatTile, { label: m.t("splicewire-beam-inertia::messages.surfaces_ux_entries"), value: st.entries })
    ] }),
    surfaces && surfaces.length > 0 && /* @__PURE__ */ jsxs("nav", { className: "mt-8", "aria-label": m.t("splicewire-beam-inertia::messages.surfaces_operator_surfaces"), "data-testid": "operator-surfaces", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xs tracking-wide text-muted-foreground uppercase", children: m.t("splicewire-beam-inertia::messages.surfaces_surfaces") }),
      /* @__PURE__ */ jsx("ul", { className: "mt-2 divide-y divide-border rounded-xl border border-border", children: surfaces.map((surface) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Link,
        {
          href: surface.href,
          className: "block px-4 py-3 hover:bg-muted/50",
          children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: surface.title }),
            surface.blurb && /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-sm text-muted-foreground", children: surface.blurb })
          ]
        }
      ) }, surface.href)) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-8 text-sm text-muted-foreground", children: surfaceMessage(m, "splicewire-beam-inertia::messages.surfaces_operator_explanation", { host: /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "@splicewire/beam-mainframe" }) }) })
  ] });
}
export {
  OperatorDashboard as default
};
//# sourceMappingURL=dashboard-RI7TSWRO.js.map