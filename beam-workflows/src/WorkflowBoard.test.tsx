import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkflowProjectionData, WorkflowTransitionData } from '@splicewire/beam-resources/types/workflows';
import { projection } from './story-fixtures';
import { transitionIntoPlace } from './transitionIntoPlace';
import { WorkflowBoard } from './WorkflowBoard';

// Owner-review-20261112 ticket 47: the move-to-transition rule, and the workflow board in both modes.

const t = (name: string, from: string, to: string, reason: string | null = null): WorkflowTransitionData => ({
    name,
    from: [from],
    to: [to],
    guard: null,
    effects: [],
    metadata: null,
    reason,
});

describe('transitionIntoPlace', () => {
    // The fixture sits in in_review with approve (→ published) and revise (→ draft) available.
    it('applies the one available transition into the target place', () => {
        expect(transitionIntoPlace(projection, 'published')).toEqual({ kind: 'apply', transition: 'approve' });
        expect(transitionIntoPlace(projection, 'draft')).toEqual({ kind: 'apply', transition: 'revise' });
    });

    it('refuses with no reason when no transition out of the current place leads there', () => {
        expect(transitionIntoPlace(projection, 'archived')).toEqual({ kind: 'none' });
    });

    it('refuses with the backend reason when the transition that leads there is not available', () => {
        const guarded = {
            ...projection,
            available: ['revise'],
            transitions: projection.transitions.map((tr) => (tr.name === 'approve' ? { ...tr, reason: 'An editor must sign off.' } : tr)),
        };
        expect(transitionIntoPlace(guarded, 'published')).toEqual({
            kind: 'blocked',
            transition: 'approve',
            reason: 'An editor must sign off.',
        });
    });

    it('ignores a reason on a transition that does not leave the current place', () => {
        const elsewhere = { ...projection, transitions: [...projection.transitions, t('restore', 'archived', 'draft', 'Too old.')] };
        expect(transitionIntoPlace({ ...elsewhere, available: [] }, 'draft')).toEqual({ kind: 'none' });
    });

    it('names every candidate and applies none when more than one available transition leads there', () => {
        const two = {
            ...projection,
            transitions: [...projection.transitions, t('fast_track', 'in_review', 'published')],
            available: ['approve', 'revise', 'fast_track'],
        };
        expect(transitionIntoPlace(two, 'published')).toEqual({ kind: 'ambiguous', transitions: ['approve', 'fast_track'] });
    });

    it('counts a name that repeats across from-lists once', () => {
        const repeated = { ...projection, transitions: [...projection.transitions, t('approve', 'in_review', 'published')] };
        expect(transitionIntoPlace(repeated, 'published')).toEqual({ kind: 'apply', transition: 'approve' });
    });
});

type Post = { id: string; title: string; projection: WorkflowProjectionData };

const at = (current: string, available: string[]): WorkflowProjectionData => ({ ...projection, current, available });

/** A caller that owns its subjects and gives one a new projection when a transition runs, the way a host would. */
function WorkflowHarness({ onTransition }: { onTransition: (post: Post, transition: string) => void | Promise<void> }) {
    const [posts, setPosts] = useState<Post[]>([
        { id: 'p1', title: 'Spring menu', projection: at('in_review', ['approve', 'revise']) },
        { id: 'p2', title: 'Hiring post', projection: at('draft', ['submit']) },
    ]);
    const after: Record<string, [string, string[]]> = {
        approve: ['published', ['archive']],
        revise: ['draft', ['submit']],
        submit: ['in_review', ['approve', 'revise']],
    };
    return (
        <WorkflowBoard
            cards={posts}
            getCardKey={(p) => p.id}
            getCardLabel={(p) => p.title}
            renderCard={(p) => <span>{p.title}</span>}
            getProjection={(p) => p.projection}
            onTransition={async (post, transition) => {
                await onTransition(post, transition);
                const [current, available] = after[transition]!;
                setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, projection: at(current, available) } : p)));
            }}
        />
    );
}

const laneOfCard = (title: string) => screen.getByText(title).closest('[data-lane]')?.getAttribute('data-lane');
const status = () => screen.getAllByRole('status').find((el) => el.hasAttribute('data-card-board-status'))?.textContent;
const card = (title: string) => within(screen.getByText(title).closest('li') as HTMLElement);

async function chooseLane(title: string, lane: string) {
    fireEvent.click(screen.getByRole('button', { name: `Move ${title}` }));
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: `Move to ${lane}` }));
    });
}

afterEach(cleanup);

