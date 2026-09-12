import { Head } from '@inertiajs/react';
import { PlatformConnectionPanel } from '../../platform/platform-connection-panel';
import type {
    PlatformConnection,
    PlatformConnectionEndpoints,
} from '../../platform/types';

/**
 * The operator realm's Platform-connection page.
 *
 * A thin mount, like `operator/dashboard` beside it: the chrome comes from `beamInertiaOptions`'
 * `layout:` switch for `operator/*`, and every moving part lives in
 * `../../platform/platform-connection-panel`, so a host that wants the surface somewhere else (an OS
 * float, an account-realm page) composes the panel directly without inheriting this route's chrome.
 *
 * Unlike its sibling, props are REQUIRED. The dashboard's optional props exist so it can render in an
 * OS window that threads only shared props with a plausible zero roll-up; there is no plausible
 * default for a pairing state, and a panel that rendered "not connected" because its props were
 * missing would be reporting a security-relevant fact it does not know.
 */
type Props = {
    connection: PlatformConnection;
    endpoints: PlatformConnectionEndpoints;
};

export default function OperatorPlatformConnection({ connection, endpoints }: Props) {
    return (
        <>
            <Head title="Platform connection" />
            <PlatformConnectionPanel connection={connection} endpoints={endpoints} />
        </>
    );
}
