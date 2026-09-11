/**
 * The reader's two absences (G2-BEAM-AUTHOR-EMPTY-ENTRY, measured on beam.test 2026-09-11).
 *
 * `<EntryBody>` used to collapse "this entry has never been authored" into "the artifact failed to
 * load", and the shared message was the operator-facing *"run `php artisan splicewire:beam:ux:compile`"*.
 * A GUEST reading the never-authored `/about` was therefore told to run a command they cannot run, on a
 * host where that command reported "already current 13" — the entry was not uncompiled, it was empty.
 * The two conditions now answer separately.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { componentFromArtifact, EntryBody } from './EntryBody.js';

describe('EntryBody — never-authored vs unloadable', () => {
    it('states the page has no content yet when there is no artifact URL, with no operator advice', async () => {
        render(<EntryBody artifact={{ url: '', version: null }} />);

        await waitFor(() => expect(document.querySelector('[data-beam-entry-unauthored]')).not.toBeNull());
        expect(screen.getByText(/doesn’t have any content yet/)).toBeTruthy();
        expect(document.body.textContent).not.toContain('artisan');
    });

    it('keeps the operator-facing compile advice for an artifact that EXISTS and will not load', async () => {
        // A URL that cannot resolve — the genuine "compiled artifact is missing or broken" case, which
        // is a doctor finding and stays worded for whoever can act on it (ADR-0209 §7: never a
        // client-side compile fallback either way).
        render(<EntryBody artifact={{ url: '/beam/ux/artifacts/does-not-exist.js', version: 'v1' }} />);

        await waitFor(() => expect(document.querySelector('[data-beam-entry-uncompiled]')).not.toBeNull());
        expect(document.body.textContent).toContain('splicewire:beam:ux:compile');
    });

    it('lets a host replace the empty state without touching the failure state', async () => {
        render(<EntryBody artifact={{ url: '' }} empty={<p>Nothing here yet.</p>} />);

        await waitFor(() => expect(screen.getByText('Nothing here yet.')).toBeTruthy());
    });
});

describe('componentFromArtifact', () => {
    // Measured on beam.test 2026-09-11: a canvas-authored page compiled to a module with an empty
    // `module.exports`; handing React the resulting `undefined` killed the entire page at render
    // (minified error #130). A reader must never lose the page over a build product they cannot fix.
    const Real = () => null;

    it('returns the default export when the artifact yields one', () => {
        expect(componentFromArtifact({ default: () => ({ default: Real }) })).toBe(Real);
    });

    it('returns null — not undefined — when the module exports nothing', () => {
        expect(componentFromArtifact({ default: () => ({}) } as never)).toBeNull();
    });

    it('returns null when the module is not an artifact factory at all', () => {
        expect(componentFromArtifact({} as never)).toBeNull();
        expect(componentFromArtifact({ default: () => undefined } as never)).toBeNull();
    });
});
