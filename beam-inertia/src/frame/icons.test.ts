import { Circle } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { frameIcon } from './icons';

describe('frameIcon', () => {
    // The names the operator rail's seats declare today (laravel-tower-starter's `platform` seat and the
    // resources that join it). An unmapped name renders the neutral dot, which reads as "unstyled", so
    // each one a host actually ships is pinned here in both casings the wire carries.
    it.each(['Building', 'LayoutDashboard', 'Activity', 'Gauge', 'Bot', 'Cable'])(
        'maps the operator seat icon %s in both casings',
        (name) => {
            const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

            expect(frameIcon(name)).not.toBe(Circle);
            expect(frameIcon(kebab)).toBe(frameIcon(name));
        },
    );

    it('falls back to the neutral dot for an unmapped or missing name', () => {
        expect(frameIcon('not-an-icon')).toBe(Circle);
        expect(frameIcon(null)).toBe(Circle);
    });
});
