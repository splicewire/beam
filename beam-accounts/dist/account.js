// src/account/AccountShell.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup as SidebarGroup2,
  SidebarGroupLabel as SidebarGroupLabel2,
  SidebarHeader,
  SidebarInset,
  SidebarMenu as SidebarMenu2,
  SidebarMenuButton as SidebarMenuButton2,
  SidebarMenuItem as SidebarMenuItem2,
  SidebarProvider,
  SidebarTrigger,
  TooltipProvider
} from "@schemastud/ui";

// src/account/AccountNav.tsx
import { AppRail } from "@splicewire/beam-ux/appshell";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function AccountNav({ nav, label = "Account", linkComponent, isActive, itemIcon }) {
  const items = (nav?.items ?? []).filter((item) => !!item.href);
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
  if (items.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    AppRail,
    {
      label,
      className: "min-w-0",
      isActive,
      groups: [{ id: "account", label, items: items.map((item) => ({
        ...item,
        id: item.href,
        icon: itemIcon?.(item)
      })) }],
      renderGroup: (group, rows) => /* @__PURE__ */ jsxs(SidebarGroup, { className: "px-2 py-0", children: [
        /* @__PURE__ */ jsx(SidebarGroupLabel, { children: group.label }),
        /* @__PURE__ */ jsx(SidebarMenu, { children: rows })
      ] }),
      renderItem: (item, { active }) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(SidebarMenuButton, { asChild: true, isActive: active, tooltip: { children: item.title }, children: /* @__PURE__ */ jsxs(Link, { href: item.href, prefetch: true, "aria-current": active ? "page" : void 0, children: [
        item.icon,
        /* @__PURE__ */ jsx("span", { children: item.title })
      ] }) }) })
    }
  );
}

// src/account/css.ts
var ACCOUNT_SHELL_CSS = `
[data-collapsible='icon'] .beam-ux-account-action { display: none; }
.beam-ux-account-metrics { row-gap: 0.125rem; }
.beam-ux-account-secondary { color: var(--sidebar-foreground, currentColor); opacity: 0.8; }
.beam-ux-account-mobilebar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border, currentColor);
  font-weight: 600;
}
.beam-ux-account-mobilebar > a { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
@media (min-width: 768px) { .beam-ux-account-mobilebar { display: none; } }
`;

