import type { ReactNode } from 'react';

export function SurfaceHeading({ embedded, children }: { embedded: boolean; children: ReactNode }) {
    const className = 'text-xl font-semibold tracking-tight';

    return embedded ? <h2 className={className}>{children}</h2> : <h1 className={className}>{children}</h1>;
}
