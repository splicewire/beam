import { createElement, type ComponentProps } from 'react';
import type { WidgetRegistry } from '@schemastud/seam';
import { AgreementMemberWidget } from './agreement-member.js';
import type { AgreementReader } from './agreement-read.js';
export { AgreementPrompt } from './agreement-prompt.js';
export type { AgreementRead, AgreementReader } from './agreement-read.js';
// agreements 15: a client off frame's transport lazy-loads this entry on a 428 and reads the body with the one parser.
export { requirementsOf, type OutstandingRequirement } from '../interlock/requirements.js';

export interface AgreementWidgetOptions {
    /**
     * agreements 15: how 'agreement-member' reads an Agreement it is not given the text of, through the host's own
     * transport. Absent, it reads with a same-origin `fetch`, as before.
     */
    read?: AgreementReader;
}

/** The shared lazy widget-registration module for frame kits and frame-vocabulary. */
export default function registerAgreementWidgets(registry: WidgetRegistry, options: AgreementWidgetOptions = {}): void {
    const { read } = options;
    if (read === undefined) {
        registry.registerWidget('agreement-member', AgreementMemberWidget);
        return;
    }
    function ReadingAgreementMemberWidget(props: ComponentProps<typeof AgreementMemberWidget>) {
        return createElement(AgreementMemberWidget, { ...props, read });
    }
    registry.registerWidget('agreement-member', ReadingAgreementMemberWidget);
}
