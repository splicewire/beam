import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AppRail } from './AppRail.js';
afterEach(cleanup);
const groups = [{ id: 'tools', label: 'Tools', items: [{ id: 'one', title: 'One', href: '/one' }] }];
it('keeps the default semantic rail and active styling unchanged', () => {
    const { container } = render(<AppRail groups={groups} isActive={() => true} />);
    expect(container.querySelector('nav > section > ul > li > a')?.textContent).toBe('One');
    expect(screen.getByRole('link').getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link').className).toContain('bg-sidebar-accent');
});
it('lets an adapter render rows and group chrome using core-computed active state', () => {
    const { rerender } = render(<AppRail groups={groups} isActive={() => true}
        renderGroup={(group, children) => <section aria-label={group.label}><ol>{children}</ol></section>}
        renderItem={(item, { active }) => <li><a href={item.href} data-adapter="yes" aria-current={active ? 'page' : undefined}>{item.title}</a></li>} />);
    expect(screen.getByRole('link').getAttribute('data-adapter')).toBe('yes');
    expect(screen.getByRole('link').getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('list').tagName).toBe('OL');
    rerender(<AppRail groups={groups} isActive={() => false}
        renderItem={(item, { active }) => <li><a href={item.href} aria-current={active ? 'page' : undefined}>{item.title}</a></li>} />);
    expect(screen.getByRole('link').hasAttribute('aria-current')).toBe(false);
});
