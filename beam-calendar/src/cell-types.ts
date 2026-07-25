// The rehomed CalendarCellForm surface's type seam (frame-canonical-forms ticket 02) — the
// composition-cell DTO re-export + the four-kind injection contract for the form. Kept in its own
// module (not folded into the calendar-grid `types.ts`) because the form and the grid are two
// distinct surfaces sharing one package; a host that only mounts the grid never pulls the form's
// service interfaces.
//
// DTO SOURCE (rehome-ui §profile): the composition-cell read-model travels in from
// @splicewire/_resources — the projection sliced off the app's single generated.d.ts by the
// `resources:splicewire` pipeline — NEVER a local copy. tsup keeps the `import type` in the shipped
// dist so the PHP source of truth genuinely travels into the package.
import type { CompositionCellData } from '@splicewire/_resources/types/cell';

export type { CompositionCellData };

/**
 * The form-facing cell shape. Structurally the generated {@link CompositionCellData}, but with the
 * two per-profile payloads narrowed from the lossy spatie array-cast (`Array<any>`) to the JSON
 * object map the wire actually delivers — the studio/api.ts precedent. `slots.kind`/`slots.anchor`/
 * `slots.composition_id` etc. are read as object keys, so an `Array<any>` type would be unusable.
 * DTO typing is generic with a default bound to the projection (rehome-ui §profile).
 */
export type CalendarCell<T extends CompositionCellData = CompositionCellData> = Omit<T, 'slots' | 'output' | 'children'> & {
    slots: Record<string, unknown> | null;
    output: Record<string, unknown> | null;
    children?: CalendarCell[] | null;
};

/**
 * A calendar profile's Kind descriptor — the `/composition-profiles` config the form reads to
 * resolve a short suffix (`series`) to its REAL full schema-$id URL (…/kind/series), which the
 * write path admits on. Config-shaped (no server Data class), so declared here, not projected.
 */
export interface CalendarCellKind {
    kind: string;
    label?: string;
    schema?: Record<string, unknown>;
}

/** The calendar profile descriptor the form needs (only the Kind list matters to it). */
export interface CalendarProfile {
    name: string;
    cellKinds: CalendarCellKind[];
}

/** The write payload the form posts — a create (with `lane`) or an edit (targeting a `cellId`). */
export interface SaveCellInput {
    /** Present ⇒ edit that stored cell; absent ⇒ create a new cell. */
    cellId?: string | null;
    /** The delivery lane a new cell lands on (create only). */
    lane?: string;
    /** The profile-typed cell payload (the compartment truth). */
    slots: Record<string, unknown>;
}

/**
 * A server field-validation failure (422) surfaced by the injected client so the form can map
 * `slots.*` errors onto its fields. The client THROWS this (or any error carrying `.fieldErrors` /
 * `.message`); the form never inspects an HTTP response shape.
 */
export interface CellClientError {
    /** Per-field messages keyed by `slots.<field>` (or bare `<field>`); first message wins. */
    fieldErrors?: Record<string, string[]>;
    /** A whole-form message (an admission RuntimeException, a non-422 failure). */
    message?: string;
}

/**
 * The transport the HOST injects (rehome-ui `client`, REQUIRED). A composition-scoped IO seam:
 * relative endpoints only, `compositionId` is a call arg (never a bundled route). The form's
 * react-query layer (hooks.ts) calls THIS — all URL/route()/axios concerns live in the host adapter
 * that fills it. On a save failure the adapter throws a {@link CellClientError} (not a raw axios
 * error) so the form stays HTTP-agnostic.
 */
export interface CalendarCellClient<T extends CompositionCellData = CompositionCellData> {
    /** All cells of a composition — the form reads placed channels off these. */
    listCells(compositionId: string): Promise<CalendarCell<T>[]>;
    /** The composition profiles — the form resolves calendar Kind ids off these. */
    listProfiles(): Promise<CalendarProfile[]>;
    /** Create or edit a cell on a composition. */
    saveCell(compositionId: string, input: SaveCellInput): Promise<void>;
}

/** The success/failure feedback message the form emits (rehome-ui `notify`). */
export interface CellNotifyMessage {
    kind: 'success' | 'error';
    text: string;
}

/** What the host renders into the "pick a composition to point at" slot (rehome-ui `renderX`). */
export interface CellContentPickerProps {
    /** The currently-selected composition id, or '' for none. */
    value: string;
    /** The human title of the selection (may be '' — the picker resolves it). */
    label: string;
    /** The calendar's own id — a calendar can't schedule itself. */
    excludeId?: string;
    onSelect: (option: { id: string; title: string }) => void;
}

/**
 * The four-kind service bundle the {@link CalendarCellFormProvider} injects. Drawn ONLY from the
 * four injection kinds (rehome-ui §profile): `client` (REQUIRED), `notify`/`onError` (feedback,
 * optional, dep-free default), `renderContentPicker` (a `renderX` host-chrome slot, optional),
 * `subscribe` (none — omitted). No fifth kind.
 */
export interface CalendarCellFormServices<T extends CompositionCellData = CompositionCellData> {
    client: CalendarCellClient<T>;
    notify?: (msg: CellNotifyMessage) => void;
    onError?: (err: unknown) => void;
    /** The composition/content picker chrome (the app's `ContentPicker`, over its own combobox). */
    renderContentPicker?: (props: CellContentPickerProps) => import('react').ReactNode;
}
