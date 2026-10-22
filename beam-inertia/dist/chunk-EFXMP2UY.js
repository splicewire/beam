import {
  AppLogoIcon,
  InertiaRailLink,
  useBrand
} from "./chunk-UEQF4DVZ.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/app-sidebar-beam.tsx
import { Link, usePage as usePage2 } from "@inertiajs/react";
import { AccountShell } from "@splicewire/beam-accounts/account";
import { LayoutGrid, Settings } from "lucide-react";

// src/components/app-logo.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function AppLogo() {
  const { name } = useBrand();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground", children: /* @__PURE__ */ jsx(AppLogoIcon, { className: "size-5 fill-current text-white dark:text-black" }) }),
    /* @__PURE__ */ jsx("div", { className: "ml-1 grid flex-1 text-left text-sm", children: /* @__PURE__ */ jsx("span", { className: "mb-0.5 truncate leading-tight font-semibold", children: name }) })
  ] });
}

// src/components/nav-user.tsx
import { usePage } from "@inertiajs/react";
import { RealmSwitcher } from "@splicewire/beam-ux/nav";
import { ChevronsUpDown } from "lucide-react";

// src/components/ui/avatar.tsx
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { jsx as jsx2 } from "react/jsx-runtime";
function Avatar({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AvatarPrimitive.Root,
    {
      "data-slot": "avatar",
      className: cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      ),
      ...props
    }
  );
}
function AvatarImage({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AvatarPrimitive.Image,
    {
      "data-slot": "avatar-image",
      className: cn("aspect-square size-full", className),
      ...props
    }
  );
}
function AvatarFallback({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AvatarPrimitive.Fallback,
    {
      "data-slot": "avatar-fallback",
      className: cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      ),
      ...props
    }
  );
}

// src/hooks/use-initials.tsx
import { useCallback } from "react";
function getInitial(name) {
  return Array.from(name)[0] ?? "";
}
function useInitials() {
  return useCallback((fullName) => {
    const names = fullName.trim().split(/\s+/u).filter(Boolean);
    if (names.length === 0) {
      return "";
    }
    if (names.length === 1) {
      return getInitial(names[0]).toUpperCase();
    }
    const firstInitial = getInitial(names[0]);
    const lastInitial = getInitial(names[names.length - 1]);
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, []);
}

// src/components/user-info.tsx
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function UserInfo({
  user,
  showEmail = false
}) {
  const getInitials = useInitials();
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
    /* @__PURE__ */ jsxs2(Avatar, { className: "h-8 w-8 overflow-hidden rounded-full", children: [
      /* @__PURE__ */ jsx3(AvatarImage, { src: user.avatar, alt: user.name }),
      /* @__PURE__ */ jsx3(AvatarFallback, { className: "rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white", children: getInitials(user.name) })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "grid flex-1 text-left text-sm leading-tight", children: [
      /* @__PURE__ */ jsx3("span", { className: "truncate font-medium", children: user.name }),
      showEmail && /* @__PURE__ */ jsx3("span", { className: "truncate text-xs text-muted-foreground", children: user.email })
    ] })
  ] });
}

// src/components/nav-user.tsx
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function NavUser() {
  const { auth, realms } = usePage().props;
  if (!auth.user || !realms) {
    return null;
  }
  return /* @__PURE__ */ jsx4(
    RealmSwitcher,
    {
      realms,
      triggerClassName: "group flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-sidebar-accent-foreground outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground",
      label: /* @__PURE__ */ jsxs3(Fragment3, { children: [
        /* @__PURE__ */ jsx4(UserInfo, { user: auth.user }),
        /* @__PURE__ */ jsx4(ChevronsUpDown, { className: "ml-auto size-4" })
      ] }),
      signOutHref: "/logout",
      linkComponent: InertiaRailLink,
      side: "top"
    }
  );
}

// src/components/app-sidebar-beam.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function AppSidebarBeam({ children }) {
  const page = usePage2();
  const realmItems = page.props.accountNav?.items ?? [];
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const navItems = realmItems.filter(
    (item) => !!item.href
  );
  return /* @__PURE__ */ jsx5(
    AccountShell,
    {
      nav: { items: navItems },
      navLabel: "Account",
      linkComponent: Link,
      brand: /* @__PURE__ */ jsx5(AppLogo, {}),
      brandHref: "/dashboard",
      isActive: (href) => currentPath === href || href !== "/" && currentPath.startsWith(href),
      navItemIcon: (item) => item.href === "/dashboard" ? /* @__PURE__ */ jsx5(LayoutGrid, {}) : /* @__PURE__ */ jsx5(Settings, {}),
      shell: page.props.accountShell ?? null,
      sections: { plan: true, profile: true },
      sectionLabels: { plan: "Plan", profile: "Profile" },
      user: /* @__PURE__ */ jsx5(NavUser, {}),
      defaultOpen: page.props.sidebarOpen ?? true,
      children
    }
  );
}

// src/layouts/beam-account-layout.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function BeamAccountLayout({
  children
}) {
  return /* @__PURE__ */ jsx6(AppSidebarBeam, { children });
}

export {
  AppLogo,
  NavUser,
  BeamAccountLayout
};
//# sourceMappingURL=chunk-EFXMP2UY.js.map