/** Portable default realm bindings and window framing. Inertia desktop adapter: beam-inertia. */
import { createMainframeRegistry, createSlotRegistry } from '@schemastud/mainframe';
import type { Mainframe, MainframeInjection } from '@schemastud/mainframe';
import '@schemastud/mainframe/os/shell.css';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { LinkComponent } from '../site/types';
import type { RealmManifestEntry, RealmSurfaceBinding } from './realm';

/**
 * The generic placeholder surface for a realm key with no `surfaceMap` binding — the auto-surface
 * affordance every consumer of `buildAppsFromManifest` must supply. Neutral (no host branding baked
 * in); a host overriding the look entirely just binds the realm key in its own `surfaceMap` instead.
 */
function DefaultGenericSurface({ entry }: { entry: RealmManifestEntry }) {
    return (
        <div
            style={{
                padding: 28,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#6b7280',
                background: '#f9fafb',
                height: '100%',
            }}
        >
            <div style={{ color: '#6366f1', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Realm auto-surfaced
            </div>
            <p style={{ maxWidth: '46ch', margin: 0 }}>
                The <b>{entry.title}</b> realm (<code>{entry.key}</code>) is registered but no surface
                component is bound to it yet. Bind one via this desktop&apos;s <code>surfaceMap</code>{' '}
                prop — until then it opens this placeholder.
            </p>
        </div>
    );
}

/** The default auto-surface binding: a neutral placeholder window, keyed off the manifest entry alone. */
export function defaultGenericBinding(entry: RealmManifestEntry): RealmSurfaceBinding {
    return {
        label: entry.title,
        route: entry.routeBase || '/',
        subtitle: 'Realm · unbound surface',
        accent: '#6b7280',
        geometry: { x: 240, y: 130, width: 640, height: 480 },
        render: () => <DefaultGenericSurface entry={entry} />,
    };
}

/**
 * A per-window error boundary. A real surface component that hard-crashes (typically because it needs
 * page-specific Inertia props the desktop only threads shared props for) degrades to a legible notice
 * INSIDE its window, with a link to the live route — never a silent blank window.
 */
class SurfaceBoundary extends Component<{ title: string; route: string; children: ReactNode; linkComponent?: LinkComponent }, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`[beam-ux/shell] surface "${this.props.title}" threw`, error, info);
    }
    render() {
        if (this.state.error) {
            const Link: LinkComponent = this.props.linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);
            return (
                <div
                    style={{
                        padding: 28,
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: '#6b7280',
                        background: '#f9fafb',
                        height: '100%',
                    }}
                >
                    <div style={{ color: '#dc2626', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                        Surface needs its page props
                    </div>
                    <p style={{ maxWidth: '46ch' }}>
                        The real <b>{this.props.title}</b> component crashed without its page-specific
                        Inertia props (the desktop threads only shared props). Open the live route to see
                        it in full:
                    </p>
                    <Link href={this.props.route} style={{ color: '#6366f1' }}>
                        open {this.props.route} ↗
                    </Link>
                    <pre style={{ marginTop: 14, whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(this.state.error.message)}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

const surfaceMainframe: Mainframe = ({ slots }) => (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>{slots.main()}</div>
);

/** The default nested-window fill: frames `render()` in a `SurfaceBoundary`, no other chrome. */
export function defaultSurfaceInjection(title: string, route: string, render: () => ReactNode, linkComponent?: LinkComponent): MainframeInjection {
    const slots = createSlotRegistry();
    const mainframes = createMainframeRegistry();
    mainframes.register('surface', surfaceMainframe);
    slots.contribute({
        slot: 'main',
        key: `surface:${title}`,
        render: () => (
            <SurfaceBoundary title={title} route={route} linkComponent={linkComponent}>
                {render()}
            </SurfaceBoundary>
        ),
    });

    return { slots, mainframes };
}
