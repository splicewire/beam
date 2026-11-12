// Build-time only, imported explicitly with frame-vocabulary --readers. No root-barrel export.
import type { FrameReaders } from '@schemastud/frame/vocabulary';
import { FrameRail } from './components/frame-rail';
import { FrameRoutes } from './frame/router';
import { formFromManifest, labelFromManifest } from './frame/manifest';

export default {
    'manifest:nav': FrameRail,
    'manifest:routeContext': FrameRoutes,
    'resource-entry:editable': FrameRoutes,
    'resource-entry:form': formFromManifest,
    'resource-entry:key': formFromManifest,
    'resource-entry:nav': labelFromManifest,
    'resource-entry:nav.label': labelFromManifest,
    'resource-entry:showable': FrameRoutes,
} satisfies FrameReaders;
