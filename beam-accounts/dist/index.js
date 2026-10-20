// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var TokensServicesContext = createContext(null);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[tokens] ${event.message}`);
  else console.info(`[tokens] ${event.message}`);
}
function TokensProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx(TokensServicesContext.Provider, { value: services, children });
}
function useTokensServices() {
  const services = useContext(TokensServicesContext);
  if (!services) {
    throw new Error("Tokens components must be rendered inside a <TokensProvider>.");
  }
  return services;
}
function useNotify() {
  return useTokensServices().notify ?? consoleNotify;
}

// src/tokens-page.tsx
import {
  Archive,
  CalendarClock,
  Check,
  Copy,
  MoreHorizontal,
  Plus,
  RotateCw,
  Trash2,
  TriangleAlert
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  cn,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SimpleSelect
} from "@schemastud/ui";

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
var TOKENS_KEY = ["beam-accounts", "tokens"];
var PERMISSIONS_KEY = ["beam-accounts", "permissions"];
function useTokens() {
  const { client } = useTokensServices();
  return useQuery({ queryKey: TOKENS_KEY, queryFn: () => client.list() });
}
function usePermissions() {
  const { client } = useTokensServices();
  return useQuery({ queryKey: PERMISSIONS_KEY, queryFn: () => client.listPermissions() });
}
function useCreateToken() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useArchiveToken() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function usePermanentlyDeleteToken() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useRenewToken() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.renew(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useRotateToken() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.rotate(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useRevokeOtherSessions() {
  const { client, onError } = useTokensServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.revokeOtherSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
    onError: (err) => onError?.(err)
  });
}

