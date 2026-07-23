import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, CardContent, Input, Label, SimpleSelect, Switch } from '@schemastud/ui';
import type { BlueprintDraft, BlueprintTransition, GuardCatalogEntry } from './blueprint';
import {
    attachEffect,
    detachEffect,
    effectHasParams,
    effectNeedsSetup,
    effectParamsOf,
    type ParamBag,
    setEffectParams,
} from './effectParams';
import { humanizeWorkflowKey } from './humanizeWorkflowKey';
import type { PrincipalKind } from './principals';
import { RecipientPicker } from './RecipientPicker';
import { WorkflowGraph } from './WorkflowGraph';

/**
 * The `<WorkflowEditor>` (beam-workflows v2 ticket 08): a SCHEMA-FORM over the WorkflowBlueprint
 * shape — NOT a bespoke canvas (`universal-editor-is-consolidation-not-greenfield`: the
 * schema→editor binding IS the wedge). An author edits places, transitions (from/to), the initial
 * marking, and per-transition guard refs PICKED FROM THE CATALOG with their params.
 *
 * The code-only security line is enforced by construction: a guard is chosen from the catalog
 * dropdown (never typed as code), and its params render from the guard's own params schema. Saving
 * posts the blueprint to the server, which validates (referential integrity + guard membership) and
 * FORKS a new immutable version — existing pins are never rewritten. A server field error is
 * surfaced inline.
 */

// The read-model shapes (`BlueprintDraft` / `BlueprintTransition` / `GuardCatalogEntry`) and the
// `toDraft` normalizer live in `./blueprint`, aliased to the generated `Workflow*Data` DTOs, so the
// editor stays in lockstep with the backend and shares them with the diff/migrate/logic modules
// without any of them coupling back to this 581-line component.

/** The shape of a guard's params-schema properties the editor renders inputs from. */
type ParamProperties = Record<string, { type?: string; title?: string; default?: unknown }>;

