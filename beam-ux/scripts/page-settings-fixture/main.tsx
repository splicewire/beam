import { createRoot } from 'react-dom/client';
import { CanvasProvider } from '../../src/canvas/context';
import { PageEditor } from '../../src/canvas/PageEditor';
const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [{ kind: 'text' as const, value: 'Layout fixture' }] }];
const state = { headVersion: 'v1', publishedVersion: 'v1', draftPending: false, versions: [] };
// Component fixture transport: deterministic conflict/reload, no server or authenticated-user claim.
createRoot(document.getElementById('root')!).render(<>
    <button onClick={() => window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }))}>Enter editor</button>
    <CanvasProvider config={{ registry: {}, MdxView: () => null, MdxEdit: () => null }}>
        <PageEditor slug="settings-layout" entryId="settings-layout" userId="fixture-author" body={body}
            pageSettings={{ title: 'Original' }} transport={{
                saveBody: async () => null, listVersions: async () => state, publish: async () => state,
                restoreVersion: async () => state,
                saveDraft: async () => { throw Object.assign(new Error('Conflict'), { status: 409 }); },
                loadBody: async () => ({ body, pageSettings: { title: 'Reloaded' } }),
            }} />
    </CanvasProvider>
</>);
