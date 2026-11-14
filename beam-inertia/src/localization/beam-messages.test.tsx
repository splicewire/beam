// @vitest-environment jsdom
/**
 * localization 16-d: the served client catalog reaches the React tree through every layout the resolver returns. The
 * provider takes a NEW catalog on a language or a realm switch without remounting the page under it, keeps the catalog
 * when a later response omits the once-prop, and is a passthrough where nothing is served.
 */
import { cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

const props = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: props.value }) }));

import { useMessages } from '@schemastud/messages/react';
import { BeamMessages, withBeamMessages } from './beam-messages';

afterEach(() => {
    cleanup();
    props.value = {};
});

const defaults = { greeting: 'Hello' } as const;

/** A seam-backed component: its line comes from the provider's catalog, else its English default. */
function Greeting({ onMount }: { onMount?: () => void }) {
    const messages = useMessages(defaults);
    useEffect(() => onMount?.(), [onMount]);

    return <p data-testid="greeting">{messages.t('greeting')}</p>;
}

function served(locale: string, realm: string | null, text: string, hash: string, withInitial = true) {
    return {
        localization: {
            address: { url: '/catalog', hash, version: 1, locale, realm },
            initial: withInitial
                ? { version: 1, locale, realm, direction: 'ltr', messages: { greeting: { text, sourceLocale: locale } } }
                : null,
        },
    };
}

it('renders a seam-backed component from the served catalog', () => {
    props.value = served('es', null, 'Hola', 'h-es');
    const { getByTestId } = render(<BeamMessages><Greeting /></BeamMessages>);

    expect(getByTestId('greeting').textContent).toBe('Hola');
});

it('is a passthrough where nothing is served: the component keeps its English default', () => {
    const { getByTestId } = render(<BeamMessages><Greeting /></BeamMessages>);

    expect(getByTestId('greeting').textContent).toBe('Hello');
});

it('takes a new catalog on a language switch AND on a realm switch, without remounting the page', () => {
    const mounts = vi.fn();
    props.value = served('en', null, 'Hello', 'h-en');
    const view = render(<BeamMessages><Greeting onMount={mounts} /></BeamMessages>);

    // A language switch (36): the server serves a new catalog with a new address hash.
    props.value = served('es', null, 'Hola', 'h-es');
    view.rerender(<BeamMessages><Greeting onMount={mounts} /></BeamMessages>);
    expect(view.getByTestId('greeting').textContent).toBe('Hola');

    // A realm switch: the same language, the realm's own rung.
    props.value = served('es', 'operator', 'Hola, operador', 'h-es-operator');
    view.rerender(<BeamMessages><Greeting onMount={mounts} /></BeamMessages>);
    expect(view.getByTestId('greeting').textContent).toBe('Hola, operador');

    expect(mounts).toHaveBeenCalledTimes(1);
});

it('keeps the catalog when a later response omits the once-prop for the same address', () => {
    props.value = served('es', null, 'Hola', 'h-es');
    const view = render(<BeamMessages><Greeting /></BeamMessages>);

    props.value = served('es', null, 'unused', 'h-es', false);
    view.rerender(<BeamMessages><Greeting /></BeamMessages>);

    expect(view.getByTestId('greeting').textContent).toBe('Hola');
});

it('puts BeamMessages outermost in every layout shape the resolver returns', () => {
    const A = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    const B = ({ children }: { children: React.ReactNode }) => <>{children}</>;

    expect(withBeamMessages(null)).toEqual([BeamMessages]);
    expect(withBeamMessages(A)).toEqual([BeamMessages, A]);
    expect(withBeamMessages([A, B])).toEqual([BeamMessages, A, B]);
});
