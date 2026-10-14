# Shared app shell

The `@splicewire/beam-ux/appshell` entry owns placement, not a router or a feature roster.
`AppShell` generalizes Tower's desk/window/focus placement. `AppRail` generalizes its
customer rail without the customer route list. Existing consumers are unchanged.

```tsx
import { createBeamApp, AppRail } from '@splicewire/beam-ux/appshell';

const app = createBeamApp({ runtime: hostRuntime, Providers: HostProviders });
// Inside HostProviders or the outlet: app.useRuntime() is typed as hostRuntime.

const contribute = slots => {
    slots.contribute({ slot: 'brand', key: 'brand', node: <HostBrand /> });
    slots.contribute({
        slot: 'rail', key: 'navigation',
        node: <AppRail groups={admittedGroups} Link={HostLink} isActive={isActive} />,
    });
};

<app.App mode="desk" can={hostCan} contribute={contribute}
    context={{ canvas: 'flat', navigation: { mobile, open, onOpenChange: setOpen } }}
    outlet={<HostOutlet />} routeKey={locationKey} />;
```

`Link` receives anchor props (`href`, `aria-current`, `className`, children); the adapter
translates `href` to its router's contract and forwards the accessibility/style props.
Without a Link, the rail uses document anchors. `isActive` derives active state from the
host router; the rail stores no selection state. The host supplies already-admitted groups.

`outlet` is a React node, so an Inertia page, router outlet, or rendered site can use the
same core. An optional `routeKey` deliberately remounts page content on route transitions.
The context carries placement facts; its payload is reserved for the injected outlet.
`contribute` should be stable while the host roster is unchanged. Slots use Mainframe's
capability resolver; authorization and feature transports remain outside this package.

`createBeamApp` creates an isolated typed runtime context and returns `{ App, runtime,
useRuntime }`. It does not create a router, register feature widgets, mount a React root,
or access browser globals. The host owns those lifecycles. Runtime is supplied once per
factory; dynamic session/navigation state belongs in host providers or shell props.
`useRuntime` fails if called outside that factory's App.

The desk accepts host-controlled mobile disclosure and puts the same rail in the Sheet.
Window places `main` and `windowEdit`; focus places `main` and `focusExit`. The host supplies
CSS tokens/utilities (including `dotted-bg`, `route-enter`, and sidebar colors) as before.
No account, commerce, tenancy, navigation controller, or server route is installed by this entry.
