import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { createWidgetRegistry, SchemaForm } from '@schemastud/seam';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import registerAgreementWidgets from './register.js';

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
        data: { key: 'terms', kind: 'contract', title: 'Terms of service', version: { digest: 'sha256:current', content: 'Frozen terms text.' } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
});

afterEach(() => vi.unstubAllGlobals());

describe('agreement-member schema widget', () => {
    it('uses embedded guest terms without making an unauthenticated read', async () => {
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;

        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I have read and agree"
                value={undefined}
                options={{
                    key: 'terms', version: 3, digest: 'sha256:current', kind: 'contract',
                    title: 'Terms of service', content: 'Frozen guest terms.', legalUrl: null,
                }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByText('Frozen guest terms.')).toBeTruthy();
        expect(screen.getByRole('checkbox', { name: 'I have read and agree' })).toBeTruthy();
        expect(fetch).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('checkbox', { name: 'I have read and agree' }));
        expect(onChange.mock.calls.at(-1)?.[0]).toEqual({ key: 'terms', version: 3, digest: 'sha256:current' });
    });

    it('renders an embedded notice without a checkbox or member', async () => {
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;

        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="Agreement"
                value={undefined}
                options={{ key: 'privacy', version: 1, digest: 'sha256:notice', kind: 'notice', title: 'Privacy notice', content: 'We use your data.' }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByText('We use your data.')).toBeTruthy();
        expect(screen.queryByRole('checkbox')).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
        expect(onChange.mock.calls.at(-1)?.[0]).toBeUndefined();
    });

    it('fetches the agreement and emits only the existing member shape when checked', async () => {
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const schema = { type: 'object', 'x-widget': 'agreement-member' };
        expect(registry.resolveWidget(schema)).toBeDefined();

        const onChange = vi.fn();
        const Widget = registry.resolveWidget(schema) as ComponentType<any>;
        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I have read and agree"
                value={undefined}
                options={{ key: 'terms', version: 3, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/terms' }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByText('Terms of service')).toBeTruthy();
        expect(screen.getByText('Frozen terms text.')).toBeTruthy();
        fireEvent.click(screen.getByRole('checkbox', { name: 'I have read and agree' }));
        expect(onChange).toHaveBeenCalledWith({ key: 'terms', version: 3, digest: 'sha256:current' });
        expect(fetch).toHaveBeenCalledWith('/beam/agreements/agreements/terms', {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });
    });

    it('shows a notice as information and submits no agreement member', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: { key: 'privacy', kind: 'notice', title: 'Privacy notice', version: { digest: 'sha256:notice', content: 'How we use your data.' } },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
        const onSubmit = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        render(
            <SchemaForm
                schema={{
                    type: 'object',
                    properties: {
                        privacy: {
                            type: 'object',
                            title: 'Privacy notice',
                            'x-widget': 'agreement-member',
                            'x-widget-options': { key: 'privacy', version: 2, digest: 'sha256:notice', readUrl: '/beam/agreements/agreements/privacy' },
                        },
                    },
                }}
                registry={registry}
                onSubmit={onSubmit}
            />,
        );

        expect(await screen.findByText('Privacy notice')).toBeTruthy();
        expect(screen.getByText('How we use your data.')).toBeTruthy();
        expect(screen.queryByRole('checkbox')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onSubmit.mock.calls[0]?.[0].formData).toEqual({});
    });

    it('does not read or submit agreement text when the schema omits the expected digest', async () => {
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;
        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I agree"
                value={undefined}
                options={{ key: 'terms', version: 3 }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.queryByText('Frozen terms text.')).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
        expect((screen.getByRole('checkbox', { name: 'I agree' }) as HTMLInputElement).disabled).toBe(true);
        expect(onChange.mock.calls[0]?.[0]).toBeUndefined();
    });

    it('renders from schema x-widget-options and submits the fetched member through SchemaForm', async () => {
        const onSubmit = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        render(
            <SchemaForm
                schema={{
                    type: 'object',
                    required: ['agreementMember'],
                    properties: {
                        agreementMember: {
                            type: 'object',
                            title: 'I agree',
                            'x-widget-options': { key: 'terms', version: 3, digest: 'sha256:current' },
                            'x-widget': 'agreement-member',
                        },
                    },
                }}
                registry={registry}
                onSubmit={onSubmit}
            />,
        );

        expect(await screen.findByText('Frozen terms text.')).toBeTruthy();
        fireEvent.click(screen.getByRole('checkbox', { name: 'I agree' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        await screen.findByRole('button', { name: 'Submit' });
        expect(onSubmit.mock.calls[0]?.[0].formData).toEqual({
            agreementMember: { key: 'terms', version: 3, digest: 'sha256:current' },
        });
    });

    it('refuses SchemaForm submission while the agreement checkbox is unchecked', async () => {
        const onSubmit = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        render(
            <SchemaForm
                schema={{
                    type: 'object',
                    required: ['agreementMember'],
                    properties: {
                        agreementMember: {
                            type: 'object',
                            title: 'I agree',
                            'x-widget': 'agreement-member',
                            'x-widget-options': { key: 'terms', version: 3, digest: 'sha256:current' },
                        },
                    },
                }}
                registry={registry}
                onSubmit={onSubmit}
            />,
        );

        expect(await screen.findByText('Frozen terms text.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        const validation = await screen.findByRole('alert');
        expect(validation.textContent).toContain("must have required property 'I agree'");
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit a previously selected member when the agreement REST read is forbidden', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })));
        const onSubmit = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        render(
            <SchemaForm
                schema={{
                    type: 'object',
                    required: ['agreementMember'],
                    properties: {
                        agreementMember: {
                            type: 'object',
                            title: 'I agree',
                            'x-widget': 'agreement-member',
                            'x-widget-options': { key: 'terms', version: 3, digest: 'sha256:current' },
                        },
                    },
                }}
                registry={registry}
                formData={{ agreementMember: { key: 'terms', version: 3, digest: 'sha256:current' } }}
                onSubmit={onSubmit}
            />,
        );

        expect(await screen.findByText('This agreement changed or is unavailable. Reload the form before accepting.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not emit a member when the checkbox is unchecked', async () => {
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;
        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I agree"
                value={{ key: 'terms', version: 3, digest: 'sha256:current' }}
                options={{ key: 'terms', version: 3, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/terms' }}
                onChange={onChange}
            />,
        );

        fireEvent.click(await screen.findByRole('checkbox', { name: 'I agree' }));
        expect(onChange.mock.calls[0]?.[0]).toBeUndefined();
    });

    it('does not show stale text or permit assent after the digest moves', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: { key: 'terms', title: 'Terms of service', version: { digest: 'sha256:new', content: 'New frozen text.' } },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;
        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I agree"
                value={{ key: 'terms', version: 3, digest: 'sha256:current' }}
                options={{ key: 'terms', version: 3, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/terms' }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.queryByText('New frozen text.')).toBeNull();
        expect((screen.getByRole('checkbox', { name: 'I agree' }) as HTMLInputElement).disabled).toBe(true);
        expect(onChange.mock.calls[0]?.[0]).toBeUndefined();
    });

    it.each([401, 403, 404])('does not show text or retain a submitted member when REST returns %i', async (status) => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status })));
        const onChange = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;
        render(
            <Widget
                id="agreement-member"
                name="agreementMember"
                label="I agree"
                value={{ key: 'terms', version: 3, digest: 'sha256:current' }}
                options={{ key: 'terms', version: 3, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/terms' }}
                onChange={onChange}
            />,
        );

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.queryByText('Frozen terms text.')).toBeNull();
        expect((screen.getByRole('checkbox', { name: 'I agree' }) as HTMLInputElement).disabled).toBe(true);
        expect(onChange.mock.calls[0]?.[0]).toBeUndefined();
    });

    it.each([401, 403, 404])('blocks the form submission when the agreement read returns %i', async (status) => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status })));
        const onSubmit = vi.fn();
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        render(
            <SchemaForm
                schema={{
                    type: 'object',
                    required: ['agreementMember'],
                    properties: {
                        agreementMember: {
                            type: 'object',
                            title: 'I agree',
                            'x-widget': 'agreement-member',
                            'x-widget-options': { key: 'terms', version: 3, digest: 'sha256:current' },
                        },
                    },
                }}
                registry={registry}
                onSubmit={onSubmit}
            />,
        );

        expect(await screen.findByText('This agreement changed or is unavailable. Reload the form before accepting.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('agreements 10b: never presents a contract and a consent as one checkbox: each agreement is its own member', async () => {
        // Each widget reads its own agreement.
        vi.stubGlobal('fetch', vi.fn(async (url: string) => {
            const key = url.endsWith('voice-use') ? 'voice-use' : 'terms';
            const title = key === 'terms' ? 'Terms of service' : 'Voice use';
            return new Response(JSON.stringify({ data: { key, title, version: { digest: 'sha256:current', content: `${title} text.` } } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }));
        const registry = createWidgetRegistry();
        registerAgreementWidgets(registry);
        const Widget = registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' }) as ComponentType<any>;
        const terms = vi.fn();
        const voice = vi.fn();
        render(
            <>
                <Widget id="terms" name="terms" label="I accept the terms" value={undefined} options={{ key: 'terms', version: 3, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/terms' }} onChange={terms} />
                <Widget id="voice" name="voice" label="I consent to voice use" value={undefined} options={{ key: 'voice-use', version: 1, digest: 'sha256:current', readUrl: '/beam/agreements/agreements/voice-use' }} onChange={voice} />
            </>,
        );

        await screen.findByText('Terms of service');
        await screen.findByText('Voice use');
        const boxes = screen.getAllByRole('checkbox');
        expect(boxes).toHaveLength(2);
        fireEvent.click(screen.getByRole('checkbox', { name: 'I consent to voice use' }));
        expect(voice).toHaveBeenCalledWith({ key: 'voice-use', version: 1, digest: 'sha256:current' });
        expect(terms).not.toHaveBeenCalled();
    });
});