// src/utils.ts
var FACETS = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey"
];
var PROVENANCE_LABEL = {
  api: "API",
  session: "Session",
  dev: "Dev",
  broker: "Broker",
  passkey: "Passkey",
  // Two machine principals the generated projection grew after this map was written
  // (`federation` in _resources 753d57c, `service` in the 79411d4 regen). They are absent
  // from FACETS above — a deliberate 5-of-7 filter subset — but required here, because
  // both maps are exhaustive over TokenProvenance.
  federation: "Federation",
  service: "Service"
};
var PROVENANCE_BADGE = {
  api: "default",
  session: "secondary",
  dev: "outline",
  broker: "outline",
  passkey: "secondary",
  // Machine principals read as `outline`, alongside `broker` — the badge the flagship's own
  // copy of this surface already gives them (splicewire-app 6d8c90109).
  federation: "outline",
  service: "outline"
};
var EXPIRY_OPTIONS = [
  { value: "0", label: "Never expires" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" }
];
function asProvenance(value) {
  return FACETS.includes(value) ? value : "api";
}
function isExpired(token) {
  return !!token.expiresAt && new Date(token.expiresAt).getTime() < Date.now();
}
function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "\u2014";
}
function errorMessage(error, fallback = "Something went wrong.") {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

// src/tokens-page.tsx
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var SORTABLE_FIELDS = /* @__PURE__ */ new Set(["name", "created", "last_used", "expires"]);
var PAGE_SIZE = 10;
function TokensPage() {
  const { renderTokenActivity } = useTokensServices();
  const notify = useNotify();
  const tokens = useTokens();
  const archiveToken = useArchiveToken();
  const deleteToken = usePermanentlyDeleteToken();
  const renewToken = useRenewToken();
  const rotateToken = useRotateToken();
  const revokeOthers = useRevokeOtherSessions();
  const [active, setActive] = useState(
    () => /* @__PURE__ */ new Set(["api"])
  );
  const [showArchived, setShowArchived] = useState(false);
  const [target, setTarget] = useState(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [rotated, setRotated] = useState(null);
  const [sort, setSort] = useState(null);
  const all = tokens.data ?? [];
  const rows = useMemo(
    () => all.filter(
      (t) => (showArchived || !t.archivedAt) && (active.size === 0 || active.has(asProvenance(t.provenance)))
    ),
    [all, active, showArchived]
  );
  const otherSessionCount = useMemo(
    () => all.filter(
      (t) => t.provenance === "session" && !t.isCurrent && !t.archivedAt
    ).length,
    [all]
  );
  const archivedCount = useMemo(
    () => all.filter((t) => !!t.archivedAt).length,
    [all]
  );
  const busy = archiveToken.isPending || deleteToken.isPending || renewToken.isPending || rotateToken.isPending || revokeOthers.isPending;
  const columns = useMemo(
    () => [
      {
        header: "Name",
        meta: { sortField: "name", sortAccessor: (t) => t.name.toLowerCase() },
        cell: ({ row }) => (
          // The cap bounds a session's whole user-agent string, and it holds the badges too:
          // at 12rem a short name beside "This session" truncated with the column half empty.
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 max-w-[24rem] items-center gap-2", children: [
            /* @__PURE__ */ jsx2(
              "span",
              {
                className: "min-w-0 truncate font-medium",
                title: row.original.name,
                children: row.original.name
              }
            ),
            row.original.isCurrent && /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "shrink-0 text-[10px]", children: "This session" }),
            row.original.archivedAt && /* @__PURE__ */ jsx2(Badge, { variant: "outline", className: "shrink-0 text-[10px]", children: "Archived" })
          ] })
        )
      },
      {
        header: "Type",
        cell: ({ row }) => {
          const provenance = asProvenance(row.original.provenance);
          return /* @__PURE__ */ jsx2(Badge, { variant: PROVENANCE_BADGE[provenance], children: PROVENANCE_LABEL[provenance] });
        }
      },
      {
        header: "Scope",
        cell: ({ row }) => /* @__PURE__ */ jsx2(ScopeChips, { abilities: row.original.abilities })
      },
      {
        header: "Created",
        meta: { sortField: "created", sortAccessor: (t) => t.createdAt },
        cell: ({ row }) => /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: row.original.createdAt ? formatDate(row.original.createdAt) : "\u2014" })
      },
      {
        header: "Last used",
        meta: { sortField: "last_used", sortAccessor: (t) => t.lastUsedAt },
        cell: ({ row }) => /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: row.original.lastUsedAt ? formatDate(row.original.lastUsedAt) : "Never" })
      },
      {
        header: "Expires",
        meta: { sortField: "expires", sortAccessor: (t) => t.expiresAt },
        cell: ({ row }) => {
          const token = row.original;
          if (!token.expiresAt) {
            return /* @__PURE__ */ jsx2("span", { className: "text-muted-foreground", children: "Never" });
          }
          const expired = isExpired(token);
          return /* @__PURE__ */ jsxs(
            "span",
            {
              className: cn(
                "text-muted-foreground",
                expired && "text-destructive"
              ),
              children: [
                formatDate(token.expiresAt),
                expired ? " \xB7 expired" : ""
              ]
            }
          );
        }
      },
      {
        id: "actions",
        header: () => /* @__PURE__ */ jsx2("span", { className: "sr-only", children: "Actions" }),
        cell: ({ row }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-0.5", children: [
          renderTokenActivity?.(row.original),
          /* @__PURE__ */ jsx2(
            RowActions,
            {
              token: row.original,
              disabled: busy,
              onRenew: () => setLifecycle({ token: row.original, action: "renew" }),
              onRotate: () => setLifecycle({ token: row.original, action: "rotate" }),
              onArchive: () => setTarget(row.original),
              onDelete: () => setDeleteTarget(row.original)
            }
          )
        ] })
      }
    ],
    [busy, renderTokenActivity]
  );
  function toggleFacet(facet) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });
  }
  async function confirmArchive() {
    if (!target) return;
    try {
      if (target === "other-sessions") {
        const result = await revokeOthers.mutateAsync();
        notify({ type: "success", message: result.message });
      } else {
        const name = target.name;
        await archiveToken.mutateAsync(target.id);
        notify({ type: "success", message: `Archived \u201C${name}\u201D.` });
      }
      setTarget(null);
    } catch {
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const name = deleteTarget.name;
      await deleteToken.mutateAsync(deleteTarget.id);
      notify({ type: "success", message: `Deleted \u201C${name}\u201D.` });
      setDeleteTarget(null);
    } catch {
    }
  }
  async function confirmLifecycle(expiresInDays) {
    if (!lifecycle) return;
    const { token, action } = lifecycle;
    try {
      if (action === "renew") {
        await renewToken.mutateAsync({ id: token.id, expiresInDays });
        notify({ type: "success", message: `Renewed \u201C${token.name}\u201D.` });
      } else {
        const created = await rotateToken.mutateAsync({
          id: token.id,
          expiresInDays
        });
        setRotated(created);
      }
      setLifecycle(null);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx2("h2", { className: "font-semibold", children: "API tokens" }),
        /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "Personal access tokens for the api/v1 surface. Browser sessions and dev tokens are tagged so you can filter them out." })
      ] }),
      /* @__PURE__ */ jsx2(CreateTokenDialog, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      FACETS.map((facet) => {
        const on = active.has(facet);
        return /* @__PURE__ */ jsx2(
          Button,
          {
            type: "button",
            size: "sm",
            variant: on ? "secondary" : "outline",
            "aria-pressed": on,
            className: cn("h-7 rounded-full px-3", on && "ring-1 ring-ring"),
            onClick: () => toggleFacet(facet),
            children: PROVENANCE_LABEL[facet]
          },
          facet
        );
      }),
      active.size === 0 && /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: "Showing all types" }),
      archivedCount > 0 && /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: showArchived ? "secondary" : "outline",
          "aria-pressed": showArchived,
          className: cn(
            "h-7 rounded-full px-3",
            showArchived && "ring-1 ring-ring"
          ),
          onClick: () => setShowArchived((v) => !v),
          children: [
            /* @__PURE__ */ jsx2(Archive, { className: "size-3.5" }),
            " Archived (",
            archivedCount,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsx2("div", { className: "ml-auto", children: otherSessionCount > 0 && /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          disabled: busy,
          onClick: () => setTarget("other-sessions"),
          children: [
            "Revoke ",
            otherSessionCount,
            " other session",
            otherSessionCount === 1 ? "" : "s"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx2(
      DataTable,
      {
        columns,
        data: rows,
        loading: tokens.isPending,
        clientSort: {
          sortableFields: SORTABLE_FIELDS,
          sort,
          onSortChange: setSort
        },
        clientPageSize: PAGE_SIZE,
        rowClassName: (token) => token.archivedAt || isExpired(token) ? "opacity-60" : void 0,
        emptyMessage: all.length === 0 ? "No tokens yet." : "No tokens match the selected types."
      }
    ),
    /* @__PURE__ */ jsx2(
      ArchiveConfirmDialog,
      {
        target,
        pending: busy,
        onCancel: () => setTarget(null),
        onConfirm: confirmArchive
      }
    ),
    /* @__PURE__ */ jsx2(
      DeleteConfirmDialog,
      {
        target: deleteTarget,
        pending: busy,
        onCancel: () => setDeleteTarget(null),
        onConfirm: confirmDelete
      }
    ),
    /* @__PURE__ */ jsx2(
      LifecycleDialog,
      {
        lifecycle,
        pending: renewToken.isPending || rotateToken.isPending,
        onCancel: () => setLifecycle(null),
        onConfirm: confirmLifecycle
      }
    ),
    /* @__PURE__ */ jsx2(
      SecretRevealDialog,
      {
        created: rotated,
        title: "Token rotated",
        onOpenChange: (open) => !open && setRotated(null)
      }
    )
  ] });
}
function ScopeChips({ abilities }) {
  if (!abilities || abilities.length === 0) {
    return /* @__PURE__ */ jsx2(Badge, { variant: "secondary", className: "text-[10px]", children: "Full access" });
  }
  return /* @__PURE__ */ jsx2("div", { className: "flex max-w-xs flex-wrap gap-1", children: abilities.map((ability) => /* @__PURE__ */ jsx2(
    Badge,
    {
      variant: "outline",
      className: "font-mono text-[10px] font-normal",
      children: ability
    },
    ability
  )) });
}
function RowActions({
  token,
  disabled,
  onRenew,
  onRotate,
  onArchive,
  onDelete
}) {
  const [open, setOpen] = useState(false);
  if (token.isCurrent) {
    return /* @__PURE__ */ jsx2("span", { className: "text-xs text-muted-foreground", children: "\u2014" });
  }
  const archived = !!token.archivedAt;
  const canManage = !archived && asProvenance(token.provenance) === "api";
  function run(action) {
    setOpen(false);
    action();
  }
  return /* @__PURE__ */ jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx2(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx2(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: "size-7",
        "aria-label": `Manage ${token.name}`,
        disabled,
        children: /* @__PURE__ */ jsx2(MoreHorizontal, {})
      }
    ) }),
    /* @__PURE__ */ jsxs(PopoverContent, { align: "end", className: "w-48 p-1", children: [
      canManage && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2(ActionItem, { icon: /* @__PURE__ */ jsx2(CalendarClock, {}), onClick: () => run(onRenew), children: "Renew\u2026" }),
        /* @__PURE__ */ jsx2(ActionItem, { icon: /* @__PURE__ */ jsx2(RotateCw, {}), onClick: () => run(onRotate), children: "Rotate\u2026" })
      ] }),
      archived ? /* @__PURE__ */ jsx2(
        ActionItem,
        {
          icon: /* @__PURE__ */ jsx2(Trash2, {}),
          destructive: true,
          onClick: () => run(onDelete),
          children: "Delete permanently"
        }
      ) : /* @__PURE__ */ jsx2(
        ActionItem,
        {
          icon: /* @__PURE__ */ jsx2(Archive, {}),
          destructive: true,
          onClick: () => run(onArchive),
          children: "Archive"
        }
      )
    ] })
  ] });
}
function ActionItem({
  icon,
  children,
  destructive,
  onClick
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
        destructive && "text-destructive hover:text-destructive"
      ),
      children: [
        /* @__PURE__ */ jsx2("span", { className: "[&>svg]:size-4", children: icon }),
        children
      ]
    }
  );
}
function LifecycleDialog({
  lifecycle,
  pending,
  onCancel,
  onConfirm
}) {
  const [expiresIn, setExpiresIn] = useState("30");
  const isRotate = lifecycle?.action === "rotate";
  return /* @__PURE__ */ jsx2(
    Dialog,
    {
      open: lifecycle !== null,
      onOpenChange: (open) => {
        if (!open) onCancel();
        else setExpiresIn("30");
      },
      children: /* @__PURE__ */ jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxs(DialogTitle, { children: [
            isRotate ? "Rotate" : "Renew",
            " \u201C",
            lifecycle?.token.name ?? "",
            "\u201D?"
          ] }),
          /* @__PURE__ */ jsx2(DialogDescription, { children: isRotate ? "Issues a new secret with the same name and scope, and archives the current one. Any client using the old secret must switch to the new one." : "Extends the expiry. The secret is unchanged, so existing clients keep working." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsx2(Label, { htmlFor: "lifecycle-expiry", children: "Expires" }),
          /* @__PURE__ */ jsx2(
            SimpleSelect,
            {
              id: "lifecycle-expiry",
              "aria-label": "New lifetime",
              value: expiresIn,
              onValueChange: setExpiresIn,
              options: EXPIRY_OPTIONS,
              className: "w-full"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: "Cancel" }),
          /* @__PURE__ */ jsx2(
            Button,
            {
              variant: isRotate ? "destructive" : "default",
              onClick: () => onConfirm(Number(expiresIn) || void 0),
              disabled: pending,
              children: pending ? "Working\u2026" : isRotate ? "Rotate" : "Renew"
            }
          )
        ] })
      ] })
    }
  );
}
function ArchiveConfirmDialog({
  target,
  pending,
  onCancel,
  onConfirm
}) {
  const isSweep = target === "other-sessions";
  return /* @__PURE__ */ jsx2(Dialog, { open: target !== null, onOpenChange: (open) => !open && onCancel(), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx2(DialogTitle, { children: isSweep ? "Revoke all other sessions?" : `Archive \u201C${target?.name ?? ""}\u201D?` }),
      /* @__PURE__ */ jsx2(DialogDescription, { children: isSweep ? "This logs out every other browser session. Your API tokens are not affected, and you stay signed in here." : "The token stops working immediately and any client using it will fail. Its record is kept, archived, for audit \u2014 this cannot be undone." })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: "Cancel" }),
      /* @__PURE__ */ jsx2(Button, { variant: "destructive", onClick: onConfirm, disabled: pending, children: pending ? "Working\u2026" : isSweep ? "Revoke" : "Archive" })
    ] })
  ] }) });
}
function DeleteConfirmDialog({
  target,
  pending,
  onCancel,
  onConfirm
}) {
  return /* @__PURE__ */ jsx2(Dialog, { open: target !== null, onOpenChange: (open) => !open && onCancel(), children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { children: [
        "Delete \u201C",
        target?.name ?? "",
        "\u201D permanently?"
      ] }),
      /* @__PURE__ */ jsx2(DialogDescription, { children: "This removes the archived token record entirely. The activity log keeps a dated entry of it for audit, but the row itself is gone. This cannot be undone." })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx2(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: "Cancel" }),
      /* @__PURE__ */ jsx2(Button, { variant: "destructive", onClick: onConfirm, disabled: pending, children: pending ? "Working\u2026" : "Delete permanently" })
    ] })
  ] }) });
}
function SecretRevealDialog({
  created,
  title,
  onOpenChange
}) {
  const [copied, setCopied] = useState(false);
  async function copySecret() {
    if (!created) return;
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }
  return /* @__PURE__ */ jsx2(Dialog, { open: created !== null, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx2(DialogTitle, { children: title }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "Copy the secret for \u201C",
        created?.name,
        "\u201D now."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-md border border-amber-500/30 dark:border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-3 text-sm text-amber-600 dark:text-amber-400", children: [
      /* @__PURE__ */ jsx2(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }),
      /* @__PURE__ */ jsx2("span", { children: "This secret is shown once and cannot be retrieved again. Store it somewhere safe before closing this dialog." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx2(
        Input,
        {
          readOnly: true,
          value: created?.token ?? "",
          className: "font-mono text-xs",
          onFocus: (event) => event.currentTarget.select()
        }
      ),
      /* @__PURE__ */ jsx2(
        Button,
        {
          variant: "outline",
          size: "icon",
          "aria-label": "Copy token",
          onClick: copySecret,
          children: copied ? /* @__PURE__ */ jsx2(Check, {}) : /* @__PURE__ */ jsx2(Copy, {})
        }
      )
    ] }),
    /* @__PURE__ */ jsx2(DialogFooter, { children: /* @__PURE__ */ jsx2(Button, { onClick: () => onOpenChange(false), children: "Done" }) })
  ] }) });
}
function CreateTokenDialog() {
  const createToken = useCreateToken();
  const permissions = usePermissions();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("full");
  const [selected, setSelected] = useState(() => /* @__PURE__ */ new Set());
  const [expiresIn, setExpiresIn] = useState("0");
  const [created, setCreated] = useState(null);
  const myPermissions = useMemo(
    () => [...permissions.data ?? []].sort((a, b) => a.localeCompare(b)),
    [permissions.data]
  );
  function openDialog() {
    setName("");
    setMode("full");
    setSelected(/* @__PURE__ */ new Set());
    setExpiresIn("0");
    setCreated(null);
    createToken.reset();
    setOpen(true);
  }
  function togglePermission(permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }
  const scopeReady = mode === "full" || selected.size > 0;
  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !scopeReady) return;
    const token = await createToken.mutateAsync({
      name: name.trim(),
      abilities: mode === "scoped" ? [...selected] : void 0,
      expiresInDays: Number(expiresIn) || void 0
    });
    setCreated(token);
    setOpen(false);
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(Button, { onClick: openDialog, children: [
      /* @__PURE__ */ jsx2(Plus, {}),
      " New token"
    ] }),
    /* @__PURE__ */ jsx2(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsx2(DialogContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx2(DialogTitle, { children: "New API token" }),
        /* @__PURE__ */ jsx2(DialogDescription, { children: "Give the token a name, and choose how much of your access it may use." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx2(Label, { htmlFor: "token-name", children: "Name" }),
        /* @__PURE__ */ jsx2(
          Input,
          {
            id: "token-name",
            value: name,
            onChange: (event) => setName(event.target.value),
            placeholder: "e.g. CI deploys",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx2(Label, { children: "Access" }),
        /* @__PURE__ */ jsx2("div", { className: "grid grid-cols-2 gap-2", children: [
          ["full", "Full access", "Acts as you"],
          ["scoped", "Limited", "Pick permissions"]
        ].map(([value, title, hint]) => {
          const on = mode === value;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              "aria-pressed": on,
              onClick: () => setMode(value),
              className: cn(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                on ? "border-ring bg-accent ring-1 ring-ring" : "border-input hover:bg-accent/50"
              ),
              children: [
                /* @__PURE__ */ jsx2("div", { className: "font-medium", children: title }),
                /* @__PURE__ */ jsx2("div", { className: "text-xs text-muted-foreground", children: hint })
              ]
            },
            value
          );
        }) })
      ] }),
      mode === "scoped" && /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsxs(Label, { children: [
          "Permissions",
          " ",
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-muted-foreground", children: [
            "(",
            selected.size,
            " selected)"
          ] })
        ] }),
        permissions.isLoading ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "Loading your permissions\u2026" }) : myPermissions.length === 0 ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: "You hold no scopable permissions on this team." }) : /* @__PURE__ */ jsx2("div", { className: "flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2", children: myPermissions.map((permission) => {
          const on = selected.has(permission);
          return /* @__PURE__ */ jsx2(
            "button",
            {
              type: "button",
              "aria-pressed": on,
              onClick: () => togglePermission(permission),
              className: cn(
                "rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors",
                on ? "border-ring bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-accent"
              ),
              children: permission
            },
            permission
          );
        }) }),
        /* @__PURE__ */ jsx2("p", { className: "text-xs text-muted-foreground", children: "Choosing fewer permissions limits what the token can do if it is exposed. It can never do more than you can, and stops working for a permission the moment you lose it." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx2(Label, { htmlFor: "token-expiry", children: "Expires" }),
        /* @__PURE__ */ jsx2(
          SimpleSelect,
          {
            id: "token-expiry",
            "aria-label": "Token lifetime",
            value: expiresIn,
            onValueChange: setExpiresIn,
            options: EXPIRY_OPTIONS,
            className: "w-full"
          }
        )
      ] }),
      createToken.isError && /* @__PURE__ */ jsx2("p", { className: "text-sm text-destructive", children: errorMessage(createToken.error, "Could not create the token.") }),
      /* @__PURE__ */ jsx2(DialogFooter, { children: /* @__PURE__ */ jsx2(
        Button,
        {
          type: "submit",
          disabled: !name.trim() || !scopeReady || createToken.isPending,
          children: createToken.isPending ? "Creating\u2026" : "Create token"
        }
      ) })
    ] }) }) }),
    /* @__PURE__ */ jsx2(
      SecretRevealDialog,
      {
        created,
        title: "Token created",
        onOpenChange: (open2) => !open2 && setCreated(null)
      }
    )
  ] });
}

// src/auth-provider.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var AuthServicesContext = createContext2(null);
function AuthProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx3(AuthServicesContext.Provider, { value: services, children });
}
function useAuthServices() {
  const services = useContext2(AuthServicesContext);
  if (!services) {
    throw new Error("Auth components must be rendered inside an <AuthProvider>.");
  }
  return services;
}

