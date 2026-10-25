// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
