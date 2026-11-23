import {
  englishBeamAccountsMessages,
  useBeamAccountsMessages
} from "./chunk-OH2ZB2EC.js";

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
  cn as cn2,
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

// src/token-fragment.tsx
import { cn } from "@schemastud/ui";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function tokenFragment(token, messages = englishBeamAccountsMessages) {
  if (token.lastFour) {
    return {
      kind: "secret",
      text: `\u2026${token.lastFour}`,
      label: messages.t("splicewire-beam-accounts::messages.fragment_secret", { last: token.lastFour })
    };
  }
  const id = String(token.id);
  const tail = id.length > 4 ? id.slice(-4) : id;
  return {
    kind: "id",
    text: messages.t(id.length > 4 ? "splicewire-beam-accounts::messages.fragment_id_short" : "splicewire-beam-accounts::messages.fragment_id", { tail }),
    label: messages.t("splicewire-beam-accounts::messages.fragment_id_label", { tail })
  };
}
function TokenFragmentText({
  token,
  className
}) {
  const m = useBeamAccountsMessages();
  const fragment = tokenFragment(token, m);
  return /* @__PURE__ */ jsxs(
    "span",
    {
      "data-token-fragment": fragment.kind,
      title: fragment.label,
      className: cn(
        "shrink-0 font-mono text-[11px] text-muted-foreground",
        className
      ),
      children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: fragment.text }),
        /* @__PURE__ */ jsx2("span", { className: "sr-only", children: fragment.label })
      ]
    }
  );
}

// src/message-descriptor.ts
var notice = (key, parameters) => ({ key, parameters });
var say = (m, value) => typeof value === "string" ? value : Array.isArray(value) ? value.map((part) => say(m, part)).join("") : m.t(value.key, value.parameters);
var NoticeError = class extends Error {
  constructor(notice2) {
    super(say(englishBeamAccountsMessages, notice2));
    this.notice = notice2;
  }
  notice;
};

