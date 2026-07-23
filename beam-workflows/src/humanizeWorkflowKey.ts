/**
 * Turn a machine workflow key (`review_gate`, `status.emitted`, `publish-flow`) into a human
 * label (`Review gate`). Extracted from `WorkflowStepper` into its own pure module (slice 02
 * prefactor) so `WorkflowEditor` (slice 04) imports the helper, not the real-time Stepper — the
 * app twin's `import { humanizeWorkflowKey } from './WorkflowStepper'` would have coupled the
 * schema-form editor to the Echo-subscribing Stepper for one string transform.
 */
export function humanizeWorkflowKey(key: string): string {
    const spaced = key.replace(/[_.-]+/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
