import type { MemberRole, TenantInvitation, TenantMember } from "./team-types";

export type RosterKind = "member" | "invitation";
export type RosterStatus = "Active" | "Pending";

export interface RosterRow {
  id: string;
  kind: RosterKind;
  status: RosterStatus;
  name: string | null;
  email: string;
  role: MemberRole | string;
  /** ISO — `joinedAt` for members, `createdAt` (invited-at) for pending invitations. */
  since: string | null;
  /** True only for the caller's own member row (self-action guards). */
  isSelf: boolean;
}

export function mergeRoster(
  memberRows: TenantMember[],
  inviteRows: TenantInvitation[],
  selfId: string | null,
): RosterRow[] {
  const memberR: RosterRow[] = memberRows.map((m) => ({
    id: m.id,
    kind: "member",
    status: "Active",
    name: m.name,
    email: m.email,
    role: m.role,
    since: m.joinedAt,
    isSelf: m.id === selfId,
  }));
  const inviteR: RosterRow[] = inviteRows
    .filter((i) => !i.acceptedAt)
    .map((i) => ({
      id: i.id,
      kind: "invitation",
      status: "Pending",
      name: null,
      email: i.email,
      role: i.role,
      since: i.createdAt,
      isSelf: false,
    }));
  return [...memberR, ...inviteR];
}

/** Count of `owner` pivot rows — the min-1-owner invariant reads off this to lock the last owner. */
export function ownerCount(memberRows: TenantMember[]): number {
  return memberRows.filter((m) => m.role === "owner").length;
}
