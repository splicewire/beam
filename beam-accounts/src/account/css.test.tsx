import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SidebarProvider, TooltipProvider } from '@schemastud/ui';
import { AccountShell } from './AccountShell.js';
import { ACCOUNT_SHELL_CSS } from './css.js';
describe('AccountShell renders its own sheet', () => {
    it('the collapsed-rail action and the metrics row gap are sheet rules', () => {
        const { container } = render(
            <SidebarProvider>
                <TooltipProvider>
                    <AccountShell
                        nav={{ items: [{ title: 'Dashboard', href: '/account' }] }}
                        shell={{
                            plan: { tier: 'free', label: 'Free', credits: 6, max: 8 },
                            profile: { handle: '@drew', avatar: 'DM', metrics: [{ label: 'SONGS', value: '4' }] },
                            account: { email: 'drew@example.test', paymentMethodLabel: null },
                            upsells: [],
                        }}
                        action={<button type="button">New</button>}
                        sections={{ profile: true }}
                    >
                        <div>page</div>
                    </AccountShell>
                </TooltipProvider>
            </SidebarProvider>,
        );
        const sheets = Array.from(container.querySelectorAll('style')).map((s) => s.textContent);
        expect(sheets).toContain(ACCOUNT_SHELL_CSS);
        expect(container.querySelector('.beam-ux-account-action')).not.toBeNull();
        expect(container.querySelector('.beam-ux-account-metrics')).not.toBeNull();
        expect(ACCOUNT_SHELL_CSS).toMatch(/\[data-collapsible='icon'\] \.beam-ux-account-action\s*\{\s*display:\s*none/);
        expect(ACCOUNT_SHELL_CSS).toMatch(/\.beam-ux-account-metrics\s*\{[^}]*row-gap:\s*0\.125rem/);
    });
});

it('keeps account sheet colours token-only after the ownership move', () => {
    expect(ACCOUNT_SHELL_CSS).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    for (const declaration of ACCOUNT_SHELL_CSS.match(/(?:color|background(?:-image)?|box-shadow):[^;]+/g) ?? []) {
        expect(declaration.replace(/var\(--[a-z-]+[^)]*\)/g, '')).not.toMatch(/\b(rgb|hsl|oklch|oklab)\(/);
    }
});
