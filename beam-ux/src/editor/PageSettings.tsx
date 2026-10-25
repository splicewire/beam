import type { SessionPageSettings } from './local-session';

/** These controls change the Local Session, never the published entry row. */
export function PageSettings({ value, onChange }: { value: SessionPageSettings; onChange: (value: SessionPageSettings) => void }) {
  const fields = [
    ['title', 'Title'], ['parentId', 'Parent entry ID'], ['segment', 'URL segment'],
    ['navGroup', 'Navigation group'], ['layout', 'Layout'], ['template', 'Template'],
    ['description', 'Description'], ['socialImage', 'Social image'], ['publishedDate', 'Published date'],
  ] as const;
  return <details className="pe-page-settings"><summary>Page settings</summary>
    <div className="pe-page-settings-fields" role="region" aria-label="Page settings fields">
    <p>Saved with your draft. Publish makes these settings visible.</p>
    {fields.map(([key, label]) => <label key={key}>{label}
      <input type={key === 'publishedDate' ? 'date' : 'text'} value={value[key] ?? ''}
        onChange={event => onChange({ ...value, [key]: event.target.value || (key === 'title' ? '' : null) })} />
    </label>)}
    <label>Navigation order<input type="number" value={value.navOrder ?? ''} onChange={event => onChange({ ...value, navOrder: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label>Page type<select value={value.pageType ?? 'WebPage'} onChange={event => onChange({ ...value, pageType: event.target.value })}>
      {['WebPage', 'Article', 'CollectionPage', 'ProfilePage'].map(type => <option key={type}>{type}</option>)}
    </select></label>
    </div>
  </details>;
}
