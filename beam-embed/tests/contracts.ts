import type { RetentionPostureData } from '@splicewire/beam-resources/types/embed-retention';
// @ts-expect-error retention windows retain their generated numeric wire contract
const invalidDays: RetentionPostureData['chats'][number]['retention_days'] = 'ninety';
void invalidDays;
