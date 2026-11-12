import {
  Badge
} from "./chunk-O7ZKQDZR.js";
import {
  bodyClient
} from "./chunk-MUHE33WK.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "./chunk-FADCRF7N.js";
import {
  getBeamInertiaConfig
} from "./chunk-XP5YRUDH.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn
} from "./chunk-GBIJGQ7E.js";

// src/frame/realm.tsx
import { usePage } from "@inertiajs/react";
import { createContext, useContext, useMemo } from "react";
import { jsx } from "react/jsx-runtime";
var DefaultFrameRealm = {
  realm: null,
  basename: "/",
  manifestUrl: "/frame/manifest"
};
var FrameRealmCtx = createContext(DefaultFrameRealm);
function FrameRealmProvider({
  realm = null,
  basename = DefaultFrameRealm.basename,
  manifestUrl = DefaultFrameRealm.manifestUrl,
  children
}) {
  const value = useMemo(
    () => ({ realm, basename: normalizeBase(basename), manifestUrl }),
    [realm, basename, manifestUrl]
  );
  return /* @__PURE__ */ jsx(FrameRealmCtx.Provider, { value, children });
}
function useFrameRealm() {
  const context = useContext(FrameRealmCtx);
  const page = usePage();
  const props = page?.props ?? {};
  return useMemo(() => {
    if (context !== DefaultFrameRealm) {
      return context;
    }
    const realm = typeof props.realm === "string" ? props.realm : DefaultFrameRealm.realm;
    const basename = typeof props.basename === "string" ? props.basename : DefaultFrameRealm.basename;
    const manifestUrl = typeof props.manifestUrl === "string" ? props.manifestUrl : DefaultFrameRealm.manifestUrl;
    return { realm, basename: normalizeBase(basename), manifestUrl };
  }, [context, props.realm, props.basename, props.manifestUrl]);
}
function normalizeBase(base) {
  const trimmed = base.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}
function realmHref(basename, path) {
  const base = normalizeBase(basename);
  const relative = path.replace(/^\/+/, "");
  return base === "/" ? `/${relative}` : `${base}/${relative}`;
}
function realmRelative(basename, href) {
  const base = normalizeBase(basename);
  if (base !== "/" && (href === base || href.startsWith(`${base}/`))) {
    return href.slice(base.length).replace(/^\/+/, "");
  }
  return href.replace(/^\/+/, "");
}

// src/frame/kit.tsx
import { Link } from "@inertiajs/react";
import { createFrameKit } from "@schemastud/frame";
import { toast } from "sonner";

// src/frame/icons.tsx
import {
  Activity,
  Bot,
  Building,
  Cable,
  Calendar,
  CalendarDays,
  Circle,
  Clapperboard,
  FileBadge,
  FileCode,
  FileJson,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  IdCard,
  Inbox,
  Key,
  KeyRound,
  Layers,
  LayoutDashboard,
  Link2,
  ListChecks,
  Mail,
  Map as Map2,
  MessagesSquare,
  NotebookPen,
  Package,
  Receipt,
  Mic,
  Repeat,
  Scale,
  Send,
  Server,
  Shapes,
  ShieldCheck,
  Sliders,
  Target,
  UserCog,
  Users,
  Webhook,
  Workflow
} from "lucide-react";
var ICONS = {
  "file-text": FileText,
  FileText,
  "file-json": FileJson,
  FileJson,
  "git-branch": GitBranch,
  GitBranch,
  globe: Globe,
  Globe,
  map: Map2,
  Map: Map2,
  server: Server,
  Server,
  users: Users,
  Users,
  webhook: Webhook,
  Webhook,
  "key-round": KeyRound,
  KeyRound,
  link: Link2,
  Link2,
  // The operator rail's seat (laravel-tower-starter's `platform` section).
  activity: Activity,
  Activity,
  bot: Bot,
  Bot,
  building: Building,
  Building,
  cable: Cable,
  Cable,
  gauge: Gauge,
  Gauge,
  "layout-dashboard": LayoutDashboard,
  LayoutDashboard,
  // Every other name a live `#[ParticleResource]` declaration in the estate carries (beam-accounts,
  // beam-calendars, beam-commerce, beam-notifications, beam-workflows, satellite-composition, tower,
  // beam-extension-demo). A name lucide does not export (`microphone`) stays on the neutral dot.
  calendar: Calendar,
  Calendar,
  "calendar-days": CalendarDays,
  CalendarDays,
  clapperboard: Clapperboard,
  Clapperboard,
  "file-badge": FileBadge,
  FileBadge,
  "file-code": FileCode,
  FileCode,
  "id-card": IdCard,
  IdCard,
  inbox: Inbox,
  Inbox,
  key: Key,
  Key,
  layers: Layers,
  Layers,
  "list-checks": ListChecks,
  ListChecks,
  mail: Mail,
  Mail,
  "messages-square": MessagesSquare,
  MessagesSquare,
  "notebook-pen": NotebookPen,
  NotebookPen,
  package: Package,
  Package,
  receipt: Receipt,
  Receipt,
  mic: Mic,
  Mic,
  repeat: Repeat,
  Repeat,
  scale: Scale,
  Scale,
  send: Send,
  Send,
  shapes: Shapes,
  Shapes,
  "shield-check": ShieldCheck,
  ShieldCheck,
  sliders: Sliders,
  Sliders,
  target: Target,
  Target,
  "user-cog": UserCog,
  UserCog,
  workflow: Workflow,
  Workflow
};
function frameIcon(name) {
  return (name ? ICONS[name] : void 0) ?? Circle;
}

