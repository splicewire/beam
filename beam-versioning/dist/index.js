// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var VersionsServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[versions] ${event.message}`);
  else console.info(`[versions] ${event.message}`);
}
function VersionsProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(VersionsServicesContext.Provider, { value: services, children });
}
function useVersionsServices() {
  const services = useContext(VersionsServicesContext);
  if (!services) {
    throw new Error("Versioning components must be rendered inside a <VersionsProvider>.");
  }
  return services;
}
function useNotify() {
  return useVersionsServices().notify ?? consoleNotify;
}

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
var VERSIONS_PREFIX = ["beam-versioning", "versions"];
function useVersionsKey() {
  const { scope } = useVersionsServices();
  const suffix = scope === void 0 ? [] : Array.isArray(scope) ? scope : [scope];
  return [...VERSIONS_PREFIX, ...suffix];
}
function useVersions() {
  const { client } = useVersionsServices();
  const queryKey = useVersionsKey();
  return useQuery({ queryKey, queryFn: () => client.list() });
}
function useSaveVersion() {
  const { client, onError } = useVersionsServices();
  const queryKey = useVersionsKey();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input = {}) => client.save(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => onError?.(err)
  });
}
function useRestoreVersion() {
  const { client, onError } = useVersionsServices();
  const queryKey = useVersionsKey();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, input = {} }) => client.restore(ref, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => onError?.(err)
  });
}

// src/versions-panel.tsx
import { Loader2 as Loader22, Save } from "lucide-react";
import { useState } from "react";
import { Button as Button3, Input } from "@schemastud/ui";

// src/version-restore-dialog.tsx
import { Loader2, RotateCcw } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@schemastud/ui";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function VersionRestoreDialog({
  version,
  pending,
  onConfirm,
  onCancel
}) {
  return /* @__PURE__ */ jsx2(Dialog, { open: version !== null, onOpenChange: (next) => !next && onCancel(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { children: [
        "Restore ",
        version?.readable,
        "?"
      ] }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "Your working copy is replaced with ",
        version?.readable,
        "'s content. A new version is minted, so nothing is lost \u2014 you can roll back again."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsxs(Button, { disabled: pending, onClick: onConfirm, children: [
        pending ? /* @__PURE__ */ jsx2(Loader2, { className: "animate-spin" }) : /* @__PURE__ */ jsx2(RotateCcw, {}),
        "Restore"
      ] })
    ] })
  ] }) });
}

// src/versions-list.tsx
import { AlertTriangle, Check, RotateCcw as RotateCcw2 } from "lucide-react";
import { Badge, Button as Button2 } from "@schemastud/ui";

// src/relative-time.ts
function relativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1e3);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}

// src/versions-list.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function VersionRow({
  version,
  onRestore,
  disabled,
  renderMeta
}) {
  return /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-2 rounded-md border p-3 text-sm", children: [
    /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx3("span", { className: "font-mono font-medium", children: version.readable }),
        version.isHead && /* @__PURE__ */ jsxs2(Badge, { variant: "secondary", className: "gap-1 text-[10px]", children: [
          /* @__PURE__ */ jsx3(Check, { className: "size-3" }),
          " HEAD"
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "mt-0.5 flex items-center gap-2 text-xs text-muted-foreground", children: [
        version.label && /* @__PURE__ */ jsx3("span", { className: "truncate", children: version.label }),
        version.label && version.createdAt && /* @__PURE__ */ jsx3("span", { children: "\xB7" }),
        version.createdAt && /* @__PURE__ */ jsx3("span", { children: relativeTime(version.createdAt) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1", children: [
      renderMeta?.(version),
      /* @__PURE__ */ jsxs2(
        Button2,
        {
          variant: "ghost",
          size: "sm",
          disabled: disabled || version.isHead,
          "aria-label": version.isHead ? `${version.readable} is the current version` : `Restore ${version.readable}`,
          title: version.isHead ? "Already the current version" : `Restore ${version.readable}`,
          onClick: () => onRestore(version),
          children: [
            /* @__PURE__ */ jsx3(RotateCcw2, {}),
            " Restore"
          ]
        }
      )
    ] })
  ] });
}
function VersionsList({
  versions,
  isLoading = false,
  isError = false,
  disabled = false,
  onRestore,
  renderVersionMeta,
  emptyMessage = "No versions yet \u2014 save one to capture this milestone.",
  errorMessage = "Could not load version history."
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: "Loading versions\u2026" });
  }
  if (isError) {
    return /* @__PURE__ */ jsxs2("p", { className: "flex items-center gap-2 text-sm text-destructive", children: [
      /* @__PURE__ */ jsx3(AlertTriangle, { className: "size-4" }),
      " ",
      errorMessage
    ] });
  }
  if (!versions || versions.length === 0) {
    return /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: emptyMessage });
  }
  return /* @__PURE__ */ jsx3("div", { className: "space-y-2", children: versions.map((version) => /* @__PURE__ */ jsx3(
    VersionRow,
    {
      version,
      disabled,
      onRestore,
      renderMeta: renderVersionMeta
    },
    version.id
  )) });
}

