import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TeamProvider } from "./team-provider";
import type { TeamClient, TenantMember, TenantInvitation } from "./team-types";
export const TEAM_MEMBERS: TenantMember[] = [
  {
    id: "owner",
    name: "Ada Lovelace",
    email: "ada@example.test",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "member",
    name: "Grace Hopper",
    email: "grace@example.test",
    role: "member",
    joinedAt: "2026-02-01T00:00:00Z",
  },
];
export const TEAM_INVITATIONS: TenantInvitation[] = [
  {
    id: "invite",
    email: "alex@example.test",
    role: "member",
    acceptedAt: null,
    createdAt: "2026-09-01T00:00:00Z",
  },
];
export function makeTeamClient(
  members = TEAM_MEMBERS,
  invitations = TEAM_INVITATIONS,
): TeamClient {
  return {
    members: async () => members,
    invitations: async () => invitations,
    roles: async () => ({
      assignable: [
        { value: "owner", label: "Owner" },
        { value: "admin", label: "Admin" },
        { value: "member", label: "Member" },
      ],
      invitable: [
        { value: "admin", label: "Admin" },
        { value: "member", label: "Member" },
      ],
    }),
    updateRole: async () => undefined,
    removeMember: async () => undefined,
    sendInvitation: async () => undefined,
    revokeInvitation: async () => undefined,
    resendInvitation: async () => undefined,
  };
}
export function MockTeamProvider({
  children,
  client = makeTeamClient(),
}: {
  children: ReactNode;
  client?: TeamClient;
}) {
  const [cache] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={cache}>
      <TeamProvider services={{ client }}>{children}</TeamProvider>
    </QueryClientProvider>
  );
}
