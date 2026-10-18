import { expect, it } from 'vitest';
import { IndexedDbSessions, LocalSession, sessionKey } from './local-session';

it('persists the complete session snapshot without a server-settings variable', async () => {
    const session = new LocalSession({entry:'page',user:'author',base:'v1'}, ['body'], {title:'draft title'});
    const snapshot = session.snapshot();
    const writes: {value: unknown; key: string}[] = [];
    const transaction = {
        oncomplete: () => {},
        objectStore: () => ({
            put: (value: unknown, key: string) => {
                writes.push({value,key});
                queueMicrotask(() => transaction.oncomplete());
            },
        }),
    };
    // The fake supplies only the IDB boundary; exercise the real write method and validation.
    const store = Object.assign(Object.create(IndexedDbSessions.prototype) as IndexedDbSessions, {
        database: Promise.resolve({transaction: () => transaction}),
    });
    await expect(store.write(snapshot)).resolves.toBeUndefined();
    expect(writes).toEqual([{value:snapshot,key:sessionKey(snapshot.identity)}]);
});
