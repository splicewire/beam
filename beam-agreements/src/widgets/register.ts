import type { WidgetRegistry } from '@schemastud/seam';
import { AgreementMemberWidget } from './agreement-member.js';
export { AgreementPrompt } from './agreement-prompt.js';
// agreements 15: a client off frame's transport lazy-loads this entry on a 428 and reads the body with the one parser.
export { requirementsOf, type OutstandingRequirement } from '../interlock/requirements.js';

/** The shared lazy widget-registration module for frame kits and frame-vocabulary. */
export default function registerAgreementWidgets(registry: WidgetRegistry): void {
    registry.registerWidget('agreement-member', AgreementMemberWidget);
}
