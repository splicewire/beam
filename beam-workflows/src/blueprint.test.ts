import { expect, it } from 'vitest';
import { toDraft } from './blueprint';

// toDraft normalizes a partial blueprint into a complete, deeply-cloned draft. Every field of the generated
// WorkflowTransitionData must be carried: `reason` (the transition reason, _resources f3ab73f) was dropped, which
// failed the package's declaration build against that bundle.

it('carries a transition reason, and defaults a missing one to null', () => {
    const draft = toDraft({
        name: 'wf',
        places: ['draft', 'review'],
        transitions: [
            { name: 'submit', from: ['draft'], to: ['review'], guard: null, effects: [], metadata: null, reason: 'Ready to check' },
            { name: 'revise', from: ['review'], to: ['draft'] } as never,
        ],
    });

    expect(draft.transitions.map((t) => t.reason)).toEqual(['Ready to check', null]);
});

it('clones every array, so editing the draft never mutates the source', () => {
    const source = {
        name: 'wf',
        places: ['draft', 'review'],
        transitions: [{ name: 'submit', from: ['draft'], to: ['review'], guard: null, effects: ['notify'], metadata: null, reason: null }],
    };
    const draft = toDraft(source);

    draft.places.push('published');
    draft.transitions[0].from.push('review');
    draft.transitions[0].effects.push('audit');

    expect(source.places).toEqual(['draft', 'review']);
    expect(source.transitions[0].from).toEqual(['draft']);
    expect(source.transitions[0].effects).toEqual(['notify']);
    expect(draft.initial).toEqual(['draft']);
});
