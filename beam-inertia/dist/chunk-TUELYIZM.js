import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "./chunk-BBYPLYMO.js";
import {
  AppLogo,
  NavUser
} from "./chunk-EFXMP2UY.js";
import {
  FrameRail,
  InertiaRailLink
} from "./chunk-UEQF4DVZ.js";
import {
  FrameRealmProvider,
  useFrameRealm
} from "./chunk-WB76RVEA.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/components/ui/tooltip.tsx
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx, jsxs } from "react/jsx-runtime";
function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TooltipPrimitive.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip({
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipPrimitive.Root, { "data-slot": "tooltip", ...props });
}
function TooltipTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipPrimitive.Trigger, { "data-slot": "tooltip-trigger", ...props });
}
function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    TooltipPrimitive.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: cn(
        "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-w-sm rounded-md px-3 py-1.5 text-xs",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(TooltipPrimitive.Arrow, { className: "bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" })
      ]
    }
  ) });
}

// src/components/ui/sidebar.tsx
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import * as React from "react";

// src/hooks/use-mobile.tsx
import { useSyncExternalStore } from "react";
var MOBILE_BREAKPOINT = 768;
var mql = typeof window === "undefined" ? void 0 : window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
function mediaQueryListener(callback) {
  if (!mql) {
    return () => {
    };
  }
  mql.addEventListener("change", callback);
  return () => {
    mql.removeEventListener("change", callback);
  };
}
function isSmallerThanBreakpoint() {
  return mql?.matches ?? false;
}
function getServerSnapshot() {
  return false;
}
function useIsMobile() {
  return useSyncExternalStore(
    mediaQueryListener,
    isSmallerThanBreakpoint,
    getServerSnapshot
  );
}

// src/components/ui/sidebar.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var SIDEBAR_COOKIE_NAME = "sidebar_state";
var SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
var SIDEBAR_WIDTH = "16rem";
var SIDEBAR_WIDTH_MOBILE = "18rem";
var SIDEBAR_WIDTH_ICON = "3rem";
var SIDEBAR_KEYBOARD_SHORTCUT = "b";
var SidebarContext = React.createContext(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );
  return /* @__PURE__ */ jsx2(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "sidebar-wrapper",
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      className: cn(
        "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
        className
      ),
      ...props,
      children
    }
  ) });
}
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsx2(
      "div",
      {
        "data-slot": "sidebar",
        className: cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className
        ),
        ...props,
        children
      }
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ jsxs2(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: [
      /* @__PURE__ */ jsxs2(SheetHeader, { className: "sr-only", children: [
        /* @__PURE__ */ jsx2(SheetTitle, { children: "Sidebar" }),
        /* @__PURE__ */ jsx2(SheetDescription, { children: "Displays the mobile sidebar." })
      ] }),
      /* @__PURE__ */ jsx2(
        SheetContent,
        {
          "data-sidebar": "sidebar",
          "data-slot": "sidebar",
          "data-mobile": "true",
          className: "bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden",
          style: {
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE
          },
          side,
          children: /* @__PURE__ */ jsx2("div", { className: "flex h-full w-full flex-col", children })
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: "group peer text-sidebar-foreground hidden md:block",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      "data-slot": "sidebar",
      children: [
        /* @__PURE__ */ jsx2(
          "div",
          {
            className: cn(
              "relative h-svh w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
            )
          }
        ),
        /* @__PURE__ */ jsx2(
          "div",
          {
            className: cn(
              "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]" : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            ...props,
            children: /* @__PURE__ */ jsx2(
              "div",
              {
                "data-sidebar": "sidebar",
                className: "bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm",
                children
              }
            )
          }
        )
      ]
    }
  );
}
function SidebarTrigger({
  className,
  onClick,
  ...props
}) {
  const { toggleSidebar, isMobile, state } = useSidebar();
  return /* @__PURE__ */ jsxs2(
    Button,
    {
      "data-sidebar": "trigger",
      "data-slot": "sidebar-trigger",
      variant: "ghost",
      size: "icon",
      className: cn("h-7 w-7", className),
      onClick: (event) => {
        onClick?.(event);
        toggleSidebar();
      },
      ...props,
      children: [
        isMobile || state === "collapsed" ? /* @__PURE__ */ jsx2(PanelLeftOpenIcon, {}) : /* @__PURE__ */ jsx2(PanelLeftCloseIcon, {}),
        /* @__PURE__ */ jsx2("span", { className: "sr-only", children: "Toggle sidebar" })
      ]
    }
  );
}
function SidebarInset({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "main",
    {
      "data-slot": "sidebar-inset",
      className: cn(
        "bg-background relative flex max-w-full min-h-svh flex-1 flex-col",
        "peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0",
        className
      ),
      ...props
    }
  );
}
function SidebarHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "sidebar-header",
      "data-sidebar": "header",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
}
function SidebarFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "sidebar-footer",
      "data-sidebar": "footer",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
}
function SidebarContent({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "sidebar-content",
      "data-sidebar": "content",
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      ...props
    }
  );
}
function SidebarMenu({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "ul",
    {
      "data-slot": "sidebar-menu",
      "data-sidebar": "menu",
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      ...props
    }
  );
}
function SidebarMenuItem({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "li",
    {
      "data-slot": "sidebar-menu-item",
      "data-sidebar": "menu-item",
      className: cn("group/menu-item relative", className),
      ...props
    }
  );
}
var sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx2(
    Comp,
    {
      "data-slot": "sidebar-menu-button",
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      ...props
    }
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ jsxs2(Tooltip, { children: [
    /* @__PURE__ */ jsx2(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx2(
      TooltipContent,
      {
        side: "right",
        align: "center",
        hidden: state !== "collapsed" || isMobile,
        ...tooltip
      }
    )
  ] });
}

// src/components/app-content.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function AppContent({ variant = "sidebar", children, ...props }) {
  if (variant === "sidebar") {
    return /* @__PURE__ */ jsx3(SidebarInset, { ...props, children });
  }
  return /* @__PURE__ */ jsx3(
    "main",
    {
      className: "mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl",
      ...props,
      children
    }
  );
}

