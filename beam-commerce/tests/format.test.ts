import { describe, expect, it } from 'vitest';
import { errorMessage } from '../src/format';

describe('errorMessage public boundary', () => {
    it.each([
        [{ status: 422, message: 'Choose a valid billing month.' }, 'Choose a valid billing month.'],
        [
            {
                response: {
                    status: 409,
                    data: { message: 'This subscription is already active.' },
                },
            },
            'This subscription is already active.',
        ],
    ])('keeps declared 4xx copy public', (error, expected) => {
        expect(errorMessage(error, 'Could not load billing.')).toBe(expected);
    });

    it.each([
        new Error('connect ECONNREFUSED 10.0.0.12'),
        {
            status: 500,
            message: 'SQLSTATE[42P01]: relation subscriptions does not exist',
        },
        {
            response: {
                status: 503,
                data: { message: 'Stripe secret sk_live_private failed' },
            },
        },
    ])('replaces arbitrary server and transport details with safe package copy', (error) => {
        expect(errorMessage(error, 'Could not load billing.')).toBe('Could not load billing.');
    });
});
