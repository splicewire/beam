import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntryRowActions } from './EntryRowActions.js';
import type { EntryRowActionsRecord } from './types.js';

const record = (over: Partial<EntryRowActionsRecord> = {}): EntryRowActionsRecord => ({
    id: '1',
    slug: 'hero',
    title: 'Hero',
    realm: 'site',
    ...over,
});

describe('EntryRowActions', () => {
    it('always offers edit/duplicate/delete', () => {
        render(
            <EntryRowActions
                record={record()}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Duplicate' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    });

    it('hides promote-to-central when the record does not carry the grant', () => {
        render(
            <EntryRowActions
                record={record({ canPromoteToCentral: false })}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        expect(screen.queryByRole('button', { name: 'Promote to central' })).toBeNull();
    });

    it('shows promote-to-central and calls the callback only when the record carries the grant', () => {
        const onPromoteToCentral = vi.fn();
        render(
            <EntryRowActions
                record={record({ canPromoteToCentral: true })}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
                onPromoteToCentral={onPromoteToCentral}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Promote to central' }));

        expect(onPromoteToCentral).toHaveBeenCalledWith(record({ canPromoteToCentral: true }));
    });

    it('calls onEdit/onDuplicate directly, no confirm guard', () => {
        const onEdit = vi.fn();
        const onDuplicate = vi.fn();
        render(
            <EntryRowActions
                record={record()}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

        expect(onEdit).toHaveBeenCalledWith(record());
        expect(onDuplicate).toHaveBeenCalledWith(record());
    });

    it('calls onDelete only when the confirm guard passes', () => {
        const onDelete = vi.fn();
        const { rerender } = render(
            <EntryRowActions
                record={record()}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={onDelete}
                confirmDelete={() => false}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onDelete).not.toHaveBeenCalled();

        rerender(
            <EntryRowActions
                record={record()}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={onDelete}
                confirmDelete={() => true}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
        expect(onDelete).toHaveBeenCalledWith(record());
    });

    it('defaults the confirm guard to window.confirm, keyed off title falling back to slug', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(
            <EntryRowActions
                record={record({ title: null, slug: 'no-title' })}
                onEdit={vi.fn()}
                onDuplicate={vi.fn()}
                onDelete={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('no-title'));
        confirmSpy.mockRestore();
    });
});
