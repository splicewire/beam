import {
  jsonHeaders
} from "./chunk-QMLU62K5.js";

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

// src/frame/manifest.ts
import { useQuery } from "@tanstack/react-query";
async function fetchManifest(url) {
  const res = await fetch(url, {
    headers: jsonHeaders(),
    credentials: "same-origin"
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed (${res.status}).`);
  }
  const body = await res.json();
  return {
    resources: body.resources ?? [],
    contexts: body.contexts ?? {},
    nav: body.nav ?? { items: [] },
    routeContext: body.routeContext ?? []
  };
}
function useFrameManifest() {
  const { realm, manifestUrl } = useFrameRealm();
  return useQuery({
    queryKey: ["frame", "manifest", ...realm === null ? [] : [realm]],
    queryFn: () => fetchManifest(manifestUrl),
    staleTime: 6e4
  });
}
function manifestLookup(manifest) {
  return (resource) => manifest?.contexts[resource];
}
function formFromManifest(manifest, resourceKey) {
  return manifest?.resources.find((r) => r.key === resourceKey)?.form;
}
function labelFromManifest(manifest, resourceKey) {
  return manifest?.resources.find((r) => r.key === resourceKey)?.nav.label ?? resourceKey;
}

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
  Map,
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
  map: Map,
  Map,
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

export {
  frameIcon,
  DefaultFrameRealm,
  FrameRealmProvider,
  useFrameRealm,
  realmHref,
  realmRelative,
  useFrameManifest,
  manifestLookup,
  formFromManifest,
  labelFromManifest
};
//# sourceMappingURL=chunk-WB76RVEA.js.map