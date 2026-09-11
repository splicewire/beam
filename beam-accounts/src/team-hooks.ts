import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeamServices } from "./team-provider";
import type { TeamClient } from "./team-types";

const membersKey = ["beam.accounts.members.index"];
const invitationsKey = ["beam.accounts.invitations.index"];
export function useTeamMembers() {
  const { client } = useTeamServices();
  return useQuery({ queryKey: membersKey, queryFn: () => client.members() });
}
export function useTeamInvitations() {
  const { client } = useTeamServices();
  return useQuery({
    queryKey: invitationsKey,
    queryFn: () => client.invitations(),
  });
}
export function useTeamRoles() {
  const { client } = useTeamServices();
  return useQuery({
    queryKey: ["beam.accounts.members.roles"],
    queryFn: () => client.roles(),
    staleTime: Infinity,
  });
}
function useTeamMutation<T>(
  run: (client: TeamClient, input: T) => Promise<unknown>,
  key?: string[],
) {
  const { client, onError } = useTeamServices();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => run(client, input),
    onError,
    onSuccess: async () => {
      if (key) await cache.invalidateQueries({ queryKey: key });
    },
  });
}
export function useUpdateMemberRole() {
  return useTeamMutation(
    (client, input: { userId: string; role: string }) =>
      client.updateRole(input),
    membersKey,
  );
}
export function useRemoveMember() {
  return useTeamMutation(
    (client, id: string) => client.removeMember(id),
    membersKey,
  );
}
export function useSendInvitation() {
  return useTeamMutation(
    (client, input: { email: string; role: string }) =>
      client.sendInvitation(input),
    invitationsKey,
  );
}
export function useRevokeInvitation() {
  return useTeamMutation(
    (client, id: string) => client.revokeInvitation(id),
    invitationsKey,
  );
}
export function useResendInvitation() {
  return useTeamMutation((client, id: string) => client.resendInvitation(id));
}
