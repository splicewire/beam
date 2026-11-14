import { useBeamMessages } from '../messages';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    const messages = useBeamMessages();
    return (
        <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{title || messages.t('splicewire-beam-inertia::messages.chrome_unexpected_error')}</AlertTitle>
            <AlertDescription>
                <ul className="list-inside list-disc text-sm">
                    {Array.from(new Set(errors)).map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
