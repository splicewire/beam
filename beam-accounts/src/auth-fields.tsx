import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { cn, Input } from '@schemastud/ui';

/**
 * A password `Input` with a show/hide eye toggle, so a user can catch typos before
 * submitting. The toggle is a real button in the tab order with an aria-label that
 * reflects state; the field itself keeps all the usual Input props.
 */
export function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn('pr-10', className)}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                tabIndex={0}
            >
                {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
        </div>
    );
}

/** An inline, role=alert error line for the auth forms. Renders nothing when empty. */
export function AuthError({ message }: { message?: string | null }) {
    if (!message) return null;
    return (
        <p role="alert" className="text-sm text-destructive">
            {message}
        </p>
    );
}