describe('WorkflowBoard with the workflow adapter', () => {
    it('lanes are the projection places and each card sits in its current place', () => {
        render(<WorkflowHarness onTransition={() => undefined} />);
        expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
            'Draft',
            'In review',
            'Published',
            'Archived',
        ]);
        expect(laneOfCard('Spring menu')).toBe('in_review');
        expect(laneOfCard('Hiring post')).toBe('draft');
    });

    it('a move applies the one available transition into the target place', async () => {
        const onTransition = vi.fn();
        render(<WorkflowHarness onTransition={onTransition} />);
        await chooseLane('Spring menu', 'Published');
        expect(onTransition).toHaveBeenCalledTimes(1);
        expect(onTransition.mock.calls[0]?.[1]).toBe('approve');
        expect(laneOfCard('Spring menu')).toBe('published');
        expect(status()).toBe('Spring menu moved to Published.');
    });

    it('a move with no transition there is refused with the reason, and the card returns', async () => {
        const onTransition = vi.fn();
        render(<WorkflowHarness onTransition={onTransition} />);
        await chooseLane('Spring menu', 'Archived');
        expect(onTransition).not.toHaveBeenCalled();
        expect(laneOfCard('Spring menu')).toBe('in_review');
        expect(status()).toBe('Spring menu was not moved to Archived: No available transition leads there.');
    });

    it('a move with more than one transition there is refused, and the card names them for its buttons', async () => {
        const onTransition = vi.fn();
        const two: WorkflowProjectionData = {
            ...projection,
            transitions: [...projection.transitions, t('fast_track', 'in_review', 'published')],
            available: ['approve', 'revise', 'fast_track'],
        };
        render(
            <WorkflowBoard
                cards={[{ id: 'p1', title: 'Spring menu' }]}
                getCardKey={(p) => p.id}
                getCardLabel={(p) => p.title}
                renderCard={(p) => <span>{p.title}</span>}
                getProjection={() => two}
                onTransition={onTransition}
            />,
        );
        await chooseLane('Spring menu', 'Published');
        expect(onTransition).not.toHaveBeenCalled();
        expect(laneOfCard('Spring menu')).toBe('in_review');
        expect(status()).toBe(
            'Spring menu was not moved to Published: More than one transition leads there (Approve, Fast track). Choose one on the card.',
        );
        expect(card('Spring menu').getByRole('button', { name: 'Fast track' })).toBeTruthy();
    });

    it('a transition the backend rejects refuses the move with its message', async () => {
        render(
            <WorkflowHarness
                onTransition={() => {
                    throw new Error('The post needs a summary.');
                }}
            />,
        );
        await chooseLane('Hiring post', 'In review');
        expect(laneOfCard('Hiring post')).toBe('draft');
        expect(status()).toBe('Hiring post was not moved to In review: The post needs a summary.');
    });

    it('each card offers its available transitions as buttons, so nothing needs dragging', async () => {
        const onTransition = vi.fn();
        render(<WorkflowHarness onTransition={onTransition} />);
        const group = within(screen.getByRole('group', { name: 'Transitions for Spring menu' }));
        expect(group.getAllByRole('button').map((b) => b.textContent)).toEqual(['Approve', 'Revise']);
        await act(async () => {
            fireEvent.click(group.getByRole('button', { name: 'Revise' }));
        });
        expect(onTransition.mock.calls[0]?.[1]).toBe('revise');
        expect(laneOfCard('Spring menu')).toBe('draft');
        expect(card('Spring menu').getByRole('button', { name: 'Submit' })).toBeTruthy();
    });

    it('a rejected transition button says why on the card', async () => {
        render(
            <WorkflowHarness
                onTransition={() => Promise.reject(new Error('Offline.'))}
            />,
        );
        await act(async () => {
            fireEvent.click(card('Hiring post').getByRole('button', { name: 'Submit' }));
        });
        expect(card('Hiring post').getByRole('alert').textContent).toBe('Submit did not run: Offline.');
        expect(laneOfCard('Hiring post')).toBe('draft');
    });
});

describe('WorkflowBoard without an adapter', () => {
    it('renders the caller’s lanes and cards, and onMove is the caller’s', async () => {
        const onMove = vi.fn(() => ({ refused: 'Not today.' }));
        render(
            <WorkflowBoard
                lanes={[
                    { key: 'todo', title: 'To do' },
                    { key: 'done', title: 'Done' },
                ]}
                cards={[{ id: 'a', title: 'Write the brief', lane: 'todo' }]}
                getCardKey={(c) => c.id}
                getCardLane={(c) => c.lane}
                getCardLabel={(c) => c.title}
                renderCard={(c) => <span>{c.title}</span>}
                onMove={onMove}
            />,
        );
        expect(laneOfCard('Write the brief')).toBe('todo');
        expect(screen.queryByRole('group', { name: /^Transitions for/ })).toBeNull();
        await chooseLane('Write the brief', 'Done');
        expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'done');
        expect(laneOfCard('Write the brief')).toBe('todo');
        expect(status()).toBe('Write the brief was not moved to Done: Not today.');
    });
});
