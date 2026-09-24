import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Clock3,
  Copy,
  KeyRound,
  Plus,
  Trash2,
  Search,
  RotateCw,
} from "lucide-react";
import { SchemaForm, type SchemaNode } from "@schemastud/seam";
import {
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  cn,
} from "@schemastud/ui";
import {
  useTokens,
  usePermissions,
  useCreateToken,
  useArchiveToken,
  usePermanentlyDeleteToken,
  useRotateToken,
  useRevokeOtherSessions,
} from "./hooks";
import { useNotify, useTokensServices } from "./provider";
import type {
  ApiTokenData,
  CreatedTokenData,
  TokenProvenance,
  TokensServices,
} from "./types";

/** Token roster with grouped permission selection and reveal-once create/rotate flows.
 * Transport, feedback, and optional row activity are supplied by TokensProvider.
 */
const FACETS: TokenProvenance[] = [
  "api",
  "session",
  "dev",
  "broker",
  "passkey",
];

const PROVENANCE_LABEL: Record<TokenProvenance, string> = {
  api: "API",
  session: "Session",
  dev: "Dev",
  broker: "Broker",
  passkey: "Passkey",
  federation: "Federation",
  // The sync service identity's token — a machine principal, not a human one, which is
  // why it is absent from FACETS above (a deliberate 5-of-7 filter set) but required
  // here: both maps are exhaustive over TokenProvenance.
  service: "Service",
};

const PROVENANCE_BADGE: Record<
  TokenProvenance,
  "default" | "secondary" | "outline"
> = {
  api: "default",
  session: "secondary",
  dev: "outline",
  broker: "outline",
  passkey: "secondary",
  federation: "outline",
  service: "outline",
};

const EXPIRY_OPTIONS = [
  { value: 0, label: "Never expires" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

// The create-token schema — the REAL SchemaForm artifact carrying name + expiry. `abilities` is NOT
// a SchemaForm enum: the grouped scope picker (the ticket-Q1 enhancement) owns scope as a bespoke
// grouped/searchable control. Both feed the one mint body ({ name, abilities, expiresInDays }).
const tokenScopeSchema: SchemaNode = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Token name",
      description:
        'A label you recognise later — e.g. "ci-deploy-bot" or "laptop CLI".',
      minLength: 1,
    },
    expiresInDays: {
      type: "integer",
      title: "Expires",
      description:
        'When the token stops working. "Never" mints a token with no expiry.',
      enum: EXPIRY_OPTIONS.map((o) => o.value),
      enumNames: EXPIRY_OPTIONS.map((o) => o.label),
      default: 0,
    },
  },
  required: ["name"],
};

// ─── small look helpers ──────────────────────────────────────────────────────

function MonoLabel({ label }: { label: string }) {
  return (
    <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
  );
}

function asProvenance(value: string): TokenProvenance {
  return (FACETS as string[]).includes(value) ||
    value === "federation" ||
    value === "service"
    ? (value as TokenProvenance)
    : "api";
}

