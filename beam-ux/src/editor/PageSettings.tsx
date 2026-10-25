import { useId } from 'react';
import type { SessionPageSettings } from './local-session';

type FieldSchema = { type?: string | string[]; title?: string };

/**
 * A page's Page Fields as the server offers them (ux-0233 d4): `names`, the host's registered classes a page may
 * declare for its child pages (`childFields`); `schema`, the fields its own parent declares, or null when it declares
 * none.
 */
export interface PageFieldsOffer {
  names: string[];
  schema: { properties?: Record<string, FieldSchema> } | null;
}

/** These controls change the Local Session, never the published entry row. */
export function PageSettings({ value, onChange, pageFields = null, fileLanguages = [] }: { value: SessionPageSettings; onChange: (value: SessionPageSettings) => void; pageFields?: PageFieldsOffer | null; fileLanguages?: string[] | null }) {
  const labelId = useId();
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
    <label><span id={`${labelId}-page-type`}>Page type</span><select aria-labelledby={`${labelId}-page-type`} value={value.pageType ?? 'WebPage'} onChange={event => onChange({ ...value, pageType: event.target.value })}>
      {['WebPage', 'Article', 'CollectionPage', 'ProfilePage'].map(type => <option key={type}>{type}</option>)}
    </select></label>
    {/* ux-0233 d5: the File Language; Publish moves the page's file. Shown only where the host writes more than one. */}
    {(fileLanguages ?? []).length > 1 && <label><span id={`${labelId}-file-language`}>File language</span><select aria-labelledby={`${labelId}-file-language`} value={value.fileLanguage ?? ''}
      onChange={event => onChange({ ...value, fileLanguage: event.target.value })}>
      {(fileLanguages ?? []).map(language => <option key={language} value={language}>{language.toUpperCase()}</option>)}
    </select></label>}
    {pageFields && pageFields.names.length > 0 && <label><span id={`${labelId}-child-fields`}>Child page fields</span><select aria-labelledby={`${labelId}-child-fields`} value={value.childFields ?? ''}
      onChange={event => onChange({ ...value, childFields: event.target.value || null })}>
      <option value="">None</option>
      {pageFields.names.map(name => <option key={name}>{name}</option>)}
    </select></label>}
    {pageFields?.schema && <PageFieldInputs schema={pageFields.schema} value={value.fields ?? {}} onChange={fields => onChange({ ...value, fields })} />}
    <UnclaimedKeys value={value.unclaimed ?? {}} onChange={unclaimed => onChange({ ...value, unclaimed })} />
    </div>
  </details>;
}

/** ux-0233 d4: the Page Fields this page's parent declares; the server checks them on save. An empty input clears one. */
function PageFieldInputs({ schema, value, onChange }: {
  schema: NonNullable<PageFieldsOffer['schema']>;
  value: Record<string, string | number | boolean>;
  onChange: (value: Record<string, string | number | boolean>) => void;
}) {
  const set = (name: string, next: string | number | boolean | null) => {
    const rest = { ...value };
    delete rest[name];
    onChange(next === null ? rest : { ...rest, [name]: next });
  };
  return <fieldset aria-label="Page fields">
    <legend>Page fields</legend>
    {Object.entries(schema.properties ?? {}).map(([name, field]) => {
      const type = [field.type ?? 'string'].flat().find(candidate => candidate !== 'null') ?? 'string';
      const label = field.title ?? name;
      if (type === 'boolean') {
        return <label key={name}>{label}<input type="checkbox" checked={value[name] === true} onChange={event => set(name, event.target.checked)} /></label>;
      }
      const numeric = type === 'integer' || type === 'number';
      return <label key={name}>{label}<input type={numeric ? 'number' : 'text'} value={value[name] === undefined ? '' : String(value[name])}
        onChange={event => set(name, event.target.value === '' ? null : numeric ? Number(event.target.value) : event.target.value)} /></label>;
    })}
  </fieldset>;
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