// src/versions-panel.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function VersionsPanel({
  disabled = false,
  showSaveButton = true
}) {
  const { renderVersionMeta, onSaved, onRestored } = useVersionsServices();
  const notify = useNotify();
  const versions = useVersions();
  const save = useSaveVersion();
  const restore = useRestoreVersion();
  const [confirming, setConfirming] = useState(null);
  const [labelling, setLabelling] = useState(false);
  const [label, setLabel] = useState("");
  function handleSave() {
    save.mutate(
      { label: label.trim() || void 0 },
      {
        onSuccess: (v) => {
          notify({ type: "success", message: `Saved ${v.readable}` });
          onSaved?.(v);
          setLabelling(false);
          setLabel("");
        },
        onError: () => notify({ type: "error", message: "Save version failed" })
      }
    );
  }
  function handleRestore() {
    if (!confirming) return;
    const target = confirming;
    restore.mutate(
      { ref: target.id },
      {
        onSuccess: (v) => {
          notify({
            type: "success",
            message: `Restored ${target.readable} \u2014 now ${v.readable}`
          });
          onRestored?.(v);
          setConfirming(null);
        },
        onError: () => notify({ type: "error", message: "Restore failed" })
      }
    );
  }
  return /* @__PURE__ */ jsxs3("div", { className: "flex-1 space-y-4 overflow-y-auto", children: [
    showSaveButton && !disabled && (labelling ? /* @__PURE__ */ jsxs3(
      "form",
      {
        className: "flex items-center gap-2",
        onSubmit: (e) => {
          e.preventDefault();
          handleSave();
        },
        children: [
          /* @__PURE__ */ jsx4(
            Input,
            {
              autoFocus: true,
              value: label,
              onChange: (e) => setLabel(e.target.value),
              placeholder: "Optional label (e.g. before the rewrite)",
              "aria-label": "Version label",
              className: "h-8 text-sm"
            }
          ),
          /* @__PURE__ */ jsxs3(Button3, { type: "submit", size: "sm", disabled: save.isPending, children: [
            save.isPending ? /* @__PURE__ */ jsx4(Loader22, { className: "animate-spin" }) : /* @__PURE__ */ jsx4(Save, {}),
            "Save"
          ] }),
          /* @__PURE__ */ jsx4(
            Button3,
            {
              type: "button",
              size: "sm",
              variant: "ghost",
              disabled: save.isPending,
              onClick: () => {
                setLabelling(false);
                setLabel("");
              },
              children: "Cancel"
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxs3(
      Button3,
      {
        className: "w-full",
        size: "sm",
        onClick: () => setLabelling(true),
        children: [
          /* @__PURE__ */ jsx4(Save, {}),
          " Save version"
        ]
      }
    )),
    /* @__PURE__ */ jsx4(
      VersionsList,
      {
        versions: versions.data,
        isLoading: versions.isPending,
        isError: versions.isError,
        disabled: disabled || restore.isPending,
        onRestore: setConfirming,
        renderVersionMeta
      }
    ),
    /* @__PURE__ */ jsx4(
      VersionRestoreDialog,
      {
        version: confirming,
        pending: restore.isPending,
        onConfirm: handleRestore,
        onCancel: () => setConfirming(null)
      }
    )
  ] });
}
export {
  VersionRestoreDialog,
  VersionsList,
  VersionsPanel,
  VersionsProvider,
  relativeTime,
  useNotify,
  useRestoreVersion,
  useSaveVersion,
  useVersions,
  useVersionsServices
};
//# sourceMappingURL=index.js.map