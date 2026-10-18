import { useEffect, useRef, useState } from 'react';
import type { SessionPageSettings } from './local-session';
import { IndexedDbSessions, LocalSession, type SessionSnapshot } from './local-session';

/** Persistence errors are visible: a session is never silently advertised as reload-safe. */
export function useLocalSession(entry: string, user: string | undefined, base: string | null | undefined, body: unknown[], enabled: boolean, pageSettings: SessionPageSettings | null = null) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [pending, setPending] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, render] = useState(0);
  const store = useRef<IndexedDbSessions | null>(null);
  const serial = useRef<Promise<void>>(Promise.resolve());
  const persisted = useRef<ReturnType<LocalSession['snapshot']>['identity'] | undefined>(undefined);
  const server = useRef({ body, base, pageSettings });
  server.current = { body, base, pageSettings };
  useEffect(() => {
    if (!enabled || base === undefined) return;
    if (!user) { setError('The editor requires an authenticated user identity for its Local Session.'); return; }
    let live = true;
    const identity = { entry, user, base };
    const database = new IndexedDbSessions();
    store.current = database;
    database.forEntry(entry, user).then(rows => {
      if (!live) return;
      const exact = rows.find(row => row.identity.base === base);
      if (exact) {
        const resumed = LocalSession.resume(identity, exact, pageSettings);
        persisted.current = identity; setSession(resumed);
      } else if (rows.length) {
        // Recovery is explicit and names the retained base; every offered session belongs
        // to this entry and user. No stale state is applied before the author chooses.
        setPending(rows[rows.length - 1]);
      } else setSession(new LocalSession(identity, body, pageSettings));
    }).catch(reason => live && setError(String(reason)));
    return () => { live = false; void serial.current.finally(() => database.close()); };
    // The server base advances on Save without remounting or losing the undo stack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, user, enabled]);
  const persist = (next: LocalSession) => {
    const snapshot = next.snapshot();
    const previous = persisted.current;
    persisted.current = snapshot.identity;
    serial.current = serial.current.then(() => store.current!.write(snapshot, previous));
    void serial.current.catch(reason => setError(String(reason)));
    render(value => value + 1);
  };
  const recover = async (restore: boolean) => {
    if (!pending || !user || server.current.base === undefined) return;
    const identity = { entry, user, base: server.current.base };
    const next = restore
      ? LocalSession.restoreUnsaved(identity, server.current.body, pending, server.current.pageSettings)
      : new LocalSession(identity, server.current.body, server.current.pageSettings);
    persisted.current = pending.identity;
    setSession(next); setPending(null); persist(next);
  };
  return {
    session, pending, error, recover,
    beginSource(text: string, printedBody?: unknown[]) { if (session) { session.beginSource(text, printedBody); persist(session); } },
    editSource(text: string) { if (session) { session.editSource(text); persist(session); } },
    applySource(body: unknown[]) { if (session) { session.applySource(body); persist(session); } },
    discardSource() { if (session) { session.discardSource(); persist(session); } },
    change(next: unknown[], settings?: SessionPageSettings | null) { if (session) { session.change(next, settings); persist(session); } },
    undo() { if (session) { session.undo(); persist(session); } },
    redo() { if (session) { session.redo(); persist(session); } },
    saved(nextBase: string, savedBody?: unknown[], settings?: SessionPageSettings | null) { if (session) { session.saved(nextBase, savedBody, settings); persist(session); } },
    reset(nextBase: string, nextBody: unknown[], settings: SessionPageSettings | null = null) {
      if (!user) return;
      const next = new LocalSession({ entry, user, base: nextBase }, nextBody, settings);
      setSession(next); persist(next);
    },
    async flushed() { await serial.current; },
  };
}