// src/auth-hooks.ts
import { useMutation as useMutation2, useQuery as useQuery2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";

// src/webauthn.ts
function base64urlToBuffer(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function isWebAuthnSupported() {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function" && typeof navigator !== "undefined" && !!navigator.credentials && typeof navigator.credentials.get === "function";
}
function toRequestOptions(options) {
  const o = { ...options };
  o.challenge = base64urlToBuffer(options.challenge);
  if (Array.isArray(options.allowCredentials)) {
    o.allowCredentials = options.allowCredentials.map((c) => ({
      ...c,
      id: base64urlToBuffer(c.id)
    }));
  }
  return o;
}
function toCreationOptions(options) {
  const o = { ...options };
  o.challenge = base64urlToBuffer(options.challenge);
  const user = { ...options.user };
  user.id = base64urlToBuffer(user.id);
  o.user = user;
  if (Array.isArray(options.excludeCredentials)) {
    o.excludeCredentials = options.excludeCredentials.map((c) => ({
      ...c,
      id: base64urlToBuffer(c.id)
    }));
  }
  return o;
}
function assertionToJson(credential) {
  const response = credential.response;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      authenticatorData: bufferToBase64url(response.authenticatorData),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null
    }
  };
}
function attestationToJson(credential) {
  const response = credential.response;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      attestationObject: bufferToBase64url(response.attestationObject)
    }
  };
}
async function runAssertionCeremony(options) {
  const credential = await navigator.credentials.get({
    publicKey: toRequestOptions(options)
  });
  if (!credential) throw new Error("Passkey verification was cancelled.");
  return assertionToJson(credential);
}
async function runAttestationCeremony(options) {
  const credential = await navigator.credentials.create({
    publicKey: toCreationOptions(options)
  });
  if (!credential) throw new Error("Passkey registration was cancelled.");
  return attestationToJson(credential);
}

// src/auth-hooks.ts
var PASSKEYS_KEY = ["beam-accounts", "passkeys"];
function useLogin() {
  const { client, onError } = useAuthServices();
  return useMutation2({
    mutationFn: (input) => client.login(input),
    onError: (err) => onError?.(err)
  });
}
function useRequestPasswordReset() {
  const { client, onError } = useAuthServices();
  return useMutation2({
    mutationFn: (input) => client.requestPasswordReset(input),
    onError: (err) => onError?.(err)
  });
}
function useResetPassword() {
  const { client, onError } = useAuthServices();
  return useMutation2({
    mutationFn: (input) => client.resetPassword(input),
    onError: (err) => onError?.(err)
  });
}
function useAuth() {
  return {
    login: useLogin(),
    requestPasswordReset: useRequestPasswordReset(),
    resetPassword: useResetPassword()
  };
}
function usePasskey() {
  const { client, onError } = useAuthServices();
  return useMutation2({
    mutationFn: async () => {
      if (!client.passkey) throw new Error("Passkey sign-in is not available.");
      const { handle, options } = await client.passkey.loginOptions();
      const credential = await runAssertionCeremony(options);
      return await client.passkey.login({ handle, credential });
    },
    onError: (err) => onError?.(err)
  });
}
function usePasskeys() {
  const { client } = useAuthServices();
  return useQuery2({
    queryKey: PASSKEYS_KEY,
    queryFn: () => client.passkey?.list() ?? Promise.resolve([])
  });
}
function useRegisterPasskey() {
  const { client, onError } = useAuthServices();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: async (name) => {
      if (!client.passkey) throw new Error("Passkey registration is not available.");
      const { handle, options } = await client.passkey.registrationOptions();
      const credential = await runAttestationCeremony(options);
      return client.passkey.register({ handle, name, credential });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useRenamePasskey() {
  const { client, onError } = useAuthServices();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: ({ id, name }) => {
      if (!client.passkey?.rename) throw new Error("Passkey rename is not available.");
      return client.passkey.rename(id, name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY }),
    onError: (err) => onError?.(err)
  });
}
function useDeletePasskey() {
  const { client, onError } = useAuthServices();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: (id) => client.passkey?.remove(id) ?? Promise.resolve(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY }),
    onError: (err) => onError?.(err)
  });
}

// src/login-panel.tsx
import { useState as useState3 } from "react";
import { Button as Button2, Card, CardContent, CardDescription, CardHeader, Label as Label2 } from "@schemastud/ui";

// src/auth-fields.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState as useState2 } from "react";
import { cn as cn2, Input as Input2 } from "@schemastud/ui";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState2(false);
  return /* @__PURE__ */ jsxs2("div", { className: "relative", children: [
    /* @__PURE__ */ jsx4(
      Input2,
      {
        ...props,
        type: visible ? "text" : "password",
        className: cn2("pr-10", className)
      }
    ),
    /* @__PURE__ */ jsx4(
      "button",
      {
        type: "button",
        onClick: () => setVisible((v) => !v),
        className: "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground",
        "aria-label": visible ? "Hide password" : "Show password",
        "aria-pressed": visible,
        tabIndex: 0,
        children: visible ? /* @__PURE__ */ jsx4(EyeOff, { className: "size-4", "aria-hidden": true }) : /* @__PURE__ */ jsx4(Eye, { className: "size-4", "aria-hidden": true })
      }
    )
  ] });
}
function AuthError({ message }) {
  if (!message) return null;
  return /* @__PURE__ */ jsx4("p", { role: "alert", className: "text-sm text-destructive", children: message });
}

// src/login-panel.tsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function LoginPanel({
  brand,
  onSuccess,
  title = "Sign in to Splicewire",
  titleAs: TitleTag = "h1",
  description,
  showPasskeySlot = false,
  passkeySlot,
  showRemember = false,
  showForgotLink = false,
  onForgot,
  footer
}) {
  const [email, setEmail] = useState3("");
  const [password, setPassword] = useState3("");
  const [remember, setRemember] = useState3(false);
  const login = useLogin();
  async function submit(event) {
    event.preventDefault();
    login.reset();
    try {
      const result = await login.mutateAsync({
        email,
        password,
        ...showRemember ? { remember } : {}
      });
      onSuccess(result);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs3("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs3(Card, { className: "w-full", children: [
      /* @__PURE__ */ jsxs3(CardHeader, { children: [
        /* @__PURE__ */ jsx5(TitleTag, { className: "font-semibold leading-none tracking-tight", children: title }),
        description && /* @__PURE__ */ jsx5(CardDescription, { children: description })
      ] }),
      /* @__PURE__ */ jsxs3(CardContent, { className: "space-y-4", children: [
        showPasskeySlot && passkeySlot && /* @__PURE__ */ jsxs3(Fragment2, { children: [
          /* @__PURE__ */ jsx5("div", { children: passkeySlot }),
          /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-3", "aria-hidden": true, children: [
            /* @__PURE__ */ jsx5("span", { className: "h-px flex-1 bg-border" }),
            /* @__PURE__ */ jsx5("span", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: "Or continue with email" }),
            /* @__PURE__ */ jsx5("span", { className: "h-px flex-1 bg-border" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("form", { className: "space-y-4", onSubmit: submit, children: [
          /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx5(Label2, { htmlFor: "login-email", children: "Email" }),
            /* @__PURE__ */ jsx5(
              "input",
              {
                id: "login-email",
                type: "email",
                autoComplete: "email",
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs3("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1", children: [
              /* @__PURE__ */ jsx5(Label2, { htmlFor: "login-password", children: "Password" }),
              showForgotLink && /* @__PURE__ */ jsx5(
                "button",
                {
                  type: "button",
                  onClick: onForgot,
                  className: "whitespace-nowrap text-sm font-medium text-primary underline-offset-4 hover:underline",
                  children: "Forgot your password?"
                }
              )
            ] }),
            /* @__PURE__ */ jsx5(
              PasswordInput,
              {
                id: "login-password",
                autoComplete: "current-password",
                required: true,
                value: password,
                onChange: (e) => setPassword(e.target.value)
              }
            )
          ] }),
          showRemember && /* @__PURE__ */ jsxs3("label", { htmlFor: "login-remember", className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx5(
              "input",
              {
                id: "login-remember",
                type: "checkbox",
                checked: remember,
                onChange: (e) => setRemember(e.target.checked),
                className: "size-4 rounded border-input"
              }
            ),
            "Remember me"
          ] }),
          /* @__PURE__ */ jsx5(AuthError, { message: login.isError ? errorMessage(login.error, "Invalid email or password.") : null }),
          /* @__PURE__ */ jsx5(Button2, { type: "submit", className: "w-full", disabled: login.isPending, children: login.isPending ? "Signing in\u2026" : "Sign in" })
        ] }),
        footer
      ] })
    ] })
  ] });
}

// src/forgot-password-form.tsx
import { useState as useState4 } from "react";
import { Button as Button3, Label as Label3 } from "@schemastud/ui";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function ForgotPasswordForm({ brand, onBack }) {
  const [email, setEmail] = useState4("");
  const [sent, setSent] = useState4(false);
  const request = useRequestPasswordReset();
  async function submit(event) {
    event.preventDefault();
    request.reset();
    try {
      await request.mutateAsync({ email });
      setSent(true);
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs4("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs4("div", { className: "w-full space-y-4", children: [
      /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx6("h1", { className: "text-lg font-semibold", children: "Forgot your password?" }),
        /* @__PURE__ */ jsx6("p", { className: "text-sm text-muted-foreground", children: "Enter your email and we'll send you a link to reset it." })
      ] }),
      sent ? /* @__PURE__ */ jsx6("p", { role: "status", className: "text-sm", children: "If an account exists for that email, a reset link is on its way. Check your inbox." }) : /* @__PURE__ */ jsxs4("form", { className: "space-y-4", onSubmit: submit, children: [
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx6(Label3, { htmlFor: "forgot-email", children: "Email" }),
          /* @__PURE__ */ jsx6(
            "input",
            {
              id: "forgot-email",
              type: "email",
              autoComplete: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            }
          )
        ] }),
        /* @__PURE__ */ jsx6(
          AuthError,
          {
            message: request.isError ? errorMessage(request.error, "Could not send the reset link.") : null
          }
        ),
        /* @__PURE__ */ jsx6(Button3, { type: "submit", className: "w-full", disabled: request.isPending, children: request.isPending ? "Sending\u2026" : "Email a reset link" })
      ] }),
      onBack && /* @__PURE__ */ jsx6(
        "button",
        {
          type: "button",
          onClick: onBack,
          className: "text-sm font-medium text-primary underline-offset-4 hover:underline",
          children: "Back to sign in"
        }
      )
    ] })
  ] });
}

