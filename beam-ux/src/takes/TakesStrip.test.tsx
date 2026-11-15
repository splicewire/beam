import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CELL_REVISION, MUSIC_TAKE } from './TakesStrip.stories';
import { relativeWhen, TakesStrip } from './TakesStrip';

afterEach(cleanup);

const labels = { region: 'Takes of this verse', empty: 'No other takes yet.', note: "Regenerate doesn't keep the version it replaces." };

describe('the takes strip', () => {
    it('renders a music take and a cell revision side by side for one node', () => {
        render(<TakesStrip takes={[MUSIC_TAKE, CELL_REVISION]} labels={labels} onRevert={vi.fn()} onKeep={vi.fn()} />);
        const strip = screen.getByRole('region', { name: 'Takes of this verse' });
        const [music, revision] = within(strip).getAllByRole('listitem').filter((item) => item.hasAttribute('data-take-kind'));

        expect(music.getAttribute('data-take-kind')).toBe('artifact');
        expect(within(music).getByText(/Music take · fixture-music-model/)).toBeTruthy();
        expect(within(music).getByLabelText('Play Music take · fixture-music-model').tagName).toBe('AUDIO');
        expect(within(within(music).getByRole('list', { name: 'What steered it' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
            'Voice: Fixture voice',
            'Prompt: warm, unhurried',
        ]);

        expect(revision.getAttribute('data-take-kind')).toBe('revision');
        expect(within(revision).getByText(/Before a refine/)).toBeTruthy();
        expect(within(revision).getByText(/Fixture verse/)).toBeTruthy();
        expect(within(strip).getByText("Regenerate doesn't keep the version it replaces.")).toBeTruthy();
    });

    it('says a take with no fingerprint was not recorded, and draws no empty chip row', () => {
        render(<TakesStrip takes={[CELL_REVISION, { ...MUSIC_TAKE, key: 'artifact:empty-fp', fingerprint: [] }]} labels={labels} />);
        expect(screen.getAllByText('Steering not recorded')).toHaveLength(2);
        expect(screen.queryByRole('list', { name: 'What steered it' })).toBeNull();
    });

    it('offers revert and keep only where the host allows them, and hands back the take', () => {
        const onRevert = vi.fn();
        const onKeep = vi.fn();
        render(<TakesStrip takes={[MUSIC_TAKE, CELL_REVISION]} labels={labels} onRevert={onRevert} onKeep={onKeep} />);
        // The music take has keep only; the revision has revert only.
        expect(screen.getAllByRole('button', { name: 'Use this take' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Keep this take' })).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Use this take' }));
        expect(onRevert).toHaveBeenCalledWith(CELL_REVISION);
        fireEvent.click(screen.getByRole('button', { name: 'Keep this take' }));
        expect(onKeep).toHaveBeenCalledWith(MUSIC_TAKE);
    });

    it('draws no action without its handler, and disables actions while busy', () => {
        render(<TakesStrip takes={[CELL_REVISION]} labels={labels} />);
        expect(screen.queryByRole('button')).toBeNull();
        cleanup();
        render(<TakesStrip takes={[CELL_REVISION]} labels={{ ...labels, revert: 'Bring this back' }} onRevert={vi.fn()} busy />);
        expect((screen.getByRole('button', { name: 'Bring this back' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('shows loading, a read error, the empty words and an action error, all in the host words', () => {
        render(<TakesStrip takes={undefined} pending labels={{ ...labels, loading: 'Fixture loading…' }} />);
        expect(screen.getByRole('status').textContent).toBe('Fixture loading…');
        cleanup();
        render(<TakesStrip takes={undefined} error="Fixture: takes could not be loaded." labels={labels} />);
        expect(screen.getByRole('alert').textContent).toBe('Fixture: takes could not be loaded.');
        cleanup();
        render(<TakesStrip takes={[]} labels={labels} />);
        expect(screen.getByText('No other takes yet.')).toBeTruthy();
        cleanup();
        render(<TakesStrip takes={[CELL_REVISION]} labels={labels} onRevert={vi.fn()} actionError="Fixture: the restore was refused." />);
        expect(screen.getByRole('alert').textContent).toBe('Fixture: the restore was refused.');
    });

    it('words time the way Studio does', () => {
        const now = Date.parse('2026-11-15T12:00:00Z');
        expect(relativeWhen(null, now)).toBe('');
        expect(relativeWhen('2026-11-15T11:59:45Z', now)).toBe('just now');
        expect(relativeWhen('2026-11-15T11:57:00Z', now)).toBe('3m ago');
        expect(relativeWhen('2026-11-15T10:00:00Z', now)).toBe('2h ago');
        expect(relativeWhen('not a date', now)).toBe('');
    });
});
