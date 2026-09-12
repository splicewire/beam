// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type AuthEntryPageData = {
slug: string,
entry: PageEntryData | null,
body: Record<string, any>[] | null,
canResetPassword: undefined | boolean,
status: undefined | string | null,
demoAccounts: DemoAccountLinkData[] | undefined,
passwordRules: undefined | string,
};

export type DemoAccountLinkData = {
key: string,
label: string,
url: string,
};

export type PageEntryData = {
id: string,
slug: string,
format: string | null,
artifact: PageEntryArtifactData | null,
};

export type PageEntryArtifactData = {
url: string,
version: string | null,
};

export type ProfilePageData = {
entry: PageEntryData | null,
mustVerifyEmail: boolean,
status: string | null,
};

export type ResetPasswordPageData = {
slug: string,
entry: PageEntryData | null,
body: Record<string, any>[] | null,
email: string | Record<string | number, any> | object | null,
token: string | null,
passwordRules: string,
};

export type SecurityPageData = {
canManageTwoFactor: boolean,
canManagePasskeys: boolean,
passkeys: SecurityPasskeyData[],
passwordRules: string,
twoFactorEnabled: undefined | boolean,
requiresConfirmation: undefined | boolean,
};

export type SecurityPasskeyData = {
id: number,
name: string,
authenticator: string | null,
created_at_diff: string,
last_used_at_diff: string | null,
};
