// GENERATED — do not edit by hand.
// Projected from generated TypeScript via resources:beam.

export type RetentionPostureChatData = {
id: string,
title: string | null,
retention_days: number,
corpus_optin: boolean,
};

export type RetentionPostureData = {
default_days: number,
chats: RetentionPostureChatData[],
};

export type PruneResultData = {
pruned: number,
};

export type PrunePreviewData = {
would_prune: number,
};

export type EraseResultData = {
erased: number,
};
