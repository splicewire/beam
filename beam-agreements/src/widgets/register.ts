import type { WidgetRegistry } from '@schemastud/seam';
import { AgreementMemberWidget } from './agreement-member.js';

/** The shared lazy widget-registration module for frame kits and frame-vocabulary. */
export default function registerAgreementWidgets(registry: WidgetRegistry): void {
    registry.registerWidget('agreement-member', AgreementMemberWidget);
}
