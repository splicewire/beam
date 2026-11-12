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

    // The names every other live `#[ParticleResource]` declaration in the estate carries (beam-accounts,
    // beam-calendars, beam-commerce, beam-notifications, beam-workflows, satellite-composition, tower,
    // beam-extension-demo). The Bills and Declarations tiles drew the dot at every host before
    // `receipt` and `shield-check` joined.
    it.each([
        'Receipt',
        'Mic',
        'mic',
        'ShieldCheck',
        'Calendar',
        'CalendarDays',
        'Clapperboard',
        'FileBadge',
        'FileCode',
        'IdCard',
        'Inbox',
        'Key',
        'Layers',
        'ListChecks',
        'Mail',
        'MessagesSquare',
        'NotebookPen',
        'Package',
        'Repeat',
        'Scale',
        'Send',
        'Shapes',
        'Sliders',
        'Target',
        'UserCog',
        'Workflow',
    ])('maps the declared resource icon %s in both casings', (name) => {
        const kebab = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

        expect(frameIcon(name)).not.toBe(Circle);
        expect(frameIcon(kebab)).toBe(frameIcon(name));
    });

    // owner-review-20261112 08: the names the flagship's manifest dumps carried unmapped (Guest Links, Privacy, Activity,
    // Grounding, Silos, the Exec board), as the wire spells them. Each drew the dot before this map held it.
    it.each([
        ['book-open-check', 'BookOpenCheck'],
        ['box', 'Box'],
        ['code', 'Code'],
        ['eye-off', 'EyeOff'],
        ['folder-tree', 'FolderTree'],
        ['history', 'History'],
        ['share-2', 'Share2'],
        ['circle-dollar-sign', 'CircleDollarSign'],
        ['pie-chart', 'PieChart'],
        ['presentation', 'Presentation'],
        ['trending-up', 'TrendingUp'],
        ['triangle-alert', 'TriangleAlert'],
    ])('maps %s and %s to one icon', (kebab, pascal) => {
        expect(frameIcon(pascal)).not.toBe(Circle);
        expect(frameIcon(kebab)).toBe(frameIcon(pascal));
    });

    it('falls back to the neutral dot for an unmapped or missing name', () => {
        expect(frameIcon('not-an-icon')).toBe(Circle);
        expect(frameIcon(null)).toBe(Circle);
    });
});
