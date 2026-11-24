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

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";

// messages.default.json
var messages_default_default = {
  version: 1,
  package: "@splicewire/beam-versioning",
  sourceLocale: "en",
  namespace: "splicewire-beam-versioning",
  sharesWith: null,
  messages: {
    "splicewire-beam-versioning::messages.already_current": "Already the current version",
    "splicewire-beam-versioning::messages.cancel": "Cancel",
    "splicewire-beam-versioning::messages.current_version_aria": ":version is the current version",
    "splicewire-beam-versioning::messages.empty": "No versions yet \u2014 save one to capture this milestone.",
    "splicewire-beam-versioning::messages.head": "HEAD",
    "splicewire-beam-versioning::messages.label_aria": "Version label",
    "splicewire-beam-versioning::messages.label_placeholder": "Optional label (e.g. before the rewrite)",
    "splicewire-beam-versioning::messages.label_published": "published",
    "splicewire-beam-versioning::messages.label_restore_of": "restore of :version",
    "splicewire-beam-versioning::messages.load_failed": "Could not load version history.",
    "splicewire-beam-versioning::messages.loading": "Loading versions\u2026",
    "splicewire-beam-versioning::messages.restore": "Restore",
    "splicewire-beam-versioning::messages.restore_description": "Your working copy is replaced with :version's content. A new version is minted, so nothing is lost \u2014 you can roll back again.",
    "splicewire-beam-versioning::messages.restore_failed": "Restore failed",
    "splicewire-beam-versioning::messages.restore_named": "Restore :version",
    "splicewire-beam-versioning::messages.restore_title": "Restore :version?",
    "splicewire-beam-versioning::messages.restored_toast": "Restored :target \u2014 now :version",
    "splicewire-beam-versioning::messages.save": "Save",
    "splicewire-beam-versioning::messages.save_failed": "Save version failed",
    "splicewire-beam-versioning::messages.save_version": "Save version",
    "splicewire-beam-versioning::messages.saved_toast": "Saved :version",
    "splicewire-beam-versioning::messages.time_days_ago": ":countd ago",
    "splicewire-beam-versioning::messages.time_hours_ago": ":counth ago",
    "splicewire-beam-versioning::messages.time_just_now": "just now",
    "splicewire-beam-versioning::messages.time_minutes_ago": ":countm ago"
  }
};

// src/messages.ts
var englishBeamVersioningMessages = createMessages(messages_default_default.messages);
var useBeamVersioningMessages = () => useMessages(messages_default_default.messages);

// src/version-restore-dialog.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function VersionRestoreDialog({
  version,
  pending,
  onConfirm,
  onCancel
}) {
  const m = useBeamVersioningMessages();
  return /* @__PURE__ */ jsx2(Dialog, { open: version !== null, onOpenChange: (next) => !next && onCancel(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx2(DialogTitle, { children: m.t("splicewire-beam-versioning::messages.restore_title", { version: version?.readable ?? "" }) }),
      /* @__PURE__ */ jsx2(DialogDescription, { children: m.t("splicewire-beam-versioning::messages.restore_description", { version: version?.readable ?? "" }) })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: onCancel, children: m.t("splicewire-beam-versioning::messages.cancel") }),
      /* @__PURE__ */ jsxs(Button, { disabled: pending, onClick: onConfirm, children: [
        pending ? /* @__PURE__ */ jsx2(Loader2, { className: "animate-spin" }) : /* @__PURE__ */ jsx2(RotateCcw, {}),
        m.t("splicewire-beam-versioning::messages.restore")
      ] })
    ] })
  ] }) });
}

// src/versions-list.tsx
import { AlertTriangle, Check, RotateCcw as RotateCcw2 } from "lucide-react";
import { Badge, Button as Button2 } from "@schemastud/ui";

// src/relative-time.ts
function relativeTime(iso, messages = englishBeamVersioningMessages) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1e3);
  if (secs < 60) return messages.t("splicewire-beam-versioning::messages.time_just_now");
  const mins = Math.round(secs / 60);
  if (mins < 60) return messages.t("splicewire-beam-versioning::messages.time_minutes_ago", { count: mins });
  const hours = Math.round(mins / 60);
  if (hours < 24) return messages.t("splicewire-beam-versioning::messages.time_hours_ago", { count: hours });
  const days = Math.round(hours / 24);
  if (days < 7) return messages.t("splicewire-beam-versioning::messages.time_days_ago", { count: days });
  return new Date(iso).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}

