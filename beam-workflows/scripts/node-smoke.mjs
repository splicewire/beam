// Node smoke test of the BUILT package (localization 30 W3, REVIEW-30W3): bare-import each dist entry through the
// package's own exports, as an installed consumer (or an SSR renderer) does, with no bundler in between. A catalog
// imported as JSON without an import attribute fails here with ERR_IMPORT_ATTRIBUTE_MISSING; a bundler would hide it.
// Run after `pnpm run build`: node scripts/node-smoke.mjs
const entries = ['@splicewire/beam-workflows/action-form'];
let failed = 0;
for (const entry of entries) {
    try {
        const mod = await import(entry);
        const names = Object.keys(mod);
        if (names.length === 0) throw new Error('no exports');
        console.log(`ok   ${entry} (${names.length} exports)`);
    } catch (error) {
        failed++;
        console.log(`FAIL ${entry}: ${error?.code ?? ''} ${String(error?.message ?? error).split('\n')[0]}`);
    }
}
// SSR: render the action form to a string, with no catalog provider, and require the English default label: the
// catalog module must load AND resolve the line (what laravel-beam-starter's Inertia SSR does).
try {
    const { createElement } = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { WorkflowActionForm } = await import('@splicewire/beam-workflows/action-form');
    const html = renderToString(createElement(WorkflowActionForm, { projection: null, onSchedule: async () => {} }));
    if (!html.includes('Schedule transition') || !html.includes('Choose a subject with a workflow to see its transitions.')) {
        throw new Error('the English catalog lines did not render');
    }
    console.log('ok   SSR renderToString(WorkflowActionForm) renders the catalog English');
} catch (error) {
    failed++;
    console.log(`FAIL SSR render: ${error?.code ?? ''} ${String(error?.message ?? error).split('\n')[0]}`);
}
process.exit(failed ? 1 : 0);
