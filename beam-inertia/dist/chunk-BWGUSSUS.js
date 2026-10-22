import {
  Badge
} from "./chunk-O7ZKQDZR.js";
import {
  Sheet,
  SheetContent,
  Skeleton
} from "./chunk-BBYPLYMO.js";
import {
  bodyClient
} from "./chunk-OMCRMKUM.js";
import {
  frameIcon,
  manifestLookup,
  useFrameManifest
} from "./chunk-WB76RVEA.js";
import {
  jsonHeaders
} from "./chunk-QMLU62K5.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "./chunk-FADCRF7N.js";
import {
  Label
} from "./chunk-563T736C.js";
import {
  getBeamInertiaConfig
} from "./chunk-2XTQOEA4.js";
import {
  Input
} from "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";

// src/frame/provider.tsx
import { Link } from "@inertiajs/react";
import {
  createWidgetRegistry,
  FrameProvider,
  registerCardWidgets,
  registerResourceRefWidget
} from "@schemastud/frame";
import { shadcnEditSlots, shadcnListSlots } from "@schemastud/frame/shadcn";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

// src/frame/release-files-form.tsx
import { useEffect } from "react";
import { createFormResolver } from "@schemastud/frame";
import { FilesComparisonPanel } from "@splicewire/beam-ux";
import { jsx, jsxs } from "react/jsx-runtime";
function ReleaseFilesForm({ formData, registerSubmit }) {
  useEffect(() => {
    registerSubmit(null);
  }, [registerSubmit]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Historical Release member" }),
    /* @__PURE__ */ jsx("dl", { children: [["release", "Release"], ["entry", "Entry"], ["versionId", "Historical saved version"], ["members", "Whole Release"], ["recordingStatus", "Local record"], ["sha", "Commit SHA"], ["message", "Recording result"]].map(([key, label]) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("dt", { className: "text-sm text-muted-foreground", children: label }),
      /* @__PURE__ */ jsx("dd", { className: "mb-3 break-all", children: String(formData[key] ?? "\u2014") })
    ] }, key)) }),
    typeof formData.id === "string" && /* @__PURE__ */ jsx(
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

// src/frame/primitives.tsx
import { Popover, PopoverContent, PopoverTrigger, SimpleSelect } from "@schemastud/ui";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var Passthrough = ({ children }) => /* @__PURE__ */ jsx2(Fragment, { children });
function FrameSidePanel({
  open,
  onOpenChange,
  children
}) {
  return /* @__PURE__ */ jsx2(Sheet, { open, onOpenChange, children: /* @__PURE__ */ jsx2(SheetContent, { className: "w-full overflow-y-auto sm:max-w-lg", children }) });
}
var framePrimitives = {
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  SimpleSelect,
  Table: Passthrough,
  Dialog: ({
    open,
    onOpenChange,
    title,
    children
  }) => /* @__PURE__ */ jsx2(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
    title ? /* @__PURE__ */ jsx2(DialogHeader, { children: /* @__PURE__ */ jsx2(DialogTitle, { children: title }) }) : null,
    children
  ] }) }),
  SidePanel: FrameSidePanel
};

// src/frame/transport.ts
import { createResourceTransport, FrameActionError, parseResourcePage } from "@schemastud/frame";
var FRAME = "/frame";
async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: jsonHeaders(),
    credentials: "same-origin"
  });
  if (!res.ok) {
    throw new Error(`GET ${url} failed (${res.status})`);
  }
  return await res.json();
}
async function writeJson(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: jsonHeaders(),
    credentials: "same-origin",
    ...body === void 0 ? {} : { body: JSON.stringify(body) }
  });
  if (!res.ok) {
    throw new Error(`${method} ${url} failed (${res.status})`);
  }
  return await res.json().catch(() => null);
}
async function sendAction(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: jsonHeaders(),
    credentials: "same-origin",
    ...body === void 0 ? {} : { body: JSON.stringify(body) }
  });
  const parsed = await res.json().catch(() => null);
  if (!res.ok) {
    throw new FrameActionError(res.status, parsed, `${method} ${url} failed (${res.status}).`);
  }
  return parsed;
}
var frameTransport = createResourceTransport(
  {
    async list(resource, params) {
      const query = new URLSearchParams(params).toString();
      const listUrl = `${FRAME}/resources/${resource}`;
      const body = await fetchJson(
        query ? `${listUrl}?${query}` : listUrl
      );
      return parseResourcePage(body);
    },
    async get(resource, id) {
      const body = await fetchJson(
        `${FRAME}/resources/${resource}/records/${id}`
      );
      return body.data;
    },
    async getFormSchema(resource, _form, purpose = "write") {
      return fetchJson(`${FRAME}/resources/${resource}/schema${purpose === "read" ? "?purpose=read" : ""}`);
    },
    async create(resource, data) {
      const body = await writeJson(
        "POST",
        `${FRAME}/resources/${resource}`,
        data
      );
      return body.data;
    },
    async save(resource, id, data) {
      const body = await writeJson(
        "PUT",
        `${FRAME}/resources/${resource}/records/${id}`,
        data
      );
      return body.data;
    },
    async remove(resource, id) {
      await writeJson("DELETE", `${FRAME}/resources/${resource}/records/${id}`);
    }
  },
  {
    resourceUrl: (resource) => `${FRAME}/resources/${encodeURIComponent(resource)}`,
    read: (url, params) => {
      const query = new URLSearchParams(params).toString();
      return fetchJson(query ? `${url}?${query}` : url);
    },
    write: sendAction
  }
);

// src/frame/provider.tsx
import { useBrowserUrlState } from "@schemastud/frame";
import { jsx as jsx3 } from "react/jsx-runtime";
var renderCardLink = ({
  href,
  className,
  children,
  "aria-label": ariaLabel
}) => /* @__PURE__ */ jsx3(Link, { href, className, "aria-label": ariaLabel, children });
function TenantFrameProvider({ children }) {
  const { data: manifest } = useFrameManifest();
  const can = useCallback(
    (action, resource) => {
      if (action === "viewAny" || action === "view") {
        return true;
      }
      return manifest?.contexts?.[resource]?.can?.[action] === true;
    },
    [manifest]
  );
  const injection = useMemo(() => {
    const registry = createWidgetRegistry();
    registerResourceRefWidget(registry);
    registerCardWidgets(registry, {
      iconFor: frameIcon,
      renderLink: renderCardLink
    });
    const formResolver = createReleaseFilesFormResolver();
    return {
      formResolver,
      transport: frameTransport,
      primitives: framePrimitives,
      useUrlState: useBrowserUrlState,
      registry,
      // Tenant-realm request schemas are self-contained (forRequest()); no $refs to resolve.
      schemaFetcher: async (ref) => ({ $id: ref }),
      can,
      manifestFor: manifestLookup(manifest),
      listSlots: shadcnListSlots,
      editSlots: shadcnEditSlots,
      // A declared action's result (ADR-0005) is this host's toast — the same sonner `<Toaster/>`
      // the flash messages use — rather than frame's inline fallback.
      notify: ({ tone, message }) => tone === "error" ? toast.error(message) : toast.success(message)
    };
  }, [can, manifest]);
  return /* @__PURE__ */ jsx3(FrameProvider, { value: injection, children });
}

export {
  TenantFrameProvider
};
//# sourceMappingURL=chunk-BWGUSSUS.js.map