// src/reset-password-form.tsx
import { useState as useState5 } from "react";
import { Button as Button4, Label as Label4 } from "@schemastud/ui";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function ResetPasswordForm({ token, email, brand, onSuccess }) {
  const [password, setPassword] = useState5("");
  const [confirmation, setConfirmation] = useState5("");
  const [mismatch, setMismatch] = useState5(false);
  const reset = useResetPassword();
  async function submit(event) {
    event.preventDefault();
    reset.reset();
    if (password !== confirmation) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    try {
      await reset.mutateAsync({
        token,
        email,
        password,
        passwordConfirmation: confirmation
      });
      onSuccess?.();
    } catch {
    }
  }
  return /* @__PURE__ */ jsxs5("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs5("div", { className: "w-full space-y-4", children: [
      /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx7("h1", { className: "text-lg font-semibold", children: "Set a new password" }),
        /* @__PURE__ */ jsxs5("p", { className: "text-sm text-muted-foreground", children: [
          "Resetting the password for ",
          email,
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs5("form", { className: "space-y-4", onSubmit: submit, children: [
        /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx7(Label4, { htmlFor: "reset-password", children: "New password" }),
          /* @__PURE__ */ jsx7(
            PasswordInput,
            {
              id: "reset-password",
              autoComplete: "new-password",
              required: true,
              value: password,
              onChange: (e) => setPassword(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx7(Label4, { htmlFor: "reset-password-confirm", children: "Confirm new password" }),
          /* @__PURE__ */ jsx7(
            PasswordInput,
            {
              id: "reset-password-confirm",
              autoComplete: "new-password",
              required: true,
              value: confirmation,
              onChange: (e) => setConfirmation(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsx7(
          AuthError,
          {
            message: mismatch ? "The passwords do not match." : reset.isError ? errorMessage(reset.error, "This reset link is invalid or has expired.") : null
          }
        ),
        /* @__PURE__ */ jsx7(Button4, { type: "submit", className: "w-full", disabled: reset.isPending, children: reset.isPending ? "Resetting\u2026" : "Reset password" })
      ] })
    ] })
  ] });
}

// src/passkey-button.tsx
import { KeyRound } from "lucide-react";
import { useState as useState6 } from "react";
import { Button as Button5 } from "@schemastud/ui";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function PasskeyButton({ onSuccess, label }) {
  const [supported] = useState6(() => isWebAuthnSupported());
  const passkey = usePasskey();
  if (!supported) return null;
  return /* @__PURE__ */ jsxs6("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs6(
      Button5,
      {
        type: "button",
        variant: "outline",
        className: "w-full",
        disabled: passkey.isPending,
        onClick: () => passkey.mutate(void 0, { onSuccess: (result) => onSuccess(result) }),
        children: [
          /* @__PURE__ */ jsx8(KeyRound, { className: "size-4", "aria-hidden": true }),
          passkey.isPending ? "Waiting for passkey\u2026" : label ?? "Sign in with a passkey"
        ]
      }
    ),
    /* @__PURE__ */ jsx8(
      AuthError,
      {
        message: passkey.isError ? errorMessage(passkey.error, "Passkey verification was cancelled.") : null
      }
    )
  ] });
}

// src/passkeys-section.tsx
import { Check as Check2, KeyRound as KeyRound2, Pencil, Trash2 as Trash22, X } from "lucide-react";
import { useState as useState7 } from "react";
import { Button as Button6, Input as Input3, Label as Label5 } from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function PasskeysSection({
  showHeader = true
} = {}) {
  const [supported] = useState7(() => isWebAuthnSupported());
  const [name, setName] = useState7("");
  const [editingId, setEditingId] = useState7(null);
  const [draftName, setDraftName] = useState7("");
  const { client } = useAuthServices();
  const canRename = Boolean(client.passkey?.rename);
  const passkeys = usePasskeys();
  const register = useRegisterPasskey();
  const rename = useRenamePasskey();
  const remove = useDeletePasskey();
  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    register.mutate(name.trim(), { onSuccess: () => setName("") });
  }
  function startEditing(id, current) {
    setEditingId(id);
    setDraftName(current);
  }
  function cancelEditing() {
    setEditingId(null);
    setDraftName("");
  }
  function saveEditing(id) {
    const next = draftName.trim();
    if (!next) return;
    rename.mutate({ id, name: next }, { onSuccess: () => cancelEditing() });
  }
  return /* @__PURE__ */ jsxs7("div", { className: "space-y-6", children: [
    showHeader && /* @__PURE__ */ jsxs7("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx9("h2", { className: "text-base font-semibold", children: "Passkeys" }),
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "Sign in without a password using a passkey saved on a trusted device." })
    ] }),
    supported ? /* @__PURE__ */ jsxs7("form", { className: "flex items-end gap-2", onSubmit: submit, children: [
      /* @__PURE__ */ jsxs7("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx9(Label5, { htmlFor: "passkey-name", children: "Add a passkey" }),
        /* @__PURE__ */ jsx9(
          Input3,
          {
            id: "passkey-name",
            placeholder: "e.g. My laptop",
            value: name,
            onChange: (e) => setName(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs7(Button6, { type: "submit", disabled: register.isPending || !name.trim(), children: [
        /* @__PURE__ */ jsx9(KeyRound2, { className: "size-4", "aria-hidden": true }),
        register.isPending ? "Waiting\u2026" : "Register"
      ] })
    ] }) : /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "This browser or device doesn't support passkeys." }),
    /* @__PURE__ */ jsx9(
      AuthError,
      {
        message: register.isError ? errorMessage(register.error, "Could not register the passkey.") : null
      }
    ),
    /* @__PURE__ */ jsx9(
      AuthError,
      {
        message: rename.isError ? errorMessage(rename.error, "Could not rename the passkey.") : null
      }
    ),
    /* @__PURE__ */ jsxs7("ul", { className: "divide-y rounded-md border", children: [
      passkeys.isPending && /* @__PURE__ */ jsx9("li", { className: "p-3 text-sm text-muted-foreground", children: "Loading\u2026" }),
      passkeys.data?.length === 0 && !passkeys.isPending && /* @__PURE__ */ jsx9("li", { className: "p-3 text-sm text-muted-foreground", children: "No passkeys registered yet." }),
      passkeys.data?.map((passkey) => {
        const editing = editingId === passkey.id;
        return /* @__PURE__ */ jsx9(
          "li",
          {
            className: "flex items-center justify-between gap-3 p-3",
            children: editing ? /* @__PURE__ */ jsxs7(
              "form",
              {
                className: "flex flex-1 items-center gap-2",
                onSubmit: (e) => {
                  e.preventDefault();
                  saveEditing(passkey.id);
                },
                children: [
                  /* @__PURE__ */ jsx9(
                    Input3,
                    {
                      "aria-label": `Rename ${passkey.name}`,
                      autoFocus: true,
                      value: draftName,
                      onChange: (e) => setDraftName(e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === "Escape") cancelEditing();
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx9(
                    Button6,
                    {
                      type: "submit",
                      variant: "ghost",
                      size: "icon",
                      "aria-label": "Save name",
                      disabled: rename.isPending || !draftName.trim(),
                      children: /* @__PURE__ */ jsx9(Check2, { className: "size-4", "aria-hidden": true })
                    }
                  ),
                  /* @__PURE__ */ jsx9(
                    Button6,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "icon",
                      "aria-label": "Cancel rename",
                      disabled: rename.isPending,
                      onClick: cancelEditing,
                      children: /* @__PURE__ */ jsx9(X, { className: "size-4", "aria-hidden": true })
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxs7(Fragment3, { children: [
              /* @__PURE__ */ jsxs7("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx9("div", { className: "truncate text-sm font-medium", children: passkey.name }),
                /* @__PURE__ */ jsxs7("div", { className: "text-xs text-muted-foreground", children: [
                  "Added ",
                  formatDate(passkey.createdAt),
                  " \xB7 Last used",
                  " ",
                  formatDate(passkey.lastUsedAt)
                ] })
              ] }),
              /* @__PURE__ */ jsxs7("div", { className: "flex items-center gap-1", children: [
                canRename && /* @__PURE__ */ jsx9(
                  Button6,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    "aria-label": `Rename ${passkey.name}`,
                    disabled: remove.isPending,
                    onClick: () => startEditing(passkey.id, passkey.name),
                    children: /* @__PURE__ */ jsx9(Pencil, { className: "size-4", "aria-hidden": true })
                  }
                ),
                /* @__PURE__ */ jsx9(
                  Button6,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    "aria-label": `Delete ${passkey.name}`,
                    disabled: remove.isPending,
                    onClick: () => remove.mutate(passkey.id),
                    children: /* @__PURE__ */ jsx9(Trash22, { className: "size-4", "aria-hidden": true })
                  }
                )
              ] })
            ] })
          },
          passkey.id
        );
      })
    ] })
  ] });
}

// src/tokens-roster.tsx
import { useMemo as useMemo2, useState as useState8 } from "react";
import {
  Check as Check3,
  Clock3,
  Copy as Copy2,
  KeyRound as KeyRound3,
  Plus as Plus2,
  Trash2 as Trash23,
  Search,
  RotateCw as RotateCw2
} from "lucide-react";
import { SchemaForm } from "@schemastud/seam";
import {
  Badge as Badge2,
  Button as Button7,
  cn as cn3,
  DataTable as DataTable2,
  Dialog as Dialog2,
  DialogContent as DialogContent2,
  DialogDescription as DialogDescription2,
  DialogFooter as DialogFooter2,
  DialogHeader as DialogHeader2,
  DialogTitle as DialogTitle2,
  Input as Input4
} from "@schemastud/ui";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var FACETS2 = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey"
];
var PROVENANCE_LABEL2 = {
  api: "API",
  session: "Session",
  dev: "Dev",
  broker: "Broker",
  passkey: "Passkey",
  federation: "Federation",
  // The sync service identity's token — a machine principal, not a human one, which is
  // why it is absent from FACETS above (a deliberate 5-of-7 filter set) but required
  // here: both maps are exhaustive over TokenProvenance.
  service: "Service"
};
var PROVENANCE_BADGE2 = {
  api: "default",
  session: "secondary",
  dev: "outline",
  broker: "outline",
  passkey: "secondary",
  federation: "outline",
  service: "outline"
};
var EXPIRY_OPTIONS2 = [
  { value: 0, label: "Never expires" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" }
];
var tokenScopeSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Token name",
      description: 'A label you recognise later \u2014 e.g. "ci-deploy-bot" or "laptop CLI".',
      minLength: 1
    },
    expiresInDays: {
      type: "integer",
      title: "Expires",
      description: 'When the token stops working. "Never" mints a token with no expiry.',
      // Labels travel IN the schema as oneOf const/title pairs: the renderer (RJSF 6) never reads a
      // schema-level `enumNames`, so an enum showed the raw "0" for "Never" (TOWER-05 shots-r5).
      oneOf: EXPIRY_OPTIONS2.map((o) => ({ const: o.value, title: o.label })),
      default: 0
    }
  },
  required: ["name"]
};
function asProvenance2(value) {
  return FACETS2.includes(value) || value === "federation" || value === "service" ? value : "api";
}
function isExpiring(token) {
  if (!token.expiresAt || token.archivedAt) return false;
  const days = (new Date(token.expiresAt).getTime() - Date.now()) / 864e5;
  return days >= 0 && days <= 14;
}
function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString() : "\u2014";
}
function expiryLabel(token, now = Date.now()) {
  if (!token.expiresAt) return "Never expires";
  const at = new Date(token.expiresAt);
  return `${at.getTime() < now ? "Expired" : "Expires"} ${at.toLocaleDateString()}`;
}
function fmtRelative(value) {
  if (!value) return "never";
  const mins = (Date.now() - new Date(value).getTime()) / 6e4;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}
