import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type {
    WorkflowBlueprintData,
    WorkflowVersionData,
    PrincipalKindData,
} from '@splicewire/_resources/types/workflows';
import { RecipientPicker, WorkflowDiff, WorkflowGraph } from '../src/index';

/**
 * The isolation bar (rehome-components §8a): the read-only leaves render off PLAIN generated-DTO
 * fixtures — no Laravel, no app context, no `@/`. The single-instance-React recipe (vitest.config)
 * carries xyflow's + Radix's portals. If a leaf had smuggled an app coupling, importing
 * `../src/index` here would fail to resolve and this file would not even load.
 */

// xyflow measures its container via ResizeObserver; jsdom lacks it. Portable test-only polyfill.
beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

const blueprint = (over: Partial<WorkflowBlueprintData> = {}): WorkflowBlueprintData => ({
    name: 'publish-flow',
    places: ['draft', 'published'],
    initial: ['draft'],
    transitions: [
        { name: 'publish', from: ['draft'], to: ['published'], guard: null, effects: [], metadata: null },
    ],
    metadata: null,
    ...over,
});

describe('@splicewire/beam-workflows read-only leaves mount in isolation', () => {
    it('WorkflowGraph lays out places off a blueprint DTO (xyflow, no Laravel)', () => {
        const { container } = render(<WorkflowGraph blueprint={blueprint()} />);
        // xyflow renders each place as a node carrying its label.
        expect(screen.getByText('draft')).toBeDefined();
        expect(screen.getByText('published')).toBeDefined();
        expect(container.querySelector('.react-flow')).not.toBeNull();
    });

    it('RecipientPicker renders selection chips off the principals vocabulary', () => {
        const kinds: PrincipalKindData[] = [
            { kind: 'owner', label: 'Owner', options: null },
            { kind: 'role', label: 'Role', options: [{ value: 'Admin', label: 'Admin' }] },
        ];
        render(
            <RecipientPicker label="Recipients" value={['owner:']} kinds={kinds} onChange={() => {}} />,
        );
        expect(screen.getByText('Recipients')).toBeDefined();
        // The selected `owner:` token resolves to its known chip label.
        expect(screen.getByText('Owner')).toBeDefined();
    });

    it('WorkflowDiff structurally diffs two version DTOs', () => {
        const versions: WorkflowVersionData[] = [
            { id: 'v1', version: 1, isActive: false, blueprint: blueprint({ places: ['draft'], transitions: [] }) },
            { id: 'v2', version: 2, isActive: true, blueprint: blueprint() },
        ];
        render(<WorkflowDiff versions={versions} lineageKey="publish-flow" />);
        expect(screen.getByText('Compare')).toBeDefined();
        // v1 → v2 adds the `published` place; the diff surfaces it (added-place line + route text).
        expect(screen.getAllByText(/published/).length).toBeGreaterThan(0);
    });
});
