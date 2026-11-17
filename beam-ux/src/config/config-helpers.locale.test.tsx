import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BEAM_UX } from './ConfigArea.fixtures';
import { FedBy } from './parts';
import { sectionIndexColumns } from './ConfigArea';
import { useBeamUxMessages } from '../messages';

// REVIEW-31A-F: display copy that a helper returns (envState, the section counts) reads the reader's catalog, which
// the ratchet cannot see. Under an es catalog these render in Spanish; with no provider they keep the pre-31 English.
afterEach(cleanup);
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.config_env_unset': { text: 'sin definir · valor del archivo', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.config_count_keys': { text: ':count clave|:count claves', sourceLocale: 'es' },
    },
};
const envKey = BEAM_UX.keys.find((key) => key.env?.set === false)!;

function Counts() {
    const m = useBeamUxMessages();
    const column = sectionIndexColumns(m)[1];
    return <>{column.cell!(BEAM_UX as never)}</>;
}

it('renders helper-returned config copy in the reader\'s locale, and the pre-31 English without one', () => {
    const english = render(<><FedBy section={BEAM_UX} keyData={envKey} /><Counts /></>);
    expect(screen.getByText('unset · file default')).toBeTruthy();
    expect(screen.getByText(`${BEAM_UX.counts.keys} ${BEAM_UX.counts.keys === 1 ? 'key' : 'keys'}`)).toBeTruthy();
    english.unmount();

    render(<MessageProvider value={spanish}><FedBy section={BEAM_UX} keyData={envKey} /><Counts /></MessageProvider>);
    expect(screen.getByText('sin definir · valor del archivo')).toBeTruthy();
    expect(screen.getByText(`${BEAM_UX.counts.keys} ${BEAM_UX.counts.keys === 1 ? 'clave' : 'claves'}`)).toBeTruthy();
});
