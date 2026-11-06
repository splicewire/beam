// src/pages/operator/dashboard.tsx
import { Head, Link } from "@inertiajs/react";
import { StatTile } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function OperatorDashboard({ staff, stats, surfaces }) {
  const s = staff ?? { name: "Operator", email: "operator@example.test" };
  const st = stats ?? { users: 0, sitemaps: 0, entries: 0 };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-6 py-10", children: [
    /* @__PURE__ */ jsx(Head, { title: "Operator" }),
    /* @__PURE__ */ jsx("h1", { className: "font-serif text-3xl font-semibold", children: "Operator" }),
    /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
      "Signed in as ",
      s.name,
      " (",
      s.email,
      ")"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsx(StatTile, { label: "Users", value: st.users }),
      /* @__PURE__ */ jsx(StatTile, { label: "Sitemaps", value: st.sitemaps }),
      /* @__PURE__ */ jsx(StatTile, { label: "UX entries", value: st.entries })
    ] }),
    surfaces && surfaces.length > 0 && /* @__PURE__ */ jsxs("nav", { className: "mt-8", "aria-label": "Operator surfaces", "data-testid": "operator-surfaces", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xs tracking-wide text-muted-foreground uppercase", children: "Surfaces" }),
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
    /* @__PURE__ */ jsxs("p", { className: "mt-8 text-sm text-muted-foreground", children: [
      "This is the operator realm's front-end, framed by the promoted",
      " ",
      /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "@splicewire/beam-mainframe" }),
      " ",
      "Mainframe host. Resource lists are served by Frame's generic particle CRUD socket; this landing is a thin stats roll-up."
    ] })
  ] });
}
export {
  OperatorDashboard as default
};
//# sourceMappingURL=dashboard-4WQQCVJX.js.map