// src/system-label.ts
var RESTORE_OF = /^restore of (v\d+(?:-[a-z0-9]+)*)$/;
function systemLabel(label, m) {
  if (label === "published") {
    return m.t("splicewire-beam-versioning::messages.label_published");
  }
  const restore = RESTORE_OF.exec(label);
  if (restore) {
    return m.t("splicewire-beam-versioning::messages.label_restore_of", { version: restore[1] });
  }
  return label;
}

// src/versions-list.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function VersionRow({
  version,
  onRestore,
  disabled,
  renderMeta
}) {
  const m = useBeamVersioningMessages();
  return /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-2 rounded-md border p-3 text-sm", children: [
    /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx3("span", { className: "font-mono font-medium", children: version.readable }),
        version.isHead && /* @__PURE__ */ jsxs2(Badge, { variant: "secondary", className: "gap-1 text-[10px]", children: [
          /* @__PURE__ */ jsx3(Check, { className: "size-3" }),
          " ",
          m.t("splicewire-beam-versioning::messages.head")
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "mt-0.5 flex items-center gap-2 text-xs text-muted-foreground", children: [
        version.label && /* @__PURE__ */ jsx3("span", { className: "truncate", children: systemLabel(version.label, m) }),
        version.label && version.createdAt && /* @__PURE__ */ jsx3("span", { children: "\xB7" }),
        version.createdAt && /* @__PURE__ */ jsx3("span", { children: relativeTime(version.createdAt, m) })
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
          "aria-label": version.isHead ? m.t("splicewire-beam-versioning::messages.current_version_aria", { version: version.readable }) : m.t("splicewire-beam-versioning::messages.restore_named", { version: version.readable }),
          title: version.isHead ? m.t("splicewire-beam-versioning::messages.already_current") : m.t("splicewire-beam-versioning::messages.restore_named", { version: version.readable }),
          onClick: () => onRestore(version),
          children: [
            /* @__PURE__ */ jsx3(RotateCcw2, {}),
            " ",
            m.t("splicewire-beam-versioning::messages.restore")
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
  emptyMessage,
  errorMessage
}) {
  const m = useBeamVersioningMessages();
  if (isLoading) {
    return /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-versioning::messages.loading") });
  }
  if (isError) {
    return /* @__PURE__ */ jsxs2("p", { className: "flex items-center gap-2 text-sm text-destructive", children: [
      /* @__PURE__ */ jsx3(AlertTriangle, { className: "size-4" }),
      " ",
      errorMessage ?? m.t("splicewire-beam-versioning::messages.load_failed")
    ] });
  }
  if (!versions || versions.length === 0) {
    return /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: emptyMessage ?? m.t("splicewire-beam-versioning::messages.empty") });
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
  const m = useBeamVersioningMessages();
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
          notify({ type: "success", message: m.t("splicewire-beam-versioning::messages.saved_toast", { version: v.readable }) });
          onSaved?.(v);
          setLabelling(false);
          setLabel("");
        },
        onError: () => notify({ type: "error", message: m.t("splicewire-beam-versioning::messages.save_failed") })
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
            message: m.t("splicewire-beam-versioning::messages.restored_toast", { target: target.readable, version: v.readable })
          });
          onRestored?.(v);
          setConfirming(null);
        },
        onError: () => notify({ type: "error", message: m.t("splicewire-beam-versioning::messages.restore_failed") })
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
              placeholder: m.t("splicewire-beam-versioning::messages.label_placeholder"),
              "aria-label": m.t("splicewire-beam-versioning::messages.label_aria"),
              className: "h-8 text-sm"
            }
          ),
          /* @__PURE__ */ jsxs3(Button3, { type: "submit", size: "sm", disabled: save.isPending, children: [
            save.isPending ? /* @__PURE__ */ jsx4(Loader22, { className: "animate-spin" }) : /* @__PURE__ */ jsx4(Save, {}),
            m.t("splicewire-beam-versioning::messages.save")
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
              children: m.t("splicewire-beam-versioning::messages.cancel")
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
          " ",
          m.t("splicewire-beam-versioning::messages.save_version")
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
  useBeamVersioningMessages,
  useNotify,
  useRestoreVersion,
  useSaveVersion,
  useVersions,
  useVersionsServices
};
//# sourceMappingURL=index.js.map