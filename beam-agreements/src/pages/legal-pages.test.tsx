import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgreementStepUp } from '../interlock/AgreementStepUp';
import { createStepUp } from '../interlock/stepUp';
import Legal from './Legal';
import LegalVersion from './LegalVersion';

const v1 = { label: 'v1', effectiveAt: '2026-10-01T00:00:00+00:00', material: true, digest: 'd1', summary: 'First terms.', url: '/legal/terms/versions/v1' };
const v2 = { label: 'v2', effectiveAt: '2026-11-20T00:00:00+00:00', material: true, digest: 'd2', summary: 'We now share data with processors.', url: '/legal/terms/versions/v2', content: 'Version two text.' };

describe('the public legal pages', () => {
    it('shows the version in force with its effective date, what changed and full text, and links each earlier version', () => {
        render(<Legal title="Terms of Service" current={v2} earlier={[v1]} />);
        expect(screen.getByRole('heading', { level: 1, name: 'Terms of Service' })).toBeTruthy();
        expect(screen.getByText(/Version v2 · in effect since November 20, 2026/)).toBeTruthy();
        expect(screen.getByText('We now share data with processors.')).toBeTruthy();
        expect(screen.getByText('Version two text.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Version v1' }).getAttribute('href')).toBe('/legal/terms/versions/v1');
    });

    it('shows one earlier version in full with a way back to the version in force', () => {
        render(<LegalVersion title="Terms of Service" version={{ ...v1, content: 'Version one text.' }} legalUrl="/legal/terms" />);
        expect(screen.getByText(/Version v1 · in effect from October 1, 2026/)).toBeTruthy();
        expect(screen.getByText('Version one text.')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Read the version in force' }).getAttribute('href')).toBe('/legal/terms');
    });
});

describe('the prompt shows what changed', () => {
    it('puts the summary above the full text in the step-up dialog', async () => {
        const stepUp = createStepUp();
        render(<AgreementStepUp controller={stepUp} />);
        void stepUp.ask([{ key: 'terms', title: 'Terms of Service', label: 'v2', digest: 'd2', content: 'Version two text.', summary: 'We now share data with processors.', remedy: { accept: 'agreements.accept' } }]);
        expect(await screen.findByText('We now share data with processors.')).toBeTruthy();
        expect(screen.getByText('Version two text.')).toBeTruthy();
    });
});
