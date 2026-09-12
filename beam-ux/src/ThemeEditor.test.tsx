import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeEditor } from './ThemeEditor';
import { UxBuilderProvider } from './provider';
import { entryIds, themeEntryBody } from './story-fixtures';
import type { BeamUxEntryBodyData, UxBuilderClient } from './types';

/**
 * G2-BEAM-THEME-NAV. The theme entry had no editor seat at all: editing a token meant hand-editing a
 * host seeder and reseeding. {@link ThemeEditor} is that seat — a COMPOSITION over the package's own
 * parts, so what these cases pin is the WIRING (the id it loads by, the schema it renders, the body it
 * commits), never a widget this file re-implements.
 *
 * The third case is the one worth reading twice. The server hands the form a schema describing
 * `{canvas, site}` while the body carries `{canvas, shell, site}` (`EntryBodyEnvelope::schemaFor()`
 * omits `shell` deliberately), so a save that wrote back only what the form rendered would reset every
 * OS-shell token to its package default — silently, since nothing on screen ever showed that
 * namespace. The case asserts the OUTCOME: a theme save preserves the namespace the form never drew.
 *
 * ⚠️ **It does not isolate the component's own merge, and does not pretend to.** Measured 2026-09-12:
 * `@rjsf`'s `omitExtraData` defaults to `false`, so `formData` already carries `shell` through, and
 * this case passes against a `ThemeEditor` whose `onChange` is a bare `setDraft(next)` (run that way
 * to check). It is a regression pin on the round trip — it would fail the day `FormEditor` gained
 * `omitExtraData: true` or the buffer stopped being seeded from the loaded body — not evidence that
 * the merge line is what carries it today.
 */

function mount(client: Partial<UxBuilderClient>) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const full = {
        loadBody: vi.fn(),
        saveBody: vi.fn(),
        ...client,
    } as UxBuilderClient;

    render(
        <QueryClientProvider client={queryClient}>
            <UxBuilderProvider services={{ client: full, notify: () => {} }}>
                <ThemeEditor entryId={entryIds.theme} />
            </UxBuilderProvider>
        </QueryClientProvider>,
    );

    return full;
}

const loadsTheTheme = () => ({
    loadBody: vi.fn(async () => themeEntryBody as BeamUxEntryBodyData),
    saveBody: vi.fn(async (_id: string, body: Record<string, unknown>) => ({
        ...themeEntryBody,
        body,
    })),
});

describe('the theme entry gets Frame’s form, addressed by entry id', () => {
    it('loads the body through the injected client, by the id it was given', async () => {
        const client = loadsTheTheme();
        mount(client);

        await screen.findByText('Theme tokens');
        expect(client.loadBody).toHaveBeenCalledWith(entryIds.theme);
    });

    it('renders the fields the SERVER’s schema declares, not a hand-written token list', async () => {
        mount(loadsTheTheme());

        // The two namespaces `schemaFor()` answers with, as the real SchemaForm renders them.
        expect(await screen.findByText('Canvas theme')).toBeTruthy();
        expect(screen.getByText('Site theme')).toBeTruthy();
        // `shell` is in the BODY but not in the schema, so it must render no fieldset at all — a
        // heading here would mean the form had invented one.
        expect(screen.queryByText('Shell theme')).toBeNull();
    });

    it('commits the un-schema’d `shell` namespace back untouched, alongside the edit', async () => {
        const client = loadsTheTheme();
        mount(client);

        await screen.findByText('Site theme');

        // Edit one real token through the rendered form — `site.accentHover`, a field the schema
        // declares and the public site's `.btn-primary:hover` actually reads.
        // `format: 'color'` renders a native `<input type="color">`, which is not typeable — a
        // `change` event carrying the swatch's new value is what a real picker fires.
        const field = screen.getByLabelText('Accent hover') as HTMLInputElement;
        expect(field.type).toBe('color');
        fireEvent.change(field, { target: { value: '#b91c1c' } });

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(client.saveBody).toHaveBeenCalled());
        const [id, body] = client.saveBody.mock.calls[0];
        expect(id).toBe(entryIds.theme);
        // The edit landed …
        expect((body.site as Record<string, string>).accentHover).toBe('#b91c1c');
        // … the rest of its own namespace survived …
        expect((body.site as Record<string, string>).accent).toBe('#0f172a');
        // … and so did the whole namespace the form never showed.
        expect(body.shell).toEqual(themeEntryBody.body.shell);
    });

    it('says the read is in flight rather than rendering an empty form', () => {
        mount({ loadBody: vi.fn(() => new Promise<BeamUxEntryBodyData>(() => {})) });

        expect(screen.getByRole('status').textContent).toContain('Loading the theme');
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });

    it('says the read FAILED rather than rendering an authored-looking blank form', async () => {
        mount({ loadBody: vi.fn(async () => { throw new Error('load 403'); }) });

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('could not be loaded');
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    });
});
