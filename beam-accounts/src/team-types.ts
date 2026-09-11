import type {
  InvitationData,
  MembershipData,
  RoleOptionData,
  RoleOptionsData,
} from "@splicewire/beam-resources/types/accounts";
import type { NotifyEvent } from "./types";
export type RoleOption = RoleOptionData;
export type MemberRole = "owner" | "admin" | "member";
export type TenantMember = MembershipData;
export type TenantInvitation = Pick<
  InvitationData,
  "id" | "email" | "role" | "acceptedAt" | "createdAt"
>;
export interface TeamClient {
  members(): Promise<TenantMember[]>;
  invitations(): Promise<TenantInvitation[]>;
  roles(): Promise<RoleOptionsData>;
  updateRole(input: { userId: string; role: string }): Promise<unknown>;
  removeMember(id: string): Promise<unknown>;
  sendInvitation(input: { email: string; role: string }): Promise<unknown>;
  revokeInvitation(id: string): Promise<unknown>;
  resendInvitation(id: string): Promise<unknown>;
}
export interface TeamServices {
  client: TeamClient;
  notify?: (event: NotifyEvent) => void;
  onError?: (error: unknown) => void;
}