// src/account/AccountShell.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function AccountShell({
  children,
  nav,
  shell,
  linkComponent,
  brand,
  brandHref,
  navLabel = "Account",
  isActive,
  navItemIcon,
  action,
  user,
  sections,
  sectionLabels,
  collapsible = "icon",
  variant = "inset",
  defaultOpen = true,
  mobileBar = true,
  menuLabel = "Open navigation",
  className,
  style,
  insetClassName,
  insetStyle,
  sectionClassName,
  sectionStyle
}) {
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx2("a", { href, ...rest }));
  const brandHeader = brand == null ? null : brandHref ? /* @__PURE__ */ jsx2(Link, { href: brandHref, prefetch: true, children: brand }) : brand;
  return /* @__PURE__ */ jsx2(SidebarProvider, { defaultOpen, className, style, children: /* @__PURE__ */ jsxs2(TooltipProvider, { delayDuration: 0, children: [
    /* @__PURE__ */ jsx2("style", { children: ACCOUNT_SHELL_CSS }),
    /* @__PURE__ */ jsxs2(Sidebar, { collapsible, variant, children: [
      brandHeader != null && /* @__PURE__ */ jsx2(SidebarHeader, { children: /* @__PURE__ */ jsx2(SidebarMenu2, { children: /* @__PURE__ */ jsx2(SidebarMenuItem2, { children: /* @__PURE__ */ jsx2(SidebarMenuButton2, { size: "lg", asChild: true, children: brandHeader }) }) }) }),
      /* @__PURE__ */ jsxs2(SidebarContent, { children: [
        action != null && /* @__PURE__ */ jsx2(SidebarGroup2, { className: "beam-ux-account-action px-2 py-0", children: action }),
        /* @__PURE__ */ jsx2(
          AccountNav,
          {
            nav,
            label: navLabel,
            linkComponent,
            isActive,
            itemIcon: navItemIcon
          }
        ),
        sections?.plan && shell?.plan && /* @__PURE__ */ jsxs2(SidebarGroup2, { className: sectionClassName, style: sectionStyle, children: [
          /* @__PURE__ */ jsx2(SidebarGroupLabel2, { children: sectionLabels?.plan ?? "Plan" }),
          /* @__PURE__ */ jsx2(PlanMeter, { shell })
        ] }),
        sections?.profile && shell?.profile && /* @__PURE__ */ jsxs2(SidebarGroup2, { className: sectionClassName, style: sectionStyle, children: [
          /* @__PURE__ */ jsx2(SidebarGroupLabel2, { children: sectionLabels?.profile ?? "Profile" }),
          /* @__PURE__ */ jsx2(ProfileBlock, { shell })
        ] }),
        sections?.upsells && shell?.upsells && shell.upsells.length > 0 && /* @__PURE__ */ jsxs2(SidebarGroup2, { className: sectionClassName, style: sectionStyle, children: [
          /* @__PURE__ */ jsx2(SidebarGroupLabel2, { children: sectionLabels?.upsells ?? "Upgrade" }),
          /* @__PURE__ */ jsx2(SidebarMenu2, { children: shell.upsells.map((upsell) => /* @__PURE__ */ jsx2(SidebarMenuItem2, { children: /* @__PURE__ */ jsx2(SidebarMenuButton2, { asChild: true, tooltip: { children: upsell.label }, children: /* @__PURE__ */ jsx2(Link, { href: upsell.href ?? "#", prefetch: true, children: /* @__PURE__ */ jsx2("span", { children: upsell.label }) }) }) }, upsell.key)) })
        ] }),
        sections?.account && shell?.account && /* @__PURE__ */ jsxs2(SidebarGroup2, { className: sectionClassName, style: sectionStyle, children: [
          /* @__PURE__ */ jsx2(SidebarGroupLabel2, { children: sectionLabels?.account ?? "Account" }),
          /* @__PURE__ */ jsx2(AccountBlock, { shell })
        ] })
      ] }),
      user != null && /* @__PURE__ */ jsx2(SidebarFooter, { children: user })
    ] }),
    /* @__PURE__ */ jsxs2(SidebarInset, { className: insetClassName, style: insetStyle, children: [
      mobileBar && /* @__PURE__ */ jsxs2("header", { className: "beam-ux-account-mobilebar", "data-account-mobilebar": "", children: [
        /* @__PURE__ */ jsx2(SidebarTrigger, { "aria-label": menuLabel }),
        brandHeader ?? /* @__PURE__ */ jsx2("span", { children: navLabel })
      ] }),
      children
    ] })
  ] }) });
}
function PlanMeter({ shell }) {
  const { label, credits, max } = shell.plan;
  const hasGauge = typeof credits === "number" && typeof max === "number";
  return /* @__PURE__ */ jsxs2("div", { "data-account-section": "plan", className: "px-2 py-1.5 text-xs", children: [
    /* @__PURE__ */ jsx2("div", { className: "font-medium", children: label }),
    hasGauge && /* @__PURE__ */ jsxs2("div", { className: "beam-ux-account-secondary mt-1 tabular-nums", children: [
      credits,
      " / ",
      max
    ] })
  ] });
}
function ProfileBlock({ shell }) {
  const { handle, metrics } = shell.profile;
  return /* @__PURE__ */ jsxs2("div", { "data-account-section": "profile", className: "px-2 py-1.5 text-xs", children: [
    /* @__PURE__ */ jsx2("div", { className: "font-medium", children: handle }),
    metrics.length > 0 && /* @__PURE__ */ jsx2("div", { className: "beam-ux-account-metrics beam-ux-account-secondary mt-1 flex flex-wrap gap-x-3", children: metrics.map((metric) => /* @__PURE__ */ jsxs2("span", { children: [
      /* @__PURE__ */ jsx2("span", { className: "font-medium", children: metric.value }),
      " ",
      metric.label
    ] }, metric.label)) })
  ] });
}
function AccountBlock({ shell }) {
  const { email, paymentMethodLabel } = shell.account;
  return /* @__PURE__ */ jsxs2("div", { "data-account-section": "account", className: "px-2 py-1.5 text-xs", children: [
    /* @__PURE__ */ jsx2("div", { className: "truncate", children: email }),
    /* @__PURE__ */ jsx2("div", { className: "beam-ux-account-secondary mt-0.5", children: paymentMethodLabel ?? "None on file" })
  ] });
}
export {
  ACCOUNT_SHELL_CSS,
  AccountNav,
  AccountShell
};
//# sourceMappingURL=account.js.map