function groupPermissions(names) {
  const byResource = /* @__PURE__ */ new Map();
  for (const name of names) {
    const dot = name.indexOf(".");
    const resource = dot === -1 ? "general" : name.slice(0, dot);
    const bucket = byResource.get(resource) ?? [];
    bucket.push(name);
    byResource.set(resource, bucket);
  }
  return [...byResource.entries()].sort(
    ([a], [b]) => a === "general" ? 1 : b === "general" ? -1 : a.localeCompare(b)
  ).map(([resource, permissions]) => ({
    resource,
    label: resource === "general" ? "General" : resource[0].toUpperCase() + resource.slice(1),
    permissions: permissions.sort()
  }));
}
function actionLabel(name) {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(dot + 1);
}
function ScopeChips2({ abilities }) {
  if (!abilities || abilities.length === 0) {
    return /* @__PURE__ */ jsxs8("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning-foreground", children: [
      /* @__PURE__ */ jsx10("span", { className: "size-1.5 rounded-full bg-warning" }),
      "Full access"
    ] });
  }
  return /* @__PURE__ */ jsx10("div", { className: "flex max-w-xs flex-wrap gap-1", children: abilities.map((a) => /* @__PURE__ */ jsxs8(
    Badge2,
    {
      variant: "outline",
      className: "flex flex-col items-start gap-0.5 py-1",
      children: [
        scopeLabel(a) && /* @__PURE__ */ jsx10("span", { className: "text-[11px] font-medium", children: scopeLabel(a) }),
        /* @__PURE__ */ jsx10("span", { className: "font-mono text-[9px] text-muted-foreground", children: a })
      ]
    },
    a
  )) });
}
var SCOPE_LABELS = {
  "activity.view": "View activity",
  "billing.manage": "Manage billing",
  "billing.view": "View billing",
  "conduit.delete": "Delete conduits",
  "conduit.update": "Update conduits",
  "content.author": "Author content",
  "context-scopes.embeddings": "Search context scope embeddings",
  "declarations.redetermine": "Redetermine declarations",
  "embeddings.embed": "Generate embeddings",
  "federation-grants.configure": "Configure federation grants",
  "federation-grants.pin": "Pin federation grants",
  "federation-grants.pull": "Pull federation grants",
  "federation-grants.revoke": "Revoke federation grants",
  "installed-extensions.refresh": "Refresh installed extensions",
  "installed-extensions.remove": "Remove installed extensions",
  "market-extensions.install": "Install marketplace extensions",
  "market-extensions.purchase": "Purchase marketplace extensions",
  "market-listing.create": "Create marketplace listings",
  "market-listing.update": "Update marketplace listings",
  "market-listing.view": "View marketplace listings",
  "media.analyze": "Analyze media",
  "media.ingest": "Ingest media",
  "permission-cascade.platform_admin_permission": "Manage platform permissions",
  "plans.checkout": "Checkout plans",
  "platform.manage": "Manage platform objects",
  "schemas.manage": "Manage schemas",
  "silos.publish-corpus": "Publish silo corpus",
  "silos.withdraw-corpus": "Withdraw silo corpus",
  "site.edit": "Edit site",
  "tenants.sync": "Sync workspaces",
  "usage.view": "View usage",
  "workflows.author": "Author workflows"
};
function scopeLabel(scope) {
  return SCOPE_LABELS[scope] ?? null;
}
function ScopePicker({
  permissions,
  selected,
  onChange
}) {
  const [query, setQuery] = useState8("");
  const groups = useMemo2(() => groupPermissions(permissions), [permissions]);
  const q = query.trim().toLowerCase();
  function toggle(name) {
    onChange(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    );
  }
  return /* @__PURE__ */ jsxs8("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx10("label", { className: "text-[13px] font-medium", children: "Scope (abilities)" }),
      selected.length === 0 ? /* @__PURE__ */ jsxs8("span", { className: "inline-flex items-center gap-1 font-mono text-[11px] text-warning-foreground", children: [
        /* @__PURE__ */ jsx10("span", { className: "size-1.5 rounded-full bg-warning" }),
        " Unscoped \xB7 Full access"
      ] }) : /* @__PURE__ */ jsxs8(
        "button",
        {
          type: "button",
          onClick: () => onChange([]),
          className: "font-mono text-[11px] text-muted-foreground hover:text-foreground",
          children: [
            selected.length,
            " selected \xB7 clear"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "relative", children: [
      /* @__PURE__ */ jsx10(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsx10(
        Input4,
        {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: "Filter permissions\u2026",
          className: "h-8 pl-8 text-[12.5px]"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "max-h-52 space-y-3 overflow-y-auto rounded-md border p-2.5", children: [
      groups.length === 0 && /* @__PURE__ */ jsx10("p", { className: "text-[12.5px] text-muted-foreground", children: "You hold no scopable permissions on this team." }),
      groups.map((group) => {
        const perms = group.permissions.filter(
          (p) => !q || p.toLowerCase().includes(q)
        );
        if (perms.length === 0) return null;
        const allOn = perms.every((p) => selected.includes(p));
        return /* @__PURE__ */ jsxs8("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx10("span", { className: "font-mono text-[10px] uppercase tracking-wide text-muted-foreground", children: group.label }),
            /* @__PURE__ */ jsx10(
              "button",
              {
                type: "button",
                onClick: () => onChange(
                  allOn ? selected.filter((p) => !perms.includes(p)) : [.../* @__PURE__ */ new Set([...selected, ...perms])]
                ),
                className: "text-[10.5px] text-primary hover:underline",
                children: allOn ? "clear group" : "select all"
              }
            )
          ] }),
          /* @__PURE__ */ jsx10("div", { className: "flex flex-wrap gap-1", children: perms.map((p) => {
            const on = selected.includes(p);
            return /* @__PURE__ */ jsxs8(
              "button",
              {
                type: "button",
                onClick: () => toggle(p),
                className: cn3(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors",
                  on ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                ),
                children: [
                  on && /* @__PURE__ */ jsx10(Check3, { className: "size-3 text-primary" }),
                  actionLabel(p)
                ]
              },
              p
            );
          }) })
        ] }, group.resource);
      })
    ] }),
    /* @__PURE__ */ jsx10("p", { className: "text-[11.5px] text-muted-foreground", children: "Leave everything unselected for a Full-access token. The picker only offers access you already have." })
  ] });
}
function CreateTokenDialog2({
  open,
  onOpenChange,
  onMinted
}) {
  const permissions = usePermissions();
  const createToken = useCreateToken();
  const [values, setValues] = useState8({
    expiresInDays: 0
  });
  const [abilities, setAbilities] = useState8([]);
  const name = String(values.name ?? "").trim();
  const expiresInDays = Number(values.expiresInDays ?? 0) || void 0;
  function reset() {
    setValues({ expiresInDays: 0 });
    setAbilities([]);
    createToken.reset();
  }
  async function mint() {
    if (!name) return;
    try {
      const created = await createToken.mutateAsync({
        name,
        abilities: abilities.length > 0 ? abilities : void 0,
        expiresInDays
      });
      reset();
      onOpenChange(false);
      onMinted(created);
    } catch {
    }
  }
  return /* @__PURE__ */ jsx10(
    Dialog2,
    {
      open,
      onOpenChange: (next) => {
        if (!next) reset();
        onOpenChange(next);
      },
      children: /* @__PURE__ */ jsxs8(DialogContent2, { className: "sm:max-w-lg", children: [
        /* @__PURE__ */ jsxs8(DialogHeader2, { children: [
          /* @__PURE__ */ jsxs8(DialogTitle2, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx10(KeyRound3, { className: "size-4 text-primary" }),
            " New API token"
          ] }),
          /* @__PURE__ */ jsx10(DialogDescription2, { children: "A token can't do more than you can: choose from your own permissions. Its secret is shown only once." })
        ] }),
        /* @__PURE__ */ jsx10(
          SchemaForm,
          {
            schema: tokenScopeSchema,
            formData: values,
            uiSchema: {
              "ui:options": { label: false },
              "ui:submitButtonOptions": { norender: true }
            },
            onChange: (e) => setValues(e.formData ?? {})
          }
        ),
        /* @__PURE__ */ jsx10(
          ScopePicker,
          {
            permissions: permissions.data ?? [],
            selected: abilities,
            onChange: setAbilities
          }
        ),
        /* @__PURE__ */ jsx10("div", { className: "flex gap-2.5 rounded-md border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-[12px] leading-relaxed text-muted-foreground", children: /* @__PURE__ */ jsx10("p", { children: "Choosing fewer permissions limits what the token can do if it is exposed. A token can only use access you currently have, and it stops using a permission when you lose that permission." }) }),
        /* @__PURE__ */ jsxs8(DialogFooter2, { children: [
          /* @__PURE__ */ jsx10(Button7, { variant: "ghost", onClick: () => onOpenChange(false), children: "Cancel" }),
          /* @__PURE__ */ jsxs8(Button7, { onClick: mint, disabled: !name || createToken.isPending, children: [
            /* @__PURE__ */ jsx10(Plus2, { className: "size-4" }),
            " ",
            createToken.isPending ? "Minting\u2026" : "Mint token"
          ] })
        ] })
      ] })
    }
  );
}
function RevealOnceDialog({
  created,
  title,
  onOpenChange
}) {
  const [copied, setCopied] = useState8(false);
  return /* @__PURE__ */ jsx10(Dialog2, { open: created !== null, onOpenChange, children: /* @__PURE__ */ jsxs8(DialogContent2, { className: "sm:max-w-lg", children: [
    /* @__PURE__ */ jsxs8(DialogHeader2, { children: [
      /* @__PURE__ */ jsxs8(DialogTitle2, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx10(KeyRound3, { className: "size-4 text-primary" }),
        " ",
        title
      ] }),
      /* @__PURE__ */ jsxs8(DialogDescription2, { children: [
        "Copy the key for \u201C",
        created?.name,
        "\u201D now \u2014 for your security, we won\u2019t show it again."
      ] })
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "min-w-0 space-y-3", children: [
      /* @__PURE__ */ jsxs8("div", { className: "flex min-w-0 items-center gap-2 rounded-md border bg-muted/50 p-2.5", children: [
        /* @__PURE__ */ jsx10(
          "code",
          {
            "data-slot": "revealed-token",
            className: "min-w-0 flex-1 break-all whitespace-normal font-mono text-[12.5px]",
            children: created?.token
          }
        ),
        /* @__PURE__ */ jsxs8(
          Button7,
          {
            size: "sm",
            variant: "outline",
            className: "flex-none",
            onClick: () => {
              if (created) void navigator.clipboard?.writeText(created.token);
              setCopied(true);
              setTimeout(() => setCopied(false), 2e3);
            },
            children: [
              /* @__PURE__ */ jsx10(Copy2, { className: "size-3.5" }),
              " ",
              copied ? "Copied" : "Copy"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-warning-foreground", children: [
        /* @__PURE__ */ jsx10("span", { className: "size-1.5 flex-none rounded-full bg-warning" }),
        "This is the only time you'll see this token. Copy it now and keep it somewhere safe, such as a password or secret manager."
      ] })
    ] }),
    /* @__PURE__ */ jsx10(DialogFooter2, { children: /* @__PURE__ */ jsx10(Button7, { onClick: () => onOpenChange(false), children: "Done" }) })
  ] }) });
}
function FacetBar({
  active,
  counts,
  onToggle
}) {
  return /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center gap-1.5", children: [
    /* @__PURE__ */ jsx10("span", { className: "mr-1 text-[12px] text-muted-foreground", children: "Type" }),
    FACETS2.map((f) => {
      const on = active.has(f);
      return /* @__PURE__ */ jsxs8(
        "button",
        {
          type: "button",
          "aria-pressed": on,
          onClick: () => onToggle(f),
          className: cn3(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
            on ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
          ),
          children: [
            PROVENANCE_LABEL2[f],
            /* @__PURE__ */ jsx10("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: counts[f] })
          ]
        },
        f
      );
    })
  ] });
}
function buildColumns(renderTokenActivity, busy, onRotate, onArchive, onDelete) {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const t = row.original;
        return (
          // Capped so a long name (a browser session's whole user-agent string) truncates: the table is
          // auto-layout, so an uncapped cell grew to the full string and pushed every other column away.
          /* @__PURE__ */ jsxs8("div", { className: "min-w-0 max-w-[24rem] space-y-0.5", children: [
            /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx10("span", { className: "truncate text-[13px] font-medium", title: t.name, children: t.name }),
              t.isCurrent && /* @__PURE__ */ jsx10(Badge2, { variant: "secondary", className: "shrink-0 text-[10px]", children: "This session" }),
              isExpiring(t) && /* @__PURE__ */ jsxs8("span", { className: "inline-flex shrink-0 items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning-foreground", children: [
                /* @__PURE__ */ jsx10(Clock3, { className: "size-3" }),
                " expiring"
              ] }),
              t.archivedAt && /* @__PURE__ */ jsx10(
                Badge2,
                {
                  variant: "outline",
                  className: "shrink-0 text-[10px] text-muted-foreground",
                  children: "archived"
                }
              )
            ] }),
            /* @__PURE__ */ jsx10("span", { className: "block text-[11px] text-muted-foreground", children: expiryLabel(t) })
          ] })
        );
      }
    },
    {
      id: "provenance",
      header: "Type",
      cell: ({ row }) => {
        const p = asProvenance2(row.original.provenance);
        return /* @__PURE__ */ jsx10(
          Badge2,
          {
            variant: PROVENANCE_BADGE2[p],
            className: "font-mono text-[10.5px]",
            children: PROVENANCE_LABEL2[p]
          }
        );
      }
    },
    {
      id: "scope",
      header: "Scope",
      cell: ({ row }) => /* @__PURE__ */ jsx10(ScopeChips2, { abilities: row.original.abilities })
    },
    {
      id: "lastUsedAt",
      header: "Last used",
      cell: ({ row }) => /* @__PURE__ */ jsx10("span", { className: "text-[12.5px] text-muted-foreground", children: fmtRelative(row.original.lastUsedAt) })
    },
    {
      id: "createdAt",
      header: "Created",
      cell: ({ row }) => /* @__PURE__ */ jsx10("span", { className: "text-[12.5px] text-muted-foreground", children: fmtDate(row.original.createdAt) })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsx10("span", { className: "sr-only", children: "Actions" }),
      cell: ({ row }) => {
        const t = row.original;
        if (t.isCurrent) {
          return /* @__PURE__ */ jsx10("span", { className: "font-mono text-sm text-muted-foreground", children: "\u2014" });
        }
        const archived = !!t.archivedAt;
        const canManage = !archived && asProvenance2(t.provenance) === "api";
        return /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-end gap-1.5", children: [
          renderTokenActivity?.(t),
          canManage && /* @__PURE__ */ jsxs8(
            Button7,
            {
              variant: "outline",
              size: "sm",
              disabled: busy,
              onClick: () => onRotate(t),
              children: [
                /* @__PURE__ */ jsx10(RotateCw2, { className: "size-3.5" }),
                " Rotate"
              ]
            }
          ),
          /* @__PURE__ */ jsx10(
            Button7,
            {
              variant: "ghost",
              size: "sm",
              disabled: busy,
              title: archived ? "Delete permanently" : "Archive",
              "aria-label": `${archived ? "Delete permanently" : "Archive"} ${t.name}`,
              onClick: () => archived ? onDelete(t) : onArchive(t),
              children: /* @__PURE__ */ jsx10(Trash23, { className: "size-3.5" })
            }
          )
        ] });
      }
    }
  ];
}
function TokensRoster() {
  const { renderTokenActivity } = useTokensServices();
  const notify = useNotify();
  const tokensQuery = useTokens();
  const archiveToken = useArchiveToken();
  const deleteToken = usePermanentlyDeleteToken();
  const rotateToken = useRotateToken();
  const revokeOthers = useRevokeOtherSessions();
  const [active, setActive] = useState8(
    () => /* @__PURE__ */ new Set(["api"])
  );
  const [showArchived, setShowArchived] = useState8(false);
  const [createOpen, setCreateOpen] = useState8(false);
  const [minted, setMinted] = useState8(null);
  const [rotated, setRotated] = useState8(null);
  const all = tokensQuery.data ?? [];
  const busy = archiveToken.isPending || deleteToken.isPending || rotateToken.isPending || revokeOthers.isPending;
  const counts = useMemo2(() => {
    const c = Object.fromEntries(FACETS2.map((f) => [f, 0]));
    for (const t of all) {
      if (!showArchived && t.archivedAt) continue;
      const p = asProvenance2(t.provenance);
      if (p in c) c[p] += 1;
    }
    return c;
  }, [all, showArchived]);
  const rows = useMemo2(
    () => all.filter((t) => {
      if (!showArchived && t.archivedAt) return false;
      if (active.size > 0 && !active.has(asProvenance2(t.provenance)))
        return false;
      return true;
    }),
    [all, active, showArchived]
  );
  const health = useMemo2(() => {
    const live = all.filter((t) => !t.archivedAt);
    return {
      active: live.length,
      expiring: live.filter(isExpiring).length,
      archived: all.filter((t) => t.archivedAt).length
    };
  }, [all]);
  const otherSessionCount = useMemo2(
    () => all.filter(
      (t) => t.provenance === "session" && !t.isCurrent && !t.archivedAt
    ).length,
    [all]
  );
  async function rotate(token) {
    try {
      const created = await rotateToken.mutateAsync({ id: token.id });
      setRotated(created);
    } catch {
    }
  }
  async function archive(token) {
    try {
      await archiveToken.mutateAsync(token.id);
      notify({ type: "success", message: `Archived \u201C${token.name}\u201D.` });
    } catch {
    }
  }
  async function remove(token) {
    try {
      await deleteToken.mutateAsync(token.id);
      notify({ type: "success", message: `Deleted \u201C${token.name}\u201D.` });
    } catch {
    }
  }
  async function sweepSessions() {
    try {
      const result = await revokeOthers.mutateAsync();
      notify({ type: "success", message: result.message });
    } catch {
    }
  }
  const columns = useMemo2(
    () => buildColumns(renderTokenActivity, busy, rotate, archive, remove),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTokenActivity, busy]
  );
  function toggleFacet(facet) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });
  }
  return /* @__PURE__ */ jsxs8("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-0.5", children: [
          /* @__PURE__ */ jsx10("h1", { className: "text-[15px] font-semibold tracking-tight", children: "Personal access tokens" }),
          /* @__PURE__ */ jsxs8("span", { className: "font-mono text-[11px] text-muted-foreground", children: [
            health.active,
            " active \xB7 ",
            health.expiring,
            " expiring \xB7",
            " ",
            health.archived,
            " archived"
          ] })
        ] }),
        /* @__PURE__ */ jsx10("p", { className: "text-[13px] text-muted-foreground", children: "Keys that let apps and scripts act on your behalf. A token can't do more than you can." })
      ] }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
        otherSessionCount > 0 && /* @__PURE__ */ jsxs8(
          Button7,
          {
            variant: "ghost",
            size: "sm",
            disabled: busy,
            title: "Signs out your other browser sessions only",
            onClick: sweepSessions,
            children: [
              "Revoke ",
              otherSessionCount,
              " other session",
              otherSessionCount === 1 ? "" : "s"
            ]
          }
        ),
        /* @__PURE__ */ jsxs8(Button7, { size: "sm", onClick: () => setCreateOpen(true), children: [
          /* @__PURE__ */ jsx10(Plus2, { className: "size-4" }),
          " New token"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx10(FacetBar, { active, counts, onToggle: toggleFacet }),
      /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-3", children: [
        active.size === 0 && /* @__PURE__ */ jsx10("span", { className: "text-[12px] text-muted-foreground", children: "Showing all types" }),
        /* @__PURE__ */ jsxs8("label", { className: "flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx10(
            "input",
            {
              type: "checkbox",
              className: "size-3.5 accent-primary",
              checked: showArchived,
              onChange: (e) => setShowArchived(e.target.checked)
            }
          ),
          "Show archived"
        ] })
      ] })
    ] }),
    tokensQuery.isError ? /* @__PURE__ */ jsx10("p", { role: "alert", className: "py-8 text-sm text-destructive", children: "Could not load your tokens. Try refreshing this page." }) : /* @__PURE__ */ jsx10(
      DataTable2,
      {
        stackOnMobile: true,
        columns,
        data: rows,
        loading: tokensQuery.isPending,
        rowClassName: (t) => t.archivedAt ? "opacity-60" : void 0,
        emptyMessage: all.length === 0 ? "No tokens yet." : "No tokens match the selected types."
      }
    ),
    /* @__PURE__ */ jsxs8("div", { className: "flex gap-2.5 rounded-md border border-warning/40 bg-warning/[0.06] p-3 text-[12.5px] leading-relaxed text-muted-foreground", children: [
      /* @__PURE__ */ jsx10("span", { className: "mt-0.5 text-xs font-medium text-warning-foreground", children: "Browser sessions" }),
      /* @__PURE__ */ jsxs8("p", { children: [
        /* @__PURE__ */ jsx10("b", { className: "text-foreground", children: "Revoke other sessions" }),
        " signs out your other browser sessions only. Your API, broker, dev and passkey tokens keep working, and so does this session."
      ] })
    ] }),
    /* @__PURE__ */ jsx10(
      CreateTokenDialog2,
      {
        open: createOpen,
        onOpenChange: setCreateOpen,
        onMinted: setMinted
      }
    ),
    /* @__PURE__ */ jsx10(
      RevealOnceDialog,
      {
        created: minted,
        title: `Token \u201C${minted?.name ?? ""}\u201D created`,
        onOpenChange: (open) => !open && setMinted(null)
      }
    ),
    /* @__PURE__ */ jsx10(
      RevealOnceDialog,
      {
        created: rotated,
        title: "Token rotated",
        onOpenChange: (open) => !open && setRotated(null)
      }
    )
  ] });
}

