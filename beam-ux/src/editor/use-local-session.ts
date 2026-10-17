import { useEffect, useRef, useState } from 'react';
import { IndexedDbSessions, LocalSession, type SessionSnapshot } from './local-session';

/** Persistence errors are visible: a session is never silently advertised as reload-safe. */
export function useLocalSession(entry: string, user: string | undefined, base: string | undefined, body: unknown[], enabled: boolean) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [pending, setPending] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, render] = useState(0);
  const store = useRef<IndexedDbSessions | null>(null);
  const serial = useRef<Promise<void>>(Promise.resolve());
  const persisted = useRef<ReturnType<LocalSession['snapshot']>['identity'] | undefined>(undefined);
  const server = useRef({ body, base });
  server.current = { body, base };
  useEffect(() => {
    if (!enabled || !base) return;
    if (!user) { setError('The editor requires an authenticated user identity for its Local Session.'); return; }
    let live = true;
    const identity = { entry, user, base };
    const database = new IndexedDbSessions();
    store.current = database;
    database.forEntry(entry, user).then(rows => {
      if (!live) return;
      const exact = rows.find(row => row.identity.base === base);
      if (exact) {
        const resumed = LocalSession.resume(identity, exact);
        persisted.current = identity; setSession(resumed);
      } else if (rows.length) {
        // Recovery is explicit and names the retained base; every offered session belongs
        // to this entry and user. No stale state is applied before the author chooses.
        setPending(rows[rows.length - 1]);
      } else setSession(new LocalSession(identity, body));
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
    if (!pending || !user || !server.current.base) return;
    const identity = { entry, user, base: server.current.base };
    const next = restore
      ? LocalSession.restoreUnsaved(identity, server.current.body, pending)
      : new LocalSession(identity, server.current.body);
    persisted.current = pending.identity;
    setSession(next); setPending(null); persist(next);
  };
  return {
    session, pending, error, recover,
    change(next: unknown[]) { if (session) { session.change(next); persist(session); } },
    undo() { if (session) { session.undo(); persist(session); } },
    redo() { if (session) { session.redo(); persist(session); } },
    saved(nextBase: string, savedBody?: unknown[]) { if (session) { session.saved(nextBase, savedBody); persist(session); } },
    reset(nextBase: string, nextBody: unknown[]) {
      if (!user) return;
      const next = new LocalSession({ entry, user, base: nextBase }, nextBody);
      setSession(next); persist(next);
    },
    async flushed() { await serial.current; },
  };
}
