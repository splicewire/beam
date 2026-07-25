import type { ReactNode } from 'react';

// One parsed line of captured `splicewire:beam:doctor` output.
export interface DoctorFinding {
    status: 'pass' | 'warn' | 'fail';
    check: string;
    detail: string;
}

// Leading level token → finding status. Case-insensitive; INFO/PASS advisory-green,
// WARN amber, ERROR/FAIL red. Anchored so it only eats a token at the line start.
const LEVEL_RE = /^\s*(INFO|PASS|WARN|ERROR|FAIL)\b\s*/i;

const LEVEL_STATUS: Record<string, DoctorFinding['status']> = {
    INFO: 'pass',
    PASS: 'pass',
    WARN: 'warn',
    ERROR: 'fail',
    FAIL: 'fail',
};

const STATUS_LABEL: Record<DoctorFinding['status'], string> = {
    pass: 'Pass',
    warn: 'Warn',
    fail: 'Fail',
};

// Parse captured doctor text (lenient, matches BEAM-02's plain-text format):
//  - split on lines, drop blanks;
//  - strip an optional leading level token (INFO/PASS/WARN/ERROR/FAIL) → status;
//  - split the remainder on the FIRST ": " into check + detail;
//  - no level token defaults to 'pass' (advisory), preferring the token when present.
export function parseDoctorOutput(raw: string): DoctorFinding[] {
    const findings: DoctorFinding[] = [];

    for (const line of raw.split(/\r?\n/)) {
        if (line.trim() === '') continue;

        let rest = line;
        let status: DoctorFinding['status'] = 'pass';

        const match = LEVEL_RE.exec(rest);
        if (match) {
            status = LEVEL_STATUS[match[1].toUpperCase()];
            rest = rest.slice(match[0].length);
        } else {
            rest = rest.trim();
        }

        const sep = rest.indexOf(': ');
        const check = sep === -1 ? rest.trim() : rest.slice(0, sep).trim();
        const detail = sep === -1 ? '' : rest.slice(sep + 2).trim();

        findings.push({ status, check, detail });
    }

    return findings;
}

// Renders captured `splicewire:beam:doctor` output — a layered Pass/Warn/Fail readiness
// report — inside a guide. Accepts the text via the `raw` prop OR as children (a fenced
// or plain text block); resolves `raw ?? children`. Each finding is a row with a status
// pip/label, a mono `check`, and its `detail`; a summary line tallies the three levels.
// Purely presentational — colors ride the host `--beam-*` / `--sr-*` tokens via kit.css.
export function DoctorOutput({
    raw,
    children,
}: {
    raw?: string;
    children?: ReactNode;
}) {
    const text = raw ?? (typeof children === 'string' ? children : String(children ?? ''));
    const findings = parseDoctorOutput(text);

    const passed = findings.filter((f) => f.status === 'pass').length;
    const warned = findings.filter((f) => f.status === 'warn').length;
    const failed = findings.filter((f) => f.status === 'fail').length;

    return (
        <div className="bkit-doctoroutput">
            <ul className="bkit-doctoroutput-list">
                {findings.map((finding, i) => (
                    <li
                        key={`${finding.check}-${i}`}
                        className={`bkit-doctoroutput-row bkit-doctoroutput-row--${finding.status}`}
                    >
                        <span className="bkit-doctoroutput-pip" aria-hidden="true" />
                        <span className="bkit-doctoroutput-label">
                            {STATUS_LABEL[finding.status]}
                        </span>
                        <span className="bkit-doctoroutput-check">{finding.check}</span>
                        {finding.detail && (
                            <span className="bkit-doctoroutput-detail">{finding.detail}</span>
                        )}
                    </li>
                ))}
            </ul>
            <p className="bkit-doctoroutput-summary">
                {passed} passed / {warned} warn / {failed} failed
            </p>
        </div>
    );
}
