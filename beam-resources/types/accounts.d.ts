// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type MembershipData = {
id: string,
name: string | null,
email: string,
role: string,
joinedAt: string | null,
};

export type InvitationData = {
id: string,
email: string,
role: string,
acceptedAt: string | null,
createdAt: string | null,
invitedBy: string | null,
updatedAt: string | null,
};

export type RoleOptionData = {
value: string,
label: string,
};

export type RoleOptionsData = {
assignable: RoleOptionData[],
invitable: RoleOptionData[],
};