// src/components/app-shell.tsx
import { usePage } from "@inertiajs/react";
import { jsx as jsx4 } from "react/jsx-runtime";
function AppShell({ children, variant = "sidebar" }) {
  const isOpen = usePage().props.sidebarOpen;
  if (variant === "header") {
    return /* @__PURE__ */ jsx4("div", { className: "flex min-h-screen w-full flex-col", children });
  }
  return /* @__PURE__ */ jsx4(SidebarProvider, { defaultOpen: isOpen, children });
}

// src/components/app-sidebar.tsx
import { Link, usePage as usePage2 } from "@inertiajs/react";
import { RealmHeader, RealmNav, useCurrentRealm } from "@splicewire/beam-ux/nav";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function accountSeats(accountNav) {
  const children = (accountNav?.items ?? []).filter((item) => !!item.href && item.href !== "/dashboard").map((item) => ({ title: item.title, href: item.href, icon: "settings" }));
  return children.length > 0 ? [{ title: "Account", children }] : [];
}
function AppSidebar({ realm } = {}) {
  const page = usePage2();
  const pageRealm = useFrameRealm();
  const railRealm = realm ?? pageRealm;
  const { realm: current, back } = useCurrentRealm(page.props.realms, new URL(page.url, "http://local").pathname);
  const home = current?.href ?? (railRealm.realm === null ? "/dashboard" : railRealm.basename);
  const account = !realm && railRealm.realm === null ? accountSeats(page.props.accountNav) : [];
  const rail = realm ? /* @__PURE__ */ jsx5(FrameRealmProvider, { ...realm, children: /* @__PURE__ */ jsx5(FrameRail, {}) }) : /* @__PURE__ */ jsx5(FrameRail, {});
  return /* @__PURE__ */ jsxs3(Sidebar, { collapsible: "icon", variant: "inset", children: [
    /* @__PURE__ */ jsxs3(SidebarHeader, { children: [
      /* @__PURE__ */ jsx5(SidebarMenu, { children: /* @__PURE__ */ jsx5(SidebarMenuItem, { children: /* @__PURE__ */ jsx5(SidebarMenuButton, { size: "lg", asChild: true, children: /* @__PURE__ */ jsx5(Link, { href: home, prefetch: true, "data-realm-home": "", children: /* @__PURE__ */ jsx5(AppLogo, {}) }) }) }) }),
      /* @__PURE__ */ jsx5(RealmHeader, { realm: current, back, linkComponent: InertiaRailLink })
    ] }),
    /* @__PURE__ */ jsxs3(SidebarContent, { children: [
      rail,
      account.length > 0 && /* @__PURE__ */ jsx5(RealmNav, { items: account, variant: "section-groups", linkComponent: InertiaRailLink })
    ] }),
    /* @__PURE__ */ jsx5(SidebarFooter, { children: /* @__PURE__ */ jsx5(NavUser, {}) })
  ] });
}

