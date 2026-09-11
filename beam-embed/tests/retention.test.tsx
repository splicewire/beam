import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrivacyRetentionPage, RetentionProvider, type RetentionClient } from '../src';

afterEach(cleanup);
function fixture(overrides: Partial<RetentionClient> = {}): RetentionClient {
    return {
        posture: vi.fn(async () => ({ default_days: 90, chats: [{id: 'chat1', title: 'Support', retention_days: 30, corpus_optin: false}] })),
        preview: vi.fn(async () => ({ would_prune: 2 })),
        prune: vi.fn(async () => ({ pruned: 2 })),
        erase: vi.fn(async () => ({ erased: 1 })),
        ...overrides,
    };
}
function mount(client: RetentionClient, canManage = true) {
    const query = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});
    return render(<QueryClientProvider client={query}><RetentionProvider services={{client}}><PrivacyRetentionPage canManage={canManage} /></RetentionProvider></QueryClientProvider>);
}
describe('portable privacy and retention', () => {
    it('reads real posture and consent with neutral policy wording', async () => {
        mount(fixture());
        expect(await screen.findByText('30 days')).toBeTruthy();
        expect(screen.getByText('opted out')).toBeTruthy();
        expect(screen.queryByText(/Splicewire/)).toBeNull();
    });
    it('shows prune preview, dispatches once and refreshes the changed counts', async () => {
        const client = fixture(); mount(client);
        await screen.findByText(/past their window would be removed/);
        fireEvent.click(screen.getByRole('button', {name: 'Prune expired sessions'}));
        await screen.findByText(/past their retention window\./);
        expect(client.prune).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(client.preview).toHaveBeenCalledTimes(2));
    });
    it('requires admin access for destructive actions', async () => {
        const client = fixture(); mount(client, false);
        await screen.findByText('30 days');
        expect(screen.getByRole('button', {name: 'Prune expired sessions'}).hasAttribute('disabled')).toBe(true);
        expect(screen.getByRole('button', {name: 'Erase subject…'}).hasAttribute('disabled')).toBe(true);
        expect(client.prune).not.toHaveBeenCalled();
    });
    it('confirms an exact subject in a real dialog before erasing and showing its receipt', async () => {
        const client = fixture(); mount(client); await screen.findByText('30 days');
        fireEvent.change(screen.getByLabelText('Visitor ID'), {target: {value: 'vis_123'}});
        fireEvent.click(screen.getByRole('button', {name: 'Erase subject…'}));
        expect(screen.getByRole('dialog')).toBeTruthy();
        const confirm = screen.getByRole('button', {name: 'Erase permanently'});
        expect(confirm.hasAttribute('disabled')).toBe(true);
        fireEvent.change(screen.getByLabelText('Type ERASE to confirm'), {target: {value: 'ERASE'}});
        fireEvent.click(confirm);
        await waitFor(() => expect(client.erase).toHaveBeenCalledWith({kind: 'visitor_id', subjectId: 'vis_123'}));
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(screen.getByText(/This cannot be undone/)).toBeTruthy();
    });
    it('keeps erase errors visible and does not turn failed mutation into a receipt', async () => {
        mount(fixture({erase: vi.fn(async () => {throw new Error('Subject denied');})}));
        await screen.findByText('30 days');
        fireEvent.change(screen.getByLabelText('Visitor ID'), {target: {value: 'vis_123'}});
        fireEvent.click(screen.getByRole('button', {name: 'Erase subject…'}));
        fireEvent.change(screen.getByLabelText('Type ERASE to confirm'), {target: {value: 'ERASE'}});
        fireEvent.click(screen.getByRole('button', {name: 'Erase permanently'}));
        expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Subject denied');
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(screen.queryByText(/This cannot be undone/)).toBeNull();
    });
    it('reports failed prune without a success receipt', async () => {
        mount(fixture({prune: vi.fn(async () => {throw new Error('Prune denied');})}));
        await screen.findByText('30 days');
        fireEvent.click(screen.getByRole('button', {name: 'Prune expired sessions'}));
        expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Prune denied');
    });
    it('requires a new confirmation after closing and reopening the dialog', async () => {
        const client = fixture(); mount(client); await screen.findByText('30 days');
        fireEvent.change(screen.getByLabelText('Visitor ID'), {target: {value: 'vis_123'}});
        fireEvent.click(screen.getByRole('button', {name: 'Erase subject…'}));
        fireEvent.change(screen.getByLabelText('Type ERASE to confirm'), {target: {value: 'ERASE'}});
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        fireEvent.click(screen.getByRole('button', {name: 'Erase subject…'}));
        expect(screen.getByRole('button', {name: 'Erase permanently'}).hasAttribute('disabled')).toBe(true);
        expect(client.erase).not.toHaveBeenCalled();
    });
    it('does not dispatch a prune when the successful preview has no work', async () => {
        const client = fixture({preview: vi.fn(async () => ({would_prune: 0}))}); mount(client);
        await screen.findByText('Nothing to prune.');
        expect(screen.getByRole('button', {name: 'Prune expired sessions'}).hasAttribute('disabled')).toBe(true);
        expect(client.prune).not.toHaveBeenCalled();
    });

});