// src/team-page.tsx
import {
  Check as Check4,
  Info,
  Mail,
  Plus as Plus3,
  RotateCcw,
  ShieldAlert,
  UserMinus,
  UserPlus,
  X as X2
} from "lucide-react";
import { useMemo as useMemo3, useState as useState9 } from "react";
import {
  Button as Button8,
  buttonVariants,
  cn as cn4,
  DataTable as DataTable3,
  Dialog as Dialog3,
  DialogContent as DialogContent3,
  DialogDescription as DialogDescription3,
  DialogFooter as DialogFooter3,
  DialogHeader as DialogHeader3,
  DialogTitle as DialogTitle3,
  Input as Input5,
  Label as Label6,
  Popover as Popover2,
  PopoverContent as PopoverContent2,
  PopoverTrigger as PopoverTrigger2,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SimpleSelect as SimpleSelect2,
  useIsMobile
} from "@schemastud/ui";

// src/team-hooks.ts
import { useMutation as useMutation3, useQuery as useQuery3, useQueryClient as useQueryClient3 } from "@tanstack/react-query";

// src/team-provider.tsx
import { createContext as createContext3, useContext as useContext3 } from "react";
import { jsx as jsx11 } from "react/jsx-runtime";
var Context = createContext3(null);
function TeamProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx11(Context.Provider, { value: services, children });
}
function useTeamServices() {
  const services = useContext3(Context);
  if (!services)
    throw new Error("TeamPage must be rendered inside TeamProvider.");
  return services;
}

// src/team-hooks.ts
var membersKey = ["beam.accounts.members.index"];
var invitationsKey = ["beam.accounts.invitations.index"];
function useTeamMembers() {
  const { client } = useTeamServices();
  return useQuery3({ queryKey: membersKey, queryFn: () => client.members() });
}
function useTeamInvitations() {
  const { client } = useTeamServices();
  return useQuery3({
    queryKey: invitationsKey,
    queryFn: () => client.invitations()
  });
}
function useTeamRoles() {
  const { client } = useTeamServices();
  return useQuery3({
    queryKey: ["beam.accounts.members.roles"],
    queryFn: () => client.roles(),
    staleTime: Infinity
  });
}
function useTeamMutation(run, key) {
  const { client, onError } = useTeamServices();
  const cache = useQueryClient3();
  return useMutation3({
    mutationFn: (input) => run(client, input),
    onError,
    onSuccess: async () => {
      if (key) await cache.invalidateQueries({ queryKey: key });
    }
  });
}
function useUpdateMemberRole() {
  return useTeamMutation(
    (client, input) => client.updateRole(input),
    membersKey
  );
}
function useRemoveMember() {
  return useTeamMutation(
    (client, id) => client.removeMember(id),
    membersKey
  );
}
function useSendInvitation() {
  return useTeamMutation(
    (client, input) => client.sendInvitation(input),
    invitationsKey
  );
}
function useRevokeInvitation() {
  return useTeamMutation(
    (client, id) => client.revokeInvitation(id),
    invitationsKey
  );
}
function useResendInvitation() {
  return useTeamMutation((client, id) => client.resendInvitation(id));
}

// src/team-roster.ts
function mergeRoster(memberRows, inviteRows, selfId) {
  const memberR = memberRows.map((m) => ({
    id: m.id,
    kind: "member",
    status: "Active",
    name: m.name,
    email: m.email,
    role: m.role,
    since: m.joinedAt,
    isSelf: m.id === selfId
  }));
  const inviteR = inviteRows.filter((i) => !i.acceptedAt).map((i) => ({
    id: i.id,
    kind: "invitation",
    status: "Pending",
    name: null,
    email: i.email,
    role: i.role,
    since: i.createdAt,
    isSelf: false
  }));
  return [...memberR, ...inviteR];
}
function ownerCount(memberRows) {
  return memberRows.filter((m) => m.role === "owner").length;
}

