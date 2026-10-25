// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const page = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
const editing = vi.hoisted(() => ({ value: false }));
vi.mock('@inertiajs/react', () => ({ usePage: () => page }));
vi.mock('@splicewire/beam-ux/canvas', () => ({ useEditMode: () => editing.value }));

import { IntakeFormIsland, IntakeFormsFromPage } from './intake';

afterEach(() => {
    cleanup();
    editing.value = false;
    page.props = {};
});

const SCHEMA = { type: 'object', properties: { email: { type: 'string', title: 'Email' } } };

it("feeds a page's forms the schemas and honeypot field the server put on it (EP-07d)", () => {
    page.props = { intakeForms: { contact: SCHEMA }, intakeHoneypotField: 'nickname' };
    const { container } = render(<IntakeFormsFromPage><IntakeFormIsland captureKey="contact" submitLabel="Join" /></IntakeFormsFromPage>);

    expect(container.querySelector('#root_email')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Join' })).toBeTruthy();
    expect(container.querySelector('input[name="nickname"][aria-hidden="true"]')).not.toBeNull();
});

it('is a preview while an author edits, and a page without the schema shows a notice', () => {
    editing.value = true;
    page.props = { intakeForms: { contact: SCHEMA } };
    render(<IntakeFormsFromPage><IntakeFormIsland captureKey="contact" /></IntakeFormsFromPage>);
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();

    editing.value = false;
    page.props = {};
    render(<IntakeFormsFromPage><IntakeFormIsland captureKey="contact" /></IntakeFormsFromPage>);
    expect(screen.getByRole('note').textContent).toBe('This form is not available.');
});
