// src/nav/RealmNav.tsx
import { useState } from "react";

// src/nav/css.ts
var SIDEBAR_ACTIVE_FG = "var(--sidebar-active-foreground,var(--sidebar-foreground))";
var REALM_NAV_CSS = `
.beam-nav-label { letter-spacing: 0.1em; }
.beam-nav-icon { width: 17px; height: 17px; }
.beam-nav-item[data-active='true'] { color: ${SIDEBAR_ACTIVE_FG}; }
.beam-nav-item[data-active='false']:hover { color: ${SIDEBAR_ACTIVE_FG}; }
.beam-nav-item[data-locked='true'] {
  width: 100%;
  cursor: pointer;
  font: inherit;
  text-align: left;
  background: none;
  opacity: var(--beam-nav-locked-opacity, 0.65);
}
.beam-nav-item[data-locked='true']:hover { opacity: 1; }
.beam-nav-lock { flex: none; margin-left: auto; font-size: 0.85em; line-height: 1; }
.beam-nav-upsell-scrim { position: fixed; inset: 0; z-index: 50; }
.beam-nav-upsell {
  position: fixed;
  z-index: 51;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(var(--beam-nav-upsell-width, 22rem), calc(100vw - 2rem));
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: var(--card, var(--background));
  color: var(--card-foreground, var(--foreground));
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
.beam-nav-upsell-title { font-weight: 600; margin-bottom: 0.375rem; }
.beam-nav-upsell-copy { margin: 0 0 1rem; opacity: 0.8; }
`;