// src/components/ui/sheet.tsx
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function Sheet({ ...props }) {
  return /* @__PURE__ */ jsx2(SheetPrimitive.Root, { "data-slot": "sheet", ...props });
}
function SheetPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx2(SheetPrimitive.Portal, { "data-slot": "sheet-portal", ...props });
}
function SheetOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    SheetPrimitive.Overlay,
    {
      "data-slot": "sheet-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
        className
      ),
      ...props
    }
  );
}
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}) {
  return /* @__PURE__ */ jsxs(SheetPortal, { children: [
    /* @__PURE__ */ jsx2(SheetOverlay, {}),
    /* @__PURE__ */ jsxs(
      SheetPrimitive.Content,
      {
        "data-slot": "sheet-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        ),
        ...props,
        children: [
          children,
          /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none", children: [
            /* @__PURE__ */ jsx2(XIcon, { className: "size-4" }),
            /* @__PURE__ */ jsx2("span", { className: "sr-only", children: "Close" })
          ] })
        ]
      }
    )
  ] });
}
function SheetHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "sheet-header",
      className: cn("flex flex-col gap-1.5 p-4", className),
      ...props
    }
  );
}
function SheetTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    SheetPrimitive.Title,
    {
      "data-slot": "sheet-title",
      className: cn("text-foreground font-semibold", className),
      ...props
    }
  );
}
function SheetDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    SheetPrimitive.Description,
    {
      "data-slot": "sheet-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}

// src/components/ui/skeleton.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx3(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("bg-primary/10 animate-pulse rounded-md", className),
      ...props
    }
  );
}

// src/frame/primitives.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function FrameSidePanel({
  open,
  onOpenChange,
  children
}) {
  return /* @__PURE__ */ jsx4(Sheet, { open, onOpenChange, children: /* @__PURE__ */ jsx4(SheetContent, { className: "w-full overflow-y-auto sm:max-w-lg", children }) });
}
var framePrimitives = {
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
  Dialog: ({
    open,
    onOpenChange,
    title,
    children
  }) => /* @__PURE__ */ jsx4(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
    title ? /* @__PURE__ */ jsx4(DialogHeader, { children: /* @__PURE__ */ jsx4(DialogTitle, { children: title }) }) : null,
    children
  ] }) }),
  SidePanel: FrameSidePanel
};

// src/frame/release-files-form.tsx
import { useEffect } from "react";
import { createFormResolver } from "@schemastud/frame";
import { FilesComparisonPanel } from "@splicewire/beam-ux";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function ReleaseFilesForm({ formData, registerSubmit }) {
  useEffect(() => {
    registerSubmit(null);
  }, [registerSubmit]);
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx5("h2", { className: "text-lg font-semibold", children: "Historical Release member" }),
    /* @__PURE__ */ jsx5("dl", { children: [["release", "Release"], ["entry", "Entry"], ["versionId", "Historical saved version"], ["members", "Whole Release"], ["recordingStatus", "Local record"], ["sha", "Commit SHA"], ["message", "Recording result"]].map(([key, label]) => /* @__PURE__ */ jsxs3("div", { children: [
      /* @__PURE__ */ jsx5("dt", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx5("dd", { className: "mb-3 break-all", children: String(formData[key] ?? "\u2014") })
    ] }, key)) }),
    typeof formData.id === "string" && /* @__PURE__ */ jsx5(
      FilesComparisonPanel,
      {
        memberId: formData.id,
        client: bodyClient,
        editorHref: getBeamInertiaConfig().fileEditorHref
      },
      formData.id
    )
  ] });
}
function createReleaseFilesFormResolver() {
  const resolver = createFormResolver();
  resolver.registerFormForSchema((schema) => schema.$id === "ReleaseFilesData", ReleaseFilesForm);
  return resolver;
}

// src/frame/kit.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var renderCardLink = ({ href, className, children, "aria-label": ariaLabel }) => /* @__PURE__ */ jsx6(Link, { href, className, "aria-label": ariaLabel, children });
var kits = /* @__PURE__ */ new Map();
function kitFor(manifestUrl) {
  let kit = kits.get(manifestUrl);
  if (!kit) {
    kit = createFrameKit({
      manifestUrl,
      primitives: framePrimitives,
      renderLink: renderCardLink,
      iconFor: frameIcon,
      schemaFetcher: async (ref) => ({ $id: ref }),
      formResolver: createReleaseFilesFormResolver(),
      notify: ({ tone, message }) => tone === "error" ? toast.error(message) : toast.success(message)
    });
    kits.set(manifestUrl, kit);
  }
  return kit;
}

// src/frame/manifest.ts
function useFrameManifest() {
  return kitFor(useFrameRealm().manifestUrl).useManifest();
}
function formFromManifest(manifest, resourceKey) {
  return manifest?.resources.find((r) => r.key === resourceKey)?.form;
}
function labelFromManifest(manifest, resourceKey) {
  return manifest?.resources.find((r) => r.key === resourceKey)?.nav.label ?? resourceKey;
}

export {
  frameIcon,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  kitFor,
  DefaultFrameRealm,
  FrameRealmProvider,
  useFrameRealm,
  realmHref,
  realmRelative,
  useFrameManifest,
  formFromManifest,
  labelFromManifest
};
//# sourceMappingURL=chunk-N5WTRHC3.js.map