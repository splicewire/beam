import type { SessionPageSettings } from './local-session';

/** These controls change the Local Session, never the published entry row. */
export function PageSettings({ value, onChange }: { value: SessionPageSettings; onChange: (value: SessionPageSettings) => void }) {
  const fields = [
    ['title', 'Title'], ['parentId', 'Parent entry ID'], ['segment', 'URL segment'],
    ['navGroup', 'Navigation group'], ['layout', 'Layout'], ['template', 'Template'],
    ['description', 'Description'], ['socialImage', 'Social image'], ['publishedDate', 'Published date'],
  ] as const;
  return <details><summary>Page settings</summary>
    <p>Saved with your draft. Publish makes these settings visible.</p>
    {fields.map(([key, label]) => <label key={key}>{label}
      <input type={key === 'publishedDate' ? 'date' : 'text'} value={value[key] ?? ''}
        onChange={event => onChange({ ...value, [key]: event.target.value || (key === 'title' ? '' : null) })} />
    </label>)}
    <label>Navigation order<input type="number" value={value.navOrder ?? ''} onChange={event => onChange({ ...value, navOrder: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label>Page type<select value={value.pageType ?? 'WebPage'} onChange={event => onChange({ ...value, pageType: event.target.value })}>
      {['WebPage', 'Article', 'CollectionPage', 'ProfilePage'].map(type => <option key={type}>{type}</option>)}
    </select></label>
    <UnclaimedKeys value={value.unclaimed ?? {}} onChange={unclaimed => onChange({ ...value, unclaimed })} />
  </details>;
}

/**
 * ux-0233 d3: the page's frontmatter keys nothing declares, kept as written. They are shown, not edited here; removing
 * one drops it from the draft, and the mirror stops printing it once that draft publishes.
 */
function UnclaimedKeys({ value, onChange }: { value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  const keys = Object.keys(value).sort();
  if (keys.length === 0) return null;
  return <fieldset aria-label="Kept frontmatter keys">
    <legend>Kept frontmatter keys</legend>
    <p>Nothing declares these keys, so they are kept as written.</p>
    <dl>{keys.map(key => <div key={key}>
      <dt>{key}</dt><dd>{value[key]}</dd>
      <button type="button" onClick={() => onChange(Object.fromEntries(Object.entries(value).filter(([kept]) => kept !== key)))}>Remove {key}</button>
    </div>)}</dl>
  </fieldset>;
}
