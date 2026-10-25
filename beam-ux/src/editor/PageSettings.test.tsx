// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PageSettings } from './PageSettings';

afterEach(cleanup);

it('shows the frontmatter keys nothing declares, sorted, and removing one drops only it (ux-0233 d3)', () => {
  const onChange = vi.fn();
  render(<PageSettings value={{ title: 'Recipe', unclaimed: { schema_type: 'HowTo', audience: 'cooks' } }} onChange={onChange} />);

  const kept = screen.getByRole('group', { name: 'Kept frontmatter keys' });
  expect(within(kept).getAllByRole('term').map(term => term.textContent)).toEqual(['audience', 'schema_type']);
  expect(within(kept).getByText('HowTo')).toBeTruthy();
  fireEvent.click(within(kept).getByRole('button', { name: 'Remove audience' }));

  expect(onChange).toHaveBeenCalledWith({ title: 'Recipe', unclaimed: { schema_type: 'HowTo' } });
});

it('shows no kept-keys group for a page that keeps none', () => {
  render(<PageSettings value={{ title: 'About' }} onChange={vi.fn()} />);

  expect(screen.queryByRole('group', { name: 'Kept frontmatter keys' })).toBeNull();
});

it('offers the registered Page Fields a parent may declare for its child pages (ux-0233 d4)', () => {
  const onChange = vi.fn();
  render(<PageSettings value={{ title: 'Recipes' }} pageFields={{ names: ['recipe'], schema: null }} onChange={onChange} />);

  fireEvent.change(screen.getByLabelText('Child page fields'), { target: { value: 'recipe' } });

  expect(onChange).toHaveBeenCalledWith({ title: 'Recipes', childFields: 'recipe' });
  expect(screen.queryByRole('group', { name: 'Page fields' })).toBeNull();
});

it('edits the Page Fields the parent declares, typed by its schema, and an empty input clears one', () => {
  const onChange = vi.fn();
  const schema = { properties: { servings: { type: ['integer', 'null'] }, cuisine: { type: ['string', 'null'] }, vegetarian: { type: ['boolean', 'null'] } } };
  render(<PageSettings value={{ title: 'Pie', fields: { servings: 4, cuisine: 'French' } }} pageFields={{ names: [], schema }} onChange={onChange} />);
  const fields = screen.getByRole('group', { name: 'Page fields' });

  fireEvent.change(within(fields).getByLabelText('servings'), { target: { value: '6' } });
  expect(onChange).toHaveBeenLastCalledWith({ title: 'Pie', fields: { servings: 6, cuisine: 'French' } });
  fireEvent.click(within(fields).getByLabelText('vegetarian'));
  expect(onChange).toHaveBeenLastCalledWith({ title: 'Pie', fields: { servings: 4, cuisine: 'French', vegetarian: true } });
  fireEvent.change(within(fields).getByLabelText('cuisine'), { target: { value: '' } });
  expect(onChange).toHaveBeenLastCalledWith({ title: 'Pie', fields: { servings: 4 } });
  expect(screen.queryByLabelText('Child page fields')).toBeNull();
});

it('changes the File Language where the host writes more than one, and hides it otherwise (ux-0233 d5)', () => {
  const onChange = vi.fn();
  render(<PageSettings value={{ title: 'Guide', fileLanguage: 'tsx' }} fileLanguages={['tsx', 'mdx']} onChange={onChange} />);

  fireEvent.change(screen.getByLabelText('File language'), { target: { value: 'mdx' } });

  expect(onChange).toHaveBeenCalledWith({ title: 'Guide', fileLanguage: 'mdx' });
  cleanup();
  render(<PageSettings value={{ title: 'Guide', fileLanguage: 'tsx' }} fileLanguages={['tsx']} onChange={vi.fn()} />);
  expect(screen.queryByLabelText('File language')).toBeNull();
});

it('gives every select its label alone as an accessible name', () => {
  render(<PageSettings value={{ title: 'Guide' }} onChange={vi.fn()}
    fileLanguages={['tsx', 'mdx']} pageFields={{ names: ['recipe'], schema: null }} />);
  fireEvent.click(screen.getByText('Page settings', { selector: 'summary' }));
  for (const name of ['Page type', 'File language', 'Child page fields']) {
    expect(screen.getByRole('combobox', { name })).toBe(screen.getByLabelText(name, { exact: true }));
  }
});

it('chooses an entry image into socialImage without publishing or changing the other page settings', async () => {
  const onChange=vi.fn();
  render(<PageSettings value={{title:'Guide',description:'Keep'}} onChange={onChange}
    mediaLibrary={{list:async()=>({items:[{id:'i',name:'cover.png',url:'/storage/i/cover.png'}]}),upload:vi.fn()}}/>);
  fireEvent.click(screen.getByText('Page settings',{selector:'summary'}));
  fireEvent.click(screen.getByRole('button',{name:'Choose image for Social image'}));
  fireEvent.click(await screen.findByRole('button',{name:'Use cover.png'}));
  await waitFor(()=>expect(onChange).toHaveBeenCalledWith({title:'Guide',description:'Keep',socialImage:'/storage/i/cover.png'}));
});

it('keeps intervening page settings when an image upload completes',async()=>{
 let finish!:(value:{id:string;name:string;url:string})=>void;
 const library={list:async()=>({items:[]}),upload:()=>new Promise<{id:string;name:string;url:string}>(resolve=>{finish=resolve;})};
 const change=vi.fn();
 const view=render(<PageSettings value={{title:'Before'}} onChange={change} mediaLibrary={library}/>);
 fireEvent.click(screen.getByRole('button',{name:'Choose image for Social image'}));
 await screen.findByText('No images for this entry yet.');
 fireEvent.change(screen.getByLabelText('Upload image for Social image'),{target:{files:[new File(['raster'],'cat.png')]}});
 view.rerender(<PageSettings value={{title:'After',description:'New text'}} onChange={change} mediaLibrary={library}/>);
 finish({id:'a',name:'photo',url:'/new.png'});
 await waitFor(()=>expect(change).toHaveBeenCalledWith({title:'After',description:'New text',socialImage:'/new.png'}));
});
