import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';
import { CanvasBindingWarnings } from './CanvasBindingWarnings.js';
import { scalarValue } from './binding-edit.js';
import { NoticeError } from '../message-descriptor.js';

// REVIEW-31A-F re-sweep, part C: copy a canvas helper returns or throws (the ratchet cannot see either) reads the
// reader's catalog. A binding warning renders in es under an es catalog; a thrown helper line carries its catalog
// key, with its message still the pre-31 English for logs.
afterEach(cleanup);
const block = (children: JsonDoc = []): JsonBlock => ({ kind: 'block', name: 'div', isComponent: false, dynamic: false, props: [], children });
const profile = { 'x-collections': [{ name: 'authors', schema: { properties: { fields: { $id: 'https://tenant.test/authors/1', properties: { name: { type: 'string' } } } } } }] };
const doc: JsonDoc = [{ ...block(), repeat: { collection: 'held' } }];
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.bindings_collection_unavailable': { text: 'La colección :name no está disponible', sourceLocale: 'es' },
    },
};

it('renders a helper-returned binding warning in the reader\'s locale', () => {
    render(<MessageProvider value={spanish}><CanvasBindingWarnings doc={doc} profile={profile} pagePublic /></MessageProvider>);
    expect(screen.getByText(/La colección held no está disponible/)).toBeTruthy();
});

it('throws helper validation as a catalog line whose message stays the pre-31 English', () => {
    let thrown: unknown;
    try { scalarValue('maybe', { path: 'fields.flag', label: 'Flag', type: 'boolean' } as never); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(NoticeError);
    expect((thrown as NoticeError).message).toBe('Enter true or false');
});