// src/utils.ts
var FACETS = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey"
];
var PROVENANCE_LABEL = {
  api: "splicewire-beam-accounts::messages.tokens_type_api",
  session: "splicewire-beam-accounts::messages.tokens_type_session",
  dev: "splicewire-beam-accounts::messages.tokens_type_dev",
  broker: "splicewire-beam-accounts::messages.tokens_type_broker",
  passkey: "splicewire-beam-accounts::messages.tokens_type_passkey",
  // Two machine principals the generated projection grew after this map was written
  // (`federation` in _resources 753d57c, `service` in the 79411d4 regen). They are absent
  // from FACETS above — a deliberate 5-of-7 filter subset — but required here, because
  // both maps are exhaustive over TokenProvenance.
  federation: "splicewire-beam-accounts::messages.tokens_type_federation",
  service: "splicewire-beam-accounts::messages.tokens_type_service"
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
  { value: "0", labelKey: "splicewire-beam-accounts::messages.tokens_never_expires" },
  { value: "7", labelKey: "splicewire-beam-accounts::messages.tokens_expiry_7_days" },
  { value: "30", labelKey: "splicewire-beam-accounts::messages.tokens_expiry_30_days" },
  { value: "60", labelKey: "splicewire-beam-accounts::messages.tokens_expiry_60_days" },
  { value: "90", labelKey: "splicewire-beam-accounts::messages.tokens_expiry_90_days" }
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
function errorMessage(error, fallback, messages = englishBeamAccountsMessages) {
  if (error instanceof NoticeError) return say(messages, error.notice);
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

// src/tokens-page.tsx
import { Fragment, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var SORTABLE_FIELDS = /* @__PURE__ */ new Set(["name", "created", "last_used", "expires"]);
var PAGE_SIZE = 10;
function TokensPage() {
  const m = useBeamAccountsMessages();
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
        header: m.t("splicewire-beam-accounts::messages.tokens_col_name"),
        meta: { sortField: "name", sortAccessor: (t) => t.name.toLowerCase() },
        cell: ({ row }) => (
          // The cap bounds a session's whole user-agent string, and it holds the badges too:
          // at 12rem a short name beside "This session" truncated with the column half empty.
          /* @__PURE__ */ jsxs2("div", { className: "flex min-w-0 max-w-[24rem] items-center gap-2", children: [
            /* @__PURE__ */ jsx3(
              "span",
              {
                className: "min-w-0 truncate font-medium",
                title: row.original.name,
                children: row.original.name
              }
            ),
            /* @__PURE__ */ jsx3(TokenFragmentText, { token: row.original }),
            row.original.isCurrent && /* @__PURE__ */ jsx3(Badge, { variant: "outline", className: "shrink-0 text-[10px]", children: m.t("splicewire-beam-accounts::messages.tokens_this_session") }),
            row.original.archivedAt && /* @__PURE__ */ jsx3(Badge, { variant: "outline", className: "shrink-0 text-[10px]", children: m.t("splicewire-beam-accounts::messages.tokens_page_archived_badge") })
          ] })
        )
      },
      {
        header: m.t("splicewire-beam-accounts::messages.tokens_col_type"),
        cell: ({ row }) => {
          const provenance = asProvenance(row.original.provenance);
          return /* @__PURE__ */ jsx3(Badge, { variant: PROVENANCE_BADGE[provenance], children: m.t(PROVENANCE_LABEL[provenance]) });
        }
      },
      {
        header: m.t("splicewire-beam-accounts::messages.tokens_col_scope"),
        cell: ({ row }) => /* @__PURE__ */ jsx3(ScopeChips, { abilities: row.original.abilities })
      },
      {
        header: m.t("splicewire-beam-accounts::messages.tokens_col_created"),
        meta: { sortField: "created", sortAccessor: (t) => t.createdAt },
        cell: ({ row }) => /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: row.original.createdAt ? formatDate(row.original.createdAt) : "\u2014" })
      },
      {
        header: m.t("splicewire-beam-accounts::messages.tokens_col_last_used"),
        meta: { sortField: "last_used", sortAccessor: (t) => t.lastUsedAt },
        cell: ({ row }) => /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: row.original.lastUsedAt ? formatDate(row.original.lastUsedAt) : m.t("splicewire-beam-accounts::messages.tokens_page_never") })
      },
      {
        header: m.t("splicewire-beam-accounts::messages.tokens_col_expires"),
        meta: { sortField: "expires", sortAccessor: (t) => t.expiresAt },
        cell: ({ row }) => {
          const token = row.original;
          if (!token.expiresAt) {
            return /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_page_never") });
          }
          const expired = isExpired(token);
          return /* @__PURE__ */ jsxs2(
            "span",
            {
              className: cn2(
                "text-muted-foreground",
                expired && "text-destructive"
              ),
              children: [
                formatDate(token.expiresAt),
                expired ? m.t("splicewire-beam-accounts::messages.tokens_page_expired_marker") : ""
              ]
            }
          );
        }
      },
      {
        id: "actions",
        header: () => /* @__PURE__ */ jsx3("span", { className: "sr-only", children: m.t("splicewire-beam-accounts::messages.tokens_col_actions") }),
        cell: ({ row }) => /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-end gap-0.5", children: [
          renderTokenActivity?.(row.original),
          /* @__PURE__ */ jsx3(
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
    // m: a live locale switch re-renders every header, badge and action label.
    [busy, renderTokenActivity, m]
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
        notify({ type: "success", message: m.t("splicewire-beam-accounts::messages.tokens_archived_toast", { name }) });
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
      notify({ type: "success", message: m.t("splicewire-beam-accounts::messages.tokens_deleted_toast", { name }) });
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
        notify({ type: "success", message: m.t("splicewire-beam-accounts::messages.tokens_page_renewed_toast", { name: token.name }) });
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
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx3("h2", { className: "font-semibold", children: m.t("splicewire-beam-accounts::messages.tokens_page_heading") }),
        /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_page_description") })
      ] }),
      /* @__PURE__ */ jsx3(CreateTokenDialog, {})
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-2", children: [
      FACETS.map((facet) => {
        const on = active.has(facet);
        return /* @__PURE__ */ jsx3(
          Button,
          {
            type: "button",
            size: "sm",
            variant: on ? "secondary" : "outline",
            "aria-pressed": on,
            className: cn2("h-7 rounded-full px-3", on && "ring-1 ring-ring"),
            onClick: () => toggleFacet(facet),
            children: m.t(PROVENANCE_LABEL[facet])
          },
          facet
        );
      }),
      active.size === 0 && /* @__PURE__ */ jsx3("span", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_showing_all_types") }),
      archivedCount > 0 && /* @__PURE__ */ jsxs2(
        Button,
        {
          type: "button",
          size: "sm",
          variant: showArchived ? "secondary" : "outline",
          "aria-pressed": showArchived,
          className: cn2(
            "h-7 rounded-full px-3",
            showArchived && "ring-1 ring-ring"
          ),
          onClick: () => setShowArchived((v) => !v),
          children: [
            /* @__PURE__ */ jsx3(Archive, { className: "size-3.5" }),
            " ",
            m.t("splicewire-beam-accounts::messages.tokens_page_archived_count", { count: archivedCount })
          ]
        }
      ),
      /* @__PURE__ */ jsx3("div", { className: "ml-auto", children: otherSessionCount > 0 && /* @__PURE__ */ jsx3(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          disabled: busy,
          onClick: () => setTarget("other-sessions"),
          children: m.choice("splicewire-beam-accounts::messages.tokens_revoke_other_count", otherSessionCount)
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx3(
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
        emptyMessage: all.length === 0 ? m.t("splicewire-beam-accounts::messages.tokens_empty") : m.t("splicewire-beam-accounts::messages.tokens_empty_filtered")
      }
    ),
    /* @__PURE__ */ jsx3(
      ArchiveConfirmDialog,
      {
        target,
        pending: busy,
        onCancel: () => setTarget(null),
        onConfirm: confirmArchive
      }
    ),
    /* @__PURE__ */ jsx3(
      DeleteConfirmDialog,
      {
        target: deleteTarget,
        pending: busy,
        onCancel: () => setDeleteTarget(null),
        onConfirm: confirmDelete
      }
    ),
    /* @__PURE__ */ jsx3(
      LifecycleDialog,
      {
        lifecycle,
        pending: renewToken.isPending || rotateToken.isPending,
        onCancel: () => setLifecycle(null),
        onConfirm: confirmLifecycle
      }
    ),
    /* @__PURE__ */ jsx3(
      SecretRevealDialog,
      {
        created: rotated,
        title: m.t("splicewire-beam-accounts::messages.tokens_rotated_title"),
        onOpenChange: (open) => !open && setRotated(null)
      }
    )
  ] });
}
function ScopeChips({ abilities }) {
  const m = useBeamAccountsMessages();
  if (!abilities || abilities.length === 0) {
    return /* @__PURE__ */ jsx3(Badge, { variant: "secondary", className: "text-[10px]", children: m.t("splicewire-beam-accounts::messages.tokens_full_access") });
  }
  return /* @__PURE__ */ jsx3("div", { className: "flex max-w-xs flex-wrap gap-1", children: abilities.map((ability) => /* @__PURE__ */ jsx3(
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
  const m = useBeamAccountsMessages();
  const [open, setOpen] = useState(false);
  if (token.isCurrent) {
    return /* @__PURE__ */ jsx3("span", { className: "text-xs text-muted-foreground", children: "\u2014" });
  }
  const archived = !!token.archivedAt;
  const canManage = !archived && asProvenance(token.provenance) === "api";
  function run(action) {
    setOpen(false);
    action();
  }
  return /* @__PURE__ */ jsxs2(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx3(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx3(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: "size-7",
        "aria-label": m.t("splicewire-beam-accounts::messages.tokens_page_manage", { name: token.name }),
        disabled,
        children: /* @__PURE__ */ jsx3(MoreHorizontal, {})
      }
    ) }),
    /* @__PURE__ */ jsxs2(PopoverContent, { align: "end", className: "w-48 p-1", children: [
      canManage && /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx3(ActionItem, { icon: /* @__PURE__ */ jsx3(CalendarClock, {}), onClick: () => run(onRenew), children: m.t("splicewire-beam-accounts::messages.tokens_page_renew_menu") }),
        /* @__PURE__ */ jsx3(ActionItem, { icon: /* @__PURE__ */ jsx3(RotateCw, {}), onClick: () => run(onRotate), children: m.t("splicewire-beam-accounts::messages.tokens_page_rotate_menu") })
      ] }),
      archived ? /* @__PURE__ */ jsx3(
        ActionItem,
        {
          icon: /* @__PURE__ */ jsx3(Trash2, {}),
          destructive: true,
          onClick: () => run(onDelete),
          children: m.t("splicewire-beam-accounts::messages.tokens_delete_permanently")
        }
      ) : /* @__PURE__ */ jsx3(
        ActionItem,
        {
          icon: /* @__PURE__ */ jsx3(Archive, {}),
          destructive: true,
          onClick: () => run(onArchive),
          children: m.t("splicewire-beam-accounts::messages.tokens_archive")
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
  return /* @__PURE__ */ jsxs2(
    "button",
    {
      type: "button",
      onClick,
      className: cn2(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
        destructive && "text-destructive hover:text-destructive"
      ),
      children: [
        /* @__PURE__ */ jsx3("span", { className: "[&>svg]:size-4", children: icon }),
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
  const m = useBeamAccountsMessages();
  const [expiresIn, setExpiresIn] = useState("30");
  const isRotate = lifecycle?.action === "rotate";
  return /* @__PURE__ */ jsx3(
    Dialog,
    {
      open: lifecycle !== null,
      onOpenChange: (open) => {
        if (!open) onCancel();
        else setExpiresIn("30");
      },
      children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
        /* @__PURE__ */ jsxs2(DialogHeader, { children: [
          /* @__PURE__ */ jsx3(DialogTitle, { children: m.t(isRotate ? "splicewire-beam-accounts::messages.tokens_page_rotate_named" : "splicewire-beam-accounts::messages.tokens_page_renew_named", { name: lifecycle?.token.name ?? "" }) }),
          /* @__PURE__ */ jsx3(DialogDescription, { children: isRotate ? m.t("splicewire-beam-accounts::messages.tokens_page_rotate_explainer") : m.t("splicewire-beam-accounts::messages.tokens_page_renew_explainer") })
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
          /* @__PURE__ */ jsx3(Label, { htmlFor: "lifecycle-expiry", children: m.t("splicewire-beam-accounts::messages.tokens_field_expires") }),
          /* @__PURE__ */ jsx3(
            SimpleSelect,
            {
              id: "lifecycle-expiry",
              "aria-label": m.t("splicewire-beam-accounts::messages.tokens_page_new_lifetime"),
              value: expiresIn,
              onValueChange: setExpiresIn,
              options: EXPIRY_OPTIONS.map((o) => ({ value: o.value, label: m.t(o.labelKey) })),
              className: "w-full"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2(DialogFooter, { children: [
          /* @__PURE__ */ jsx3(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: m.t("splicewire-beam-accounts::messages.tokens_cancel") }),
          /* @__PURE__ */ jsx3(
            Button,
            {
              variant: isRotate ? "destructive" : "default",
              onClick: () => onConfirm(Number(expiresIn) || void 0),
              disabled: pending,
              children: pending ? m.t("splicewire-beam-accounts::messages.tokens_page_working") : isRotate ? m.t("splicewire-beam-accounts::messages.tokens_rotate") : m.t("splicewire-beam-accounts::messages.tokens_page_renew")
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
  const m = useBeamAccountsMessages();
  const isSweep = target === "other-sessions";
  return /* @__PURE__ */ jsx3(Dialog, { open: target !== null, onOpenChange: (open) => !open && onCancel(), children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
    /* @__PURE__ */ jsxs2(DialogHeader, { children: [
      /* @__PURE__ */ jsx3(DialogTitle, { children: isSweep ? m.t("splicewire-beam-accounts::messages.tokens_page_revoke_all_question") : m.t("splicewire-beam-accounts::messages.tokens_page_archive_question", { name: target?.name ?? "" }) }),
      /* @__PURE__ */ jsx3(DialogDescription, { children: isSweep ? m.t("splicewire-beam-accounts::messages.tokens_page_revoke_all_explainer") : m.t("splicewire-beam-accounts::messages.tokens_page_archive_explainer") })
    ] }),
    /* @__PURE__ */ jsxs2(DialogFooter, { children: [
      /* @__PURE__ */ jsx3(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: m.t("splicewire-beam-accounts::messages.tokens_cancel") }),
      /* @__PURE__ */ jsx3(Button, { variant: "destructive", onClick: onConfirm, disabled: pending, children: pending ? m.t("splicewire-beam-accounts::messages.tokens_page_working") : isSweep ? m.t("splicewire-beam-accounts::messages.tokens_page_revoke") : m.t("splicewire-beam-accounts::messages.tokens_archive") })
    ] })
  ] }) });
}
function DeleteConfirmDialog({
  target,
  pending,
  onCancel,
  onConfirm
}) {
  const m = useBeamAccountsMessages();
  return /* @__PURE__ */ jsx3(Dialog, { open: target !== null, onOpenChange: (open) => !open && onCancel(), children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
    /* @__PURE__ */ jsxs2(DialogHeader, { children: [
      /* @__PURE__ */ jsx3(DialogTitle, { children: m.t("splicewire-beam-accounts::messages.tokens_page_delete_question", { name: target?.name ?? "" }) }),
      /* @__PURE__ */ jsx3(DialogDescription, { children: m.t("splicewire-beam-accounts::messages.tokens_page_delete_explainer") })
    ] }),
    /* @__PURE__ */ jsxs2(DialogFooter, { children: [
      /* @__PURE__ */ jsx3(Button, { variant: "outline", onClick: onCancel, disabled: pending, children: m.t("splicewire-beam-accounts::messages.tokens_cancel") }),
      /* @__PURE__ */ jsx3(Button, { variant: "destructive", onClick: onConfirm, disabled: pending, children: pending ? m.t("splicewire-beam-accounts::messages.tokens_page_working") : m.t("splicewire-beam-accounts::messages.tokens_delete_permanently") })
    ] })
  ] }) });
}
function SecretRevealDialog({
  created,
  title,
  onOpenChange
}) {
  const m = useBeamAccountsMessages();
  const [copied, setCopied] = useState(false);
  async function copySecret() {
    if (!created) return;
    await navigator.clipboard.writeText(created.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }
  return /* @__PURE__ */ jsx3(Dialog, { open: created !== null, onOpenChange, children: /* @__PURE__ */ jsxs2(DialogContent, { children: [
    /* @__PURE__ */ jsxs2(DialogHeader, { children: [
      /* @__PURE__ */ jsx3(DialogTitle, { children: title }),
      /* @__PURE__ */ jsx3(DialogDescription, { children: m.t("splicewire-beam-accounts::messages.tokens_page_copy_secret", { name: created?.name ?? "" }) })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-2 rounded-md border border-amber-500/30 dark:border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-3 text-sm text-amber-600 dark:text-amber-400", children: [
      /* @__PURE__ */ jsx3(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }),
      /* @__PURE__ */ jsx3("span", { children: m.t("splicewire-beam-accounts::messages.tokens_page_secret_once") })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx3(
        Input,
        {
          readOnly: true,
          value: created?.token ?? "",
          className: "font-mono text-xs",
          onFocus: (event) => event.currentTarget.select()
        }
      ),
      /* @__PURE__ */ jsx3(
        Button,
        {
          variant: "outline",
          size: "icon",
          "aria-label": m.t("splicewire-beam-accounts::messages.tokens_page_copy_token"),
          onClick: copySecret,
          children: copied ? /* @__PURE__ */ jsx3(Check, {}) : /* @__PURE__ */ jsx3(Copy, {})
        }
      )
    ] }),
    /* @__PURE__ */ jsx3(DialogFooter, { children: /* @__PURE__ */ jsx3(Button, { onClick: () => onOpenChange(false), children: m.t("splicewire-beam-accounts::messages.tokens_done") }) })
  ] }) });
}
function CreateTokenDialog() {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsxs2(Button, { onClick: openDialog, children: [
      /* @__PURE__ */ jsx3(Plus, {}),
      " ",
      m.t("splicewire-beam-accounts::messages.tokens_new_token")
    ] }),
    /* @__PURE__ */ jsx3(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsx3(DialogContent, { children: /* @__PURE__ */ jsxs2("form", { onSubmit: submit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs2(DialogHeader, { children: [
        /* @__PURE__ */ jsx3(DialogTitle, { children: m.t("splicewire-beam-accounts::messages.tokens_new_api_token") }),
        /* @__PURE__ */ jsx3(DialogDescription, { children: m.t("splicewire-beam-accounts::messages.tokens_page_create_description") })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx3(Label, { htmlFor: "token-name", children: m.t("splicewire-beam-accounts::messages.tokens_page_field_name") }),
        /* @__PURE__ */ jsx3(
          Input,
          {
            id: "token-name",
            value: name,
            onChange: (event) => setName(event.target.value),
            placeholder: m.t("splicewire-beam-accounts::messages.tokens_page_name_placeholder"),
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx3(Label, { children: m.t("splicewire-beam-accounts::messages.tokens_page_access") }),
        /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-2 gap-2", children: [
          ["full", "splicewire-beam-accounts::messages.tokens_page_access_full", "splicewire-beam-accounts::messages.tokens_page_acts_as_you"],
          ["scoped", "splicewire-beam-accounts::messages.tokens_page_limited", "splicewire-beam-accounts::messages.tokens_page_pick_permissions"]
        ].map(([value, title, hint]) => {
          const on = mode === value;
          return /* @__PURE__ */ jsxs2(
            "button",
            {
              type: "button",
              "aria-pressed": on,
              onClick: () => setMode(value),
              className: cn2(
                "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                on ? "border-ring bg-accent ring-1 ring-ring" : "border-input hover:bg-accent/50"
              ),
              children: [
                /* @__PURE__ */ jsx3("div", { className: "font-medium", children: m.t(title) }),
                /* @__PURE__ */ jsx3("div", { className: "text-xs text-muted-foreground", children: m.t(hint) })
              ]
            },
            value
          );
        }) })
      ] }),
      mode === "scoped" && /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsxs2(Label, { children: [
          m.t("splicewire-beam-accounts::messages.tokens_page_permissions"),
          " ",
          /* @__PURE__ */ jsx3("span", { className: "text-xs font-normal text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_page_selected_count", { count: selected.size }) })
        ] }),
        permissions.isLoading ? /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_page_loading_permissions") }) : myPermissions.length === 0 ? /* @__PURE__ */ jsx3("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_no_scopable") }) : /* @__PURE__ */ jsx3("div", { className: "flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2", children: myPermissions.map((permission) => {
          const on = selected.has(permission);
          return /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              "aria-pressed": on,
              onClick: () => togglePermission(permission),
              className: cn2(
                "rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors",
                on ? "border-ring bg-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-accent"
              ),
              children: permission
            },
            permission
          );
        }) }),
        /* @__PURE__ */ jsx3("p", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_page_fewer_permissions") })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
        /* @__PURE__ */ jsx3(Label, { htmlFor: "token-expiry", children: m.t("splicewire-beam-accounts::messages.tokens_field_expires") }),
        /* @__PURE__ */ jsx3(
          SimpleSelect,
          {
            id: "token-expiry",
            "aria-label": m.t("splicewire-beam-accounts::messages.tokens_page_token_lifetime"),
            value: expiresIn,
            onValueChange: setExpiresIn,
            options: EXPIRY_OPTIONS.map((o) => ({ value: o.value, label: m.t(o.labelKey) })),
            className: "w-full"
          }
        )
      ] }),
      createToken.isError && /* @__PURE__ */ jsx3("p", { className: "text-sm text-destructive", children: errorMessage(createToken.error, m.t("splicewire-beam-accounts::messages.tokens_page_create_failed"), m) }),
      /* @__PURE__ */ jsx3(DialogFooter, { children: /* @__PURE__ */ jsx3(
        Button,
        {
          type: "submit",
          disabled: !name.trim() || !scopeReady || createToken.isPending,
          children: createToken.isPending ? m.t("splicewire-beam-accounts::messages.tokens_page_creating") : m.t("splicewire-beam-accounts::messages.tokens_page_create")
        }
      ) })
    ] }) }) }),
    /* @__PURE__ */ jsx3(
      SecretRevealDialog,
      {
        created,
        title: m.t("splicewire-beam-accounts::messages.tokens_page_created_title"),
        onOpenChange: (open2) => !open2 && setCreated(null)
      }
    )
  ] });
}

