import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FiveRegionEditShell, useEditShellMount } from '@schemastud/frame/editor';
import { createWidgetRegistry } from '@schemastud/seam';
import { BlockInspector } from '../../src/canvas/BlockInspector';
import { CanvasProvider } from '../../src/canvas/context';

// One block whose attributes can change while the inspector's Text panel is closed. No server or host claim.
function Harness() {
    const [attrs, setAttrs] = useState<Record<string, unknown>>({ bdStyle: { layers: [{ declarations: { color: '#ff0000' } }] } });
    const registry = createWidgetRegistry();
    function Canvas() {
        const mount = useEditShellMount();
        useEffect(() => mount.registerNodeAccess({
            getNode: () => ({ type: 'p', attrsSchema: { type: 'object', properties: {} }, attrs }),
            setNodeAttrs: (_id, next) => setAttrs(next),
        }), [mount]);
        return <button type="button" onClick={() => mount.selectNode('0')}>Select node</button>;
    }
    registry.registerWidget('fixture', Canvas);
    return <CanvasProvider config={{ registry: {}, MdxView: () => null, MdxEdit: () => null, varSuggestions: ['var(--brand)'] }}>
        <FiveRegionEditShell widget="fixture" schema={{ type: 'object' }} registry={registry} inspector={<BlockInspector />} />
        <button type="button" onClick={() => setAttrs({ bdStyle: { layers: [{ declarations: { color: '#0000ff' } }] } })}>Recolour the block</button>
        <output data-testid="attrs">{JSON.stringify(attrs)}</output>
    </CanvasProvider>;
}

createRoot(document.getElementById('root')!).render(<Harness />);
