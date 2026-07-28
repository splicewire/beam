// @splicewire/beam-transforms — the transforms-domain beam surface (popcorn-runner-substrate
// ticket 09; ADR-0116 rehome-ui + ADR-0141). The RunnerTransform authoring editor for sandboxed,
// user-authored transforms. A host renders it by supplying ONE transport adapter (+ optional
// feedback / chrome) through <TransformsProvider>; the react-query data logic, the DTO typing, and
// the presentation travel inside the package.

export { TransformsProvider, useTransformsServices, useNotify } from './provider';
export { RunnerTransformEditor } from './runner-transform-editor';
export {
    useTransforms,
    useCreateTransform,
    useUpdateTransform,
    useDeleteTransform,
    useTestTransform,
} from './hooks';
export type {
    RunnerTransform,
    RunnerTransformInput,
    RunnerTransformResult,
    TransformsClient,
    TransformsServices,
    NotifyEvent,
} from './types';
