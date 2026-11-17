// Two tiny DEMO island components for the visual editor's opaque-island registry. A tree node whose
// `name` is a registered key (PascalCase) renders the REAL component (sealed — select/reorder/delete, no
// drill-in) instead of an intrinsic element. A fresh host swaps these for its own designed sections; they
// exist only to prove the island seam renders in place. Their tones read the site layout's `--st-*`
// variables (light fallbacks inline), so they flip with the site's dark scheme like the chrome does.
import { useBeamUxMessages } from '../messages.js';

export function DemoHero() {
    const m = useBeamUxMessages();
    return (
        <section
            style={{
                padding: 'clamp(40px,7vw,84px) clamp(18px,5vw,56px)',
                background: 'linear-gradient(180deg,var(--st-hero-from, #f8fafc),var(--st-hero-to, #eef2ff))',
                borderRadius: 16,
                textAlign: 'center',
            }}
        >
            <h1
                style={{
                    fontSize: 'clamp(30px,5vw,46px)',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: '0 0 12px',
                    color: 'var(--st-fg, #0f172a)',
                }}
            >
                {m.t('splicewire-beam-ux::messages.islands_hero_title')}
            </h1>
            <p
                style={{
                    fontSize: 17,
                    lineHeight: 1.55,
                    color: 'var(--st-muted, #475569)',
                    maxWidth: 520,
                    margin: '0 auto',
                }}
            >
                {m.t('splicewire-beam-ux::messages.islands_hero_body')}
            </p>
        </section>
    );
}

export function DemoFeatureRow() {
    const m = useBeamUxMessages();
    const cells = [
        {
            key: 'edit',
            title: m.t('splicewire-beam-ux::messages.islands_feature_edit_title'),
            body: m.t('splicewire-beam-ux::messages.islands_feature_edit_body'),
        },
        {
            key: 'publish',
            title: m.t('splicewire-beam-ux::messages.islands_feature_publish_title'),
            body: m.t('splicewire-beam-ux::messages.islands_feature_publish_body'),
        },
        {
            key: 'theme',
            title: m.t('splicewire-beam-ux::messages.islands_feature_theme_title'),
            body: m.t('splicewire-beam-ux::messages.islands_feature_theme_body'),
        },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                gap: 16,
                padding: '24px 0',
            }}
        >
            {cells.map((c) => (
                <div
                    key={c.key}
                    style={{
                        padding: 20,
                        border: '1px solid var(--st-card-border, #e2e8f0)',
                        borderRadius: 12,
                        background: 'var(--st-card, #fff)',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 600,
                            marginBottom: 6,
                            color: 'var(--st-fg, #0f172a)',
                        }}
                    >
                        {c.title}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: 'var(--st-dim, #64748b)',
                        }}
                    >
                        {c.body}
                    </div>
                </div>
            ))}
        </div>
    );
}
