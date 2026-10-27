import type { Meta, StoryObj } from '@storybook/react-vite';
import { RealmSwitcher } from './RealmSwitcher';

const meta = { title: 'BeamUx/Nav/RealmSwitcher', component: RealmSwitcher } satisfies Meta<typeof RealmSwitcher>;
export default meta;

/** The host supplies the icon DOM; no icon library enters the component. */
export const WithItemIcons: StoryObj<typeof RealmSwitcher> = {
    args: {
        label: 'Ada', signOutHref: '/logout', defaultOpen: true,
        realms: { current: 'tenant', back: null, realms: [
            { key: 'tenant', label: 'App', href: '/dashboard', surface: 'app', locked: false },
            { key: 'operator', label: 'Operator', href: '/operator', surface: 'app', locked: false },
            { key: 'site', label: 'Site', href: '/', surface: 'site', locked: false },
        ] },
        itemIcon: (item, { className }) => <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {item.kind === 'sign-out' ? <path d="M9 4H4v16h5M10 12h10m-4-4 4 4-4 4" /> :
                item.kind === 'site' ? <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-6 6-6 12 0 18 6-6 6-12 0-18" /></> :
                <path d="M4 4h16v16H4zM4 10h16M10 10v10" />}
        </svg>,
    },
};
