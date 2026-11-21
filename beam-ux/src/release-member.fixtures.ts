import type { ReleaseRecord } from "./releases";

type ReleaseMember = ReleaseRecord["members"][number];

/**
 * An entry Release member for tests and stories. Ticket 11 made `kind` / `ref` / `label` / `entryType` required on the
 * wire; this helper fills them for an entry member (kind `"entry"`, `entryType: "page"`, ref and label defaulting to the
 * entry id) so a fixture only states what it cares about. Override `entryType` for a theme/component/etc. For a config
 * member (null entryId, null entryType), build the object directly — the tests' own `configMember` factory does.
 */
export function entryMember(
  over: Partial<ReleaseMember> & { entryId: string },
): ReleaseMember {
  return {
    versionId: null,
    observedPin: null,
    redirectTarget: null,
    stale: false,
    kind: "entry",
    ref: over.entryId,
    label: over.entryId,
    entryType: "page",
    ...over,
  };
}
