import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SourceMode, type SourceConversion } from './SourceMode';
import { useLocalSession } from './use-local-session';
import { IndexedDbSessions } from './local-session';
import type { JsonDoc } from '../blockdoc/json';

// Exercise the real hook and LocalSession; replace only the browser storage boundary.
vi.mock('./local-session', async importOriginal => {
  const actual = await importOriginal<typeof import('./local-session')>();
  return { ...actual, IndexedDbSessions: class {
    async forEntry() { return []; }
    async write() {}
    async close() {}
  } };
});

const original: JsonDoc = [{ kind: 'text', value: 'original' }];
const edited: JsonDoc = [{ kind: 'text', value: 'edited' }];

beforeEach(() => {
  vi.spyOn(IndexedDbSessions.prototype, 'forEntry').mockResolvedValue([]);
  vi.spyOn(IndexedDbSessions.prototype, 'write').mockResolvedValue(undefined);
  vi.spyOn(IndexedDbSessions.prototype, 'close').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Editor({ conversion, allowed = true }: { conversion: SourceConversion; allowed?: boolean }) {
  const local = useLocalSession('entry', 'author', 'version-1', original, true);
  return <>
    <SourceMode local={local} conversion={conversion} allowed={allowed}>
      <p>Canvas</p>
      <div contentEditable suppressContentEditableWarning aria-label="Pending prose" onBlur={() => local.change(edited)}>edited</div>
    </SourceMode>
    <output data-testid="body">{JSON.stringify(local.session?.body)}</output>
    <button disabled={!local.session?.canUndo} onClick={local.undo}>Undo</button>
  </>;
}

it('drains the focused prose edit before printing its Local Session snapshot', async () => {
  const conversion = { print: vi.fn().mockResolvedValue({ source: 'edited' }), read: vi.fn() };
  render(<Editor conversion={conversion} />);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Source Mode' }) as HTMLButtonElement).disabled).toBe(false));
  screen.getByLabelText('Pending prose').focus();
  fireEvent.click(screen.getByRole('button', { name: 'Source Mode' }));
  await screen.findByRole('textbox', { name: 'TSX source' });
  expect(conversion.print).toHaveBeenCalledWith(edited);
});

it('hides Source Mode in the Hosted profile without invoking conversion', async () => {
  const conversion = { print: vi.fn(), read: vi.fn() };
  render(<Editor conversion={conversion} allowed={false} />);
  await waitFor(() => expect(screen.getByTestId('body').textContent).toBe(JSON.stringify(original)));
  expect(screen.queryByRole('button', { name: 'Source Mode' })).toBeNull();
  expect(screen.getByText('Canvas')).toBeTruthy();
  expect(conversion.print).not.toHaveBeenCalled();
});

it('retains malformed source and the body, then applies corrected source as one undo step', async () => {
  const conversion = {
    print: vi.fn().mockResolvedValue({ source: 'original' }),
    read: vi.fn().mockRejectedValueOnce(new Error('Malformed TSX')).mockResolvedValueOnce({ body: edited }),
  };
  render(<Editor conversion={conversion} />);
  await waitFor(() => expect((screen.getByRole('button', { name: 'Source Mode' }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Source Mode' }));
  const input = await screen.findByRole('textbox', { name: 'TSX source' });
  fireEvent.change(input, { target: { value: '<broken' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply source' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Malformed TSX');
  expect(input).toHaveProperty('value', '<broken');
  expect(screen.getByTestId('body').textContent).toBe(JSON.stringify(original));
  expect(screen.getByRole('button', { name: 'Undo' })).toHaveProperty('disabled', true);
  fireEvent.change(input, { target: { value: 'edited' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply source' }));
  await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  expect(conversion.read).toHaveBeenLastCalledWith('edited', original);
  expect(screen.getByTestId('body').textContent).toBe(JSON.stringify(edited));
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByTestId('body').textContent).toBe(JSON.stringify(original));
  expect(screen.getByRole('button', { name: 'Undo' })).toHaveProperty('disabled', true);
});
