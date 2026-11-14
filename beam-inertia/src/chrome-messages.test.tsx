// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a>,
}));
vi.mock('./layouts/beam-account-layout', () => ({ default: () => null }));
vi.mock('./layouts/operator-layout', () => ({ default: () => null }));
vi.mock('./layouts/site-layout', () => ({ default: () => null }));

import AlertError from './components/alert-error';
import { Breadcrumb, BreadcrumbEllipsis } from './components/ui/breadcrumb';
import { Spinner } from './components/ui/spinner';
import ErrorPage from './pages/error';
import AccountHome from './pages/account/home';

afterEach(cleanup);
const prefix = 'splicewire-beam-inertia::messages.chrome_';
function catalog(lines: Record<string, string> = {}): ClientCatalog {
    return {
        version: 1, locale: 'en-XA', realm: null, direction: 'ltr',
        messages: Object.fromEntries(Object.entries(lines).map(([key, text]) => [prefix + key, { text, sourceLocale: 'en-XA' }])),
    };
}

it('keeps complete English defaults without a provider, including status interpolation and accessibility', () => {
    const view = render(<>
        <ErrorPage status={419} title="Server title" message="Server policy sentence" />
        <AlertError errors={['Server validation']} />
        <Breadcrumb><BreadcrumbEllipsis /></Breadcrumb>
        <Spinner />
        <AccountHome />
    </>);
    expect(view.getByText('Error 419')).toBeTruthy();
    expect(view.getByText('Go to the home page')).toBeTruthy();
    expect(view.getByText('Go back')).toBeTruthy();
    expect(view.getByText('Something went wrong.')).toBeTruthy();
    expect(view.getByLabelText('breadcrumb')).toBeTruthy();
    expect(view.getByLabelText('Loading')).toBeTruthy();
    expect(view.getByText('More')).toBeTruthy();
    expect(view.getByText('Account home')).toBeTruthy();
    expect(view.getByText('Manage your profile, security, API tokens and team from the sidebar (behind the menu button on a narrow screen).')).toBeTruthy();
});

it('uses the real pseudo provider while leaving server titles, messages, and supplied alert titles raw', () => {
    const view = render(<MessageProvider value={catalog()} pseudo>
        <ErrorPage status={403} title="Policy title" message="Authored policy message" />
        <AlertError title="Authored alert" errors={['Server validation']} />
    </MessageProvider>);
    expect(view.getByText('Policy title')).toBeTruthy();
    expect(view.getByText('Authored policy message')).toBeTruthy();
    expect(view.getByText('Authored alert')).toBeTruthy();
    expect(view.getByText('Server validation')).toBeTruthy();
    const home = view.getByRole('link');
    expect(home.textContent).not.toBe('Go to the home page');
    expect(home.textContent).toContain('⟦');
    expect(view.getByTestId('error-page').textContent).toContain('403');
});

it('updates translated copy and typed status in existing nodes when the provider changes', () => {
    const body = <><ErrorPage status={503} title="Server title" message="Server body" realm="operator" auth={{ user: {} }} /><AlertError errors={['Raw error']} /></>;
    const view = render(<MessageProvider value={catalog()}>{body}</MessageProvider>);
    const home = view.getByRole('link');
    const back = view.getByRole('button');
    const panel = view.getByTestId('error-page');
    const status = view.getByText('Error 503');
    view.rerender(<MessageProvider value={catalog({
        go_operator: '⟦Operator destination⟧', go_back: '⟦Back destination⟧',
        error_status: '⟦Status :status⟧', unexpected_error: '⟦Failure heading⟧',
    })}>{body}</MessageProvider>);
    expect(view.getByRole('link')).toBe(home);
    expect(view.getByRole('button')).toBe(back);
    expect(view.getByTestId('error-page')).toBe(panel);
    expect(view.getByText('⟦Status 503⟧')).toBe(status);
    expect(home.textContent).toBe('⟦Operator destination⟧');
    expect(home.getAttribute('href')).toBe('/operator');
    expect(back.textContent).toBe('⟦Back destination⟧');
    expect(view.getByText('⟦Failure heading⟧')).toBeTruthy();
    expect(view.getByText('Raw error')).toBeTruthy();
    expect(view.getByText('Server body')).toBeTruthy();
});
