import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { JsonDoc, JsonNode } from '../blockdoc/json.js';
import { englishBeamUxMessages } from '../messages.js';
import { say } from '../message-descriptor.js';
import { NodeActionControl } from './NodeActionControl.js';
import { refusalOf, type NodeActionDecision } from './node-action.js';

// node-actions-and-takes 04/06/08a amend: the Refine control's copy, and the refusal line its helper returns when the
// server gave no reasons, read the reader's catalog; the server's own reasons still show as they arrived.
afterEach(cleanup);
const text = (value: string): JsonNode => ({ kind: 'text', value }) as JsonNode;
const block = (name: string, ...children: JsonNode[]): JsonNode =>
    ({ kind: 'block', name, isComponent: false, dynamic: false, props: [], children }) as JsonNode;
const DOC: JsonDoc = [block('main', block('p', text('Fixture paragraph.')))];
const refused = (reasons: string[]): NodeActionDecision => ({
    decision: 'reverted',
    revision: { reference: 'fixture-ref', before: { address: '/0/children/0', truth: block('p'), standing: [] }, after: { address: '/0/children/0', truth: block('p'), standing: [] } },
    verdict: { hardFail: true, softWorse: false, reasons },
});
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.node_action_region': { text: 'Refinar este bloque', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.node_action_regenerate': { text: 'Regenerar', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.node_action_refused': { text: 'El candidato fue rechazado.', sourceLocale: 'es' },
    },
};
const control = (decision: NodeActionDecision) => <NodeActionControl slug="fixture-page" doc={DOC} path="0.0" refine={async () => decision} onApply={() => {}} />;

it('renders a helper-returned refusal in the reader\'s locale, and in English without one', async () => {
    render(<MessageProvider value={spanish}>{control(refused([]))}</MessageProvider>);
    expect(screen.getByRole('region', { name: 'Refinar este bloque' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Regenerar' }));
    expect((await screen.findByRole('alert')).textContent).toBe('El candidato fue rechazado.');
    cleanup();

    render(control(refused([])));
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    expect((await screen.findByRole('alert')).textContent).toBe('The candidate was refused.');
});

it('returns the refusal as a catalog line, and the server\'s reasons as they arrived', () => {
    expect(say(englishBeamUxMessages, refusalOf(refused([]))!)).toBe('The candidate was refused.');
    expect(refusalOf(refused(['Fixture: the server\'s words.']))).toBe('Fixture: the server\'s words.');
});