// src/tokens-client.ts
function createTokensClient(request, endpoints) {
  const record = (id, action) => `${endpoints.index}/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;
  async function data(method, url, body) {
    const res = await request(method, url, void 0, body);
    return res.data?.data;
  }
  return {
    list: async () => await data("GET", endpoints.index) ?? [],
    create: ({ name, abilities, expiresInDays }) => {
      const body = { name };
      if (abilities && abilities.length > 0) body.abilities = abilities;
      if (expiresInDays) body.expiresInDays = expiresInDays;
      return data("POST", endpoints.index, body);
    },
    renew: ({ id, expiresInDays }) => data(
      "POST",
      record(id, "renew"),
      expiresInDays ? { expiresInDays } : {}
    ),
    rotate: ({ id, expiresInDays }) => data(
      "POST",
      record(id, "rotate"),
      expiresInDays ? { expiresInDays } : {}
    ),
    // Archive is the soft revoke (the row is kept for audit); remove is the hard delete of an archived token.
    archive: async (id) => {
      await request("DELETE", record(id));
    },
    remove: async (id) => {
      await request("DELETE", record(id, "permanent"));
    },
    revokeOtherSessions: async () => {
      const res = await request(
        "DELETE",
        endpoints.sessionsOthers
      );
      return { message: res.data.message, revoked: res.data.data.revoked };
    },
    listPermissions: async () => (await data(
      "GET",
      endpoints.permissions
    ))?.permissions ?? []
  };
}

// src/auth-provider.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var AuthServicesContext = createContext2(null);
function AuthProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx4(AuthServicesContext.Provider, { value: services, children });
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
  if (!credential) throw new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_verification_cancelled"));
  return assertionToJson(credential);
}
async function runAttestationCeremony(options) {
  const credential = await navigator.credentials.create({
    publicKey: toCreationOptions(options)
  });
  if (!credential) throw new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_registration_cancelled"));
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
      if (!client.passkey) throw new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_signin_unavailable"));
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
      if (!client.passkey) throw new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_registration_unavailable"));
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
      if (!client.passkey?.rename) throw new NoticeError(notice("splicewire-beam-accounts::messages.auth_passkey_rename_unavailable"));
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
import { cn as cn3, Input as Input2 } from "@schemastud/ui";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function PasswordInput({ className, ...props }) {
  const m = useBeamAccountsMessages();
  const [visible, setVisible] = useState2(false);
  return /* @__PURE__ */ jsxs3("div", { className: "relative", children: [
    /* @__PURE__ */ jsx5(
      Input2,
      {
        ...props,
        type: visible ? "text" : "password",
        className: cn3("pr-10", className)
      }
    ),
    /* @__PURE__ */ jsx5(
      "button",
      {
        type: "button",
        onClick: () => setVisible((v) => !v),
        className: "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground",
        "aria-label": visible ? m.t("splicewire-beam-accounts::messages.auth_hide_password") : m.t("splicewire-beam-accounts::messages.auth_show_password"),
        "aria-pressed": visible,
        tabIndex: 0,
        children: visible ? /* @__PURE__ */ jsx5(EyeOff, { className: "size-4", "aria-hidden": true }) : /* @__PURE__ */ jsx5(Eye, { className: "size-4", "aria-hidden": true })
      }
    )
  ] });
}
function AuthError({ message }) {
  if (!message) return null;
  return /* @__PURE__ */ jsx5("p", { role: "alert", className: "text-sm text-destructive", children: message });
}

// src/login-panel.tsx
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
function LoginPanel({
  brand,
  onSuccess,
  title,
  titleAs: TitleTag = "h1",
  description,
  showPasskeySlot = false,
  passkeySlot,
  showRemember = false,
  showForgotLink = false,
  onForgot,
  footer
}) {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs4("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs4(Card, { className: "w-full", children: [
      /* @__PURE__ */ jsxs4(CardHeader, { children: [
        /* @__PURE__ */ jsx6(TitleTag, { className: "font-semibold leading-none tracking-tight", children: title ?? m.t("splicewire-beam-accounts::messages.login_title") }),
        description && /* @__PURE__ */ jsx6(CardDescription, { children: description })
      ] }),
      /* @__PURE__ */ jsxs4(CardContent, { className: "space-y-4", children: [
        showPasskeySlot && passkeySlot && /* @__PURE__ */ jsxs4(Fragment2, { children: [
          /* @__PURE__ */ jsx6("div", { children: passkeySlot }),
          /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-3", "aria-hidden": true, children: [
            /* @__PURE__ */ jsx6("span", { className: "h-px flex-1 bg-border" }),
            /* @__PURE__ */ jsx6("span", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.login_or_email") }),
            /* @__PURE__ */ jsx6("span", { className: "h-px flex-1 bg-border" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs4("form", { className: "space-y-4", onSubmit: submit, children: [
          /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx6(Label2, { htmlFor: "login-email", children: m.t("splicewire-beam-accounts::messages.auth_email") }),
            /* @__PURE__ */ jsx6(
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
          /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs4("div", { className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1", children: [
              /* @__PURE__ */ jsx6(Label2, { htmlFor: "login-password", children: m.t("splicewire-beam-accounts::messages.login_password") }),
              showForgotLink && /* @__PURE__ */ jsx6(
                "button",
                {
                  type: "button",
                  onClick: onForgot,
                  className: "whitespace-nowrap text-sm font-medium text-primary underline-offset-4 hover:underline",
                  children: m.t("splicewire-beam-accounts::messages.auth_forgot_password")
                }
              )
            ] }),
            /* @__PURE__ */ jsx6(
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
          showRemember && /* @__PURE__ */ jsxs4("label", { htmlFor: "login-remember", className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx6(
              "input",
              {
                id: "login-remember",
                type: "checkbox",
                checked: remember,
                onChange: (e) => setRemember(e.target.checked),
                className: "size-4 rounded border-input"
              }
            ),
            m.t("splicewire-beam-accounts::messages.login_remember_me")
          ] }),
          /* @__PURE__ */ jsx6(AuthError, { message: login.isError ? errorMessage(login.error, m.t("splicewire-beam-accounts::messages.login_invalid"), m) : null }),
          /* @__PURE__ */ jsx6(Button2, { type: "submit", className: "w-full", disabled: login.isPending, children: login.isPending ? m.t("splicewire-beam-accounts::messages.login_signing_in") : m.t("splicewire-beam-accounts::messages.login_sign_in") })
        ] }),
        footer
      ] })
    ] })
  ] });
}

// src/demo-login.tsx
import { useCallback, useId, useMemo as useMemo2, useRef } from "react";
import { ChevronsUpDown, UserRound, UserSearch } from "lucide-react";
import { Combobox } from "@schemastud/combobox";
import { Button as Button3, Input as Input3, Popover as Popover2, PopoverContent as PopoverContent2, PopoverTrigger as PopoverTrigger2 } from "@schemastud/ui";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function BlockPopover(props) {
  return /* @__PURE__ */ jsx7("div", { className: "w-full [&>div]:block [&>div]:w-full", children: /* @__PURE__ */ jsx7(Popover2, { ...props }) });
}
function WidePopoverContent(props) {
  return /* @__PURE__ */ jsx7(PopoverContent2, { ...props, className: "w-full min-w-0 p-0" });
}
var DEFAULT_PRIMITIVES = {
  Popover: BlockPopover,
  PopoverTrigger: PopoverTrigger2,
  PopoverContent: WidePopoverContent,
  Input: Input3
};
function fetchDemoUsers(searchUrl) {
  return async (query) => {
    const url = new URL(searchUrl, window.location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    const response = await fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" });
    if (!response.ok) return [];
    const body = await response.json();
    return body.data?.users ?? [];
  };
}
var followLink = (choice) => window.location.assign(choice.url);
function DemoLogin({
  accounts = [],
  searchUrl,
  search,
  onSelect = followLink,
  primitives = DEFAULT_PRIMITIVES,
  className
}) {
  const m = useBeamAccountsMessages();
  const headingId = useId();
  const transport = useMemo2(() => search ?? (searchUrl ? fetchDemoUsers(searchUrl) : null), [search, searchUrl]);
  const seen = useRef(/* @__PURE__ */ new Map());
  const searchOptions = useCallback(
    async (query) => {
      if (!transport) return [];
      const users = await transport(query);
      users.forEach((user) => seen.current.set(user.id, user));
      return users.map((user) => ({ value: user.id, label: user.name, hint: user.email }));
    },
    [transport]
  );
  const chooseUser = useCallback(
    (option) => {
      const user = seen.current.get(option.value);
      if (user) onSelect({ kind: "user", ...user });
    },
    [onSelect]
  );
  if (accounts.length === 0 && !transport) return null;
  return /* @__PURE__ */ jsxs5("section", { "aria-labelledby": headingId, className: ["space-y-3", className].filter(Boolean).join(" "), "data-testid": "demo-login", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx7("span", { className: "h-px flex-1 bg-border", "aria-hidden": true }),
      /* @__PURE__ */ jsx7("h2", { id: headingId, className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.demo_heading") }),
      /* @__PURE__ */ jsx7("span", { className: "h-px flex-1 bg-border", "aria-hidden": true })
    ] }),
    accounts.length > 0 && /* @__PURE__ */ jsx7("ul", { className: "grid gap-2 sm:grid-cols-2", "aria-label": m.t("splicewire-beam-accounts::messages.demo_accounts"), children: accounts.map((account) => /* @__PURE__ */ jsx7("li", { children: /* @__PURE__ */ jsxs5(
      Button3,
      {
        type: "button",
        variant: "outline",
        className: "w-full justify-start",
        "aria-label": m.t("splicewire-beam-accounts::messages.demo_sign_in_as", { name: account.label }),
        onClick: () => onSelect({ kind: "account", ...account }),
        children: [
          /* @__PURE__ */ jsx7(UserRound, { className: "size-4 shrink-0", "aria-hidden": true }),
          /* @__PURE__ */ jsx7("span", { className: "truncate", children: account.label })
        ]
      }
    ) }, account.key)) }),
    transport && /* @__PURE__ */ jsx7(
      Combobox,
      {
        primitives,
        search: searchOptions,
        onSelect: chooseUser,
        placeholder: m.t("splicewire-beam-accounts::messages.demo_search"),
        emptyText: m.t("splicewire-beam-accounts::messages.demo_no_match"),
        loadingText: m.t("splicewire-beam-accounts::messages.demo_searching"),
        trigger: /* @__PURE__ */ jsxs5(Button3, { type: "button", variant: "outline", className: "w-full justify-between font-normal", children: [
          /* @__PURE__ */ jsxs5("span", { className: "flex min-w-0 items-center gap-2", children: [
            /* @__PURE__ */ jsx7(UserSearch, { className: "size-4 shrink-0", "aria-hidden": true }),
            /* @__PURE__ */ jsx7("span", { className: "truncate", children: m.t("splicewire-beam-accounts::messages.demo_any_user") })
          ] }),
          /* @__PURE__ */ jsx7(ChevronsUpDown, { className: "size-4 shrink-0 text-muted-foreground", "aria-hidden": true })
        ] })
      }
    ),
    /* @__PURE__ */ jsx7("p", { className: "text-center text-xs text-muted-foreground", children: transport ? m.t("splicewire-beam-accounts::messages.demo_local_only") : m.t("splicewire-beam-accounts::messages.demo_never_production") })
  ] });
}

// src/forgot-password-form.tsx
import { useState as useState4 } from "react";
import { Button as Button4, Label as Label3 } from "@schemastud/ui";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function ForgotPasswordForm({ brand, onBack }) {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs6("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs6("div", { className: "w-full space-y-4", children: [
      /* @__PURE__ */ jsxs6("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx8("h1", { className: "text-lg font-semibold", children: m.t("splicewire-beam-accounts::messages.auth_forgot_password") }),
        /* @__PURE__ */ jsx8("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.forgot_description") })
      ] }),
      sent ? /* @__PURE__ */ jsx8("p", { role: "status", className: "text-sm", children: m.t("splicewire-beam-accounts::messages.forgot_sent") }) : /* @__PURE__ */ jsxs6("form", { className: "space-y-4", onSubmit: submit, children: [
        /* @__PURE__ */ jsxs6("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx8(Label3, { htmlFor: "forgot-email", children: m.t("splicewire-beam-accounts::messages.auth_email") }),
          /* @__PURE__ */ jsx8(
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
        /* @__PURE__ */ jsx8(
          AuthError,
          {
            message: request.isError ? errorMessage(request.error, m.t("splicewire-beam-accounts::messages.forgot_failed"), m) : null
          }
        ),
        /* @__PURE__ */ jsx8(Button4, { type: "submit", className: "w-full", disabled: request.isPending, children: request.isPending ? m.t("splicewire-beam-accounts::messages.forgot_sending") : m.t("splicewire-beam-accounts::messages.forgot_submit") })
      ] }),
      onBack && /* @__PURE__ */ jsx8(
        "button",
        {
          type: "button",
          onClick: onBack,
          className: "text-sm font-medium text-primary underline-offset-4 hover:underline",
          children: m.t("splicewire-beam-accounts::messages.forgot_back")
        }
      )
    ] })
  ] });
}

// src/reset-password-form.tsx
import { useState as useState5 } from "react";
import { Button as Button5, Label as Label4 } from "@schemastud/ui";
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
function ResetPasswordForm({ token, email, brand, onSuccess }) {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs7("div", { className: "flex w-full flex-col items-center gap-6", children: [
    brand,
    /* @__PURE__ */ jsxs7("div", { className: "w-full space-y-4", children: [
      /* @__PURE__ */ jsxs7("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx9("h1", { className: "text-lg font-semibold", children: m.t("splicewire-beam-accounts::messages.reset_heading") }),
        /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.reset_for", { email }) })
      ] }),
      /* @__PURE__ */ jsxs7("form", { className: "space-y-4", onSubmit: submit, children: [
        /* @__PURE__ */ jsxs7("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx9(Label4, { htmlFor: "reset-password", children: m.t("splicewire-beam-accounts::messages.reset_new_password") }),
          /* @__PURE__ */ jsx9(
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
        /* @__PURE__ */ jsxs7("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx9(Label4, { htmlFor: "reset-password-confirm", children: m.t("splicewire-beam-accounts::messages.reset_confirm_password") }),
          /* @__PURE__ */ jsx9(
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
        /* @__PURE__ */ jsx9(
          AuthError,
          {
            message: mismatch ? m.t("splicewire-beam-accounts::messages.reset_mismatch") : reset.isError ? errorMessage(reset.error, m.t("splicewire-beam-accounts::messages.reset_invalid_link"), m) : null
          }
        ),
        /* @__PURE__ */ jsx9(Button5, { type: "submit", className: "w-full", disabled: reset.isPending, children: reset.isPending ? m.t("splicewire-beam-accounts::messages.reset_resetting") : m.t("splicewire-beam-accounts::messages.reset_submit") })
      ] })
    ] })
  ] });
}

// src/passkey-button.tsx
import { KeyRound } from "lucide-react";
import { useState as useState6 } from "react";
import { Button as Button6 } from "@schemastud/ui";
import { jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
function PasskeyButton({ onSuccess, label }) {
  const m = useBeamAccountsMessages();
  const [supported] = useState6(() => isWebAuthnSupported());
  const passkey = usePasskey();
  if (!supported) return null;
  return /* @__PURE__ */ jsxs8("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs8(
      Button6,
      {
        type: "button",
        variant: "outline",
        className: "w-full",
        disabled: passkey.isPending,
        onClick: () => passkey.mutate(void 0, { onSuccess: (result) => onSuccess(result) }),
        children: [
          /* @__PURE__ */ jsx10(KeyRound, { className: "size-4", "aria-hidden": true }),
          passkey.isPending ? m.t("splicewire-beam-accounts::messages.passkey_waiting") : label ?? m.t("splicewire-beam-accounts::messages.passkey_sign_in")
        ]
      }
    ),
    /* @__PURE__ */ jsx10(
      AuthError,
      {
        message: passkey.isError ? errorMessage(passkey.error, m.t("splicewire-beam-accounts::messages.auth_passkey_verification_cancelled"), m) : null
      }
    )
  ] });
}

// src/passkeys-section.tsx
import { Check as Check2, KeyRound as KeyRound2, Pencil, Trash2 as Trash22, X } from "lucide-react";
import { useState as useState7 } from "react";
import { Button as Button7, Input as Input4, Label as Label5 } from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx11, jsxs as jsxs9 } from "react/jsx-runtime";
function PasskeysSection({
  showHeader = true
} = {}) {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs9("div", { className: "space-y-6", children: [
    showHeader && /* @__PURE__ */ jsxs9("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx11("h2", { className: "text-base font-semibold", children: m.t("splicewire-beam-accounts::messages.passkeys_heading") }),
      /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.passkeys_description") })
    ] }),
    supported ? /* @__PURE__ */ jsxs9("form", { className: "flex items-end gap-2", onSubmit: submit, children: [
      /* @__PURE__ */ jsxs9("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx11(Label5, { htmlFor: "passkey-name", children: m.t("splicewire-beam-accounts::messages.passkeys_add") }),
        /* @__PURE__ */ jsx11(
          Input4,
          {
            id: "passkey-name",
            placeholder: m.t("splicewire-beam-accounts::messages.passkeys_placeholder"),
            value: name,
            onChange: (e) => setName(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxs9(Button7, { type: "submit", disabled: register.isPending || !name.trim(), children: [
        /* @__PURE__ */ jsx11(KeyRound2, { className: "size-4", "aria-hidden": true }),
        register.isPending ? m.t("splicewire-beam-accounts::messages.passkeys_waiting") : m.t("splicewire-beam-accounts::messages.passkeys_register")
      ] })
    ] }) : /* @__PURE__ */ jsx11("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.passkeys_unsupported") }),
    /* @__PURE__ */ jsx11(
      AuthError,
      {
        message: register.isError ? errorMessage(register.error, m.t("splicewire-beam-accounts::messages.passkeys_register_failed"), m) : null
      }
    ),
    /* @__PURE__ */ jsx11(
      AuthError,
      {
        message: rename.isError ? errorMessage(rename.error, m.t("splicewire-beam-accounts::messages.passkeys_rename_failed"), m) : null
      }
    ),
    /* @__PURE__ */ jsxs9("ul", { className: "divide-y rounded-md border", children: [
      passkeys.isPending && /* @__PURE__ */ jsx11("li", { className: "p-3 text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.passkeys_loading") }),
      passkeys.data?.length === 0 && !passkeys.isPending && /* @__PURE__ */ jsx11("li", { className: "p-3 text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.passkeys_empty") }),
      passkeys.data?.map((passkey) => {
        const editing = editingId === passkey.id;
        return /* @__PURE__ */ jsx11(
          "li",
          {
            className: "flex items-center justify-between gap-3 p-3",
            children: editing ? /* @__PURE__ */ jsxs9(
              "form",
              {
                className: "flex flex-1 items-center gap-2",
                onSubmit: (e) => {
                  e.preventDefault();
                  saveEditing(passkey.id);
                },
                children: [
                  /* @__PURE__ */ jsx11(
                    Input4,
                    {
                      "aria-label": m.t("splicewire-beam-accounts::messages.passkeys_rename_named", { name: passkey.name }),
                      autoFocus: true,
                      value: draftName,
                      onChange: (e) => setDraftName(e.target.value),
                      onKeyDown: (e) => {
                        if (e.key === "Escape") cancelEditing();
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx11(
                    Button7,
                    {
                      type: "submit",
                      variant: "ghost",
                      size: "icon",
                      "aria-label": m.t("splicewire-beam-accounts::messages.passkeys_save_name"),
                      disabled: rename.isPending || !draftName.trim(),
                      children: /* @__PURE__ */ jsx11(Check2, { className: "size-4", "aria-hidden": true })
                    }
                  ),
                  /* @__PURE__ */ jsx11(
                    Button7,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "icon",
                      "aria-label": m.t("splicewire-beam-accounts::messages.passkeys_cancel_rename"),
                      disabled: rename.isPending,
                      onClick: cancelEditing,
                      children: /* @__PURE__ */ jsx11(X, { className: "size-4", "aria-hidden": true })
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxs9(Fragment3, { children: [
              /* @__PURE__ */ jsxs9("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx11("div", { className: "truncate text-sm font-medium", children: passkey.name }),
                /* @__PURE__ */ jsx11("div", { className: "text-xs text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.passkeys_dates", { added: formatDate(passkey.createdAt), used: formatDate(passkey.lastUsedAt) }) })
              ] }),
              /* @__PURE__ */ jsxs9("div", { className: "flex items-center gap-1", children: [
                canRename && /* @__PURE__ */ jsx11(
                  Button7,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    "aria-label": m.t("splicewire-beam-accounts::messages.passkeys_rename_named", { name: passkey.name }),
                    disabled: remove.isPending,
                    onClick: () => startEditing(passkey.id, passkey.name),
                    children: /* @__PURE__ */ jsx11(Pencil, { className: "size-4", "aria-hidden": true })
                  }
                ),
                /* @__PURE__ */ jsx11(
                  Button7,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "icon",
                    "aria-label": m.t("splicewire-beam-accounts::messages.passkeys_delete_named", { name: passkey.name }),
                    disabled: remove.isPending,
                    onClick: () => remove.mutate(passkey.id),
                    children: /* @__PURE__ */ jsx11(Trash22, { className: "size-4", "aria-hidden": true })
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
import { useMemo as useMemo3, useState as useState8 } from "react";
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
  Button as Button8,
  cn as cn4,
  DataTable as DataTable2,
  Dialog as Dialog2,
  DialogContent as DialogContent2,
  DialogDescription as DialogDescription2,
  DialogFooter as DialogFooter2,
  DialogHeader as DialogHeader2,
  DialogTitle as DialogTitle2,
  Input as Input5
} from "@schemastud/ui";

// src/rich-message.tsx
import { Fragment as Fragment4 } from "react";
import { jsx as jsx12 } from "react/jsx-runtime";
function richMessage(messages, key, parts) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  const occurrences = /* @__PURE__ */ new Map();
  return messages.t(key, parameters).split(/(￼\d+￼)/u).map((part, index) => {
    const match = /^￼(\d+)￼$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx12(Fragment4, { children: match ? values[Number(match[1])] : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

// src/tokens-roster.tsx
import { jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
var FACETS2 = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey"
];
var PROVENANCE_LABEL2 = {
  api: "splicewire-beam-accounts::messages.tokens_type_api",
  session: "splicewire-beam-accounts::messages.tokens_type_session",
  dev: "splicewire-beam-accounts::messages.tokens_type_dev",
  broker: "splicewire-beam-accounts::messages.tokens_type_broker",
  passkey: "splicewire-beam-accounts::messages.tokens_type_passkey",
  federation: "splicewire-beam-accounts::messages.tokens_type_federation",
  // The sync service identity's token — a machine principal, not a human one, which is
  // why it is absent from FACETS above (a deliberate 5-of-7 filter set) but required
  // here: both maps are exhaustive over TokenProvenance.
  service: "splicewire-beam-accounts::messages.tokens_type_service"
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
  { value: 0, labelKey: "splicewire-beam-accounts::messages.tokens_never_expires" },
  { value: 7, labelKey: "splicewire-beam-accounts::messages.tokens_expiry_7_days" },
  { value: 30, labelKey: "splicewire-beam-accounts::messages.tokens_expiry_30_days" },
  { value: 60, labelKey: "splicewire-beam-accounts::messages.tokens_expiry_60_days" },
  { value: 90, labelKey: "splicewire-beam-accounts::messages.tokens_expiry_90_days" }
];
function tokenScopeSchemaFor(messages = englishBeamAccountsMessages) {
  return {
    type: "object",
    properties: {
      name: {
        type: "string",
        title: messages.t("splicewire-beam-accounts::messages.tokens_field_name"),
        description: messages.t("splicewire-beam-accounts::messages.tokens_field_name_hint"),
        minLength: 1
      },
      expiresInDays: {
        type: "integer",
        title: messages.t("splicewire-beam-accounts::messages.tokens_field_expires"),
        description: messages.t("splicewire-beam-accounts::messages.tokens_field_expires_hint"),
        // Labels travel IN the schema as oneOf const/title pairs: the renderer (RJSF 6) never reads a
        // schema-level `enumNames`, so an enum showed the raw "0" for "Never" (TOWER-05 shots-r5).
        oneOf: EXPIRY_OPTIONS2.map((o) => ({ const: o.value, title: messages.t(o.labelKey) })),
        default: 0
      }
    },
    required: ["name"]
  };
}
var tokenScopeSchema = tokenScopeSchemaFor();
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
function expiryLabel(token, now = Date.now(), messages = englishBeamAccountsMessages) {
  if (!token.expiresAt) return messages.t("splicewire-beam-accounts::messages.tokens_never_expires");
  const at = new Date(token.expiresAt);
  return messages.t(at.getTime() < now ? "splicewire-beam-accounts::messages.tokens_expired_on" : "splicewire-beam-accounts::messages.tokens_expires_on", { date: at.toLocaleDateString() });
}
function fmtRelative(value, messages) {
  if (!value) return messages.t("splicewire-beam-accounts::messages.tokens_never");
  const mins = (Date.now() - new Date(value).getTime()) / 6e4;
  if (mins < 60) return messages.t("splicewire-beam-accounts::messages.tokens_minutes_ago", { count: Math.max(1, Math.round(mins)) });
  if (mins < 1440) return messages.t("splicewire-beam-accounts::messages.tokens_hours_ago", { count: Math.round(mins / 60) });
  return messages.t("splicewire-beam-accounts::messages.tokens_days_ago", { count: Math.round(mins / 1440) });
}
function groupPermissions(names, messages) {
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
    label: resource === "general" ? messages.t("splicewire-beam-accounts::messages.tokens_group_general") : resource[0].toUpperCase() + resource.slice(1),
    permissions: permissions.sort()
  }));
}
function actionLabel(name) {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(dot + 1);
}
function ScopeChips2({ abilities }) {
  const m = useBeamAccountsMessages();
  if (!abilities || abilities.length === 0) {
    return /* @__PURE__ */ jsxs10("span", { className: "inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning-foreground", children: [
      /* @__PURE__ */ jsx13("span", { className: "size-1.5 rounded-full bg-warning" }),
      m.t("splicewire-beam-accounts::messages.tokens_full_access")
    ] });
  }
  return /* @__PURE__ */ jsx13("div", { className: "flex max-w-xs flex-wrap gap-1", children: abilities.map((a) => /* @__PURE__ */ jsxs10(
    Badge2,
    {
      variant: "outline",
      className: "flex flex-col items-start gap-0.5 py-1",
      children: [
        scopeLabel(a) && /* @__PURE__ */ jsx13("span", { className: "text-[11px] font-medium", children: m.t(scopeLabel(a)) }),
        /* @__PURE__ */ jsx13("span", { className: "font-mono text-[9px] text-muted-foreground", children: a })
      ]
    },
    a
  )) });
}
var SCOPE_LABELS = {
  "activity.view": "splicewire-beam-accounts::messages.tokens_scope_view_activity",
  "billing.manage": "splicewire-beam-accounts::messages.tokens_scope_manage_billing",
  "billing.view": "splicewire-beam-accounts::messages.tokens_scope_view_billing",
  "conduit.delete": "splicewire-beam-accounts::messages.tokens_scope_delete_conduits",
  "conduit.update": "splicewire-beam-accounts::messages.tokens_scope_update_conduits",
  "content.author": "splicewire-beam-accounts::messages.tokens_scope_author_content",
  "context-scopes.embeddings": "splicewire-beam-accounts::messages.tokens_scope_search_context_scope_embeddings",
  "declarations.redetermine": "splicewire-beam-accounts::messages.tokens_scope_redetermine_declarations",
  "embeddings.embed": "splicewire-beam-accounts::messages.tokens_scope_generate_embeddings",
  "federation-grants.configure": "splicewire-beam-accounts::messages.tokens_scope_configure_federation_grants",
  "federation-grants.pin": "splicewire-beam-accounts::messages.tokens_scope_pin_federation_grants",
  "federation-grants.pull": "splicewire-beam-accounts::messages.tokens_scope_pull_federation_grants",
  "federation-grants.revoke": "splicewire-beam-accounts::messages.tokens_scope_revoke_federation_grants",
  "installed-extensions.refresh": "splicewire-beam-accounts::messages.tokens_scope_refresh_installed_extensions",
  "installed-extensions.remove": "splicewire-beam-accounts::messages.tokens_scope_remove_installed_extensions",
  "market-extensions.install": "splicewire-beam-accounts::messages.tokens_scope_install_marketplace_extensions",
  "market-extensions.purchase": "splicewire-beam-accounts::messages.tokens_scope_purchase_marketplace_extensions",
  "market-listing.create": "splicewire-beam-accounts::messages.tokens_scope_create_marketplace_listings",
  "market-listing.update": "splicewire-beam-accounts::messages.tokens_scope_update_marketplace_listings",
  "market-listing.view": "splicewire-beam-accounts::messages.tokens_scope_view_marketplace_listings",
  "media.analyze": "splicewire-beam-accounts::messages.tokens_scope_analyze_media",
  "media.ingest": "splicewire-beam-accounts::messages.tokens_scope_ingest_media",
  "permission-cascade.platform_admin_permission": "splicewire-beam-accounts::messages.tokens_scope_manage_platform_permissions",
  "plans.checkout": "splicewire-beam-accounts::messages.tokens_scope_checkout_plans",
  "platform.manage": "splicewire-beam-accounts::messages.tokens_scope_manage_platform_objects",
  "schemas.manage": "splicewire-beam-accounts::messages.tokens_scope_manage_schemas",
  "silos.publish-corpus": "splicewire-beam-accounts::messages.tokens_scope_publish_silo_corpus",
  "silos.withdraw-corpus": "splicewire-beam-accounts::messages.tokens_scope_withdraw_silo_corpus",
  "site.edit": "splicewire-beam-accounts::messages.tokens_scope_edit_site",
  "tenants.sync": "splicewire-beam-accounts::messages.tokens_scope_sync_workspaces",
  "usage.view": "splicewire-beam-accounts::messages.tokens_scope_view_usage",
  "workflows.author": "splicewire-beam-accounts::messages.tokens_scope_author_workflows"
};
function scopeLabel(scope) {
  return SCOPE_LABELS[scope] ?? null;
}
function ScopePicker({
  permissions,
  selected,
  onChange
}) {
  const m = useBeamAccountsMessages();
  const [query, setQuery] = useState8("");
  const groups = useMemo3(() => groupPermissions(permissions, m), [permissions, m]);
  const q = query.trim().toLowerCase();
  function toggle(name) {
    onChange(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    );
  }
  return /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs10("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx13("label", { className: "text-[13px] font-medium", children: m.t("splicewire-beam-accounts::messages.tokens_scope_abilities") }),
      selected.length === 0 ? /* @__PURE__ */ jsxs10("span", { className: "inline-flex items-center gap-1 font-mono text-[11px] text-warning-foreground", children: [
        /* @__PURE__ */ jsx13("span", { className: "size-1.5 rounded-full bg-warning" }),
        " ",
        m.t("splicewire-beam-accounts::messages.tokens_unscoped_full_access")
      ] }) : /* @__PURE__ */ jsx13(
        "button",
        {
          type: "button",
          onClick: () => onChange([]),
          className: "font-mono text-[11px] text-muted-foreground hover:text-foreground",
          children: m.t("splicewire-beam-accounts::messages.tokens_selected_clear", { count: selected.length })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "relative", children: [
      /* @__PURE__ */ jsx13(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsx13(
        Input5,
        {
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: m.t("splicewire-beam-accounts::messages.tokens_filter_permissions"),
          className: "h-8 pl-8 text-[12.5px]"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "max-h-52 space-y-3 overflow-y-auto rounded-md border p-2.5", children: [
      groups.length === 0 && /* @__PURE__ */ jsx13("p", { className: "text-[12.5px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_no_scopable") }),
      groups.map((group) => {
        const perms = group.permissions.filter(
          (p) => !q || p.toLowerCase().includes(q)
        );
        if (perms.length === 0) return null;
        const allOn = perms.every((p) => selected.includes(p));
        return /* @__PURE__ */ jsxs10("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxs10("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx13("span", { className: "font-mono text-[10px] uppercase tracking-wide text-muted-foreground", children: group.label }),
            /* @__PURE__ */ jsx13(
              "button",
              {
                type: "button",
                onClick: () => onChange(
                  allOn ? selected.filter((p) => !perms.includes(p)) : [.../* @__PURE__ */ new Set([...selected, ...perms])]
                ),
                className: "text-[10.5px] text-primary hover:underline",
                children: allOn ? m.t("splicewire-beam-accounts::messages.tokens_clear_group") : m.t("splicewire-beam-accounts::messages.tokens_select_all")
              }
            )
          ] }),
          /* @__PURE__ */ jsx13("div", { className: "flex flex-wrap gap-1", children: perms.map((p) => {
            const on = selected.includes(p);
            return /* @__PURE__ */ jsxs10(
              "button",
              {
                type: "button",
                onClick: () => toggle(p),
                className: cn4(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors",
                  on ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                ),
                children: [
                  on && /* @__PURE__ */ jsx13(Check3, { className: "size-3 text-primary" }),
                  actionLabel(p)
                ]
              },
              p
            );
          }) })
        ] }, group.resource);
      })
    ] }),
    /* @__PURE__ */ jsx13("p", { className: "text-[11.5px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_leave_unselected") })
  ] });
}
function CreateTokenDialog2({
  open,
  onOpenChange,
  onMinted
}) {
  const m = useBeamAccountsMessages();
  const scopeSchema = useMemo3(() => tokenScopeSchemaFor(m), [m]);
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
  return /* @__PURE__ */ jsx13(
    Dialog2,
    {
      open,
      onOpenChange: (next) => {
        if (!next) reset();
        onOpenChange(next);
      },
      children: /* @__PURE__ */ jsxs10(DialogContent2, { className: "sm:max-w-lg", children: [
        /* @__PURE__ */ jsxs10(DialogHeader2, { children: [
          /* @__PURE__ */ jsxs10(DialogTitle2, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx13(KeyRound3, { className: "size-4 text-primary" }),
            " ",
            m.t("splicewire-beam-accounts::messages.tokens_new_api_token")
          ] }),
          /* @__PURE__ */ jsx13(DialogDescription2, { children: m.t("splicewire-beam-accounts::messages.tokens_create_description") })
        ] }),
        /* @__PURE__ */ jsx13(
          SchemaForm,
          {
            schema: scopeSchema,
            formData: values,
            uiSchema: {
              "ui:options": { label: false },
              "ui:submitButtonOptions": { norender: true }
            },
            onChange: (e) => setValues(e.formData ?? {})
          }
        ),
        /* @__PURE__ */ jsx13(
          ScopePicker,
          {
            permissions: permissions.data ?? [],
            selected: abilities,
            onChange: setAbilities
          }
        ),
        /* @__PURE__ */ jsx13("div", { className: "flex gap-2.5 rounded-md border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-[12px] leading-relaxed text-muted-foreground", children: /* @__PURE__ */ jsx13("p", { children: m.t("splicewire-beam-accounts::messages.tokens_fewer_permissions") }) }),
        /* @__PURE__ */ jsxs10(DialogFooter2, { children: [
          /* @__PURE__ */ jsx13(Button8, { variant: "ghost", onClick: () => onOpenChange(false), children: m.t("splicewire-beam-accounts::messages.tokens_cancel") }),
          /* @__PURE__ */ jsxs10(Button8, { onClick: mint, disabled: !name || createToken.isPending, children: [
            /* @__PURE__ */ jsx13(Plus2, { className: "size-4" }),
            " ",
            createToken.isPending ? m.t("splicewire-beam-accounts::messages.tokens_minting") : m.t("splicewire-beam-accounts::messages.tokens_mint")
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
  const m = useBeamAccountsMessages();
  const [copied, setCopied] = useState8(false);
  return /* @__PURE__ */ jsx13(Dialog2, { open: created !== null, onOpenChange, children: /* @__PURE__ */ jsxs10(DialogContent2, { className: "sm:max-w-lg", children: [
    /* @__PURE__ */ jsxs10(DialogHeader2, { children: [
      /* @__PURE__ */ jsxs10(DialogTitle2, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx13(KeyRound3, { className: "size-4 text-primary" }),
        " ",
        title
      ] }),
      /* @__PURE__ */ jsx13(DialogDescription2, { children: m.t("splicewire-beam-accounts::messages.tokens_copy_key_now", { name: created?.name ?? "" }) })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "min-w-0 space-y-3", children: [
      /* @__PURE__ */ jsxs10("div", { className: "flex min-w-0 items-center gap-2 rounded-md border bg-muted/50 p-2.5", children: [
        /* @__PURE__ */ jsx13(
          "code",
          {
            "data-slot": "revealed-token",
            className: "min-w-0 flex-1 break-all whitespace-normal font-mono text-[12.5px]",
            children: created?.token
          }
        ),
        /* @__PURE__ */ jsxs10(
          Button8,
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
              /* @__PURE__ */ jsx13(Copy2, { className: "size-3.5" }),
              " ",
              copied ? m.t("splicewire-beam-accounts::messages.tokens_copied") : m.t("splicewire-beam-accounts::messages.tokens_copy")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-warning-foreground", children: [
        /* @__PURE__ */ jsx13("span", { className: "size-1.5 flex-none rounded-full bg-warning" }),
        m.t("splicewire-beam-accounts::messages.tokens_only_time")
      ] })
    ] }),
    /* @__PURE__ */ jsx13(DialogFooter2, { children: /* @__PURE__ */ jsx13(Button8, { onClick: () => onOpenChange(false), children: m.t("splicewire-beam-accounts::messages.tokens_done") }) })
  ] }) });
}
function FacetBar({
  active,
  counts,
  onToggle
}) {
  const m = useBeamAccountsMessages();
  return /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center gap-1.5", children: [
    /* @__PURE__ */ jsx13("span", { className: "mr-1 text-[12px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_filter_type") }),
    FACETS2.map((f) => {
      const on = active.has(f);
      return /* @__PURE__ */ jsxs10(
        "button",
        {
          type: "button",
          "aria-pressed": on,
          onClick: () => onToggle(f),
          className: cn4(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
            on ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
          ),
          children: [
            m.t(PROVENANCE_LABEL2[f]),
            /* @__PURE__ */ jsx13("span", { className: "font-mono text-[10.5px] text-muted-foreground", children: counts[f] })
          ]
        },
        f
      );
    })
  ] });
}
function buildColumns(renderTokenActivity, busy, onRotate, onArchive, onDelete, m) {
  return [
    {
      id: "name",
      header: m.t("splicewire-beam-accounts::messages.tokens_col_name"),
      cell: ({ row }) => {
        const t = row.original;
        return (
          // Capped so a long name (a browser session's whole user-agent string) truncates: the table is
          // auto-layout, so an uncapped cell grew to the full string and pushed every other column away.
          /* @__PURE__ */ jsxs10("div", { className: "min-w-0 max-w-[24rem] space-y-0.5", children: [
            /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx13("span", { className: "truncate text-[13px] font-medium", title: t.name, children: t.name }),
              t.isCurrent && /* @__PURE__ */ jsx13(Badge2, { variant: "secondary", className: "shrink-0 text-[10px]", children: m.t("splicewire-beam-accounts::messages.tokens_this_session") }),
              isExpiring(t) && /* @__PURE__ */ jsxs10("span", { className: "inline-flex shrink-0 items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning-foreground", children: [
                /* @__PURE__ */ jsx13(Clock3, { className: "size-3" }),
                " ",
                m.t("splicewire-beam-accounts::messages.tokens_expiring")
              ] }),
              t.archivedAt && /* @__PURE__ */ jsx13(
                Badge2,
                {
                  variant: "outline",
                  className: "shrink-0 text-[10px] text-muted-foreground",
                  children: m.t("splicewire-beam-accounts::messages.tokens_archived")
                }
              )
            ] }),
            /* @__PURE__ */ jsxs10("span", { className: "flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsx13(TokenFragmentText, { token: t }),
              /* @__PURE__ */ jsx13("span", { "aria-hidden": "true", children: "\xB7" }),
              /* @__PURE__ */ jsx13("span", { className: "truncate", children: expiryLabel(t, Date.now(), m) })
            ] })
          ] })
        );
      }
    },
    {
      id: "provenance",
      header: m.t("splicewire-beam-accounts::messages.tokens_col_type"),
      cell: ({ row }) => {
        const p = asProvenance2(row.original.provenance);
        return /* @__PURE__ */ jsx13(
          Badge2,
          {
            variant: PROVENANCE_BADGE2[p],
            className: "font-mono text-[10.5px]",
            children: m.t(PROVENANCE_LABEL2[p])
          }
        );
      }
    },
    {
      id: "scope",
      header: m.t("splicewire-beam-accounts::messages.tokens_col_scope"),
      cell: ({ row }) => /* @__PURE__ */ jsx13(ScopeChips2, { abilities: row.original.abilities })
    },
    {
      id: "lastUsedAt",
      header: m.t("splicewire-beam-accounts::messages.tokens_col_last_used"),
      cell: ({ row }) => /* @__PURE__ */ jsx13("span", { className: "text-[12.5px] text-muted-foreground", children: fmtRelative(row.original.lastUsedAt, m) })
    },
    {
      id: "createdAt",
      header: m.t("splicewire-beam-accounts::messages.tokens_col_created"),
      cell: ({ row }) => /* @__PURE__ */ jsx13("span", { className: "text-[12.5px] text-muted-foreground", children: fmtDate(row.original.createdAt) })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsx13("span", { className: "sr-only", children: m.t("splicewire-beam-accounts::messages.tokens_col_actions") }),
      cell: ({ row }) => {
        const t = row.original;
        if (t.isCurrent) {
          return /* @__PURE__ */ jsx13("span", { className: "font-mono text-sm text-muted-foreground", children: "\u2014" });
        }
        const archived = !!t.archivedAt;
        const canManage = !archived && asProvenance2(t.provenance) === "api";
        return /* @__PURE__ */ jsxs10("div", { className: "flex items-center justify-end gap-1.5", children: [
          renderTokenActivity?.(t),
          canManage && /* @__PURE__ */ jsxs10(
            Button8,
            {
              variant: "outline",
              size: "sm",
              disabled: busy,
              onClick: () => onRotate(t),
              children: [
                /* @__PURE__ */ jsx13(RotateCw2, { className: "size-3.5" }),
                " ",
                m.t("splicewire-beam-accounts::messages.tokens_rotate")
              ]
            }
          ),
          /* @__PURE__ */ jsx13(
            Button8,
            {
              variant: "ghost",
              size: "sm",
              disabled: busy,
              title: archived ? m.t("splicewire-beam-accounts::messages.tokens_delete_permanently") : m.t("splicewire-beam-accounts::messages.tokens_archive"),
              "aria-label": m.t(archived ? "splicewire-beam-accounts::messages.tokens_delete_named" : "splicewire-beam-accounts::messages.tokens_archive_named", { name: t.name }),
              onClick: () => archived ? onDelete(t) : onArchive(t),
              children: /* @__PURE__ */ jsx13(Trash23, { className: "size-3.5" })
            }
          )
        ] });
      }
    }
  ];
}
function TokensRoster() {
  const m = useBeamAccountsMessages();
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
  const counts = useMemo3(() => {
    const c = Object.fromEntries(FACETS2.map((f) => [f, 0]));
    for (const t of all) {
      if (!showArchived && t.archivedAt) continue;
      const p = asProvenance2(t.provenance);
      if (p in c) c[p] += 1;
    }
    return c;
  }, [all, showArchived]);
  const rows = useMemo3(
    () => all.filter((t) => {
      if (!showArchived && t.archivedAt) return false;
      if (active.size > 0 && !active.has(asProvenance2(t.provenance)))
        return false;
      return true;
    }),
    [all, active, showArchived]
  );
  const health = useMemo3(() => {
    const live = all.filter((t) => !t.archivedAt);
    return {
      active: live.length,
      expiring: live.filter(isExpiring).length,
      archived: all.filter((t) => t.archivedAt).length
    };
  }, [all]);
  const otherSessionCount = useMemo3(
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
      notify({ type: "success", message: m.t("splicewire-beam-accounts::messages.tokens_archived_toast", { name: token.name }) });
    } catch {
    }
  }
  async function remove(token) {
    try {
      await deleteToken.mutateAsync(token.id);
      notify({ type: "success", message: m.t("splicewire-beam-accounts::messages.tokens_deleted_toast", { name: token.name }) });
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
  const columns = useMemo3(
    () => buildColumns(renderTokenActivity, busy, rotate, archive, remove, m),
    // m: a live locale switch re-renders every header, badge, action label and toast the columns carry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTokenActivity, busy, m]
  );
  function toggleFacet(facet) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });
  }
  return /* @__PURE__ */ jsxs10("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-0.5", children: [
          /* @__PURE__ */ jsx13("h1", { className: "text-[15px] font-semibold tracking-tight", children: m.t("splicewire-beam-accounts::messages.tokens_heading") }),
          /* @__PURE__ */ jsx13("span", { className: "font-mono text-[11px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_health", { active: health.active, expiring: health.expiring, archived: health.archived }) })
        ] }),
        /* @__PURE__ */ jsx13("p", { className: "text-[13px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_description") })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2", children: [
        otherSessionCount > 0 && /* @__PURE__ */ jsx13(
          Button8,
          {
            variant: "ghost",
            size: "sm",
            disabled: busy,
            title: m.t("splicewire-beam-accounts::messages.tokens_revoke_others_title"),
            onClick: sweepSessions,
            children: m.choice("splicewire-beam-accounts::messages.tokens_revoke_other_count", otherSessionCount)
          }
        ),
        /* @__PURE__ */ jsxs10(Button8, { size: "sm", onClick: () => setCreateOpen(true), children: [
          /* @__PURE__ */ jsx13(Plus2, { className: "size-4" }),
          " ",
          m.t("splicewire-beam-accounts::messages.tokens_new_token")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx13(FacetBar, { active, counts, onToggle: toggleFacet }),
      /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-3", children: [
        active.size === 0 && /* @__PURE__ */ jsx13("span", { className: "text-[12px] text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_showing_all_types") }),
        /* @__PURE__ */ jsxs10("label", { className: "flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx13(
            "input",
            {
              type: "checkbox",
              className: "size-3.5 accent-primary",
              checked: showArchived,
              onChange: (e) => setShowArchived(e.target.checked)
            }
          ),
          m.t("splicewire-beam-accounts::messages.tokens_show_archived")
        ] })
      ] })
    ] }),
    tokensQuery.isError ? /* @__PURE__ */ jsx13("p", { role: "alert", className: "py-8 text-sm text-destructive", children: m.t("splicewire-beam-accounts::messages.tokens_load_failed") }) : /* @__PURE__ */ jsx13(
      DataTable2,
      {
        stackOnMobile: true,
        columns,
        data: rows,
        loading: tokensQuery.isPending,
        rowClassName: (t) => t.archivedAt ? "opacity-60" : void 0,
        emptyMessage: all.length === 0 ? m.t("splicewire-beam-accounts::messages.tokens_empty") : m.t("splicewire-beam-accounts::messages.tokens_empty_filtered")
      }
    ),
    /* @__PURE__ */ jsxs10("div", { className: "flex gap-2.5 rounded-md border border-warning/40 bg-warning/[0.06] p-3 text-[12.5px] leading-relaxed text-muted-foreground", children: [
      /* @__PURE__ */ jsx13("span", { className: "mt-0.5 text-xs font-medium text-warning-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_browser_sessions") }),
      /* @__PURE__ */ jsx13("p", { children: richMessage(m, "splicewire-beam-accounts::messages.tokens_revoke_others_explainer", { action: /* @__PURE__ */ jsx13("b", { className: "text-foreground", children: m.t("splicewire-beam-accounts::messages.tokens_revoke_others") }) }) })
    ] }),
    /* @__PURE__ */ jsx13(
      CreateTokenDialog2,
      {
        open: createOpen,
        onOpenChange: setCreateOpen,
        onMinted: setMinted
      }
    ),
    /* @__PURE__ */ jsx13(
      RevealOnceDialog,
      {
        created: minted,
        title: m.t("splicewire-beam-accounts::messages.tokens_created_title", { name: minted?.name ?? "" }),
        onOpenChange: (open) => !open && setMinted(null)
      }
    ),
    /* @__PURE__ */ jsx13(
      RevealOnceDialog,
      {
        created: rotated,
        title: m.t("splicewire-beam-accounts::messages.tokens_rotated_title"),
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
import { useMemo as useMemo4, useRef as useRef2, useState as useState9 } from "react";
import {
  Button as Button9,
  buttonVariants,
  cn as cn5,
  DataTable as DataTable3,
  Dialog as Dialog3,
  DialogContent as DialogContent3,
  DialogDescription as DialogDescription3,
  DialogFooter as DialogFooter3,
  DialogHeader as DialogHeader3,
  DialogTitle as DialogTitle3,
  Input as Input6,
  Label as Label6,
  Popover as Popover3,
  PopoverContent as PopoverContent3,
  PopoverTrigger as PopoverTrigger3,
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
import { jsx as jsx14 } from "react/jsx-runtime";
var Context = createContext3(null);
function TeamProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx14(Context.Provider, { value: services, children });
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
import { jsx as jsx15 } from "react/jsx-runtime";
function RoleBadge({
  role,
  label
}) {
  return /* @__PURE__ */ jsx15(Badge3, { variant: "secondary", title: role, children: label ?? humanizeKey(role) });
}

// src/team-page.tsx
import { Fragment as Fragment5, jsx as jsx16, jsxs as jsxs11 } from "react/jsx-runtime";
function formatDate2(value) {
  return value ? new Date(value).toLocaleDateString() : "\u2014";
}
function apiErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
var FACETS3 = ["All", "Members", "Pending"];
var FACET_LABEL = { All: "splicewire-beam-accounts::messages.team_facet_all", Members: "splicewire-beam-accounts::messages.team_facet_members", Pending: "splicewire-beam-accounts::messages.team_facet_pending" };
var STATUS_LABEL = { Active: "splicewire-beam-accounts::messages.team_status_active", Pending: "splicewire-beam-accounts::messages.team_status_pending" };
function TeamPage({
  currentUserId,
  createTeamHref
}) {
  return /* @__PURE__ */ jsx16(TeamInner, { currentUserId, createTeamHref });
}
function TeamInner({
  currentUserId,
  createTeamHref
}) {
  const m = useBeamAccountsMessages();
  const isMobile = useIsMobile();
  const membersQuery = useTeamMembers();
  const invitationsQuery = useTeamInvitations();
  const roles = useTeamRoles();
  const memberRows = membersQuery.data ?? [];
  const inviteRows = invitationsQuery.data ?? [];
  const assignableRoles = roles.data?.assignable ?? [];
  const invitableRoles = roles.data?.invitable ?? [];
  const roleLabels = useMemo4(
    () => new Map(
      [...assignableRoles, ...invitableRoles].map((role) => [
        role.value,
        role.label
      ])
    ),
    [assignableRoles, invitableRoles]
  );
  const myRole = memberRows.find((m2) => m2.id === currentUserId)?.role;
  const isOwner = myRole === "owner";
  const canInvite = myRole === "owner" || myRole === "admin";
  const owners = ownerCount(memberRows);
  const lastOwner = owners <= 1;
  const roster = useMemo4(
    () => mergeRoster(memberRows, inviteRows, currentUserId),
    [memberRows, inviteRows, currentUserId]
  );
  const [facet, setFacet] = useState9("All");
  const [inviting, setInviting] = useState9(false);
  const [confirm, setConfirm] = useState9(null);
  const confirmTrigger = useRef2(null);
  const rememberRoleTrigger = (event) => {
    confirmTrigger.current = event.currentTarget.querySelector('[role="combobox"]');
  };
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
  const columns = useMemo4(
    () => [
      {
        id: "identity",
        header: m.t("splicewire-beam-accounts::messages.team_col_identity"),
        cell: ({ row }) => {
          const r = row.original;
          return /* @__PURE__ */ jsxs11("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxs11("div", { className: "truncate font-medium", children: [
              r.name ?? r.email,
              r.isSelf && /* @__PURE__ */ jsx16("span", { className: "ml-1.5 text-xs text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.team_you") })
            ] }),
            /* @__PURE__ */ jsx16("div", { className: "truncate text-xs text-muted-foreground", children: r.email })
          ] });
        }
      },
      {
        id: "role",
        meta: { label: m.t("splicewire-beam-accounts::messages.team_col_role") },
        header: () => /* @__PURE__ */ jsxs11("span", { className: "inline-flex items-center gap-1", children: [
          m.t("splicewire-beam-accounts::messages.team_col_role"),
          /* @__PURE__ */ jsxs11(Popover3, { children: [
            /* @__PURE__ */ jsx16(PopoverTrigger3, { asChild: true, children: /* @__PURE__ */ jsx16(
              "button",
              {
                type: "button",
                "aria-label": m.t("splicewire-beam-accounts::messages.team_about_roles"),
                className: "text-muted-foreground hover:text-foreground",
                children: /* @__PURE__ */ jsx16(Info, { className: "size-3.5" })
              }
            ) }),
            /* @__PURE__ */ jsx16(PopoverContent3, { className: "w-72 text-sm font-normal", children: /* @__PURE__ */ jsx16("p", { className: "leading-relaxed text-muted-foreground", children: richMessage(m, "splicewire-beam-accounts::messages.team_roles_explainer", { tier: /* @__PURE__ */ jsx16("b", { className: "text-foreground", children: m.t("splicewire-beam-accounts::messages.team_membership_tier") }) }) }) })
          ] })
        ] }),
        cell: ({ row }) => {
          const r = row.original;
          if (r.kind === "invitation" || !isOwner) {
            return /* @__PURE__ */ jsx16(
              RoleBadge,
              {
                role: String(r.role),
                label: roleLabels.get(String(r.role))
              }
            );
          }
          const disabledSelf = r.isSelf && lastOwner;
          return /* @__PURE__ */ jsxs11(
            "div",
            {
              className: "flex items-center gap-1.5",
              onFocusCapture: rememberRoleTrigger,
              onPointerDownCapture: rememberRoleTrigger,
              children: [
                /* @__PURE__ */ jsx16(
                  SimpleSelect2,
                  {
                    className: "h-8 w-32",
                    value: String(r.role),
                    disabled: disabledSelf || updateRole.isPending,
                    onValueChange: (next) => changeRole(r, next),
                    options: assignableRoles
                  }
                ),
                disabledSelf && /* @__PURE__ */ jsx16(
                  "span",
                  {
                    title: m.t("splicewire-beam-accounts::messages.team_last_owner_role"),
                    className: "text-muted-foreground",
                    children: /* @__PURE__ */ jsx16(ShieldAlert, { className: "size-3.5" })
                  }
                )
              ]
            }
          );
        }
      },
      {
        id: "status",
        header: m.t("splicewire-beam-accounts::messages.team_col_status"),
        cell: ({ row }) => /* @__PURE__ */ jsx16(StatusPill, { status: row.original.status })
      },
      {
        id: "since",
        header: m.t("splicewire-beam-accounts::messages.team_col_since"),
        cell: ({ row }) => {
          const r = row.original;
          return /* @__PURE__ */ jsx16("span", { className: "text-muted-foreground", children: r.kind === "member" ? formatDate2(r.since) : m.t("splicewire-beam-accounts::messages.team_invited_on", { date: formatDate2(r.since) }) });
        }
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          if (r.kind === "invitation") {
            if (!canInvite) return null;
            return /* @__PURE__ */ jsxs11("div", { className: "flex items-center justify-end gap-1", children: [
              /* @__PURE__ */ jsx16(ResendInvitationAction, { row: r }),
              /* @__PURE__ */ jsx16(
                Button9,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "size-7 text-destructive hover:text-destructive",
                  "aria-label": m.t("splicewire-beam-accounts::messages.team_revoke_invitation_for", { email: r.email }),
                  disabled: revokeInvitation.isPending,
                  onClick: (event) => {
                    confirmTrigger.current = event.currentTarget;
                    setConfirm({ kind: "revoke", row: r });
                  },
                  children: /* @__PURE__ */ jsx16(X2, {})
                }
              )
            ] });
          }
          if (!isOwner) return null;
          const lockRemove = r.role === "owner" && lastOwner;
          return /* @__PURE__ */ jsx16(
            Button9,
            {
              variant: "ghost",
              size: "icon",
              className: "size-7 text-destructive hover:text-destructive disabled:opacity-40",
              "aria-label": m.t("splicewire-beam-accounts::messages.team_remove_email", { email: r.email }),
              disabled: lockRemove || removeMember.isPending,
              title: lockRemove ? m.t("splicewire-beam-accounts::messages.team_last_owner_remove") : void 0,
              onClick: (event) => {
                confirmTrigger.current = event.currentTarget;
                setConfirm({ kind: "remove", row: r });
              },
              children: /* @__PURE__ */ jsx16(UserMinus, {})
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
      revokeInvitation.isPending,
      m
    ]
  );
  const readError = membersQuery.error ?? invitationsQuery.error ?? roles.error;
  if (readError) {
    return /* @__PURE__ */ jsx16("p", { role: "alert", className: "py-8 text-sm text-destructive", children: apiErrorMessage(readError, m.t("splicewire-beam-accounts::messages.team_load_failed")) });
  }
  if (membersQuery.isPending || invitationsQuery.isPending || roles.isPending) {
    return /* @__PURE__ */ jsx16("p", { className: "py-8 text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.team_loading") });
  }
  return /* @__PURE__ */ jsxs11("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs11("div", { children: [
        /* @__PURE__ */ jsx16("h2", { className: "font-semibold", children: m.t("splicewire-beam-accounts::messages.team_heading") }),
        /* @__PURE__ */ jsx16("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.team_description") })
      ] }),
      /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap items-center gap-2", children: [
        createTeamHref ? /* @__PURE__ */ jsxs11(
          "a",
          {
            href: createTeamHref,
            className: buttonVariants({ variant: "outline" }),
            children: [
              /* @__PURE__ */ jsx16(Plus3, { className: "size-4" }),
              " ",
              m.t("splicewire-beam-accounts::messages.team_new_team")
            ]
          }
        ) : null,
        canInvite && /* @__PURE__ */ jsxs11(Button9, { onClick: () => setInviting(true), children: [
          /* @__PURE__ */ jsx16(UserPlus, { className: "size-4" }),
          " ",
          m.t("splicewire-beam-accounts::messages.team_invite_member")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx16(FacetsBar, { active: facet, counts, onSelect: setFacet }),
      /* @__PURE__ */ jsxs11("span", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx16(ShieldAlert, { className: "size-3.5" }),
        m.choice("splicewire-beam-accounts::messages.team_owners_count", owners)
      ] })
    ] }),
    isMobile && counts.Pending > 0 && facet !== "Pending" && /* @__PURE__ */ jsx16(
      Button9,
      {
        variant: "outline",
        className: "h-auto w-full min-w-0 whitespace-normal break-words py-2",
        onClick: () => setFacet("Pending"),
        children: m.t("splicewire-beam-accounts::messages.team_view_pending", { count: counts.Pending })
      }
    ),
    /* @__PURE__ */ jsx16(
      DataTable3,
      {
        stackOnMobile: true,
        columns,
        data: rows,
        emptyMessage: m.t("splicewire-beam-accounts::messages.team_empty")
      }
    ),
    /* @__PURE__ */ jsx16(Sheet, { open: inviting, onOpenChange: setInviting, children: /* @__PURE__ */ jsxs11(SheetContent, { className: "flex flex-col gap-0 sm:max-w-md", children: [
      /* @__PURE__ */ jsxs11(SheetHeader, { children: [
        /* @__PURE__ */ jsxs11(SheetTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx16(Mail, { className: "size-4" }),
          " ",
          m.t("splicewire-beam-accounts::messages.team_invite_member")
        ] }),
        /* @__PURE__ */ jsx16(SheetDescription, { children: m.t("splicewire-beam-accounts::messages.team_invite_description") })
      ] }),
      /* @__PURE__ */ jsx16("div", { className: "flex-1 overflow-y-auto p-4", children: /* @__PURE__ */ jsx16(
        InviteForm,
        {
          roles: invitableRoles,
          onSent: () => setInviting(false),
          onCancel: () => setInviting(false)
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx16(
      Dialog3,
      {
        open: confirm !== null,
        onOpenChange: (o) => !o && setConfirm(null),
        children: /* @__PURE__ */ jsx16(
          DialogContent3,
          {
            onCloseAutoFocus: (event) => {
              const trigger = confirmTrigger.current;
              confirmTrigger.current = null;
              if (trigger?.isConnected) {
                event.preventDefault();
                trigger.focus();
              }
            },
            children: confirm && /* @__PURE__ */ jsxs11(Fragment5, { children: [
              /* @__PURE__ */ jsxs11(DialogHeader3, { children: [
                /* @__PURE__ */ jsx16(DialogTitle3, { className: "flex items-center gap-2", children: confirm.kind === "transfer" ? /* @__PURE__ */ jsxs11(Fragment5, { children: [
                  /* @__PURE__ */ jsx16(ShieldAlert, { className: "size-4 text-warning" }),
                  " ",
                  m.t("splicewire-beam-accounts::messages.team_transfer_ownership")
                ] }) : confirm.kind === "remove" ? /* @__PURE__ */ jsxs11(Fragment5, { children: [
                  /* @__PURE__ */ jsx16(UserMinus, { className: "size-4 text-destructive" }),
                  " ",
                  m.t("splicewire-beam-accounts::messages.team_remove_member")
                ] }) : /* @__PURE__ */ jsxs11(Fragment5, { children: [
                  /* @__PURE__ */ jsx16(X2, { className: "size-4 text-destructive" }),
                  " ",
                  m.t("splicewire-beam-accounts::messages.team_revoke_invitation")
                ] }) }),
                /* @__PURE__ */ jsx16(DialogDescription3, { children: confirm.kind === "transfer" ? /* @__PURE__ */ jsx16(Fragment5, { children: richMessage(m, "splicewire-beam-accounts::messages.team_transfer_confirm", { owner: /* @__PURE__ */ jsx16("b", { children: m.t("splicewire-beam-accounts::messages.team_owner") }), who: /* @__PURE__ */ jsx16("b", { children: confirm.row.name ?? confirm.row.email }) }) }) : confirm.kind === "remove" ? /* @__PURE__ */ jsx16(Fragment5, { children: richMessage(m, "splicewire-beam-accounts::messages.team_remove_confirm", { who: /* @__PURE__ */ jsx16("b", { children: confirm.row.name ?? confirm.row.email }) }) }) : /* @__PURE__ */ jsx16(Fragment5, { children: richMessage(m, "splicewire-beam-accounts::messages.team_revoke_confirm", { email: /* @__PURE__ */ jsx16("b", { children: confirm.row.email }) }) }) })
              ] }),
              /* @__PURE__ */ jsxs11(DialogFooter3, { children: [
                /* @__PURE__ */ jsx16(
                  Button9,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setConfirm(null),
                    children: m.t("splicewire-beam-accounts::messages.team_cancel")
                  }
                ),
                /* @__PURE__ */ jsx16(
                  Button9,
                  {
                    size: "sm",
                    variant: confirm.kind === "transfer" ? "default" : "destructive",
                    onClick: runConfirm,
                    children: confirm.kind === "transfer" ? m.t("splicewire-beam-accounts::messages.team_transfer_ownership") : confirm.kind === "remove" ? m.t("splicewire-beam-accounts::messages.team_remove_member") : m.t("splicewire-beam-accounts::messages.team_revoke_invitation")
                  }
                )
              ] })
            ] })
          }
        )
      }
    )
  ] });
}
function InviteForm({
  roles,
  onSent,
  onCancel
}) {
  const m = useBeamAccountsMessages();
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
  return /* @__PURE__ */ jsxs11("form", { className: "space-y-4", onSubmit: submit, children: [
    /* @__PURE__ */ jsxs11("div", { className: "grid gap-1.5", children: [
      /* @__PURE__ */ jsx16(Label6, { htmlFor: "invite-email", children: m.t("splicewire-beam-accounts::messages.team_email") }),
      /* @__PURE__ */ jsx16(
        Input6,
        {
          id: "invite-email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          placeholder: m.t("splicewire-beam-accounts::messages.team_email_placeholder"),
          autoComplete: "off",
          autoFocus: true
        }
      )
    ] }),
    /* @__PURE__ */ jsxs11("div", { className: "grid gap-1.5", children: [
      /* @__PURE__ */ jsx16(Label6, { htmlFor: "invite-role", children: m.t("splicewire-beam-accounts::messages.team_invite_role") }),
      /* @__PURE__ */ jsx16(
        SimpleSelect2,
        {
          id: "invite-role",
          className: "capitalize",
          value: role,
          onValueChange: setRole,
          options: roles,
          placeholder: m.t("splicewire-beam-accounts::messages.team_select_role")
        }
      )
    ] }),
    send.isError && /* @__PURE__ */ jsx16("p", { role: "alert", className: "text-sm text-destructive", children: apiErrorMessage(send.error, m.t("splicewire-beam-accounts::messages.team_invite_failed")) }),
    /* @__PURE__ */ jsxs11("div", { className: "flex justify-end gap-2 pt-2", children: [
      /* @__PURE__ */ jsx16(Button9, { type: "button", variant: "ghost", onClick: onCancel, children: m.t("splicewire-beam-accounts::messages.team_cancel") }),
      /* @__PURE__ */ jsx16(Button9, { type: "submit", disabled: !valid || send.isPending, children: send.isPending ? m.t("splicewire-beam-accounts::messages.team_sending") : m.t("splicewire-beam-accounts::messages.team_send_invitation") })
    ] })
  ] });
}
function StatusPill({ status }) {
  const m = useBeamAccountsMessages();
  const pending = status === "Pending";
  return /* @__PURE__ */ jsxs11(
    "span",
    {
      className: cn5(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]",
        pending ? "border-warning/40 bg-warning/10 text-warning-foreground" : "border-primary/25 bg-primary/5 text-foreground"
      ),
      children: [
        /* @__PURE__ */ jsx16(
          "span",
          {
            className: cn5(
              "size-1.5 rounded-full",
              pending ? "bg-warning" : "bg-primary"
            )
          }
        ),
        m.t(STATUS_LABEL[status])
      ]
    }
  );
}
function FacetsBar({
  active,
  counts,
  onSelect
}) {
  const m = useBeamAccountsMessages();
  return /* @__PURE__ */ jsx16("div", { className: "inline-flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-sm", children: FACETS3.map((f) => /* @__PURE__ */ jsxs11(
    "button",
    {
      type: "button",
      onClick: () => onSelect(f),
      className: cn5(
        "rounded px-3 py-1 font-medium transition-colors",
        f === active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      ),
      children: [
        m.t(FACET_LABEL[f]),
        /* @__PURE__ */ jsx16("span", { className: "ml-1.5 text-xs text-muted-foreground", children: counts[f] })
      ]
    },
    f
  )) });
}
function ResendInvitationAction({ row }) {
  const m = useBeamAccountsMessages();
  const resend = useResendInvitation();
  return /* @__PURE__ */ jsx16(
    Button9,
    {
      variant: "ghost",
      size: "icon",
      className: "size-7",
      "aria-label": m.t("splicewire-beam-accounts::messages.team_resend_for", { email: row.email }),
      disabled: resend.isPending,
      title: resend.isSuccess ? m.t("splicewire-beam-accounts::messages.team_sent") : m.t("splicewire-beam-accounts::messages.team_resend"),
      onClick: () => resend.mutate(row.id),
      children: resend.isSuccess ? /* @__PURE__ */ jsx16(Check4, { className: "text-primary" }) : /* @__PURE__ */ jsx16(RotateCcw, {})
    }
  );
}

// src/agreement-prompt.tsx
import { lazy, Suspense } from "react";
import { jsx as jsx17 } from "react/jsx-runtime";
var Prompt = lazy(async () => {
  const widgets = await import("@splicewire/beam-agreements/widgets");
  return { default: widgets.AgreementPrompt };
});
function AgreementPrompt({ agreement, value, onChange }) {
  return /* @__PURE__ */ jsx17(Suspense, { fallback: null, children: /* @__PURE__ */ jsx17(
    Prompt,
    {
      agreementKey: agreement.key,
      readUrl: agreement.readUrl,
      required: agreement.required,
      version: agreement.version,
      digest: agreement.digest,
      kind: agreement.kind,
      title: agreement.title,
      label: agreement.label,
      effectiveAt: agreement.effectiveAt,
      summary: agreement.summary,
      content: agreement.content,
      legalUrl: agreement.legalUrl,
      value,
      onChange: (member) => onChange(isAgreementMember(member) ? member : void 0)
    }
  ) });
}
function isAgreementMember(value) {
  return typeof value === "object" && value !== null && typeof value.key === "string" && Number.isInteger(value.version) && typeof value.digest === "string";
}

// src/create-team-form.tsx
import { useState as useState10 } from "react";
import { Button as Button10, Input as Input7, Label as Label7 } from "@schemastud/ui";
import { jsx as jsx18, jsxs as jsxs12 } from "react/jsx-runtime";
function CreateTeamForm({ onSubmit, processing = false, errors, cancelHref, defaultName = "" }) {
  const m = useBeamAccountsMessages();
  const [name, setName] = useState10(defaultName);
  const valid = name.trim().length > 0;
  function submit(event) {
    event.preventDefault();
    if (!valid || processing) return;
    onSubmit({ name: name.trim() });
  }
  return /* @__PURE__ */ jsxs12("form", { className: "w-full max-w-lg space-y-6", onSubmit: submit, "aria-labelledby": "create-team-heading", children: [
    /* @__PURE__ */ jsxs12("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx18("h1", { id: "create-team-heading", className: "text-lg font-semibold", children: m.t("splicewire-beam-accounts::messages.create_team_heading") }),
      /* @__PURE__ */ jsx18("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.create_team_description") })
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "grid gap-2", children: [
      /* @__PURE__ */ jsx18(Label7, { htmlFor: "team-name", children: m.t("splicewire-beam-accounts::messages.create_team_name") }),
      /* @__PURE__ */ jsx18(
        Input7,
        {
          id: "team-name",
          name: "name",
          autoFocus: true,
          autoComplete: "organization",
          maxLength: 255,
          placeholder: m.t("splicewire-beam-accounts::messages.create_team_placeholder"),
          value: name,
          "aria-invalid": errors?.name ? true : void 0,
          "aria-describedby": errors?.name ? "team-name-error" : void 0,
          onChange: (event) => setName(event.target.value)
        }
      ),
      /* @__PURE__ */ jsx18("div", { id: "team-name-error", children: /* @__PURE__ */ jsx18(AuthError, { message: errors?.name }) })
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx18(Button10, { type: "submit", disabled: !valid || processing, children: processing ? m.t("splicewire-beam-accounts::messages.create_team_creating") : m.t("splicewire-beam-accounts::messages.create_team_submit") }),
      cancelHref ? /* @__PURE__ */ jsx18("a", { href: cancelHref, className: "text-sm text-muted-foreground underline-offset-4 hover:underline", children: m.t("splicewire-beam-accounts::messages.create_team_cancel") }) : null
    ] })
  ] });
}

// src/accept-invitation-panel.tsx
import { Button as Button11, buttonVariants as buttonVariants2, cn as cn6 } from "@schemastud/ui";
import { Fragment as Fragment6, jsx as jsx19, jsxs as jsxs13 } from "react/jsx-runtime";
function roleLabel(role, m) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : m.t("splicewire-beam-accounts::messages.invite_member_role");
}
var primaryLink = cn6(buttonVariants2({ variant: "default" }), "w-full");
var secondaryLink = cn6(buttonVariants2({ variant: "outline" }), "w-full");
function AcceptInvitationPanel(props) {
  const { state, teamName, email, role, inviterName, viewerEmail, onAccept, processing = false, error } = props;
  const m = useBeamAccountsMessages();
  const team = teamName ?? m.t("splicewire-beam-accounts::messages.invite_the_team");
  const invitedLine = /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: richMessage(m, "splicewire-beam-accounts::messages.invite_invited_line", { inviter: inviterName ?? m.t("splicewire-beam-accounts::messages.invite_a_teammate"), email: /* @__PURE__ */ jsx19("b", { className: "font-medium text-foreground", children: email }), team: /* @__PURE__ */ jsx19("b", { className: "font-medium text-foreground", children: team }), role: /* @__PURE__ */ jsx19("b", { className: "font-medium text-foreground", children: roleLabel(role, m) }) }) });
  return /* @__PURE__ */ jsxs13("section", { className: "w-full space-y-5", "aria-labelledby": "invitation-heading", "data-invitation-state": state, children: [
    state === "ready" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_join", { team }) }),
      invitedLine,
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.invite_signed_in_as", { email: viewerEmail ?? email ?? "" }) }),
      props.agreements?.map((agreement) => /* @__PURE__ */ jsx19(
        AgreementPrompt,
        {
          agreement,
          value: props.agreementMember?.key === agreement.key ? props.agreementMember : void 0,
          onChange: props.onAgreementMemberChange ?? (() => void 0)
        },
        agreement.key
      )),
      /* @__PURE__ */ jsx19(AuthError, { message: error }),
      /* @__PURE__ */ jsx19(
        Button11,
        {
          className: "w-full",
          onClick: onAccept,
          disabled: processing || !onAccept || Boolean(props.agreements?.some((agreement) => agreement.required) && !props.agreementMember),
          children: processing ? m.t("splicewire-beam-accounts::messages.invite_joining") : m.t("splicewire-beam-accounts::messages.invite_accept")
        }
      )
    ] }),
    state === "guest" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_join", { team }) }),
      invitedLine,
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.invite_create_or_login", { email: email ?? "" }) }),
      /* @__PURE__ */ jsxs13("div", { className: "flex flex-col gap-2", children: [
        props.registerHref ? /* @__PURE__ */ jsx19("a", { href: props.registerHref, className: primaryLink, children: m.t("splicewire-beam-accounts::messages.invite_create_account") }) : null,
        props.loginHref ? /* @__PURE__ */ jsx19("a", { href: props.loginHref, className: secondaryLink, children: m.t("splicewire-beam-accounts::messages.invite_log_in") }) : null
      ] })
    ] }),
    state === "wrong-account" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_wrong_account") }),
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: richMessage(m, "splicewire-beam-accounts::messages.invite_wrong_account_body", { email: /* @__PURE__ */ jsx19("b", { className: "font-medium text-foreground", children: email }), viewer: /* @__PURE__ */ jsx19("b", { className: "font-medium text-foreground", children: viewerEmail }), again: email }) }),
      /* @__PURE__ */ jsx19(AuthError, { message: error }),
      props.onLogout ? /* @__PURE__ */ jsx19(Button11, { variant: "outline", className: "w-full", onClick: props.onLogout, children: m.t("splicewire-beam-accounts::messages.invite_log_out") }) : null
    ] }),
    state === "expired" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_expired") }),
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: inviterName ? m.t("splicewire-beam-accounts::messages.invite_expired_ask_named", { name: inviterName, team }) : m.t("splicewire-beam-accounts::messages.invite_expired_ask_team", { team }) }),
      /* @__PURE__ */ jsx19(Home, { href: props.homeHref })
    ] }),
    state === "used" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_used") }),
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.invite_used_body", { team }) }),
      /* @__PURE__ */ jsx19(Home, { href: props.homeHref })
    ] }),
    state === "invalid" && /* @__PURE__ */ jsxs13(Fragment6, { children: [
      /* @__PURE__ */ jsx19(Heading, { children: m.t("splicewire-beam-accounts::messages.invite_invalid") }),
      /* @__PURE__ */ jsx19("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-accounts::messages.invite_invalid_body") }),
      /* @__PURE__ */ jsx19(Home, { href: props.homeHref })
    ] })
  ] });
}
function Heading({ children }) {
  return /* @__PURE__ */ jsx19("h1", { id: "invitation-heading", className: "text-lg font-semibold", children });
}
function Home({ href }) {
  const m = useBeamAccountsMessages();
  return href ? /* @__PURE__ */ jsx19("a", { href, className: secondaryLink, children: m.t("splicewire-beam-accounts::messages.invite_dashboard") }) : null;
}
export {
  AcceptInvitationPanel,
  AgreementPrompt,
  AuthError,
  AuthProvider,
  CreateTeamForm,
  DemoLogin,
  ForgotPasswordForm,
  LoginPanel,
  NoticeError,
  PasskeyButton,
  PasskeysSection,
  PasswordInput,
  ResetPasswordForm,
  TeamPage,
  TeamProvider,
  TokensPage,
  TokensProvider,
  TokensRoster,
  createTokensClient,
  englishBeamAccountsMessages,
  errorMessage,
  fetchDemoUsers,
  isWebAuthnSupported,
  mergeRoster,
  ownerCount,
  runAssertionCeremony,
  runAttestationCeremony,
  useArchiveToken,
  useAuth,
  useAuthServices,
  useBeamAccountsMessages,
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