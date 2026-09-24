import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Info,
  Mail,
  Plus,
  RotateCcw,
  ShieldAlert,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  buttonVariants,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SimpleSelect,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  DataTable,
  cn,
} from "@schemastud/ui";
import {
  useTeamMembers,
  useTeamInvitations,
  useTeamRoles,
  useRemoveMember,
  useRevokeInvitation,
  useSendInvitation,
  useUpdateMemberRole,
  useResendInvitation,
} from "./team-hooks";
import type { RoleOption } from "./team-types";
import { mergeRoster, ownerCount, type RosterRow } from "./team-roster";

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}
function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const FACETS = ["All", "Members", "Pending"] as const;
type Facet = (typeof FACETS)[number];

export function TeamPage({
  currentUserId,
  createTeamHref,
}: {
  currentUserId: string | null;
  /** The host's `teams.create` page. Given ⇒ a "New team" link beside the invite control. */
  createTeamHref?: string | null;
}) {
  return (
    <TeamInner currentUserId={currentUserId} createTeamHref={createTeamHref} />
  );
}

type ConfirmIntent = { kind: "remove" | "revoke" | "transfer"; row: RosterRow };

function TeamInner({
  currentUserId,
  createTeamHref,
}: {
  currentUserId: string | null;
  createTeamHref?: string | null;
}) {
  // Generated SDK reads (client-sdk-codegen 05). The role vocabulary is server-derived from the
  // beam-accounts Role enum and never changes within a session, so `staleTime: Infinity` rides the
  // generated hook's options passthrough exactly as the hand-written hook set it.
  const membersQuery = useTeamMembers();
  const invitationsQuery = useTeamInvitations();
  const roles = useTeamRoles();

  const memberRows = membersQuery.data ?? [];
  const inviteRows = invitationsQuery.data ?? [];
  const assignableRoles = roles.data?.assignable ?? [];
  const invitableRoles = roles.data?.invitable ?? [];

  const myRole = memberRows.find((m) => m.id === currentUserId)?.role;
  const isOwner = myRole === "owner"; // manageMembers = owner-only (role change / remove / transfer)
  const canInvite = myRole === "owner" || myRole === "admin"; // manageInvitations = owner|admin

  const owners = ownerCount(memberRows);
  const lastOwner = owners <= 1;

  const roster = useMemo(
    () => mergeRoster(memberRows, inviteRows, currentUserId),
    [memberRows, inviteRows, currentUserId],
  );

  const [facet, setFacet] = useState<Facet>("All");
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmIntent | null>(null);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();

  const counts: Record<Facet, number> = {
    All: roster.length,
    Members: roster.filter((r) => r.kind === "member").length,
    Pending: roster.filter((r) => r.kind === "invitation").length,
  };
  const rows = roster.filter((r) =>
    facet === "All"
      ? true
      : facet === "Members"
        ? r.kind === "member"
        : r.kind === "invitation",
  );

  const changeRole = (row: RosterRow, next: string) => {
    if (next === String(row.role)) return;
    // Assigning `owner` = ownership transfer → high-stakes confirm.
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

  const columns: ColumnDef<RosterRow, unknown>[] = useMemo(
    () => [
      {
        id: "identity",
        header: "Name / email",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="min-w-0">
              <div className="truncate font-medium">
                {r.name ?? r.email}
                {r.isSelf && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {r.email}
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: () => (
          <span className="inline-flex items-center gap-1">
            Workspace role
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="About workspace roles"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm font-normal">
                <p className="leading-relaxed text-muted-foreground">
                  <b className="text-foreground">Membership tier</b> (owner /
                  admin / member) — governs who manages the team. Separate from
                  what you can access inside the workspace.
                </p>
              </PopoverContent>
            </Popover>
          </span>
        ),
        cell: ({ row }) => {
          const r = row.original;
          // Pending invites carry a role but aren't editable (no member yet); and
          // non-owners always see a read-only badge (manageMembers = owner-only).
          if (r.kind === "invitation" || !isOwner) {
            return (
              <Badge variant="secondary" className="capitalize">
                {r.role}
              </Badge>
            );
          }
          const disabledSelf = r.isSelf && lastOwner; // last owner can't demote self
          return (
            <div className="flex items-center gap-1.5">
              <SimpleSelect
                className="h-8 w-32 capitalize"
                value={String(r.role)}
                disabled={disabledSelf || updateRole.isPending}
                onValueChange={(next) => changeRole(r, next)}
                options={assignableRoles}
              />
              {disabledSelf && (
                <span
                  title="min-1-owner: you are the last owner and can't demote yourself"
                  className="text-muted-foreground"
                >
                  <ShieldAlert className="size-3.5" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.status} />,
      },
      {
        id: "since",
        header: "Joined / invited",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="text-muted-foreground">
              {r.kind === "member"
                ? formatDate(r.since)
                : `Invited ${formatDate(r.since)}`}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const r = row.original;
          // Pending invite → resend + revoke (owner|admin = manageInvitations).
          if (r.kind === "invitation") {
            if (!canInvite) return null;
            return (
              <div className="flex items-center justify-end gap-1">
                <ResendInvitationAction row={r} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  aria-label={`Revoke invitation for ${r.email}`}
                  disabled={revokeInvitation.isPending}
                  onClick={() => setConfirm({ kind: "revoke", row: r })}
                >
                  <X />
                </Button>
              </div>
            );
          }
          // Member → remove (owner-only = manageMembers; last-owner locked).
          if (!isOwner) return null;
          const lockRemove = r.role === "owner" && lastOwner;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive disabled:opacity-40"
              aria-label={`Remove ${r.email}`}
              disabled={lockRemove || removeMember.isPending}
              title={
                lockRemove
                  ? "min-1-owner: the last owner can’t be removed"
                  : undefined
              }
              onClick={() => setConfirm({ kind: "remove", row: r })}
            >
              <UserMinus />
            </Button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isOwner,
      canInvite,
      lastOwner,
      assignableRoles,
      updateRole.isPending,
      removeMember.isPending,
      revokeInvitation.isPending,
    ],
  );

  const readError = membersQuery.error ?? invitationsQuery.error ?? roles.error;
  if (readError) {
    return (
      <p role="alert" className="py-8 text-sm text-destructive">
        {apiErrorMessage(readError, "Could not load the team.")}
      </p>
    );
  }
  if (membersQuery.isPending || invitationsQuery.isPending || roles.isPending) {
    return <p className="py-8 text-sm text-muted-foreground">Loading team…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">
            People and pending invitations for this workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {createTeamHref ? (
            <a
              href={createTeamHref}
              className={buttonVariants({ variant: "outline" })}
            >
              <Plus className="size-4" /> New team
            </a>
          ) : null}
          {canInvite && (
            <Button onClick={() => setInviting(true)}>
              <UserPlus className="size-4" /> Invite member
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FacetsBar active={facet} counts={counts} onSelect={setFacet} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="size-3.5" />
          {owners} owner{owners === 1 ? "" : "s"} · min-1-owner enforced
        </span>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No one in this segment yet."
      />

      {/* Invite composer — a hand-built email + role form posting the invitations endpoint. */}
      <Sheet open={inviting} onOpenChange={setInviting}>
        <SheetContent className="flex flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="size-4" /> Invite member
            </SheetTitle>
            <SheetDescription>
              Invite someone by email — they join with the role you pick.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <InviteForm
              roles={invitableRoles}
              onSent={() => setInviting(false)}
              onCancel={() => setInviting(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Destructive + ownership-transfer confirms. */}
      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <DialogContent>
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {confirm.kind === "transfer" ? (
                    <>
                      <ShieldAlert className="size-4 text-warning" /> Transfer
                      ownership
                    </>
                  ) : confirm.kind === "remove" ? (
                    <>
                      <UserMinus className="size-4 text-destructive" /> Remove
                      member
                    </>
                  ) : (
                    <>
                      <X className="size-4 text-destructive" /> Revoke
                      invitation
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {confirm.kind === "transfer" ? (
                    <>
                      Assign <b>Owner</b> to{" "}
                      <b>{confirm.row.name ?? confirm.row.email}</b>? This is a
                      high-stakes change — they gain full workspace control.
                    </>
                  ) : confirm.kind === "remove" ? (
                    <>
                      Remove <b>{confirm.row.name ?? confirm.row.email}</b> from
                      this workspace?
                    </>
                  ) : (
                    <>
                      Revoke the pending invitation for{" "}
                      <b>{confirm.row.email}</b>?
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={
                    confirm.kind === "transfer" ? "default" : "destructive"
                  }
                  onClick={runConfirm}
                >
                  {confirm.kind === "transfer"
                    ? "Transfer ownership"
                    : confirm.kind === "remove"
                      ? "Remove member"
                      : "Revoke invitation"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Hand-built invite composer: email + real workspace-role select → POST invitations.send. */
function InviteForm({
  roles,
  onSent,
  onCancel,
}: {
  roles: RoleOption[];
  onSent: () => void;
  onCancel: () => void;
}) {
  const send = useSendInvitation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(() => roles[0]?.value ?? "member");

  const valid = email.trim().length > 0 && role.length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    send.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail("");
          onSent();
        },
      },
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@example.com"
          autoComplete="off"
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="invite-role">Workspace role</Label>
        <SimpleSelect
          id="invite-role"
          className="capitalize"
          value={role}
          onValueChange={setRole}
          options={roles}
          placeholder="Select a role"
        />
      </div>

      {send.isError && (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(send.error, "Could not send the invitation.")}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || send.isPending}>
          {send.isPending ? "Sending…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}

/** Status = dot + label on a tinted ground (never colour-alone). */
function StatusPill({ status }: { status: RosterRow["status"] }) {
  const pending = status === "Pending";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]",
        pending
          ? "border-warning/40 bg-warning/10 text-warning-foreground"
          : "border-primary/25 bg-primary/5 text-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          pending ? "bg-warning" : "bg-primary",
        )}
      />
      {status}
    </span>
  );
}

/** A FacetsBar-style segmenter (All / Members / Pending) over the merged roster. */
function FacetsBar({
  active,
  counts,
  onSelect,
}: {
  active: Facet;
  counts: Record<Facet, number>;
  onSelect: (f: Facet) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-sm">
      {FACETS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onSelect(f)}
          className={cn(
            "rounded px-3 py-1 font-medium transition-colors",
            f === active
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {f}
          <span className="ml-1.5 text-xs text-muted-foreground">
            {counts[f]}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Re-send a pending invite's email — low-stakes (no confirm); shows a transient "Sent". */
function ResendInvitationAction({ row }: { row: RosterRow }) {
  // A resend does not mutate the roster (same bearer token, same mail), so there is nothing
  // host-side to compose and the generated hook is consumed directly.
  const resend = useResendInvitation();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={`Resend invitation for ${row.email}`}
      disabled={resend.isPending}
      title={resend.isSuccess ? "Sent" : "Resend invitation"}
      onClick={() => resend.mutate(row.id)}
    >
      {resend.isSuccess ? <Check className="text-primary" /> : <RotateCcw />}
    </Button>
  );
}