// src/components/breadcrumbs.tsx
import { Link as Link2 } from "@inertiajs/react";
import { Fragment } from "react";

// src/components/ui/breadcrumb.tsx
import { Slot as Slot2 } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function Breadcrumb({ ...props }) {
  return /* @__PURE__ */ jsx6("nav", { "aria-label": "breadcrumb", "data-slot": "breadcrumb", ...props });
}
function BreadcrumbList({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "ol",
    {
      "data-slot": "breadcrumb-list",
      className: cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      ),
      ...props
    }
  );
}
function BreadcrumbItem({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "li",
    {
      "data-slot": "breadcrumb-item",
      className: cn("inline-flex items-center gap-1.5", className),
      ...props
    }
  );
}
function BreadcrumbLink({
  asChild,
  className,
  ...props
}) {
  const Comp = asChild ? Slot2 : "a";
  return /* @__PURE__ */ jsx6(
    Comp,
    {
      "data-slot": "breadcrumb-link",
      className: cn("hover:text-foreground transition-colors", className),
      ...props
    }
  );
}
function BreadcrumbPage({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "span",
    {
      "data-slot": "breadcrumb-page",
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      className: cn("text-foreground font-normal", className),
      ...props
    }
  );
}
function BreadcrumbSeparator({
  children,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    "li",
    {
      "data-slot": "breadcrumb-separator",
      role: "presentation",
      "aria-hidden": "true",
      className: cn("[&>svg]:size-3.5", className),
      ...props,
      children: children ?? /* @__PURE__ */ jsx6(ChevronRight, {})
    }
  );
}

// src/components/breadcrumbs.tsx
import { Fragment as Fragment2, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function Breadcrumbs({
  breadcrumbs
}) {
  return /* @__PURE__ */ jsx7(Fragment2, { children: breadcrumbs.length > 0 && /* @__PURE__ */ jsx7(Breadcrumb, { children: /* @__PURE__ */ jsx7(BreadcrumbList, { children: breadcrumbs.map((item, index) => {
    const isLast = index === breadcrumbs.length - 1;
    return /* @__PURE__ */ jsxs5(Fragment, { children: [
      /* @__PURE__ */ jsx7(BreadcrumbItem, { children: isLast ? /* @__PURE__ */ jsx7(BreadcrumbPage, { children: item.title }) : /* @__PURE__ */ jsx7(BreadcrumbLink, { asChild: true, children: /* @__PURE__ */ jsx7(Link2, { href: item.href, children: item.title }) }) }),
      !isLast && /* @__PURE__ */ jsx7(BreadcrumbSeparator, {})
    ] }, index);
  }) }) }) });
}

// src/components/app-sidebar-header.tsx
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function AppSidebarHeader({
  breadcrumbs = []
}) {
  return /* @__PURE__ */ jsx8("header", { className: "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4", children: /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx8(SidebarTrigger, { className: "-ml-1" }),
    /* @__PURE__ */ jsx8(Breadcrumbs, { breadcrumbs })
  ] }) });
}

// src/layouts/app/app-sidebar-layout.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function AppSidebarLayout({
  children,
  breadcrumbs = [],
  realm
}) {
  return /* @__PURE__ */ jsxs7(AppShell, { variant: "sidebar", children: [
    /* @__PURE__ */ jsx9(AppSidebar, { realm }),
    /* @__PURE__ */ jsxs7(AppContent, { variant: "sidebar", className: "overflow-x-hidden", children: [
      /* @__PURE__ */ jsx9(AppSidebarHeader, { breadcrumbs }),
      children
    ] })
  ] });
}

// src/layouts/operator-layout.tsx
import { jsx as jsx10 } from "react/jsx-runtime";
var OperatorFrameRealm = {
  realm: "operator",
  basename: "/operator",
  manifestUrl: "/operator/frame/manifest"
};
function OperatorLayout({ breadcrumbs = [], children }) {
  return /* @__PURE__ */ jsx10(AppSidebarLayout, { breadcrumbs, realm: OperatorFrameRealm, children });
}

export {
  TooltipProvider,
  AppSidebarLayout,
  OperatorLayout
};
//# sourceMappingURL=chunk-TUELYIZM.js.map