function isExpiring(token: ApiTokenData): boolean {
  if (!token.expires_at || token.archived_at) return false;
  const days = (new Date(token.expires_at).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 14;
}

function fmtDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function fmtRelative(value: string | null): string {
  if (!value) return "never";
  const mins = (Date.now() - new Date(value).getTime()) / 60_000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

// ─── scope grouping (the ticket-Q1 enhancement, client-side over listPermissions) ────

interface PermissionGroup {
  resource: string;
  label: string;
  permissions: string[];
}

function groupPermissions(names: string[]): PermissionGroup[] {
  const byResource = new Map<string, string[]>();
  for (const name of names) {
    const dot = name.indexOf(".");
    const resource = dot === -1 ? "general" : name.slice(0, dot);
    const bucket = byResource.get(resource) ?? [];
    bucket.push(name);
    byResource.set(resource, bucket);
  }
  return [...byResource.entries()]
    .sort(([a], [b]) =>
      a === "general" ? 1 : b === "general" ? -1 : a.localeCompare(b),
    )
    .map(([resource, permissions]) => ({
      resource,
      label:
        resource === "general"
          ? "General"
          : resource[0].toUpperCase() + resource.slice(1),
      permissions: permissions.sort(),
    }));
}

function actionLabel(name: string): string {
  const dot = name.indexOf(".");
  return dot === -1 ? name : name.slice(dot + 1);
}

// ─── the scope cell ──────────────────────────────────────────────────────────

function ScopeChips({ abilities }: { abilities: string[] | null }) {
  if (!abilities || abilities.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning-foreground">
        <span className="size-1.5 rounded-full bg-warning" />
        Full access
        <span className="font-mono text-[10px] text-muted-foreground">
          ['*']
        </span>
      </span>
    );
  }
  return (
    <div className="flex max-w-xs flex-wrap gap-1">
      {abilities.map((a) => (
        <Badge key={a} variant="outline" className="font-mono text-[10.5px]">
          {a}
        </Badge>
      ))}
    </div>
  );
}

// ─── the ONE enhancement: grouped + searchable scope picker (ticket Q1) ──────

function ScopePicker({
  permissions,
  selected,
  onChange,
}: {
  permissions: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupPermissions(permissions), [permissions]);
  const q = query.trim().toLowerCase();

  function toggle(name: string) {
    onChange(
      selected.includes(name)
        ? selected.filter((n) => n !== name)
        : [...selected, name],
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-medium">Scope (abilities)</label>
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-warning-foreground">
            <span className="size-1.5 rounded-full bg-warning" /> Unscoped ·
            Full access
            <span className="text-muted-foreground">['*']</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onChange([])}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {selected.length} selected · clear
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter permissions…"
          className="h-8 pl-8 text-[12.5px]"
        />
      </div>

      <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border p-2.5">
        {groups.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">
            You hold no scopable permissions in this workspace.
          </p>
        )}
        {groups.map((group) => {
          const perms = group.permissions.filter(
            (p) => !q || p.toLowerCase().includes(q),
          );
          if (perms.length === 0) return null;
          const allOn = perms.every((p) => selected.includes(p));
          return (
            <div key={group.resource} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      allOn
                        ? selected.filter((p) => !perms.includes(p))
                        : [...new Set([...selected, ...perms])],
                    )
                  }
                  className="text-[10.5px] text-primary hover:underline"
                >
                  {allOn ? "clear group" : "select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {perms.map((p) => {
                  const on = selected.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(p)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors",
                        on
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {on && <Check className="size-3 text-primary" />}
                      {actionLabel(p)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11.5px] text-muted-foreground">
        Leave everything unselected for an unscoped Full-access token. The
        picker offers only permissions you hold — the ADR-0109 clamp ceiling.
      </p>
    </div>
  );
}

// ─── the create-token flow (REAL SchemaForm + grouped scope picker) ──────────

function CreateTokenDialog({
  open,
  onOpenChange,
  onMinted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMinted: (token: CreatedTokenData) => void;
}) {
  const permissions = usePermissions();
  const createToken = useCreateToken();
  const [values, setValues] = useState<Record<string, unknown>>({
    expiresInDays: 0,
  });
  const [abilities, setAbilities] = useState<string[]>([]);

  const name = String(values.name ?? "").trim();
  const expiresInDays = Number(values.expiresInDays ?? 0) || undefined;

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
        abilities: abilities.length > 0 ? abilities : undefined,
        expiresInDays,
      });
      reset();
      onOpenChange(false);
      onMinted(created);
    } catch {
      // Surfaced by the injected onError / host error net.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" /> New API token
          </DialogTitle>
          <DialogDescription>
            Mint only tokens ⊆ your own permissions. The plaintext is shown
            once.
          </DialogDescription>
        </DialogHeader>

        {/* name + expiry: the REAL @schemastud/seam SchemaForm off the schema. */}
        <SchemaForm
          schema={tokenScopeSchema}
          formData={values}
          uiSchema={{
            "ui:options": { label: false },
            "ui:submitButtonOptions": { norender: true },
          }}
          onChange={(e: { formData?: Record<string, unknown> }) =>
            setValues(e.formData ?? {})
          }
        />

        {/* THE ONE ENHANCEMENT (Q1) — grouped + searchable scope picker over listPermissions. */}
        <ScopePicker
          permissions={permissions.data ?? []}
          selected={abilities}
          onChange={setAbilities}
        />

        {/* ADR-0109 clamp/intersect teaching. */}
        <div className="flex gap-2.5 rounded-md border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-[12px] leading-relaxed text-muted-foreground">
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-primary">
            ADR-0109
          </span>
          <p>
            Scope limits what a <b className="text-foreground">leaked</b> token
            can do — not a trust boundary. Abilities are{" "}
            <b className="text-foreground">clamped at mint</b> to what you hold
            and <b className="text-foreground">re-intersected at enforcement</b>{" "}
            (token ∩ your live permissions). The picker offers only your own
            permissions;{" "}
            <span className="font-mono text-[11px]">engine:consume</span> /{" "}
            <span className="font-mono text-[11px]">tenant:provision</span>{" "}
            never appear.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={mint} disabled={!name || createToken.isPending}>
            <Plus className="size-4" />{" "}
            {createToken.isPending ? "Minting…" : "Mint token"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── the reveal-once secret modal (blocking) — the "your key" moment ─────────

function RevealOnceDialog({
  created,
  title,
  onOpenChange,
}: {
  created: CreatedTokenData | null;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={created !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>
            Copy the key for “{created?.name}” now — for your security, we
            won&rsquo;t show it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2.5">
            <code className="min-w-0 flex-1 truncate font-mono text-[12.5px]">
              {created?.token}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (created) void navigator.clipboard?.writeText(created.token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="size-3.5" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-warning-foreground">
            <span className="size-1.5 flex-none rounded-full bg-warning" />
            This is the only time the plaintext key is shown. Store it in a
            secret manager now.
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── the facet bar ───────────────────────────────────────────────────────────

function FacetBar({
  active,
  counts,
  onToggle,
}: {
  active: Set<TokenProvenance>;
  counts: Record<TokenProvenance, number>;
  onToggle: (facet: TokenProvenance) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        provenance
      </span>
      {FACETS.map((f) => {
        const on = active.has(f);
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(f)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
              on
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {PROVENANCE_LABEL[f]}
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {counts[f]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── roster columns ──────────────────────────────────────────────────────────

function buildColumns(
  renderTokenActivity: TokensServices["renderTokenActivity"],
  busy: boolean,
  onRotate: (token: ApiTokenData) => void,
  onArchive: (token: ApiTokenData) => void,
  onDelete: (token: ApiTokenData) => void,
): ColumnDef<ApiTokenData, unknown>[] {
  return [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const t = row.original;
        return (
          // Capped so a long name (a browser session's whole user-agent string) truncates: the table is
          // auto-layout, so an uncapped cell grew to the full string and pushed every other column away.
          <div className="min-w-0 max-w-[24rem] space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-medium" title={t.name}>
                {t.name}
              </span>
              {t.is_current && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  This session
                </Badge>
              )}
              {isExpiring(t) && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning-foreground">
                  <Clock3 className="size-3" /> expiring
                </span>
              )}
              {t.archived_at && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] text-muted-foreground"
                >
                  archived
                </Badge>
              )}
            </div>
            <MonoLabel label={`PersonalAccessToken#${t.id}`} />
          </div>
        );
      },
    },
    {
      id: "provenance",
      header: "Type",
      cell: ({ row }) => {
        const p = asProvenance(row.original.provenance);
        return (
          <Badge
            variant={PROVENANCE_BADGE[p]}
            className="font-mono text-[10.5px]"
          >
            {PROVENANCE_LABEL[p]}
          </Badge>
        );
      },
    },
    {
      id: "scope",
      header: "Scope",
      cell: ({ row }) => <ScopeChips abilities={row.original.abilities} />,
    },
    {
      id: "last_used_at",
      header: "Last used",
      cell: ({ row }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {fmtRelative(row.original.last_used_at)}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {fmtDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const t = row.original;
        // is_current renders "—": the server 422 guard made a visible affordance.
        if (t.is_current) {
          return (
            <span className="font-mono text-sm text-muted-foreground">—</span>
          );
        }
        const archived = !!t.archived_at;
        const canManage = !archived && asProvenance(t.provenance) === "api";
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* activity.view-gated per-row popover slot — absence, not a dead button. */}
            {renderTokenActivity?.(t)}
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => onRotate(t)}
              >
                <RotateCw className="size-3.5" /> Rotate
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={archived ? "Delete permanently" : "Archive"}
              aria-label={`${archived ? "Delete permanently" : "Archive"} ${t.name}`}
              onClick={() => (archived ? onDelete(t) : onArchive(t))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}

// ─── the graduated surface ───────────────────────────────────────────────────

export function TokensRoster() {
  const { renderTokenActivity } = useTokensServices();
  const notify = useNotify();

  const tokensQuery = useTokens();
  const archiveToken = useArchiveToken();
  const deleteToken = usePermanentlyDeleteToken();
  const rotateToken = useRotateToken();
  const revokeOthers = useRevokeOtherSessions();

  const [active, setActive] = useState<Set<TokenProvenance>>(
    () => new Set<TokenProvenance>(["api"]),
  );
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [minted, setMinted] = useState<CreatedTokenData | null>(null);
  const [rotated, setRotated] = useState<CreatedTokenData | null>(null);

  const all = tokensQuery.data ?? [];

  const busy =
    archiveToken.isPending ||
    deleteToken.isPending ||
    rotateToken.isPending ||
    revokeOthers.isPending;

  const counts = useMemo(() => {
    const c = Object.fromEntries(FACETS.map((f) => [f, 0])) as Record<
      TokenProvenance,
      number
    >;
    for (const t of all) {
      const p = asProvenance(t.provenance);
      if (p in c) c[p] += 1;
    }
    return c;
  }, [all]);

  const rows = useMemo(
    () =>
      all.filter((t) => {
        if (!showArchived && t.archived_at) return false;
        if (active.size > 0 && !active.has(asProvenance(t.provenance)))
          return false;
        return true;
      }),
    [all, active, showArchived],
  );

  const health = useMemo(() => {
    const live = all.filter((t) => !t.archived_at);
    return {
      active: live.length,
      expiring: live.filter(isExpiring).length,
      archived: all.filter((t) => t.archived_at).length,
    };
  }, [all]);

  const otherSessionCount = useMemo(
    () =>
      all.filter(
        (t) => t.provenance === "session" && !t.is_current && !t.archived_at,
      ).length,
    [all],
  );

  async function rotate(token: ApiTokenData) {
    try {
      const created = await rotateToken.mutateAsync({ id: token.id });
      setRotated(created);
    } catch {
      /* host error net */
    }
  }

  async function archive(token: ApiTokenData) {
    try {
      await archiveToken.mutateAsync(token.id);
      notify({ type: "success", message: `Archived “${token.name}”.` });
    } catch {
      /* host error net */
    }
  }

  async function remove(token: ApiTokenData) {
    try {
      await deleteToken.mutateAsync(token.id);
      notify({ type: "success", message: `Deleted “${token.name}”.` });
    } catch {
      /* host error net */
    }
  }

  async function sweepSessions() {
    try {
      const result = await revokeOthers.mutateAsync();
      notify({ type: "success", message: result.message });
    } catch {
      /* host error net */
    }
  }

  const columns = useMemo(
    () => buildColumns(renderTokenActivity, busy, rotate, archive, remove),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTokenActivity, busy],
  );

  function toggleFacet(facet: TokenProvenance) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header: title + inline CTAs + health summary (desk topBar chrome lives inline here). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Personal access tokens
            </h2>
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              {health.active} active · {health.expiring} expiring ·{" "}
              {health.archived} archived
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Scoped credentials that act as you against the API. Mint only tokens
            ⊆ your own permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {otherSessionCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title="Session-provenance sweep only"
              onClick={sweepSessions}
            >
              Revoke {otherSessionCount} other session
              {otherSessionCount === 1 ? "" : "s"}
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New token
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FacetBar active={active} counts={counts} onToggle={toggleFacet} />
        <div className="flex items-center gap-3">
          {active.size === 0 && (
            <span className="text-[12px] text-muted-foreground">
              Showing all types
            </span>
          )}
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
      </div>

      {tokensQuery.isError ? (
        <p role="alert" className="py-8 text-sm text-destructive">
          Could not load your tokens. Try refreshing this page.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          loading={tokensQuery.isPending}
          rowClassName={(t: ApiTokenData) =>
            t.archived_at ? "opacity-60" : undefined
          }
          emptyMessage={
            all.length === 0
              ? "No tokens yet."
              : "No tokens match the selected types."
          }
        />
      )}

      {/* The "log out everywhere else" teaching — Session-provenance ONLY. */}
      <div className="flex gap-2.5 rounded-md border border-warning/40 bg-warning/[0.06] p-3 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-warning-foreground">
          sessions
        </span>
        <p>
          <b className="text-foreground">Revoke other sessions</b> sweeps only{" "}
          <span className="font-mono">Session</span>-provenance tokens (browser
          logins) — it never touches your <span className="font-mono">API</span>{" "}
          / <span className="font-mono">Broker</span> /{" "}
          <span className="font-mono">Dev</span> /{" "}
          <span className="font-mono">Passkey</span> tokens. Your current
          session is never swept.
        </p>
      </div>

      <CreateTokenDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onMinted={setMinted}
      />
      <RevealOnceDialog
        created={minted}
        title={`Token “${minted?.name ?? ""}” created`}
        onOpenChange={(open) => !open && setMinted(null)}
      />
      <RevealOnceDialog
        created={rotated}
        title="Token rotated"
        onOpenChange={(open) => !open && setRotated(null)}
      />
    </div>
  );
}