export function WorkflowEditor({
    initial,
    guards,
    effects = [],
    principals = [],
    saving = false,
    error,
    onSave,
}: {
    initial: BlueprintDraft;
    guards: GuardCatalogEntry[];
    /** The post-transition effect catalog (notifications, webhooks) — same shape as guards. */
    effects?: GuardCatalogEntry[];
    /** The recipient-picker vocabulary (ticket 17) — `catalog.principals`, for array effect params. */
    principals?: PrincipalKind[];
    saving?: boolean;
    error?: string | null;
    onSave: (blueprint: BlueprintDraft) => void;
}) {
    const [draft, setDraft] = useState<BlueprintDraft>(initial);
    const [view, setView] = useState<'edit' | 'graph'>('edit');
    const guardByName = useMemo(() => Object.fromEntries(guards.map((g) => [g.name, g])), [guards]);

    function patch(next: Partial<BlueprintDraft>) {
        setDraft((d) => ({ ...d, ...next }));
    }

    function addPlace() {
        const name = `place_${draft.places.length + 1}`;
        patch({ places: [...draft.places, name] });
    }

    function renamePlace(index: number, value: string) {
        const places = draft.places.slice();
        places[index] = value;
        patch({ places });
    }

    function removePlace(index: number) {
        const place = draft.places[index];
        patch({
            places: draft.places.filter((_, i) => i !== index),
            initial: draft.initial.filter((p) => p !== place),
        });
    }

    function patchTransition(index: number, next: Partial<BlueprintTransition>) {
        const transitions = draft.transitions.slice();
        transitions[index] = { ...transitions[index], ...next };
        patch({ transitions });
    }

    function addTransition() {
        patch({
            transitions: [
                ...draft.transitions,
                {
                    name: `transition_${draft.transitions.length + 1}`,
                    from: [],
                    to: [],
                    guard: null,
                    effects: [],
                    metadata: null,
                },
            ],
        });
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Edit / Graph tabs — the schema-form is the authoring seam; the graph is a read-only
                legibility view of the same draft (ticket 18). */}
            <div className="flex gap-1 border-b border-[var(--swc-ink-08)]">
                {(['edit', 'graph'] as const).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setView(tab)}
                        aria-pressed={view === tab}
                        className={`-mb-px border-b-2 px-3 py-1.5 text-sm capitalize ${
                            view === tab
                                ? 'border-[var(--swc-green)] text-[var(--swc-ink-80)]'
                                : 'border-transparent text-[var(--swc-ink-45)] hover:text-[var(--swc-ink-60)]'
                        }`}
                    >
                        {tab === 'graph' ? 'Graph' : 'Edit'}
                    </button>
                ))}
            </div>

            {view === 'graph' && <WorkflowGraph blueprint={draft} />}

            {view === 'edit' && (
                <>
                    {/* Places */}
                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--swc-ink-45)] uppercase">
                                Places
                            </h3>
                            <Button size="sm" variant="ghost" onClick={addPlace}>
                                <Plus className="size-3" /> Add place
                            </Button>
                        </div>
                        {draft.places.map((place, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    className="flex-1"
                                    value={place}
                                    aria-label={`Place ${index + 1} name`}
                                    onChange={(e) => renamePlace(index, e.target.value)}
                                />
                                <label className="flex items-center gap-1.5 text-xs text-[var(--swc-ink-50)]">
                                    <input
                                        type="radio"
                                        name="initial"
                                        className="accent-[var(--swc-green)]"
                                        checked={draft.initial.includes(place)}
                                        onChange={() => patch({ initial: [place] })}
                                    />
                                    initial
                                </label>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Remove place ${place}`}
                                    onClick={() => removePlace(index)}
                                >
                                    <Trash2 className="size-3" />
                                </Button>
                            </div>
                        ))}
                    </section>

                    {/* Transitions */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--swc-ink-45)] uppercase">
                                Transitions
                            </h3>
                            <Button size="sm" variant="ghost" onClick={addTransition}>
                                <Plus className="size-3" /> Add transition
                            </Button>
                        </div>
                        {draft.transitions.map((transition, index) => {
                            const guard = transition.guard
                                ? guardByName[transition.guard]
                                : undefined;
                            return (
                                <Card key={index}>
                                    <CardContent className="space-y-3 p-3">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                className="flex-1"
                                                value={transition.name}
                                                aria-label={`Transition ${index + 1} name`}
                                                onChange={(e) =>
                                                    patchTransition(index, { name: e.target.value })
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                aria-label={`Remove transition ${transition.name}`}
                                                onClick={() =>
                                                    patch({
                                                        transitions: draft.transitions.filter(
                                                            (_, i) => i !== index,
                                                        ),
                                                    })
                                                }
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <PlaceSelect
                                                label="From"
                                                places={draft.places}
                                                value={transition.from}
                                                onChange={(from) =>
                                                    patchTransition(index, { from })
                                                }
                                            />
                                            <PlaceSelect
                                                label="To"
                                                places={draft.places}
                                                value={transition.to}
                                                onChange={(to) => patchTransition(index, { to })}
                                            />
                                        </div>
                                        {/* Guard picker — a SELECT over the catalog (never typed code). */}
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[var(--swc-ink-50)]">
                                                Guard
                                            </Label>
                                            <SimpleSelect
                                                className="w-64"
                                                aria-label={`Guard for transition ${transition.name}`}
                                                value={transition.guard ?? ''}
                                                onValueChange={(value) =>
                                                    patchTransition(index, { guard: value || null })
                                                }
                                                options={[
                                                    { value: '', label: '— none —' },
                                                    ...guards.map((g) => ({
                                                        value: g.name,
                                                        label: g.label,
                                                    })),
                                                ]}
                                            />
                                        </div>
                                        {guard && (
                                            <GuardParams
                                                guard={guard}
                                                value={
                                                    (transition.metadata?.guardParams as Record<
                                                        string,
                                                        unknown
                                                    >) ?? {}
                                                }
                                                onChange={(guardParams) =>
                                                    patchTransition(index, {
                                                        metadata: {
                                                            ...transition.metadata,
                                                            guardParams,
                                                        },
                                                    })
                                                }
                                            />
                                        )}
                                        {/* Effects picker — attach post-transition effects (notifications,
                                    webhooks) from the catalog. Like guards: pick by name, never code.
                                    An attached effect that declares params discloses a primitive form
                                    keyed to metadata.effect_params[<ref>] (ticket 16). */}
                                        {effects.length > 0 && (
                                            <div className="space-y-1.5 border-t border-[var(--swc-ink-08)] pt-2">
                                                <Label className="text-[var(--swc-ink-50)]">
                                                    When it fires
                                                </Label>
                                                <div className="flex flex-col gap-1.5">
                                                    {effects.map((e) => (
                                                        <EffectRow
                                                            key={e.name}
                                                            effect={e}
                                                            on={transition.effects.includes(e.name)}
                                                            params={effectParamsOf(
                                                                transition,
                                                                e.name,
                                                            )}
                                                            onToggle={(checked) =>
                                                                patchTransition(
                                                                    index,
                                                                    checked
                                                                        ? attachEffect(
                                                                              transition,
                                                                              e.name,
                                                                          )
                                                                        : detachEffect(
                                                                              transition,
                                                                              e.name,
                                                                          ),
                                                                )
                                                            }
                                                            onParamsChange={(params) =>
                                                                patchTransition(
                                                                    index,
                                                                    setEffectParams(
                                                                        transition,
                                                                        e.name,
                                                                        params,
                                                                    ),
                                                                )
                                                            }
                                                            principals={principals}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>
                </>
            )}

            <div className="flex justify-end">
                <Button disabled={saving} onClick={() => onSave(draft)}>
                    {saving ? 'Saving…' : 'Save as new version'}
                </Button>
            </div>
        </div>
    );
}

function PlaceSelect({
    label,
    places,
    value,
    onChange,
}: {
    label: string;
    places: string[];
    value: string[];
    onChange: (value: string[]) => void;
}) {
    // A single-place lifecycle is the common case; a multi-select supports workflow-nets. Radix
    // has no multi-select primitive, so this stays a native <select multiple>, restyled to match
    // the shadcn Input (border/radius/focus-ring) for visual consistency.
    return (
        <div className="space-y-1">
            <Label className="text-xs text-[var(--swc-ink-50)]">{label}</Label>
            <select
                multiple
                aria-label={label}
                className="block h-24 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                value={value}
                onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value))}
            >
                {places.map((p) => (
                    <option key={p} value={p}>
                        {p}
                    </option>
                ))}
            </select>
        </div>
    );
}

function GuardParams({
    guard,
    value,
    onChange,
}: {
    guard: GuardCatalogEntry;
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
}) {
    const properties = (guard.paramsSchema?.properties ?? {}) as ParamProperties;
    if (Object.keys(properties).length === 0) return null;

    return (
        <div className="space-y-2 rounded-md bg-[var(--swc-ink-05)] p-3">
            <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--swc-ink-45)] uppercase">
                {humanizeWorkflowKey(guard.name)} params
            </div>
            <PrimitiveParamFields properties={properties} value={value} onChange={onChange} />
        </div>
    );
}

/**
 * The per-effect params twin of {@see GuardParams} (beam-workflows-ux tickets 16/17). Its value is keyed
 * to `metadata.effect_params[<ref>]` (effects are plural per transition) — exactly what the runtime
 * reads. Primitive props render as fields (boolean/string/number); an ARRAY prop dispatches to the
 * {@see RecipientPicker} (ticket 17 — the first non-primitive param, e.g. `principals`).
 */
function EffectParams({
    effect,
    value,
    onChange,
    principals,
}: {
    effect: GuardCatalogEntry;
    value: ParamBag;
    onChange: (value: ParamBag) => void;
    principals: PrincipalKind[];
}) {
    const properties = (effect.paramsSchema?.properties ?? {}) as ParamProperties;
    const arrayProps = Object.entries(properties).filter(([, s]) => s.type === 'array');

    return (
        <div className="space-y-2 rounded-md border-l-2 border-[var(--swc-green)] bg-[var(--swc-ink-05)] p-3">
            <div className="font-mono text-[10px] tracking-[0.1em] text-[var(--swc-ink-45)] uppercase">
                {humanizeWorkflowKey(effect.name)} params
            </div>
            {arrayProps.map(([key, schema]) => (
                <RecipientPicker
                    key={key}
                    label={schema.title ?? key}
                    kinds={principals}
                    value={Array.isArray(value[key]) ? (value[key] as string[]) : []}
                    onChange={(next) => onChange({ ...value, [key]: next })}
                />
            ))}
            <PrimitiveParamFields properties={properties} value={value} onChange={onChange} />
        </div>
    );
}

/**
 * One row in the "When it fires" effects picker (ticket 16): the attach Switch, and — for an ON effect
 * that declares params — a collapsible "params" chevron (collapsed by default, AUTO-EXPANDING on first
 * attach) plus a red "needs setup" dot when a required param is still empty. Detach clears the bag
 * (handled by the parent's `detachEffect`).
 */
function EffectRow({
    effect,
    on,
    params,
    onToggle,
    onParamsChange,
    principals,
}: {
    effect: GuardCatalogEntry;
    on: boolean;
    params: ParamBag;
    onToggle: (checked: boolean) => void;
    onParamsChange: (params: ParamBag) => void;
    principals: PrincipalKind[];
}) {
    const hasParams = effectHasParams(effect);
    const [expanded, setExpanded] = useState(false);
    // Auto-expand on FIRST attach (an off→on flip this session), collapse on detach. An
    // already-attached effect on initial load stays collapsed — `wasOn` seeds from the mounted state.
    const wasOn = useRef(on);
    useEffect(() => {
        if (on && !wasOn.current) setExpanded(true);
        if (!on) setExpanded(false);
        wasOn.current = on;
    }, [on]);

    const needsSetup = on && hasParams && effectNeedsSetup(effect, params);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
                <Switch
                    checked={on}
                    onCheckedChange={onToggle}
                    aria-label={`Attach ${effect.label}`}
                />
                <span className="text-[var(--swc-ink-60)]">{effect.label}</span>
                {on && hasParams && (
                    <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        aria-expanded={expanded}
                        className="flex items-center gap-0.5 font-mono text-[10px] tracking-[0.08em] text-[var(--swc-ink-45)] uppercase hover:text-[var(--swc-ink-60)]"
                    >
                        <ChevronDown
                            className={`size-3 transition-transform ${expanded ? '' : '-rotate-90'}`}
                        />
                        params
                    </button>
                )}
                {needsSetup && (
                    <span
                        title="A required param is still empty"
                        aria-label="Needs setup"
                        className="size-1.5 rounded-full bg-destructive"
                    />
                )}
            </div>
            {on && hasParams && expanded && (
                <div className="pl-8">
                    <EffectParams
                        effect={effect}
                        value={params}
                        onChange={onParamsChange}
                        principals={principals}
                    />
                </div>
            )}
        </div>
    );
}

/** Primitive param field renderers (boolean→Switch, string/number→Input), shared by guard + effect params. */
function PrimitiveParamFields({
    properties,
    value,
    onChange,
}: {
    properties: ParamProperties;
    value: Record<string, unknown>;
    onChange: (value: Record<string, unknown>) => void;
}) {
    return (
        <>
            {Object.entries(properties).map(([key, schema]) =>
                schema.type === 'boolean' ? (
                    <div key={key} className="flex items-center justify-between gap-3">
                        <Label htmlFor={`param-${key}`} className="text-[var(--swc-ink-60)]">
                            {schema.title ?? key}
                        </Label>
                        <Switch
                            id={`param-${key}`}
                            checked={Boolean(value[key] ?? schema.default ?? false)}
                            onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
                        />
                    </div>
                ) : schema.type === 'string' || schema.type === 'number' ? (
                    <div key={key} className="space-y-1">
                        <Label htmlFor={`param-${key}`} className="text-[var(--swc-ink-60)]">
                            {schema.title ?? key}
                        </Label>
                        <Input
                            id={`param-${key}`}
                            type={schema.type === 'number' ? 'number' : 'text'}
                            value={String(value[key] ?? schema.default ?? '')}
                            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
                        />
                    </div>
                ) : null,
            )}
        </>
    );
}
