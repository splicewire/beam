import { lazy, Suspense } from 'react';

export interface AgreementPromptData {
    key: string;
    readUrl?: string;
    required: boolean;
    version?: number;
    digest?: string;
    kind?: string;
    title?: string;
    label?: string;
    effectiveAt?: string;
    summary?: string | null;
    content?: string;
    legalUrl?: string | null;
}

export type AgreementMember = { key: string; version: number; digest: string };

const Prompt = lazy(async () => {
    const widgets = await import('@splicewire/beam-agreements/widgets');
    return { default: widgets.AgreementPrompt };
});

/** Loads the optional agreements widget only when the host supplied Agreement props. */
export function AgreementPrompt({ agreement, values, onChange }: {
    agreement: AgreementPromptData;
    values: Record<string, AgreementMember>;
    onChange: (key: string, value?: AgreementMember) => void;
}) {
    return (
        <Suspense fallback={null}>
            <Prompt
                agreementKey={agreement.key}
                readUrl={agreement.readUrl}
                required={agreement.required}
                version={agreement.version}
                digest={agreement.digest}
                kind={agreement.kind}
                title={agreement.title}
                label={agreement.label}
                effectiveAt={agreement.effectiveAt}
                summary={agreement.summary}
                content={agreement.content}
                legalUrl={agreement.legalUrl}
                value={values[agreement.key]}
                onChange={(member) => onChange(agreement.key, isAgreementMember(member) ? member : undefined)}
            />
        </Suspense>
    );
}

function isAgreementMember(value: unknown): value is AgreementMember {
    return typeof value === 'object' && value !== null
        && typeof (value as AgreementMember).key === 'string'
        && Number.isInteger((value as AgreementMember).version)
        && typeof (value as AgreementMember).digest === 'string';
}
