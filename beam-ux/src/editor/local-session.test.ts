import { describe, expect, it } from 'vitest';
import { LocalSession, type SessionSnapshot } from './local-session';

const identity = { entry: 'entry-a', user: 'author-a', base: 'v1' };
describe('editor Local Session (ADR-0004)', () => {
  it('undo survives Save and becomes dirty again without a server call', () => {
    const session = new LocalSession(identity, ['initial']);
    session.change(['edited']);
    session.saved('v2');
    expect(session.dirty).toBe(false);
    session.undo();
    expect(session.body).toEqual(['initial']);
    expect(session.dirty).toBe(true);
    session.redo();
    expect(session.dirty).toBe(false);
    expect(session.identity.base).toBe('v2');
  });
  it('does not mark edits made during a Save request as saved', () => {
    const session = new LocalSession(identity, ['initial']);
    session.change(['sent']); const sent = session.body;
    session.change(['still typing']); session.saved('v2', sent);
    expect(session.body).toEqual(['still typing']); expect(session.dirty).toBe(true);
    session.undo(); expect(session.dirty).toBe(false);
  });
  it('roundtrips the cursor, history, and saved body on reload', () => {
    const session = new LocalSession(identity, ['initial']);
    session.change(['one']); session.change(['two']); session.undo();
    const resumed = LocalSession.resume(identity, session.snapshot());
    expect(resumed.body).toEqual(['one']);
    expect(resumed.canRedo).toBe(true);
    resumed.redo(); expect(resumed.body).toEqual(['two']);
  });
  it('does not silently resume another base, entry, or user', () => {
    const state = new LocalSession(identity, []).snapshot();
    for (const changed of [{ base: 'v2' }, { entry: 'b' }, { user: 'b' }]) {
      expect(() => LocalSession.resume({ ...identity, ...changed }, state)).toThrow('identity');
    }
  });
  it('explicitly restores unsaved work on a moved base without merging it', () => {
    const old = new LocalSession(identity, ['old server']); old.change(['ours']);
    const session = LocalSession.restoreUnsaved({ ...identity, base: 'v2' }, ['theirs'], old.snapshot());
    expect(session.body).toEqual(['ours']); expect(session.dirty).toBe(true);
    expect(session.identity.base).toBe('v2');
    expect(() => LocalSession.restoreUnsaved({ ...identity, user: 'other' }, [], old.snapshot())).toThrow('identity');
  });
  it('discard/History restore begins a fresh clean stack', () => {
    const session = new LocalSession({ ...identity, base: 'v3' }, ['restored']);
    expect(session.canUndo).toBe(false); expect(session.dirty).toBe(false);
  });
  it('copies inputs and snapshots, and rejects malformed persisted data', () => {
    const body = [{ text: 'one' }]; const session = new LocalSession(identity, body);
    body[0].text = 'mutated'; expect(session.body).toEqual([{ text: 'one' }]);
    const snapshot = session.snapshot(); snapshot.history[0] = [];
    expect(session.body).toEqual([{ text: 'one' }]);
    expect(() => LocalSession.resume(identity, { ...snapshot, cursor: 12 } as SessionSnapshot)).toThrow('session');
  });
});

 it('undo and reload keep page settings in the same session as the body', () => {
    const session = new LocalSession(identity, ['body'], { title: 'Original' });
    session.change(['edited'], { title: 'Draft' });
    const resumed = LocalSession.resume(identity, session.snapshot());
    expect(resumed.pageSettings).toEqual({ title: 'Draft' });
    resumed.undo();
    expect(resumed.body).toEqual(['body']);
    expect(resumed.pageSettings).toEqual({ title: 'Original' });
    resumed.redo();
    resumed.saved('v2', ['edited'], { title: 'Draft' });
    expect(resumed.dirty).toBe(false);
    resumed.change(['edited'], { title: 'Another title' });
    expect(resumed.dirty).toBe(true);
 });

it('a settings edit made during Save remains dirty after the response', () => {
  const session = new LocalSession(identity, ['body'], { title: 'Sent' });
  const sent = session.pageSettings;
  session.change(['body'], { title: 'Typed during request' });
  session.saved('v2', ['body'], sent);
  expect(session.dirty).toBe(true);
  expect(session.pageSettings?.title).toBe('Typed during request');
});

it('retains unauthored changes under a null base and replaces that identity after first save', () => {
    const session = new LocalSession({entry:'legacy',user:'author',base:null}, []);
    session.change([{kind:'text',value:'draft'}]);
    const resumed = LocalSession.resume({entry:'legacy',user:'author',base:null},session.snapshot());
    expect(resumed.dirty).toBe(true);
    resumed.saved('first-head');
    expect(resumed.identity.base).toBe('first-head');
    expect(resumed.canUndo).toBe(true);
    expect(resumed.dirty).toBe(false);
});
