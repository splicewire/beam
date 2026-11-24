import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoryboardStepper, type StoryboardStep } from './StoryboardStepper';

const STEPS: StoryboardStep[] = [
    { key: 'collect', label: 'Collect', summary: 'Read the brief.', status: 'done', body: 'Collect body', wire: 'The brief' },
    { key: 'draft', label: 'Draft', summary: 'Write a reply.', status: 'current', body: 'Draft body', wire: 'The draft' },
    { key: 'send', label: 'Send', summary: 'Email it.', status: 'upcoming', body: 'Send body' },
];

const rail = () => within(screen.getByRole('navigation', { name: 'Steps' }));
const railButton = (name: string) => rail().getByRole('button', { name: new RegExp(`^${name} ?,`) });
const storyButton = (name: string) =>
    screen.getAllByRole('button', { name: new RegExp(`^${name}`) }).find((b) => b.hasAttribute('aria-expanded'))!;
const storyItem = (name: string) => storyButton(name).closest('li')!;

afterEach(cleanup);

// Owner-review-20261112 ticket 30: one set of keyed steps, a rail and a storyboard sharing selection and open state.
describe('StoryboardStepper', () => {
    it('renders the same steps as a rail of buttons and a storyboard, with no provider', () => {
        render(<StoryboardStepper steps={STEPS} />);

        const railButtons = rail().getAllByRole('button');
        expect(railButtons.map((b) => b.textContent)).toEqual(['Collect, done', 'Draft, current step', 'Send, not started']);
        for (const b of railButtons) expect(b.tagName).toBe('BUTTON');
        expect(['Collect', 'Draft', 'Send'].map((n) => storyButton(n).getAttribute('aria-expanded'))).toEqual([
            'false',
            'false',
            'false',
        ]);
        // The current step is selected by default.
        expect(railButton('Draft').getAttribute('aria-current')).toBe('step');
        expect(storyItem('Draft').hasAttribute('data-selected')).toBe(true);
        // A wire slot follows each step that has one.
        expect(screen.getByRole('group', { name: 'Passed on from Collect' }).textContent).toBe('The brief');
        expect(screen.queryByRole('group', { name: 'Passed on from Send' })).toBeNull();
    });

    it('selecting in the rail selects and opens the step in the storyboard, and announces it', () => {
        render(<StoryboardStepper steps={STEPS} />);

        fireEvent.click(railButton('Send'));

        expect(railButton('Send').getAttribute('aria-current')).toBe('step');
        expect(railButton('Draft').hasAttribute('aria-current')).toBe(false);
        expect(storyItem('Send').hasAttribute('data-selected')).toBe(true);
        expect(storyButton('Send').getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('region', { name: 'Send' }).textContent).toBe('Send body');
        expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe('Send is open.');
    });

    it('opening in the storyboard selects the step in the rail; closing it is announced too', () => {
        render(<StoryboardStepper steps={STEPS} />);

        fireEvent.click(storyButton('Collect'));
        expect(railButton('Collect').getAttribute('aria-current')).toBe('step');
        expect(screen.getByRole('region', { name: 'Collect' }).textContent).toBe('Collect body');

        fireEvent.click(storyButton('Collect'));
        expect(storyButton('Collect').getAttribute('aria-expanded')).toBe('false');
        expect(screen.queryByRole('region', { name: 'Collect' })).toBeNull();
        expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe('Collect is closed.');
    });

    it('keys state by step, not position: a reordered set keeps the same step open and selected', () => {
        const { rerender } = render(<StoryboardStepper steps={STEPS} />);
        fireEvent.click(railButton('Collect'));

        rerender(<StoryboardStepper steps={[...STEPS].reverse()} />);

        expect(railButton('Collect').getAttribute('aria-current')).toBe('step');
        expect(storyButton('Collect').getAttribute('aria-expanded')).toBe('true');
        expect(storyButton('Send').getAttribute('aria-expanded')).toBe('false');
    });

    it('is controllable: selection and open state come from props and changes are reported', () => {
        const onSelect = vi.fn();
        const onOpen = vi.fn();
        render(
            <StoryboardStepper
                steps={STEPS}
                selectedKey="collect"
                openKeys={['collect']}
                onSelectedKeyChange={onSelect}
                onOpenKeysChange={onOpen}
            />,
        );

        expect(railButton('Collect').getAttribute('aria-current')).toBe('step');
        fireEvent.click(railButton('Send'));

        expect(onSelect).toHaveBeenCalledWith('send');
        expect(onOpen).toHaveBeenCalledWith(['collect', 'send']);
        // Controlled: nothing moves until the host passes new props.
        expect(railButton('Collect').getAttribute('aria-current')).toBe('step');
        expect(storyButton('Send').getAttribute('aria-expanded')).toBe('false');
    });

    it('gives every step button a tap target of at least 24px', () => {
        render(<StoryboardStepper steps={STEPS} />);

        for (const b of screen.getAllByRole('button')) expect(b.className).toMatch(/\bmin-h-(?:6|8)\b/);
    });
});
