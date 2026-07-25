import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RecipientPicker } from './RecipientPicker';
import { principals } from './story-fixtures';

/**
 * Catalog story for {@link RecipientPicker} (component-seams ticket 26; beam-workflows-ux tickets
 * 08/17). The field renderer for a `workflow.await` effect's `principals` array — a Popover-triggered,
 * input-shaped field showing selection as removable chips, over a FLAT checklist (owner/watcher + each
 * role flattened) with an "Advanced" raw `kind:selector` escape hatch.
 *
 * Its axis is **states**: empty (placeholder) / selected (known chips) / a flagged raw chip (an
 * undeclared token → dashed `text-destructive` "raw ⚠"). No variant/size/tone/density prop (rule of
 * sanction). The chips + field use semantic tokens (`border-input`, `bg-transparent`, `text-destructive`)
 * plus a couple of `--swc-ink-*` brand vars — largely re-skins under `.dark`; the `--swc-ink-*` accents
 * are self-contained-hex (→ ticket 32).
 *
 * Controlled wrappers: each story owns local `value` state so toggling/removing chips works live in the
 * catalog (the picker is a controlled `value`/`onChange` field).
 */
const meta = {
    title: 'Workflows/RecipientPicker',
    component: RecipientPicker,
    parameters: { layout: 'padded' },
    decorators: [
        (Story) => (
            <div className="w-[320px] max-w-full">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof RecipientPicker>;

export default meta;

function Controlled({ initial }: { initial: string[] }) {
    const [value, setValue] = useState<string[]>(initial);
    return (
        <RecipientPicker
            label="Recipients"
            value={value}
            onChange={setValue}
            kinds={principals}
        />
    );
}

/** No selection — the "Choose recipients…" placeholder. Open the Popover to see the checklist. */
export const Empty: StoryObj = {
    render: () => <Controlled initial={[]} />,
};

/** A populated selection — owner + an Editor role, both rendered as known chips. */
export const Selected: StoryObj = {
    render: () => <Controlled initial={['owner:', 'role:Editor']} />,
};

/**
 * A selection containing an UNDECLARED token (`team:eng`) alongside known chips — it renders as a
 * flagged dashed "raw ⚠" chip so fail-silently is made visible (ticket 17).
 */
export const WithRawToken: StoryObj = {
    render: () => <Controlled initial={['owner:', 'team:eng']} />,
};

/** A picker with NO role options declared — only the fixed owner/watcher rows in the checklist. */
export const FlatKindsOnly: StoryObj = {
    render: () => {
        function FlatControlled() {
            const [value, setValue] = useState<string[]>(['watcher:']);
            return (
                <RecipientPicker
                    label="Recipients"
                    value={value}
                    onChange={setValue}
                    kinds={[
                        { kind: 'owner', label: 'Owner', options: null },
                        { kind: 'watcher', label: 'Watchers', options: null },
                    ]}
                />
            );
        }
        return <FlatControlled />;
    },
};