// src/nav/RealmNav.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var DEFAULTS = {
  root: "flex-1 space-y-4 overflow-y-auto px-2.5 text-[13px] font-medium",
  group: "space-y-0.5",
  groupLabel: "beam-nav-label px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase text-sidebar-foreground/55",
  // The Developer zone is a container, not one more group (build.qa, UX-08b): a divider above it and a title in
  // sentence case and heavier than the uppercase section labels inside it, so "Developer" and "Ops" never read as
  // two equal headings.
  zone: "mt-1 space-y-0.5 border-t border-sidebar-border pt-2",
  zoneLabel: "beam-nav-zone-label px-2.5 pb-0.5 text-[12px] font-semibold text-sidebar-foreground/80",
  // The active / hover text colour is `.beam-nav-item[data-active=…]` in REALM_NAV_CSS; the
  // utilities here are the ones every host emits for its own sidebar.
  item: (active) => [
    "beam-nav-item flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 transition-colors",
    active ? "border-sidebar-primary bg-sidebar-accent font-semibold" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40"
  ].join(" "),
  itemIcon: (active) => ["beam-nav-icon flex-none", active ? "text-sidebar-primary" : "text-sidebar-foreground/70"].join(
    " "
  ),
  itemLabel: "min-w-0 flex-1 truncate"
};
function resolveClass(override, fallback, active) {
  if (override === void 0) return fallback(active);
  return typeof override === "function" ? override(active) : override;
}
function toGroups(items, variant) {
  if (variant === "section-groups") {
    return items.map((section) => ({
      label: section.title,
      items: (section.children && section.children.length > 0 ? section.children : [section]).filter(isRailable)
    })).filter((group) => group.items.length > 0);
  }
  const groups = [];
  let current = { items: [] };
  for (const node of items) {
    if (!node.href && !node.locked) {
      if (current.items.length > 0) groups.push(current);
      current = { label: node.title, items: (node.children ?? []).filter(isRailable) };
    } else {
      current.items.push(node);
    }
  }
  if (current.items.length > 0) groups.push(current);
  return groups;
}
function isRailable(node) {
  return Boolean(node.href || node.locked);
}
function UpsellPopover({
  node,
  cta,
  onClose
}) {
  const upsell = node.locked?.upsell ?? null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "beam-nav-upsell-scrim", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "beam-nav-upsell", role: "dialog", "aria-label": `Unlock ${node.title}`, children: [
      /* @__PURE__ */ jsx("div", { className: "beam-nav-upsell-title", children: node.title }),
      /* @__PURE__ */ jsx("p", { className: "beam-nav-upsell-copy", children: node.locked?.reason }),
      cta ? cta(node, { upsell }) : /* @__PURE__ */ jsx("button", { type: "button", className: "beam-nav-upsell-cta", onClick: onClose, children: "Upgrade" })
    ] })
  ] });
}
function RailItem({
  node,
  linkComponent,
  icon,
  classNames,
  onUpsell
}) {
  const serverActive = Boolean(node.active || node.activeTrail);
  const iconClass = resolveClass(classNames?.itemIcon, DEFAULTS.itemIcon, serverActive);
  if (node.locked) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: resolveClass(classNames?.item, DEFAULTS.item, false),
        "data-active": false,
        "data-locked": true,
        title: node.locked.reason,
        onClick: () => onUpsell(node),
        children: [
          icon ? icon(node, { className: iconClass, active: false }) : null,
          /* @__PURE__ */ jsx("span", { className: classNames?.itemLabel ?? DEFAULTS.itemLabel, children: node.title }),
          /* @__PURE__ */ jsx("span", { className: "beam-nav-lock", "aria-label": "locked", children: "\u{1F512}" })
        ]
      }
    );
  }
  if (!node.href) return null;
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href: node.href,
      className: resolveClass(classNames?.item, DEFAULTS.item, serverActive),
      "data-active": serverActive,
      "aria-current": serverActive ? "page" : void 0,
      children: [
        icon ? icon(node, { className: iconClass, active: serverActive }) : null,
        /* @__PURE__ */ jsx("span", { className: classNames?.itemLabel ?? DEFAULTS.itemLabel, children: node.title })
      ]
    }
  );
}
function RealmNav({
  items,
  variant = "flat-with-headers",
  linkComponent,
  icon,
  classNames,
  upsellCta,
  meta
}) {
  const rail = (items ?? []).filter((node) => node.zone !== "meta");
  const zones = (items ?? []).filter((node) => node.zone === "meta" && (node.children?.length ?? 0) > 0);
  const groups = toGroups(rail, variant);
  const [upsell, setUpsell] = useState(null);
  return /* @__PURE__ */ jsxs("nav", { className: classNames?.root ?? DEFAULTS.root, children: [
    /* @__PURE__ */ jsx("style", { children: REALM_NAV_CSS }),
    groups.map((group, i) => /* @__PURE__ */ jsxs("div", { className: classNames?.group ?? DEFAULTS.group, children: [
      group.label ? /* @__PURE__ */ jsx("div", { className: classNames?.groupLabel ?? DEFAULTS.groupLabel, children: group.label }) : null,
      group.items.map((node) => /* @__PURE__ */ jsx(
        RailItem,
        {
          node,
          linkComponent,
          icon,
          classNames,
          onUpsell: setUpsell
        },
        node.routeName ?? node.href ?? node.title
      ))
    ] }, group.label ?? `group-${i}`)),
    zones.length > 0 ? meta ? meta(zones) : zones.map((zone) => /* @__PURE__ */ jsxs("div", { "data-zone": "meta", className: classNames?.zone ?? DEFAULTS.zone, children: [
      /* @__PURE__ */ jsx("div", { "data-zone-label": true, className: classNames?.zoneLabel ?? DEFAULTS.zoneLabel, children: zone.title }),
      toGroups(zone.children ?? [], "section-groups").map((group, i, seats) => /* @__PURE__ */ jsxs("div", { className: classNames?.group ?? DEFAULTS.group, children: [
        seats.length > 1 && group.label ? /* @__PURE__ */ jsx("div", { className: classNames?.groupLabel ?? DEFAULTS.groupLabel, children: group.label }) : null,
        group.items.map((node) => /* @__PURE__ */ jsx(
          RailItem,
          {
            node,
            linkComponent,
            icon,
            classNames,
            onUpsell: setUpsell
          },
          node.routeName ?? node.href ?? node.title
        ))
      ] }, group.label ?? `seat-${i}`))
    ] }, zone.routeName ?? zone.title)) : null,
    upsell ? /* @__PURE__ */ jsx(UpsellPopover, { node: upsell, cta: upsellCta, onClose: () => setUpsell(null) }) : null
  ] });
}

