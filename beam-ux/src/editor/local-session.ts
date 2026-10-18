import type { EntryPageSettings } from '../generated/page-settings';
export type SessionPageSettings = Partial<EntryPageSettings>;
/** ADR-0004: client undo is a Local Session; server versions are not the undo stack. */
export interface SessionIdentity { entry: string; user: string; base: string }
export interface SessionSnapshot {
  source?: {text: string; printed: string; body: unknown[]};
  format: 1;
  identity: SessionIdentity;
  history: unknown[][];
  cursor: number;
  settingsHistory?: (SessionPageSettings | null)[];
  savedSettings?: SessionPageSettings | null;
  savedBody: unknown[];
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sameOwner = (a: SessionIdentity, b: SessionIdentity) => a.entry === b.entry && a.user === b.user;
export const sessionKey = (identity: SessionIdentity): string => JSON.stringify([identity.entry, identity.user, identity.base]);

export class LocalSession {
  private state: SessionSnapshot;
  constructor(identity: SessionIdentity, body: unknown[], pageSettings: SessionPageSettings | null = null) {
    if (!identity.entry || !identity.user || !identity.base) throw new Error('A Local Session requires an entry/user/base identity.');
    this.state = { format: 1, identity: copy(identity), history: [copy(body)], cursor: 0, savedBody: copy(body), settingsHistory: [copy(pageSettings)], savedSettings: copy(pageSettings) };
  }
  static resume(identity: SessionIdentity, snapshot: SessionSnapshot, initialSettings: SessionPageSettings | null = null): LocalSession {
    if (snapshot?.source && (typeof snapshot.source.text !== 'string' || typeof snapshot.source.printed !== 'string' || !Array.isArray(snapshot.source.body))) throw new Error('Invalid persisted source session.');
    if (!snapshot || snapshot.format !== 1 || !snapshot.identity || sessionKey(identity) !== sessionKey(snapshot.identity)) throw new Error('Local Session identity differs.');
    if (!Array.isArray(snapshot.history) || !snapshot.history.length || !snapshot.history.every(Array.isArray) || !Array.isArray(snapshot.savedBody) || !Number.isInteger(snapshot.cursor) || snapshot.cursor < 0 || snapshot.cursor >= snapshot.history.length) throw new Error('Invalid persisted session.');
    if (snapshot.settingsHistory !== undefined && (!Array.isArray(snapshot.settingsHistory) || snapshot.settingsHistory.length !== snapshot.history.length || snapshot.settingsHistory.some(value => value !== null && (typeof value !== 'object' || Array.isArray(value))))) throw new Error('Invalid persisted page settings.');
    const session = new LocalSession(identity, []);
    session.state = copy(snapshot);
    if (!session.state.settingsHistory) {
      session.state.settingsHistory = session.state.history.map(() => copy(initialSettings));
      session.state.savedSettings = copy(initialSettings);
    }
    return session;
  }
  /** Called only after the author chooses Restore unsaved changes; never a silent merge. */
  static restoreUnsaved(identity: SessionIdentity, serverBody: unknown[], snapshot: SessionSnapshot, serverSettings: SessionPageSettings | null = null): LocalSession {
    if (!sameOwner(identity, snapshot.identity)) throw new Error('Local Session identity differs.');
    const session = LocalSession.resume(snapshot.identity, snapshot, serverSettings);
    session.state.identity = copy(identity);
    session.state.savedBody = copy(serverBody);
    session.state.savedSettings = copy(serverSettings);
    return session;
  }
  get identity(): SessionIdentity { return copy(this.state.identity); }
  get body(): unknown[] { return copy(this.state.history[this.state.cursor]); }
  get pageSettings(): SessionPageSettings | null { return copy(this.state.settingsHistory?.[this.state.cursor] ?? null); }
  get dirty(): boolean { return !!this.state.source || !equal(this.body, this.state.savedBody) || !equal(this.pageSettings, this.state.savedSettings ?? null); }
  get source() { return this.state.source ? copy(this.state.source) : null; }
  beginSource(text: string, printedBody: unknown[] = this.body): void {
    if (!equal(printedBody, this.body)) throw new Error('The Local Session changed while printing. Open Source Mode again.');
    if (!this.state.source) this.state.source = {text, printed:text, body:copy(printedBody)};
  }
  editSource(text: string): void { if (!this.state.source) throw new Error('Source Mode is not open.'); this.state.source.text=text; }
  applySource(body: unknown[]): void { if (!this.state.source) throw new Error('Source Mode is not open.'); delete this.state.source; this.change(body); }
  discardSource(): void { delete this.state.source; }
  get canUndo(): boolean { return this.state.cursor > 0; }
  get canRedo(): boolean { return this.state.cursor + 1 < this.state.history.length; }
  change(body: unknown[], pageSettings: SessionPageSettings | null = this.pageSettings): void {
    if (this.state.source) throw new Error('Apply or discard Source Mode before editing blocks.');
    if (equal(body, this.body) && equal(pageSettings, this.pageSettings)) return;
    this.state.settingsHistory ??= this.state.history.map(() => null);
    this.state.settingsHistory.splice(this.state.cursor + 1);
    this.state.settingsHistory.push(copy(pageSettings));
    this.state.history.splice(this.state.cursor + 1);
    this.state.history.push(copy(body));
    this.state.cursor++;
  }
  undo(): void { if (!this.state.source && this.canUndo) this.state.cursor--; }
  redo(): void { if (!this.state.source && this.canRedo) this.state.cursor++; }
  /** Save advances the server base, but deliberately preserves undo/redo and the session. */
  saved(base: string, savedBody: unknown[] = this.body, savedSettings: SessionPageSettings | null = this.pageSettings): void {
    if (this.state.source) throw new Error('Apply or discard Source Mode before saving.');
    if (!base) throw new Error('A saved Local Session requires a base.');
    this.state.identity.base = base;
    this.state.savedBody = copy(savedBody);
    this.state.savedSettings = copy(savedSettings);
  }
  snapshot(): SessionSnapshot { return copy(this.state); }
}

/** One origin-scoped IndexedDB store; keys include entry, authenticated user, and server base. */
export class IndexedDbSessions {
  private database: Promise<IDBDatabase>;
  constructor(factory: IDBFactory = indexedDB) {
    this.database = new Promise((resolve, reject) => {
      const request = factory.open('beam-editor-local-sessions', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('sessions');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Local Session storage is blocked by another tab.'));
    });
  }
  async read(identity: SessionIdentity): Promise<SessionSnapshot | undefined> {
    const rows = await this.forEntry(identity.entry, identity.user);
    return rows.find(row => row.identity.base === identity.base);
  }
  async forEntry(entry: string, user: string): Promise<SessionSnapshot[]> {
    const database = await this.database;
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('sessions', 'readonly');
      const request = transaction.objectStore('sessions').getAll();
      request.onsuccess = () => resolve((request.result as SessionSnapshot[]).filter(row => row.identity?.entry === entry && row.identity?.user === user));
      request.onerror = () => reject(request.error);
    });
  }
  /** Atomic replacement when Save changes the base; the old key cannot remain as a false conflict. */
  async write(snapshot: SessionSnapshot, previousIdentity?: SessionIdentity): Promise<void> {
    LocalSession.resume(snapshot.identity, snapshot);
    const database = await this.database;
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      if (previousIdentity) {
        if (!sameOwner(previousIdentity, snapshot.identity)) { transaction.abort(); reject(new Error('Local Session identity differs.')); return; }
        store.delete(sessionKey(previousIdentity));
      }
      store.put(copy(snapshot), sessionKey(snapshot.identity));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Local Session write aborted.'));
    });
  }
  async discard(identity: SessionIdentity): Promise<void> {
    const database = await this.database;
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('sessions', 'readwrite');
      transaction.objectStore('sessions').delete(sessionKey(identity));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  async close(): Promise<void> { (await this.database).close(); }
}
