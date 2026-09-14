// A missing or empty projection must fail before this package can be packed.
import type { AutoReloadConfigData } from '../types/auto-reload';
import type { BeamUxEntryBodyData } from '../types/beam-ux';
import type { SubscriptionData, UsageSummaryData } from '../types/commerce';

export type RequiredPublicContract =
  | BeamUxEntryBodyData
  | AutoReloadConfigData
  | SubscriptionData
  | UsageSummaryData;
