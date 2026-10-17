import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('the Theme empty state is customer-safe, not a seeder command (starter C50)', () => {
    const page = readFileSync(new URL('./theme.tsx', import.meta.url), 'utf8');
    expect(page).not.toContain('php artisan');
    expect(page).not.toContain('db:seed');
    expect(page).toContain('default theme');
});