// src/RoleBadge.tsx
import { Badge as Badge3 } from "@schemastud/ui";
import { humanizeKey } from "@schemastud/seam";
import { jsx as jsx12 } from "react/jsx-runtime";
function RoleBadge({
  role,
  label
}) {
  return /* @__PURE__ */ jsx12(Badge3, { variant: "secondary", title: role, children: label ?? humanizeKey(role) });
}

// src/team-page.tsx
import { Fragment as Fragment4, jsx as jsx13, jsxs as jsxs9 } from "react/jsx-runtime";
function formatDate2(value) {
  return value ? new Date(value).toLocaleDateString() : "\u2014";
}
function apiErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
var FACETS3 = ["All", "Members", "Pending"];
function TeamPage({
  currentUserId,
  createTeamHref
}) {
  return /* @__PURE__ */ jsx13(TeamInner, { currentUserId, createTeamHref });
}
function TeamInner({
  currentUserId,
  createTeamHref
}) {
  const isMobile = useIsMobile();
  const membersQuery = useTeamMembers();
  const invitationsQuery = useTeamInvitations();
  const roles = useTeamRoles();
  const memberRows = membersQuery.data ?? [];
  const inviteRows = invitationsQuery.data ?? [];
  const assignableRoles = roles.data?.assignable ?? [];
  const invitableRoles = roles.data?.invitable ?? [];
  const roleLabels = useMemo3(
    () => new Map(
      [...assignableRoles, ...invitableRoles].map((role) => [
        role.value,
        role.label
      ])
    ),
    [assignableRoles, invitableRoles]
  );
  const myRole = memberRows.find((m) => m.id === currentUserId)?.role;
  const isOwner = myRole === "owner";
  const canInvite = myRole === "owner" || myRole === "admin";
  const owners = ownerCount(memberRows);
  const lastOwner = owners <= 1;
  const roster = useMemo3(
    () => mergeRoster(memberRows, inviteRows, currentUserId),
    [memberRows, inviteRows, currentUserId]
  );
  const [facet, setFacet] = useState9("All");
  const [inviting, setInviting] = useState9(false);
  const [confirm, setConfirm] = useState9(null);
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();
  const counts = {
    All: roster.length,
    Members: roster.filter((r) => r.kind === "member").length,
    Pending: roster.filter((r) => r.kind === "invitation").length
  };
  const rows = roster.filter(
    (r) => facet === "All" ? true : facet === "Members" ? r.kind === "member" : r.kind === "invitation"
  );
  const changeRole = (row, next) => {
    if (next === String(row.role)) return;
    if (next === "owner") {
      setConfirm({ kind: "transfer", row });
      return;
    }
    updateRole.mutate({ userId: row.id, role: next });
  };
  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "transfer") {
      updateRole.mutate({ userId: confirm.row.id, role: "owner" });
    } else if (confirm.kind === "remove") {
      removeMember.mutate(confirm.row.id);
    } else {
      revokeInvitation.mutate(confirm.row.id);
    }
    setConfirm(null);
  };
  const columns = useMemo3(
    () => [
      {
        id: "identity",
        header: "Name / email",
        cell: ({ row }) => {
          const r = row.original;
          return /* @__PURE__ */ jsxs9("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs9("div", { className: "truncate font-medium", children: [
              r.name ?? r.email,
              r.isSelf && /* @__PURE__ */ jsx13("span", { className: "ml-1.5 text-xs text-muted-foreground", children: "(you)" })
            ] }),
            /* @__PURE__ */ jsx13("div", { className: "truncate text-xs text-muted-foreground", children: r.email })
          ] });
        }
      },
      {
        id: "role",
        meta: { label: "Team role" },
        header: () => /* @__PURE__ */ jsxs9("span", { className: "inline-flex items-center gap-1", children: [
          "Team role",
          /* @__PURE__ */ jsxs9(Popover2, { children: [
            /* @__PURE__ */ jsx13(PopoverTrigger2, { asChild: true, children: /* @__PURE__ */ jsx13(
              "button",
              {
                type: "button",
                "aria-label": "About team roles",
                className: "text-muted-foreground hover:text-foreground",
                children: /* @__PURE__ */ jsx13(Info, { className: "size-3.5" })
              }
            ) }),
            /* @__PURE__ */ jsx13(PopoverContent2, { className: "w-72 text-sm font-normal", children: /* @__PURE__ */ jsxs9("p", { className: "leading-relaxed text-muted-foreground", children: [
              /* @__PURE__ */ jsx13("b", { className: "text-foreground", children: "Membership tier" }),
              " (owner / admin / member) \u2014 governs who manages the team. Separate from what you can access inside the team."
            ] }) })
          ] })
        ] }),
        cell: ({ row }) => {
          const r = row.original;
          if (r.kind === "invitation" || !isOwner) {
            return /* @__PURE__ */ jsx13(
              RoleBadge,
              {
                role: String(r.role),
                label: roleLabels.get(String(r.role))
              }
            );
          }
          const disabledSelf = r.isSelf && lastOwner;
          return /* @__PURE__ */ jsxs9("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx13(
              SimpleSelect2,
              {
                className: "h-8 w-32",
                value: String(r.role),
                disabled: disabledSelf || updateRole.isPending,
                onValueChange: (next) => changeRole(r, next),
                options: assignableRoles
              }
            ),
            disabledSelf && /* @__PURE__ */ jsx13(
              "span",
              {
                title: "min-1-owner: you are the last owner and can't demote yourself",
                className: "text-muted-foreground",
                children: /* @__PURE__ */ jsx13(ShieldAlert, { className: "size-3.5" })
              }
            )
          ] });
        }
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => /* @__PURE__ */ jsx13(StatusPill, { status: row.original.status })
      },
      {
        id: "since",
        header: "Joined / invited",
        cell: ({ row }) => {
          const r = row.original;
          return /* @__PURE__ */ jsx13("span", { className: "text-muted-foreground", children: r.kind === "member" ? formatDate2(r.since) : `Invited ${formatDate2(r.since)}` });
        }
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          if (r.kind === "invitation") {
            if (!canInvite) return null;
            return /* @__PURE__ */ jsxs9("div", { className: "flex items-center justify-end gap-1", children: [
              /* @__PURE__ */ jsx13(ResendInvitationAction, { row: r }),
              /* @__PURE__ */ jsx13(
                Button8,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "size-7 text-destructive hover:text-destructive",
                  "aria-label": `Revoke invitation for ${r.email}`,
                  disabled: revokeInvitation.isPending,
                  onClick: () => setConfirm({ kind: "revoke", row: r }),
                  children: /* @__PURE__ */ jsx13(X2, {})
                }
              )
            ] });
          }
          if (!isOwner) return null;
          const lockRemove = r.role === "owner" && lastOwner;
          return /* @__PURE__ */ jsx13(
            Button8,
            {
              variant: "ghost",
              size: "icon",
              className: "size-7 text-destructive hover:text-destructive disabled:opacity-40",
              "aria-label": `Remove ${r.email}`,
              disabled: lockRemove || removeMember.isPending,
              title: lockRemove ? "min-1-owner: the last owner can\u2019t be removed" : void 0,
              onClick: () => setConfirm({ kind: "remove", row: r }),
              children: /* @__PURE__ */ jsx13(UserMinus, {})
            }
          );
        }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isOwner,
      canInvite,
      lastOwner,
      assignableRoles,
      roleLabels,
      updateRole.isPending,
      removeMember.isPending,
      revokeInvitation.isPending
    ]
  );
  const readError = membersQuery.error ?? invitationsQuery.error ?? roles.error;
  if (readError) {
    return /* @__PURE__ */ jsx13("p", { role: "alert", className: "py-8 text-sm text-destructive", children: apiErrorMessage(readError, "Could not load the team.") });
  }
  if (membersQuery.isPending || invitationsQuery.isPending || roles.isPending) {
    return /* @__PURE__ */ jsx13("p", { className: "py-8 text-sm text-muted-foreground", children: "Loading team\u2026" });
  }
  return /* @__PURE__ */ jsxs9("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs9("div", { children: [
        /* @__PURE__ */ jsx13("h2", { className: "font-semibold", children: "Team" }),
        /* @__PURE__ */ jsx13("p", { className: "text-sm text-muted-foreground", children: "People and pending invitations for this team." })
      ] }),
      /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-center gap-2", children: [
        createTeamHref ? /* @__PURE__ */ jsxs9(
          "a",
          {
            href: createTeamHref,
            className: buttonVariants({ variant: "outline" }),
            children: [
              /* @__PURE__ */ jsx13(Plus3, { className: "size-4" }),
              " New team"
            ]
          }
        ) : null,
        canInvite && /* @__PURE__ */ jsxs9(Button8, { onClick: () => setInviting(true), children: [
          /* @__PURE__ */ jsx13(UserPlus, { className: "size-4" }),
          " Invite member"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx13(FacetsBar, { active: facet, counts, onSelect: setFacet }),
      /* @__PURE__ */ jsxs9("span", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx13(ShieldAlert, { className: "size-3.5" }),
        owners,
        " owner",
        owners === 1 ? "" : "s",
        " \xB7 a team always keeps at least one owner"
      ] })
    ] }),
    isMobile && counts.Pending > 0 && facet !== "Pending" && /* @__PURE__ */ jsxs9(
      Button8,
      {
        variant: "outline",
        className: "h-auto w-full min-w-0 whitespace-normal break-words py-2",
        onClick: () => setFacet("Pending"),
        children: [
          "View pending invitations (",
          counts.Pending,
          ")"
        ]
      }
    ),
    /* @__PURE__ */ jsx13(
      DataTable3,
      {
        stackOnMobile: true,
        columns,
        data: rows,
        emptyMessage: "No one in this segment yet."
      }
    ),
    /* @__PURE__ */ jsx13(Sheet, { open: inviting, onOpenChange: setInviting, children: /* @__PURE__ */ jsxs9(SheetContent, { className: "flex flex-col gap-0 sm:max-w-md", children: [
      /* @__PURE__ */ jsxs9(SheetHeader, { children: [
        /* @__PURE__ */ jsxs9(SheetTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx13(Mail, { className: "size-4" }),
          " Invite member"
        ] }),
        /* @__PURE__ */ jsx13(SheetDescription, { children: "Invite someone by email \u2014 they join with the role you pick." })
      ] }),
      /* @__PURE__ */ jsx13("div", { className: "flex-1 overflow-y-auto p-4", children: /* @__PURE__ */ jsx13(
        InviteForm,
        {
          roles: invitableRoles,
          onSent: () => setInviting(false),
          onCancel: () => setInviting(false)
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx13(
      Dialog3,
      {
        open: confirm !== null,
        onOpenChange: (o) => !o && setConfirm(null),
        children: /* @__PURE__ */ jsx13(DialogContent3, { children: confirm && /* @__PURE__ */ jsxs9(Fragment4, { children: [
          /* @__PURE__ */ jsxs9(DialogHeader3, { children: [
            /* @__PURE__ */ jsx13(DialogTitle3, { className: "flex items-center gap-2", children: confirm.kind === "transfer" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
              /* @__PURE__ */ jsx13(ShieldAlert, { className: "size-4 text-warning" }),
              " Transfer ownership"
            ] }) : confirm.kind === "remove" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
              /* @__PURE__ */ jsx13(UserMinus, { className: "size-4 text-destructive" }),
              " Remove member"
            ] }) : /* @__PURE__ */ jsxs9(Fragment4, { children: [
              /* @__PURE__ */ jsx13(X2, { className: "size-4 text-destructive" }),
              " Revoke invitation"
            ] }) }),
            /* @__PURE__ */ jsx13(DialogDescription3, { children: confirm.kind === "transfer" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
              "Assign ",
              /* @__PURE__ */ jsx13("b", { children: "Owner" }),
              " to",
              " ",
              /* @__PURE__ */ jsx13("b", { children: confirm.row.name ?? confirm.row.email }),
              "? This is a high-stakes change \u2014 they gain full control of the team."
            ] }) : confirm.kind === "remove" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
              "Remove ",
              /* @__PURE__ */ jsx13("b", { children: confirm.row.name ?? confirm.row.email }),
              " from this team?"
            ] }) : /* @__PURE__ */ jsxs9(Fragment4, { children: [
              "Revoke the pending invitation for",
              " ",
              /* @__PURE__ */ jsx13("b", { children: confirm.row.email }),
              "?"
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs9(DialogFooter3, { children: [
            /* @__PURE__ */ jsx13(
              Button8,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => setConfirm(null),
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx13(
              Button8,
              {
                size: "sm",
                variant: confirm.kind === "transfer" ? "default" : "destructive",
                onClick: runConfirm,
                children: confirm.kind === "transfer" ? "Transfer ownership" : confirm.kind === "remove" ? "Remove member" : "Revoke invitation"
              }
            )
          ] })
        ] }) })
      }
    )
  ] });
}
function InviteForm({
  roles,
  onSent,
  onCancel
}) {
  const send = useSendInvitation();
  const [email, setEmail] = useState9("");
  const [role, setRole] = useState9(() => roles[0]?.value ?? "member");
  const valid = email.trim().length > 0 && role.length > 0;
  function submit(event) {
    event.preventDefault();
    if (!valid) return;
    send.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail("");
          onSent();
        }
      }
    );
  }
  return /* @__PURE__ */ jsxs9("form", { className: "space-y-4", onSubmit: submit, children: [
    /* @__PURE__ */ jsxs9("div", { className: "grid gap-1.5", children: [
      /* @__PURE__ */ jsx13(Label6, { htmlFor: "invite-email", children: "Email" }),
      /* @__PURE__ */ jsx13(
        Input5,
        {
          id: "invite-email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: "teammate@example.com",
          autoComplete: "off",
          autoFocus: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "grid gap-1.5", children: [
      /* @__PURE__ */ jsx13(Label6, { htmlFor: "invite-role", children: "Team role" }),
      /* @__PURE__ */ jsx13(
        SimpleSelect2,
        {
          id: "invite-role",
          className: "capitalize",
          value: role,
          onValueChange: setRole,
          options: roles,
          placeholder: "Select a role"
        }
      )
    ] }),
    send.isError && /* @__PURE__ */ jsx13("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(send.error, "Could not send the invitation.") }),
    /* @__PURE__ */ jsxs9("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsx13(Button8, { type: "button", variant: "ghost", onClick: onCancel, children: "Cancel" }),
      /* @__PURE__ */ jsx13(Button8, { type: "submit", disabled: !valid || send.isPending, children: send.isPending ? "Sending\u2026" : "Send invitation" })
    ] })
  ] });
}
function StatusPill({ status }) {
  const pending = status === "Pending";
  return /* @__PURE__ */ jsxs9(
    "span",
    {
      className: cn4(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]",
        pending ? "border-warning/40 bg-warning/10 text-warning-foreground" : "border-primary/25 bg-primary/5 text-foreground"
      ),
      children: [
        /* @__PURE__ */ jsx13(
          "span",
          {
            className: cn4(
              "size-1.5 rounded-full",
              pending ? "bg-warning" : "bg-primary"
            )
          }
        ),
        status
      ]
    }
  );
}
function FacetsBar({
  active,
  counts,
  onSelect
}) {
  return /* @__PURE__ */ jsx13("div", { className: "inline-flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-sm", children: FACETS3.map((f) => /* @__PURE__ */ jsxs9(
    "button",
    {
      type: "button",
      onClick: () => onSelect(f),
      className: cn4(
        "rounded px-3 py-1 font-medium transition-colors",
        f === active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      ),
      children: [
        f,
        /* @__PURE__ */ jsx13("span", { className: "ml-1.5 text-xs text-muted-foreground", children: counts[f] })
      ]
    },
    f
  )) });
}
function ResendInvitationAction({ row }) {
  const resend = useResendInvitation();
  return /* @__PURE__ */ jsx13(
    Button8,
    {
      variant: "ghost",
      size: "icon",
      className: "size-7",
      "aria-label": `Resend invitation for ${row.email}`,
      disabled: resend.isPending,
      title: resend.isSuccess ? "Sent" : "Resend invitation",
      onClick: () => resend.mutate(row.id),
      children: resend.isSuccess ? /* @__PURE__ */ jsx13(Check4, { className: "text-primary" }) : /* @__PURE__ */ jsx13(RotateCcw, {})
    }
  );
}

