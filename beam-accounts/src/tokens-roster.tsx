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
  cn,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
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
import { TokenFragmentText } from "./token-fragment";
import type {
  ApiTokenData,
  CreatedTokenData,
  TokenProvenance,
  TokensServices,
} from "./types";
import { englishBeamAccountsMessages, useBeamAccountsMessages, type BeamAccountsMessages, type BeamAccountsMessageKey } from "./messages";
import { richMessage } from "./rich-message";

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

const PROVENANCE_LABEL: Record<TokenProvenance, BeamAccountsMessageKey> = {
  api: 'splicewire-beam-accounts::messages.tokens_type_api',
  session: 'splicewire-beam-accounts::messages.tokens_type_session',
  dev: 'splicewire-beam-accounts::messages.tokens_type_dev',
  broker: 'splicewire-beam-accounts::messages.tokens_type_broker',
  passkey: 'splicewire-beam-accounts::messages.tokens_type_passkey',
  federation: 'splicewire-beam-accounts::messages.tokens_type_federation',
  // The sync service identity's token — a machine principal, not a human one, which is
  // why it is absent from FACETS above (a deliberate 5-of-7 filter set) but required
  // here: both maps are exhaustive over TokenProvenance.
  service: 'splicewire-beam-accounts::messages.tokens_type_service',
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
  { value: 0, labelKey: 'splicewire-beam-accounts::messages.tokens_never_expires' },
  { value: 7, labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_7_days' },
  { value: 30, labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_30_days' },
  { value: 60, labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_60_days' },
  { value: 90, labelKey: 'splicewire-beam-accounts::messages.tokens_expiry_90_days' },
] as const;

// The create-token schema — the REAL SchemaForm artifact carrying name + expiry. `abilities` is NOT
// a SchemaForm enum: the grouped scope picker (the ticket-Q1 enhancement) owns scope as a bespoke
// grouped/searchable control. Both feed the one mint body ({ name, abilities, expiresInDays }).
/** The create-token schema in the reader's locale; `tokenScopeSchema` is its English instance. */
export function tokenScopeSchemaFor(messages: BeamAccountsMessages = englishBeamAccountsMessages): SchemaNode {
  return {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: messages.t('splicewire-beam-accounts::messages.tokens_field_name'),
      description: messages.t('splicewire-beam-accounts::messages.tokens_field_name_hint'),
      minLength: 1,
    },
    expiresInDays: {
      type: "integer",
      title: messages.t('splicewire-beam-accounts::messages.tokens_field_expires'),
      description: messages.t('splicewire-beam-accounts::messages.tokens_field_expires_hint'),
      // Labels travel IN the schema as oneOf const/title pairs: the renderer (RJSF 6) never reads a
      // schema-level `enumNames`, so an enum showed the raw "0" for "Never" (TOWER-05 shots-r5).
      oneOf: EXPIRY_OPTIONS.map((o) => ({ const: o.value, title: messages.t(o.labelKey) })),
      default: 0,
    },
  },
  required: ["name"],
  };
}

export const tokenScopeSchema: SchemaNode = tokenScopeSchemaFor();

// ─── small look helpers ──────────────────────────────────────────────────────

function asProvenance(value: string): TokenProvenance {
  return (FACETS as string[]).includes(value) ||
    value === "federation" ||
    value === "service"
    ? (value as TokenProvenance)
    : "api";
}

function isExpiring(token: ApiTokenData): boolean {
  if (!token.expiresAt || token.archivedAt) return false;
  const days = (new Date(token.expiresAt).getTime() - Date.now()) / 86_400_000;
  return days >= 0 && days <= 14;
}

function fmtDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/** The row's subtitle: when the token stops working. (Last used, created and scope have their own
 *  columns; the subtitle used to print `PersonalAccessToken#<id>`, a server class name.) */
export function expiryLabel(
  token: Pick<ApiTokenData, "expiresAt">,
  now: number = Date.now(),
  messages: BeamAccountsMessages = englishBeamAccountsMessages
): string {
  if (!token.expiresAt) return messages.t('splicewire-beam-accounts::messages.tokens_never_expires');
  const at = new Date(token.expiresAt);
  // The date keeps the browser locale (toLocaleDateString) so English stays byte-identical; nominated.
  return messages.t(at.getTime() < now ? 'splicewire-beam-accounts::messages.tokens_expired_on' : 'splicewire-beam-accounts::messages.tokens_expires_on', { date: at.toLocaleDateString() });
}

function fmtRelative(value: string | null, messages: BeamAccountsMessages): string {
  if (!value) return messages.t('splicewire-beam-accounts::messages.tokens_never');
  const mins = (Date.now() - new Date(value).getTime()) / 60_000;
  if (mins < 60) return messages.t('splicewire-beam-accounts::messages.tokens_minutes_ago', { count: Math.max(1, Math.round(mins)) });
  if (mins < 1440) return messages.t('splicewire-beam-accounts::messages.tokens_hours_ago', { count: Math.round(mins / 60) });
  return messages.t('splicewire-beam-accounts::messages.tokens_days_ago', { count: Math.round(mins / 1440) });
}

// ─── scope grouping (the ticket-Q1 enhancement, client-side over listPermissions) ────

interface PermissionGroup {
  resource: string;
  label: string;
  permissions: string[];
}

function groupPermissions(names: string[], messages: BeamAccountsMessages): PermissionGroup[] {
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
      a === "general" ? 1 : b === "general" ? -1 : a.localeCompare(b)
    )
    .map(([resource, permissions]) => ({
      resource,
      label:
        resource === "general"
          ? messages.t('splicewire-beam-accounts::messages.tokens_group_general')
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
  const m = useBeamAccountsMessages();
  if (!abilities || abilities.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] text-warning-foreground">
        <span className="size-1.5 rounded-full bg-warning" />
        {/* The label alone: the `['*']` wildcard is the wire shape, not something a person reads. */}
        {m.t('splicewire-beam-accounts::messages.tokens_full_access')}
      </span>
    );
  }
  return (
    <div className="flex max-w-xs flex-wrap gap-1">
      {abilities.map((a) => (
        <Badge
          key={a}
          variant="outline"
          className="flex flex-col items-start gap-0.5 py-1"
        >
          {scopeLabel(a) && (
            <span className="text-[11px] font-medium">{m.t(scopeLabel(a)!)}</span>
          )}
          <span className="font-mono text-[9px] text-muted-foreground">{a}</span>
        </Badge>
      ))}
    </div>
  );
}

const SCOPE_LABELS: Record<string, BeamAccountsMessageKey> = {
  "activity.view": 'splicewire-beam-accounts::messages.tokens_scope_view_activity',
  "billing.manage": 'splicewire-beam-accounts::messages.tokens_scope_manage_billing',
  "billing.view": 'splicewire-beam-accounts::messages.tokens_scope_view_billing',
  "conduit.delete": 'splicewire-beam-accounts::messages.tokens_scope_delete_conduits',
  "conduit.update": 'splicewire-beam-accounts::messages.tokens_scope_update_conduits',
  "content.author": 'splicewire-beam-accounts::messages.tokens_scope_author_content',
  "context-scopes.embeddings": 'splicewire-beam-accounts::messages.tokens_scope_search_context_scope_embeddings',
  "declarations.redetermine": 'splicewire-beam-accounts::messages.tokens_scope_redetermine_declarations',
  "embeddings.embed": 'splicewire-beam-accounts::messages.tokens_scope_generate_embeddings',
  "federation-grants.configure": 'splicewire-beam-accounts::messages.tokens_scope_configure_federation_grants',
  "federation-grants.pin": 'splicewire-beam-accounts::messages.tokens_scope_pin_federation_grants',
  "federation-grants.pull": 'splicewire-beam-accounts::messages.tokens_scope_pull_federation_grants',
  "federation-grants.revoke": 'splicewire-beam-accounts::messages.tokens_scope_revoke_federation_grants',
  "installed-extensions.refresh": 'splicewire-beam-accounts::messages.tokens_scope_refresh_installed_extensions',
  "installed-extensions.remove": 'splicewire-beam-accounts::messages.tokens_scope_remove_installed_extensions',
  "market-extensions.install": 'splicewire-beam-accounts::messages.tokens_scope_install_marketplace_extensions',
  "market-extensions.purchase": 'splicewire-beam-accounts::messages.tokens_scope_purchase_marketplace_extensions',
  "market-listing.create": 'splicewire-beam-accounts::messages.tokens_scope_create_marketplace_listings',
  "market-listing.update": 'splicewire-beam-accounts::messages.tokens_scope_update_marketplace_listings',
  "market-listing.view": 'splicewire-beam-accounts::messages.tokens_scope_view_marketplace_listings',
  "media.analyze": 'splicewire-beam-accounts::messages.tokens_scope_analyze_media',
  "media.ingest": 'splicewire-beam-accounts::messages.tokens_scope_ingest_media',
  "permission-cascade.platform_admin_permission": 'splicewire-beam-accounts::messages.tokens_scope_manage_platform_permissions',
  "plans.checkout": 'splicewire-beam-accounts::messages.tokens_scope_checkout_plans',
  "platform.manage": 'splicewire-beam-accounts::messages.tokens_scope_manage_platform_objects',
  "schemas.manage": 'splicewire-beam-accounts::messages.tokens_scope_manage_schemas',
  "silos.publish-corpus": 'splicewire-beam-accounts::messages.tokens_scope_publish_silo_corpus',
  "silos.withdraw-corpus": 'splicewire-beam-accounts::messages.tokens_scope_withdraw_silo_corpus',
  "site.edit": 'splicewire-beam-accounts::messages.tokens_scope_edit_site',
  "tenants.sync": 'splicewire-beam-accounts::messages.tokens_scope_sync_workspaces',
  "usage.view": 'splicewire-beam-accounts::messages.tokens_scope_view_usage',
  "workflows.author": 'splicewire-beam-accounts::messages.tokens_scope_author_workflows',
};

function scopeLabel(scope: string): BeamAccountsMessageKey | null {
  return SCOPE_LABELS[scope] ?? null;
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
  const m = useBeamAccountsMessages();
  const [query, setQuery] = useState("");
  const groups = useMemo(() => groupPermissions(permissions, m), [permissions, m]);
  const q = query.trim().toLowerCase();

  function toggle(name: string) {
    onChange(
      selected.includes(name)
        ? selected.filter((n) => n !== name)
        : [...selected, name]
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-medium">{m.t('splicewire-beam-accounts::messages.tokens_scope_abilities')}</label>
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-warning-foreground">
            <span className="size-1.5 rounded-full bg-warning" /> {m.t('splicewire-beam-accounts::messages.tokens_unscoped_full_access')}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onChange([])}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {m.t('splicewire-beam-accounts::messages.tokens_selected_clear', { count: selected.length })}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.t('splicewire-beam-accounts::messages.tokens_filter_permissions')}
          className="h-8 pl-8 text-[12.5px]"
        />
      </div>

      <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border p-2.5">
        {groups.length === 0 && (
          <p className="text-[12.5px] text-muted-foreground">
            {m.t('splicewire-beam-accounts::messages.tokens_no_scopable')}
          </p>
        )}
        {groups.map((group) => {
          const perms = group.permissions.filter(
            (p) => !q || p.toLowerCase().includes(q)
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
                        : [...new Set([...selected, ...perms])]
                    )
                  }
                  className="text-[10.5px] text-primary hover:underline"
                >
                  {allOn ? m.t('splicewire-beam-accounts::messages.tokens_clear_group') : m.t('splicewire-beam-accounts::messages.tokens_select_all')}
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
                          : "border-border text-muted-foreground hover:bg-muted"
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
        {m.t('splicewire-beam-accounts::messages.tokens_leave_unselected')}
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
  const m = useBeamAccountsMessages();
  const scopeSchema = useMemo(() => tokenScopeSchemaFor(m), [m]);
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
            <KeyRound className="size-4 text-primary" /> {m.t('splicewire-beam-accounts::messages.tokens_new_api_token')}
          </DialogTitle>
          <DialogDescription>
            {m.t('splicewire-beam-accounts::messages.tokens_create_description')}
          </DialogDescription>
        </DialogHeader>

        {/* name + expiry: the REAL @schemastud/seam SchemaForm off the schema. */}
        <SchemaForm
          schema={scopeSchema}
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

        {/* Explain the security boundary in product language; the ADR stays in source history. */}
        <div className="flex gap-2.5 rounded-md border border-dashed border-primary/40 bg-primary/[0.04] p-3 text-[12px] leading-relaxed text-muted-foreground">
          <p>
            {m.t('splicewire-beam-accounts::messages.tokens_fewer_permissions')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {m.t('splicewire-beam-accounts::messages.tokens_cancel')}
          </Button>
          <Button onClick={mint} disabled={!name || createToken.isPending}>
            <Plus className="size-4" />{" "}
            {createToken.isPending ? m.t('splicewire-beam-accounts::messages.tokens_minting') : m.t('splicewire-beam-accounts::messages.tokens_mint')}
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
  const m = useBeamAccountsMessages();
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={created !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>
            {m.t('splicewire-beam-accounts::messages.tokens_copy_key_now', { name: created?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {/* The content is a `grid` whose implicit track sizes to its items' min-content. A
            `truncate` (nowrap) key made that min-content the whole secret, so the track grew past
            the dialog and clipped the key box, the notice and Done at its right edge (replay-6
            G3-BEAM-TOKENS). The key now wraps anywhere (`break-all`), and `min-w-0` keeps this
            block from ever setting the track's floor. */}
        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/50 p-2.5">
            <code
              data-slot="revealed-token"
              className="min-w-0 flex-1 break-all whitespace-normal font-mono text-[12.5px]"
            >
              {created?.token}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="flex-none"
              onClick={() => {
                if (created) void navigator.clipboard?.writeText(created.token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              <Copy className="size-3.5" /> {copied ? m.t('splicewire-beam-accounts::messages.tokens_copied') : m.t('splicewire-beam-accounts::messages.tokens_copy')}
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-warning-foreground">
            <span className="size-1.5 flex-none rounded-full bg-warning" />
            {m.t('splicewire-beam-accounts::messages.tokens_only_time')}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{m.t('splicewire-beam-accounts::messages.tokens_done')}</Button>
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
  const m = useBeamAccountsMessages();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[12px] text-muted-foreground">{m.t('splicewire-beam-accounts::messages.tokens_filter_type')}</span>
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
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {m.t(PROVENANCE_LABEL[f])}
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
  m: BeamAccountsMessages
): ColumnDef<ApiTokenData, unknown>[] {
  return [
    {
      id: "name",
      header: m.t('splicewire-beam-accounts::messages.tokens_col_name'),
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
              {t.isCurrent && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {m.t('splicewire-beam-accounts::messages.tokens_this_session')}
                </Badge>
              )}
              {isExpiring(t) && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] text-warning-foreground">
                  <Clock3 className="size-3" /> {m.t('splicewire-beam-accounts::messages.tokens_expiring')}
                </span>
              )}
              {t.archivedAt && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] text-muted-foreground"
                >
                  {m.t('splicewire-beam-accounts::messages.tokens_archived')}
                </Badge>
              )}
            </div>
            {/* The fragment comes first on the second line: two rows can share a name (one owner
                held 24 `dev-login-as` tokens), and this is what tells them apart (K-28). */}
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <TokenFragmentText token={t} />
              <span aria-hidden="true">·</span>
              <span className="truncate">{expiryLabel(t, Date.now(), m)}</span>
            </span>
          </div>
        );
      },
    },
    {
      id: "provenance",
      header: m.t('splicewire-beam-accounts::messages.tokens_col_type'),
      cell: ({ row }) => {
        const p = asProvenance(row.original.provenance);
        return (
          <Badge
            variant={PROVENANCE_BADGE[p]}
            className="font-mono text-[10.5px]"
          >
            {m.t(PROVENANCE_LABEL[p])}
          </Badge>
        );
      },
    },
    {
      id: "scope",
      header: m.t('splicewire-beam-accounts::messages.tokens_col_scope'),
      cell: ({ row }) => <ScopeChips abilities={row.original.abilities} />,
    },
    {
      id: "lastUsedAt",
      header: m.t('splicewire-beam-accounts::messages.tokens_col_last_used'),
      cell: ({ row }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {fmtRelative(row.original.lastUsedAt, m)}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: m.t('splicewire-beam-accounts::messages.tokens_col_created'),
      cell: ({ row }) => (
        <span className="text-[12.5px] text-muted-foreground">
          {fmtDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{m.t('splicewire-beam-accounts::messages.tokens_col_actions')}</span>,
      cell: ({ row }) => {
        const t = row.original;
        // isCurrent renders "—": the server 422 guard made a visible affordance.
        if (t.isCurrent) {
          return (
            <span className="font-mono text-sm text-muted-foreground">—</span>
          );
        }
        const archived = !!t.archivedAt;
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
                <RotateCw className="size-3.5" /> {m.t('splicewire-beam-accounts::messages.tokens_rotate')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={archived ? m.t('splicewire-beam-accounts::messages.tokens_delete_permanently') : m.t('splicewire-beam-accounts::messages.tokens_archive')}
              aria-label={m.t(archived ? 'splicewire-beam-accounts::messages.tokens_delete_named' : 'splicewire-beam-accounts::messages.tokens_archive_named', { name: t.name })}
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
  const m = useBeamAccountsMessages();
  const { renderTokenActivity } = useTokensServices();
  const notify = useNotify();

  const tokensQuery = useTokens();
  const archiveToken = useArchiveToken();
  const deleteToken = usePermanentlyDeleteToken();
  const rotateToken = useRotateToken();
  const revokeOthers = useRevokeOtherSessions();

  const [active, setActive] = useState<Set<TokenProvenance>>(
    () => new Set<TokenProvenance>(["api"])
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
      if (!showArchived && t.archivedAt) continue;
      const p = asProvenance(t.provenance);
      if (p in c) c[p] += 1;
    }
    return c;
  }, [all, showArchived]);

  const rows = useMemo(
    () =>
      all.filter((t) => {
        if (!showArchived && t.archivedAt) return false;
        if (active.size > 0 && !active.has(asProvenance(t.provenance)))
          return false;
        return true;
      }),
    [all, active, showArchived]
  );

  const health = useMemo(() => {
    const live = all.filter((t) => !t.archivedAt);
    return {
      active: live.length,
      expiring: live.filter(isExpiring).length,
      archived: all.filter((t) => t.archivedAt).length,
    };
  }, [all]);

  const otherSessionCount = useMemo(
    () =>
      all.filter(
        (t) => t.provenance === "session" && !t.isCurrent && !t.archivedAt
      ).length,
    [all]
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
      notify({ type: "success", message: m.t('splicewire-beam-accounts::messages.tokens_archived_toast', { name: token.name }) });
    } catch {
      /* host error net */
    }
  }

  async function remove(token: ApiTokenData) {
    try {
      await deleteToken.mutateAsync(token.id);
      notify({ type: "success", message: m.t('splicewire-beam-accounts::messages.tokens_deleted_toast', { name: token.name }) });
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
    () => buildColumns(renderTokenActivity, busy, rotate, archive, remove, m),
    // m: a live locale switch re-renders every header, badge, action label and toast the columns carry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderTokenActivity, busy, m]
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {/* The page's one h1: every host renders this roster as the whole Tokens page. */}
            <h1 className="text-[15px] font-semibold tracking-tight">
              {m.t('splicewire-beam-accounts::messages.tokens_heading')}
            </h1>
            <span className="font-mono text-[11px] text-muted-foreground">
              {m.t('splicewire-beam-accounts::messages.tokens_health', { active: health.active, expiring: health.expiring, archived: health.archived })}
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {m.t('splicewire-beam-accounts::messages.tokens_description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {otherSessionCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              title={m.t('splicewire-beam-accounts::messages.tokens_revoke_others_title')}
              onClick={sweepSessions}
            >
              {m.choice('splicewire-beam-accounts::messages.tokens_revoke_other_count', otherSessionCount)}
            </Button>
          )}
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> {m.t('splicewire-beam-accounts::messages.tokens_new_token')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FacetBar active={active} counts={counts} onToggle={toggleFacet} />
        <div className="flex items-center gap-3">
          {active.size === 0 && (
            <span className="text-[12px] text-muted-foreground">
              {m.t('splicewire-beam-accounts::messages.tokens_showing_all_types')}
            </span>
          )}
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-primary"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            {m.t('splicewire-beam-accounts::messages.tokens_show_archived')}
          </label>
        </div>
      </div>

      {tokensQuery.isError ? (
        <p role="alert" className="py-8 text-sm text-destructive">
          {m.t('splicewire-beam-accounts::messages.tokens_load_failed')}
        </p>
      ) : (
        <DataTable
          stackOnMobile
          columns={columns}
          data={rows}
          loading={tokensQuery.isPending}
          rowClassName={(t: ApiTokenData) =>
            t.archivedAt ? "opacity-60" : undefined
          }
          emptyMessage={
            all.length === 0
              ? m.t('splicewire-beam-accounts::messages.tokens_empty')
              : m.t('splicewire-beam-accounts::messages.tokens_empty_filtered')
          }
        />
      )}

      {/* The "log out everywhere else" teaching — Session-provenance ONLY. */}
      <div className="flex gap-2.5 rounded-md border border-warning/40 bg-warning/[0.06] p-3 text-[12.5px] leading-relaxed text-muted-foreground">
        <span className="mt-0.5 text-xs font-medium text-warning-foreground">
          {m.t('splicewire-beam-accounts::messages.tokens_browser_sessions')}
        </span>
        <p>
          {richMessage(m, 'splicewire-beam-accounts::messages.tokens_revoke_others_explainer', { action: <b className="text-foreground">{m.t('splicewire-beam-accounts::messages.tokens_revoke_others')}</b> })}
        </p>
      </div>

      <CreateTokenDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onMinted={setMinted}
      />
      <RevealOnceDialog
        created={minted}
        title={m.t('splicewire-beam-accounts::messages.tokens_created_title', { name: minted?.name ?? "" })}
        onOpenChange={(open) => !open && setMinted(null)}
      />
      <RevealOnceDialog
        created={rotated}
        title={m.t('splicewire-beam-accounts::messages.tokens_rotated_title')}
        onOpenChange={(open) => !open && setRotated(null)}
      />
    </div>
  );
}
