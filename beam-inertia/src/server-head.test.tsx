// @vitest-environment jsdom
/**
 * ADR-0234 d1 (EP-28): the server composes each page's head, and Inertia's server head keeps it current as a visitor
 * navigates. Its title arrives branded, so the title callback passes it through: the brand's template applies once, on
 * the server. Driven through Inertia's own head manager, so a change in how Inertia calls these options fails here.
 */
import { createHeadManager, resolveServerHead, type Page } from '@inertiajs/core';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const brand = { name: 'Acme', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '' };
const TITLE = '<title data-inertia="title">About us - Acme</title>';
const DESCRIPTION = '<meta data-inertia="description" name="description" content="Who we are.">';

const page = (props: Record<string, unknown>) => ({ component: 'site/entry', props, url: '/', version: null }) as unknown as Page;

beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    document.body.innerHTML = `<script data-page="app" type="application/json">${JSON.stringify({ props: { brand } })}</script><div id="app"></div>`;
});

afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
});

it('takes the server head as it is, without branding its title a second time', async () => {
    const { beamInertiaOptions } = await import('./index');
    const options = beamInertiaOptions({});
    let head: string[] = [];

    createHeadManager(true, options.title, (elements) => (head = elements), resolveServerHead(page({ head: [TITLE, DESCRIPTION] }), options.serverHead));

    expect(head).toEqual([TITLE, DESCRIPTION]);
}, 30_000); // the first import loads the whole shell, which takes seconds under a full parallel run

it('still brands a page the server composed no head for, after one it did', async () => {
    const { beamInertiaOptions } = await import('./index');
    const options = beamInertiaOptions({});
    let head: string[] = [];

    // A visitor reads a public page, then signs in: the login page carries no head, so its own title is branded.
    resolveServerHead(page({ head: [TITLE] }), options.serverHead);
    const manager = createHeadManager(true, options.title, (elements) => (head = elements), resolveServerHead(page({}), options.serverHead));
    manager.createProvider().update(['<title data-inertia="">Log in</title>']);

    expect(head).toEqual(['<title data-inertia="">Log in - Acme</title>']);
});

it("turns off the packaged pages' own head, which the server's replaces", async () => {
    const { beamInertiaOptions } = await import('./index');
    const { entryPageConfig } = await import('@splicewire/beam-ux/docs');

    beamInertiaOptions({});

    expect(entryPageConfig().serverHead).toBe(true);
});