// src/create-team-form.tsx
import { useState as useState10 } from "react";
import { Button as Button9, Input as Input6, Label as Label7 } from "@schemastud/ui";
import { jsx as jsx14, jsxs as jsxs10 } from "react/jsx-runtime";
function CreateTeamForm({ onSubmit, processing = false, errors, cancelHref, defaultName = "" }) {
  const [name, setName] = useState10(defaultName);
  const valid = name.trim().length > 0;
  function submit(event) {
    event.preventDefault();
    if (!valid || processing) return;
    onSubmit({ name: name.trim() });
  }
  return /* @__PURE__ */ jsxs10("form", { className: "w-full max-w-lg space-y-6", onSubmit: submit, "aria-labelledby": "create-team-heading", children: [
    /* @__PURE__ */ jsxs10("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx14("h1", { id: "create-team-heading", className: "text-lg font-semibold", children: "Create a team" }),
      /* @__PURE__ */ jsx14("p", { className: "text-sm text-muted-foreground", children: "A team is where you and your teammates share work. You'll be its owner, and you can invite people once it exists." })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsx14(Label7, { htmlFor: "team-name", children: "Team name" }),
      /* @__PURE__ */ jsx14(
        Input6,
        {
          id: "team-name",
          name: "name",
          autoFocus: true,
          autoComplete: "organization",
          maxLength: 255,
          placeholder: "e.g. Acme Design",
          value: name,
          "aria-invalid": errors?.name ? true : void 0,
          "aria-describedby": errors?.name ? "team-name-error" : void 0,
          onChange: (event) => setName(event.target.value)
        }
      ),
      /* @__PURE__ */ jsx14("div", { id: "team-name-error", children: /* @__PURE__ */ jsx14(AuthError, { message: errors?.name }) })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx14(Button9, { type: "submit", disabled: !valid || processing, children: processing ? "Creating\u2026" : "Create team" }),
      cancelHref ? /* @__PURE__ */ jsx14("a", { href: cancelHref, className: "text-sm text-muted-foreground underline-offset-4 hover:underline", children: "Cancel" }) : null
    ] })
  ] });
}

// src/accept-invitation-panel.tsx
import { Button as Button10, buttonVariants as buttonVariants2, cn as cn5 } from "@schemastud/ui";
import { Fragment as Fragment5, jsx as jsx15, jsxs as jsxs11 } from "react/jsx-runtime";
function roleLabel(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
}
var primaryLink = cn5(buttonVariants2({ variant: "default" }), "w-full");
var secondaryLink = cn5(buttonVariants2({ variant: "outline" }), "w-full");
function AcceptInvitationPanel(props) {
  const { state, teamName, email, role, inviterName, viewerEmail, onAccept, processing = false, error } = props;
  const team = teamName ?? "the team";
  const invitedLine = /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
    inviterName ?? "A teammate",
    " invited ",
    /* @__PURE__ */ jsx15("b", { className: "font-medium text-foreground", children: email }),
    " to join",
    " ",
    /* @__PURE__ */ jsx15("b", { className: "font-medium text-foreground", children: team }),
    " as ",
    /* @__PURE__ */ jsx15("b", { className: "font-medium text-foreground", children: roleLabel(role) }),
    "."
  ] });
  return /* @__PURE__ */ jsxs11("section", { className: "w-full space-y-5", "aria-labelledby": "invitation-heading", "data-invitation-state": state, children: [
    state === "ready" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsxs11(Heading, { children: [
        "Join ",
        team
      ] }),
      invitedLine,
      /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
        "You're signed in as ",
        viewerEmail ?? email,
        "."
      ] }),
      /* @__PURE__ */ jsx15(AuthError, { message: error }),
      /* @__PURE__ */ jsx15(Button10, { className: "w-full", onClick: onAccept, disabled: processing || !onAccept, children: processing ? "Joining\u2026" : "Accept invitation" })
    ] }),
    state === "guest" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsxs11(Heading, { children: [
        "Join ",
        team
      ] }),
      invitedLine,
      /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
        "Create an account for ",
        email,
        ", or log in if you already have one. You'll come straight back here to accept."
      ] }),
      /* @__PURE__ */ jsxs11("div", { className: "flex flex-col gap-2", children: [
        props.registerHref ? /* @__PURE__ */ jsx15("a", { href: props.registerHref, className: primaryLink, children: "Create account" }) : null,
        props.loginHref ? /* @__PURE__ */ jsx15("a", { href: props.loginHref, className: secondaryLink, children: "Log in" }) : null
      ] })
    ] }),
    state === "wrong-account" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsx15(Heading, { children: "This invitation is for someone else" }),
      /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
        "It was sent to ",
        /* @__PURE__ */ jsx15("b", { className: "font-medium text-foreground", children: email }),
        ", but you're signed in as",
        " ",
        /* @__PURE__ */ jsx15("b", { className: "font-medium text-foreground", children: viewerEmail }),
        ". Log out, then open the link again and sign in or register as ",
        email,
        "."
      ] }),
      /* @__PURE__ */ jsx15(AuthError, { message: error }),
      props.onLogout ? /* @__PURE__ */ jsx15(Button10, { variant: "outline", className: "w-full", onClick: props.onLogout, children: "Log out" }) : null
    ] }),
    state === "expired" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsx15(Heading, { children: "This invitation has expired" }),
      /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
        inviterName ? `Ask ${inviterName}` : "Ask the team",
        " to send you a new invitation to ",
        team,
        "."
      ] }),
      /* @__PURE__ */ jsx15(Home, { href: props.homeHref })
    ] }),
    state === "used" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsx15(Heading, { children: "This invitation has already been used" }),
      /* @__PURE__ */ jsxs11("p", { className: "text-sm text-muted-foreground", children: [
        "Each invitation link works once. If you accepted it, ",
        team,
        " is already in your account."
      ] }),
      /* @__PURE__ */ jsx15(Home, { href: props.homeHref })
    ] }),
    state === "invalid" && /* @__PURE__ */ jsxs11(Fragment5, { children: [
      /* @__PURE__ */ jsx15(Heading, { children: "This invitation link isn't valid" }),
      /* @__PURE__ */ jsx15("p", { className: "text-sm text-muted-foreground", children: "It may have been revoked, or replaced by a newer invitation. Check your email for the latest link, or ask the team to invite you again." }),
      /* @__PURE__ */ jsx15(Home, { href: props.homeHref })
    ] })
  ] });
}
function Heading({ children }) {
  return /* @__PURE__ */ jsx15("h1", { id: "invitation-heading", className: "text-lg font-semibold", children });
}
function Home({ href }) {
  return href ? /* @__PURE__ */ jsx15("a", { href, className: secondaryLink, children: "Go to your dashboard" }) : null;
}
export {
  AcceptInvitationPanel,
  AuthError,
  AuthProvider,
  CreateTeamForm,
  ForgotPasswordForm,
  LoginPanel,
  PasskeyButton,
  PasskeysSection,
  PasswordInput,
  ResetPasswordForm,
  TeamPage,
  TeamProvider,
  TokensPage,
  TokensProvider,
  TokensRoster,
  isWebAuthnSupported,
  mergeRoster,
  ownerCount,
  runAssertionCeremony,
  runAttestationCeremony,
  useArchiveToken,
  useAuth,
  useAuthServices,
  useCreateToken,
  useDeletePasskey,
  useLogin,
  useNotify,
  usePasskey,
  usePasskeys,
  usePermanentlyDeleteToken,
  usePermissions,
  useRegisterPasskey,
  useRenamePasskey,
  useRenewToken,
  useRequestPasswordReset,
  useResetPassword,
  useRevokeOtherSessions,
  useRotateToken,
  useTokens,
  useTokensServices
};
//# sourceMappingURL=index.js.map