import { useCallback, useId, useMemo, useRef, type ComponentProps } from 'react';
import { ChevronsUpDown, UserRound, UserSearch } from 'lucide-react';
import { Combobox, type ComboboxOption, type ComboboxPrimitives } from '@schemastud/combobox';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '@schemastud/ui';
import type { DemoAccountLinkData, DemoUserLinkData } from '@splicewire/beam-resources/types/accounts-pages';

/** One demo subject's one-click sign-in, as the server publishes it (`AuthEntryPageData.demoAccounts`). */
export type DemoLoginAccount = DemoAccountLinkData;

/** One "any user" picker result, as `GET users/demo-search` returns it; `url` is the signed, expiring login-as link. */
export type DemoLoginUser = DemoUserLinkData;

/** What the visitor chose: a demo subject from the roster, or any user from the picker. */
export type DemoLoginChoice = ({ kind: 'account' } & DemoLoginAccount) | ({ kind: 'user' } & DemoLoginUser);

export interface DemoLoginProps {
    /** The demo-subject roster (`AuthEntryPageData.demoAccounts`). Empty or absent draws no roster. */
    accounts?: DemoLoginAccount[];
    /**
     * Where the "log in as any user" picker searches (`AuthEntryPageData.demoUserSearchUrl`). The server sets it only
     * on a local host with every demo gate open, so absent means no picker. Ignored when `search` is supplied.
     */
    searchUrl?: string | null;
    /**
     * The picker's transport, for a host that does not reach `searchUrl` with a same-origin `fetch` (a token SPA on
     * another origin). Supplying it turns the picker on.
     */
    search?: (query: string) => Promise<DemoLoginUser[]>;
    /**
     * What a choice does. Defaults to a full GET of its signed `url`, which signs a SESSION host in and redirects. A
     * token host converts the choice into its own hand-off instead (the flagship's `/dev/login-as` hop).
     */
    onSelect?: (choice: DemoLoginChoice) => void;
    /** The atoms the picker renders into. Defaults to `@schemastud/ui`'s. */
    primitives?: ComboboxPrimitives;
    /** Placement classes for the section, e.g. its margin under a form. */
    className?: string;
}

/** `@schemastud/ui`'s Popover root is an inline-block; the picker's trigger is full width, so its root is a block. */
function BlockPopover(props: ComponentProps<typeof Popover>) {
    return (
        <div className="w-full [&>div]:block [&>div]:w-full">
            <Popover {...props} />
        </div>
    );
}

function WidePopoverContent(props: ComponentProps<typeof PopoverContent>) {
    return <PopoverContent {...props} className="w-full min-w-0 p-0" />;
}

const DEFAULT_PRIMITIVES: ComboboxPrimitives = {
    Popover: BlockPopover,
    PopoverTrigger,
    PopoverContent: WidePopoverContent,
    Input,
};

/** The default transport: a same-origin GET of the declared `users.demo-search` op, unwrapping beam's envelope. */
export function fetchDemoUsers(searchUrl: string): (query: string) => Promise<DemoLoginUser[]> {
    return async (query) => {
        const url = new URL(searchUrl, window.location.href);
        if (query.trim()) url.searchParams.set('q', query.trim());

        const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (!response.ok) return [];

        const body = (await response.json()) as { data?: { users?: DemoLoginUser[] } };
        return body.data?.users ?? [];
    };
}

const followLink = (choice: DemoLoginChoice) => window.location.assign(choice.url);

/**
 * The login page's demo sign-in (S1, owner-review-20261026 ticket 01): the demo-subject roster as one-click buttons,
 * and, on a local host, a typeahead that signs in as ANY user. Portable and transport-injected like the rest of the
 * auth panels: a session host mounts it as-is in `LoginPanel`'s `footer` (or beside its own form), a token host
 * supplies `search` and `onSelect`.
 *
 * Every gate is the server's. The roster arrives only when the host is in demo mode, the search URL only when the
 * third, local-only gate holds; this component draws exactly what it is given and nothing when it is given nothing.
 */
export function DemoLogin({
    accounts = [],
    searchUrl,
    search,
    onSelect = followLink,
    primitives = DEFAULT_PRIMITIVES,
    className,
}: DemoLoginProps) {
    // Unique per mount, so two panels on one page never share a labelling id (impeccable audit, a11y).
    const headingId = useId();
    const transport = useMemo(() => search ?? (searchUrl ? fetchDemoUsers(searchUrl) : null), [search, searchUrl]);

    // The combobox is value-neutral (`{ value, label, hint }`); this bridges a chosen value back to its user.
    const seen = useRef(new Map<string, DemoLoginUser>());

    const searchOptions = useCallback(
        async (query: string): Promise<ComboboxOption[]> => {
            if (!transport) return [];
            const users = await transport(query);
            users.forEach((user) => seen.current.set(user.id, user));
            return users.map((user) => ({ value: user.id, label: user.name, hint: user.email }));
        },
        [transport],
    );

    const chooseUser = useCallback(
        (option: ComboboxOption) => {
            const user = seen.current.get(option.value);
            if (user) onSelect({ kind: 'user', ...user });
        },
        [onSelect],
    );

    if (accounts.length === 0 && !transport) return null;

    return (
        <section aria-labelledby={headingId} className={['space-y-3', className].filter(Boolean).join(' ')} data-testid="demo-login">
            <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" aria-hidden />
                <h2 id={headingId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Demo sign-in
                </h2>
                <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            {accounts.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2" aria-label="Demo accounts">
                    {accounts.map((account) => (
                        <li key={account.key}>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                aria-label={`Sign in as ${account.label}`}
                                onClick={() => onSelect({ kind: 'account', ...account })}
                            >
                                <UserRound className="size-4 shrink-0" aria-hidden />
                                <span className="truncate">{account.label}</span>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            {transport && (
                <Combobox
                    primitives={primitives}
                    search={searchOptions}
                    onSelect={chooseUser}
                    placeholder="Search by name or email"
                    emptyText="No user matches"
                    loadingText="Searching users…"
                    trigger={
                        <Button type="button" variant="outline" className="w-full justify-between font-normal">
                            <span className="flex min-w-0 items-center gap-2">
                                <UserSearch className="size-4 shrink-0" aria-hidden />
                                <span className="truncate">Sign in as any user…</span>
                            </span>
                            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        </Button>
                    }
                />
            )}

            <p className="text-center text-xs text-muted-foreground">
                {transport ? 'Local development only. Never shown in production.' : 'Demo accounts. Never shown in production.'}
            </p>
        </section>
    );
}
