import { Check, Plus, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { Input, Popover, PopoverContent, PopoverTrigger } from '@schemastud/ui';
import { type PrincipalKind, principalRows, toChips, toggleToken } from './principals';

/**
 * The recipient picker (beam-workflows-ux tickets 08/17) — the first non-primitive effect param, the
 * field renderer for `workflow.await`'s `principals`. One FLAT checklist (fixed `owner`/`watcher` rows
 * + each role flattened into a sibling row under "By role"), selection shown as removable chips in a
 * `Popover`-triggered, input-shaped field. Plus an "Advanced" raw `kind:selector` escape hatch; an
 * undeclared token renders as a flagged dashed "raw ⚠" chip so fail-silently is made visible.
 *
 * Value = one array of opaque `kind:selector` strings (`effect_params[<ref>].principals`) — exactly
 * what the runtime reads. The picker never resolves a user (co-location).
 */
export function RecipientPicker({
    label,
    value,
    onChange,
    kinds,
}: {
    label: string;
    value: string[];
    onChange: (value: string[]) => void;
    kinds: PrincipalKind[];
}) {
    const [raw, setRaw] = useState('');
    const rows = principalRows(kinds);
    const chips = toChips(value, rows);
    const flatRows = rows.filter((r) => r.group === 'flat');
    const roleRows = rows.filter((r) => r.group === 'role');

    function toggle(token: string) {
        onChange(toggleToken(value, token));
    }

    function addRaw() {
        const token = raw.trim();
        if (token !== '' && token.includes(':') && !value.includes(token)) {
            onChange([...value, token]);
        }
        setRaw('');
    }

    return (
        <div className="space-y-1">
            <span className="text-sm text-[var(--swc-ink-60)]">{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <div
                        role="button"
                        tabIndex={0}
                        className="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-left text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        {chips.length === 0 ? (
                            <span className="text-[var(--swc-ink-45)]">Choose recipients…</span>
                        ) : (
                            chips.map((chip) => (
                                <span
                                    key={chip.token}
                                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs ${
                                        chip.known
                                            ? 'border-[var(--swc-ink-15)] bg-[var(--swc-ink-05)]'
                                            : 'border-dashed border-destructive/50 bg-destructive/5'
                                    }`}
                                >
                                    {!chip.known && (
                                        <TriangleAlert
                                            className="size-3 text-destructive"
                                            aria-label="Undeclared token"
                                        />
                                    )}
                                    <span
                                        className={`font-mono text-[9px] tracking-[0.06em] uppercase ${
                                            chip.known
                                                ? 'text-[var(--swc-ink-45)]'
                                                : 'text-destructive'
                                        }`}
                                    >
                                        {chip.kind}
                                    </span>
                                    {chip.known
                                        ? chip.label
                                        : chip.token.slice(chip.kind.length + 1) || chip.token}
                                    <span
                                        role="button"
                                        tabIndex={-1}
                                        aria-label={`Remove ${chip.label}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggle(chip.token);
                                        }}
                                        className="flex size-3.5 items-center justify-center rounded hover:bg-[var(--swc-ink-08)]"
                                    >
                                        <X className="size-2.5" />
                                    </span>
                                </span>
                            ))
                        )}
                        <Plus className="ml-auto size-3.5 text-[var(--swc-ink-45)]" />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1">
                    {flatRows.map((row) => (
                        <ChecklistRow
                            key={row.token}
                            label={row.label}
                            selected={value.includes(row.token)}
                            onClick={() => toggle(row.token)}
                        />
                    ))}

                    {roleRows.length > 0 && (
                        <>
                            <div className="px-2 pt-2 pb-1 font-mono text-[9px] tracking-[0.1em] text-[var(--swc-ink-45)] uppercase">
                                By role
                            </div>
                            {roleRows.map((row) => (
                                <ChecklistRow
                                    key={row.token}
                                    label={row.label}
                                    selected={value.includes(row.token)}
                                    onClick={() => toggle(row.token)}
                                />
                            ))}
                        </>
                    )}

                    <div className="px-2 pt-2 pb-1 font-mono text-[9px] tracking-[0.1em] text-[var(--swc-ink-45)] uppercase">
                        Advanced
                    </div>
                    <div className="flex gap-1 px-1 pb-1">
                        <Input
                            value={raw}
                            onChange={(e) => setRaw(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addRaw();
                                }
                            }}
                            placeholder="kind:selector — e.g. team:eng"
                            className="h-7 text-xs"
                            aria-label="Raw principal token"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function ChecklistRow({
    label,
    selected,
    onClick,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--swc-ink-05)]"
        >
            <span className="flex size-3.5 items-center justify-center">
                {selected && <Check className="size-3.5 text-[var(--swc-green)]" />}
            </span>
            {label}
        </button>
    );
}
