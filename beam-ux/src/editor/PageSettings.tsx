import {MediaPicker,type EntryImageLibrary} from './MediaPicker';
import { useId } from 'react';
import type { SessionPageSettings } from './local-session';
import { useBeamUxMessages, type BeamUxMessageKey } from '../messages.js';

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

/** A Redirect that leads to the page (ux-0236 d14), as the server lists it with the page. */
export interface RedirectToPage {
  path: string;
  match: string;
  permanent: boolean;
  origin: string;
}

/** These controls change the Local Session, never the published entry row. */
export function PageSettings({ value, onChange, pageFields = null, fileLanguages = [], mediaLibrary, redirects = null }: { value: SessionPageSettings; onChange: (value: SessionPageSettings) => void; pageFields?: PageFieldsOffer | null; fileLanguages?: string[] | null; mediaLibrary?: EntryImageLibrary; redirects?: RedirectToPage[] | null }) {
  const m = useBeamUxMessages();
  const labelId = useId();
  const fields: readonly (readonly [keyof SessionPageSettings & ('title' | 'parentId' | 'segment' | 'navGroup' | 'layout' | 'template' | 'description' | 'socialImage' | 'publishedDate'), BeamUxMessageKey])[] = [
    ['title', 'splicewire-beam-ux::messages.settings_field_title'], ['parentId', 'splicewire-beam-ux::messages.settings_field_parent_id'], ['segment', 'splicewire-beam-ux::messages.settings_field_segment'],
    ['navGroup', 'splicewire-beam-ux::messages.settings_field_nav_group'], ['layout', 'splicewire-beam-ux::messages.settings_field_layout'], ['template', 'splicewire-beam-ux::messages.settings_field_template'],
    ['description', 'splicewire-beam-ux::messages.settings_field_description'], ['socialImage', 'splicewire-beam-ux::messages.settings_field_social_image'], ['publishedDate', 'splicewire-beam-ux::messages.settings_field_published_date'],
  ];
  return <details className="pe-page-settings"><summary>{m.t('splicewire-beam-ux::messages.settings_heading')}</summary>
    <div className="pe-page-settings-fields" role="region" aria-label={m.t('splicewire-beam-ux::messages.settings_fields_label')}>
    <p>{m.t('splicewire-beam-ux::messages.settings_saved_with_draft')}</p>
    {fields.map(([key, label]) => <label key={key}>{m.t(label)}
      <input type={key === 'publishedDate' ? 'date' : 'text'} value={value[key] ?? ''}
        onChange={event => onChange({ ...value, [key]: event.target.value || (key === 'title' ? '' : null) })} />
    </label>)}
    {mediaLibrary&&<MediaPicker label={m.t('splicewire-beam-ux::messages.settings_field_social_image')} library={mediaLibrary} onChoose={url=>onChange({...value,socialImage:url})}/>}
    <label>{m.t('splicewire-beam-ux::messages.settings_nav_order')}<input type="number" value={value.navOrder ?? ''} onChange={event => onChange({ ...value, navOrder: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label><span id={`${labelId}-page-type`}>{m.t('splicewire-beam-ux::messages.settings_page_type')}</span><select aria-labelledby={`${labelId}-page-type`} value={value.pageType ?? 'WebPage'} onChange={event => onChange({ ...value, pageType: event.target.value })}>
      {['WebPage', 'Article', 'CollectionPage', 'ProfilePage'].map(type => <option key={type}>{type}</option>)}
    </select></label>
    {/* ux-0233 d5: the File Language; Publish moves the page's file. Shown only where the host writes more than one. */}
    {(fileLanguages ?? []).length > 1 && <label><span id={`${labelId}-file-language`}>{m.t('splicewire-beam-ux::messages.settings_file_language')}</span><select aria-labelledby={`${labelId}-file-language`} value={value.fileLanguage ?? ''}
      onChange={event => onChange({ ...value, fileLanguage: event.target.value })}>
      {(fileLanguages ?? []).map(language => <option key={language} value={language}>{language.toUpperCase()}</option>)}
    </select></label>}
    {pageFields && pageFields.names.length > 0 && <label><span id={`${labelId}-child-fields`}>{m.t('splicewire-beam-ux::messages.settings_child_fields')}</span><select aria-labelledby={`${labelId}-child-fields`} value={value.childFields ?? ''}
      onChange={event => onChange({ ...value, childFields: event.target.value || null })}>
      <option value="">{m.t('splicewire-beam-ux::messages.settings_none')}</option>
      {pageFields.names.map(name => <option key={name}>{name}</option>)}
    </select></label>}
    {pageFields?.schema && <PageFieldInputs schema={pageFields.schema} value={value.fields ?? {}} onChange={fields => onChange({ ...value, fields })} />}
    <UnclaimedKeys value={value.unclaimed ?? {}} onChange={unclaimed => onChange({ ...value, unclaimed })} />
    {redirects && <RedirectsToPage redirects={redirects} />}
    </div>
  </details>;
}

/** ux-0233 d4: the Page Fields this page's parent declares; the server checks them on save. An empty input clears one. */
function PageFieldInputs({ schema, value, onChange }: {
  schema: NonNullable<PageFieldsOffer['schema']>;
  value: Record<string, string | number | boolean>;
  onChange: (value: Record<string, string | number | boolean>) => void;
}) {
  const m = useBeamUxMessages();
  const set = (name: string, next: string | number | boolean | null) => {
    const rest = { ...value };
    delete rest[name];
    onChange(next === null ? rest : { ...rest, [name]: next });
  };
  return <fieldset aria-label={m.t('splicewire-beam-ux::messages.settings_page_fields')}>
    <legend>{m.t('splicewire-beam-ux::messages.settings_page_fields')}</legend>
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

const ORIGINS: Record<string, BeamUxMessageKey> = { author: 'splicewire-beam-ux::messages.settings_origin_author', release: 'splicewire-beam-ux::messages.settings_origin_release', takedown: 'splicewire-beam-ux::messages.settings_origin_takedown', record: 'splicewire-beam-ux::messages.settings_origin_record' };

/**
 * ux-0236 d14: the Redirects leading to the page, so an author sees what moving or deleting it would strand. They are
 * managed in the site's Redirects, not here.
 */
function RedirectsToPage({ redirects }: { redirects: RedirectToPage[] }) {
  const m = useBeamUxMessages();
  return <fieldset aria-label={m.t('splicewire-beam-ux::messages.settings_redirects')}>
    <legend>{m.t('splicewire-beam-ux::messages.settings_redirects')}</legend>
    {redirects.length === 0 ? <p>{m.t('splicewire-beam-ux::messages.settings_no_redirects')}</p> : <ul>{redirects.map(redirect => <li key={`${redirect.path} ${redirect.match}`}>
      {[redirect.match === 'prefix' ? m.t('splicewire-beam-ux::messages.settings_redirect_prefix', { path: redirect.path }) : redirect.path, redirect.permanent ? null : m.t('splicewire-beam-ux::messages.settings_temporary'), ORIGINS[redirect.origin] ? m.t(ORIGINS[redirect.origin]) : null]
        .filter(Boolean).join(' · ')}
    </li>)}</ul>}
  </fieldset>;
}

/**
 * ux-0233 d3: the page's frontmatter keys nothing declares, kept as written. They are shown, not edited here; removing
 * one drops it from the draft, and the mirror stops printing it once that draft publishes.
 */
function UnclaimedKeys({ value, onChange }: { value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  const m = useBeamUxMessages();
  const keys = Object.keys(value).sort();
  if (keys.length === 0) return null;
  return <fieldset aria-label={m.t('splicewire-beam-ux::messages.settings_kept_keys')}>
    <legend>{m.t('splicewire-beam-ux::messages.settings_kept_keys')}</legend>
    <p>{m.t('splicewire-beam-ux::messages.settings_kept_keys_explainer')}</p>
    <dl>{keys.map(key => <div key={key}>
      <dt>{key}</dt><dd>{value[key]}</dd>
      <button type="button" onClick={() => onChange(Object.fromEntries(Object.entries(value).filter(([kept]) => kept !== key)))}>{m.t('splicewire-beam-ux::messages.settings_remove_key', { key })}</button>
    </div>)}</dl>
  </fieldset>;
}
