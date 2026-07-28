// @splicewire/beam-commerce — the commerce-domain beam surfaces, authored pre-packaged and
// DTO-first (rehome-ui; ADR-0116 vendor seam). Mirrors PHP `splicewire/laravel-beam-commerce`.
//
// Customer-zero: the prepaid-credit auto-reload config + activity surface. A host renders it by
// supplying ONE transport adapter (+ optional feedback / the Stripe SetupIntent host slot)
// through <AutoReloadProvider>; everything else — the react-query data logic, the DTO typing off
// the generated projection, the presentation — travels inside the package.

export {
    AutoReloadProvider,
    useAutoReloadServices,
    useNotify,
    useSavePaymentMethod,
} from './provider';
export { useAutoReloadConfig, useAutoReloadActivity, useUpdateAutoReloadConfig } from './hooks';
export { AutoReloadConfigCard } from './AutoReloadConfigCard';
export { ReloadActivityCard } from './ReloadActivityCard';
export { formatUsd, formatDate, errorMessage } from './format';
export type {
    AutoReloadConfigData,
    AutoReloadClampsData,
    AutoReloadActivityData,
    AutoReloadAttemptData,
    AutoReloadStatus,
    AmountMode,
    PaymentMethodSource,
    AttemptOutcome,
    AutoReloadClamps,
    AutoReloadConfig,
    AutoReloadAttempt,
    AutoReloadActivity,
    AutoReloadConfigUpdate,
    AutoReloadClient,
    AutoReloadServices,
    NotifyEvent,
} from './types';
