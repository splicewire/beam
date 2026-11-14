import type { Auth } from './auth';
import type { Brand } from './brand';
import type { ClientLocalizationData } from './localization';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            brand: Brand;
            auth: Auth;
            sidebarOpen: boolean;
            /** localization 16: the client catalog's address and initial (once) catalog, shared by laravel-beam-ux. */
            localization: ClientLocalizationData;
            [key: string]: unknown;
        };
    }
}

export {};