// src/nav/RealmSwitcher.tsx
import { useRef, useState as useState2 } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var PlainLink = ({ href, className, children, ...rest }) => /* @__PURE__ */ jsx2("a", { href, className, ...rest, children });
function RealmSwitcher({
  realms,
  label,
  signOutHref,
  linkComponent,
  workspaces,
  defaultOpen = false,
  side = "bottom",
  current,
  className,
  triggerClassName
}) {
  const here = current ?? realms.current;
  const [open, setOpen] = useState2(defaultOpen);
  const trigger = useRef(null);
  const Link = linkComponent ?? PlainLink;
  const appRealms = realms.realms.filter((r) => r.surface === "app" && !r.locked);
  const site = realms.realms.find((r) => r.surface === "site" && !r.locked);
  const item = "block rounded px-2 py-1.5 text-sm hover:bg-accent";
  return /* @__PURE__ */ jsxs2("div", { className: ["relative", className].filter(Boolean).join(" "), "data-realm-switcher": "", children: [
    /* @__PURE__ */ jsx2("button", { ref: trigger, type: "button", "aria-haspopup": "menu", "aria-expanded": open, onClick: () => setOpen((v) => !v), className: triggerClassName || void 0, children: label }),
    open && /* @__PURE__ */ jsxs2(
      "div",
      {
        role: "menu",
        className: `absolute right-0 z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${side === "top" ? "bottom-full mb-1" : "top-full mt-1"}`,
        onKeyDown: (event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        },
        children: [
          workspaces,
          appRealms.map((realm) => /* @__PURE__ */ jsx2(
            Link,
            {
              href: realm.href,
              className: item,
              "aria-current": realm.key === here ? "page" : void 0,
              ...{ "data-realm-switcher-item": "realm", role: "menuitem" },
              children: realm.label
            },
            realm.key
          )),
          site && /* @__PURE__ */ jsx2(Link, { href: site.href, className: item, ...{ "data-realm-switcher-item": "site", role: "menuitem" }, children: "View site" }),
          /* @__PURE__ */ jsx2("a", { href: signOutHref, className: item, ...{ "data-realm-switcher-item": "sign-out", role: "menuitem" }, children: "Sign out" })
        ]
      }
    )
  ] });
}

// src/nav/useCurrentRealm.ts
import { useMemo } from "react";
function defaultRealm(data) {
  return data.realms.find((r) => r.key === "tenant") ?? data.realms.find((r) => r.surface === "app");
}
function pathOf(href) {
  try {
    return new URL(href, "http://local").pathname.replace(/\/+$/, "") || "/";
  } catch {
    return href;
  }
}
function useCurrentRealm(data, pathname) {
  return useMemo(() => {
    if (!data) {
      return { realm: null, back: null };
    }
    const path = pathname.replace(/\/+$/, "") || "/";
    let realm = null;
    let best = -1;
    for (const candidate of data.realms) {
      const home2 = pathOf(candidate.href);
      const matches = home2 === "/" ? path === "/" : path === home2 || path.startsWith(home2 + "/");
      if (matches && home2.length > best) {
        realm = candidate;
        best = home2.length;
      }
    }
    realm ??= data.realms.find((r) => r.key === data.current) ?? defaultRealm(data) ?? null;
    const home = defaultRealm(data);
    const back = realm && home && realm.key !== home.key && realm.surface === "app" ? data.back ?? { label: home.label, href: home.href } : null;
    return { realm, back };
  }, [data, pathname]);
}

// src/nav/RealmHeader.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var PlainLink2 = ({ href, className, children, ...rest }) => /* @__PURE__ */ jsx3("a", { href, className, ...rest, children });
function RealmHeader({
  realm,
  back,
  linkComponent,
  className
}) {
  if (!realm || !back) {
    return null;
  }
  const Link = linkComponent ?? PlainLink2;
  return /* @__PURE__ */ jsxs3("div", { className: className ?? "space-y-1 px-2 py-2", children: [
    /* @__PURE__ */ jsx3("div", { className: "text-sm font-semibold", "data-realm-label": "", children: realm.label }),
    /* @__PURE__ */ jsxs3(Link, { href: back.href, className: "text-xs opacity-70 hover:underline hover:opacity-100", ...{ "data-realm-back": "" }, children: [
      "\u2190 Back to ",
      back.label
    ] })
  ] });
}
export {
  REALM_NAV_CSS,
  RealmHeader,
  RealmNav,
  RealmSwitcher,
  SIDEBAR_ACTIVE_FG,
  useCurrentRealm
};
//# sourceMappingURL=nav.js.map