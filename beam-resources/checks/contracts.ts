// A missing or empty projection must fail before this package can be packed.
import type { AutoReloadConfigData } from '../types/auto-reload';
import type { BeamUxEntryBodyData } from '../types/beam-ux';
import type { SubscriptionData, UsageSummaryData } from '../types/commerce';

export type RequiredPublicContract =
  | BeamUxEntryBodyData
  | AutoReloadConfigData
  | SubscriptionData
  | UsageSummaryData;

// Qualified public PHP owners supply this complete intake/catalog closure.
import type { EntityIntakeFormSectionData, EntityIntakeSectionSubmittedData } from '../types/intake';
import type {
  WorkflowLineageData,
  WorkflowVersionData,
  WorkflowBlueprintData,
  WorkflowTransitionData,
  WorkflowCatalogData,
  GuardCatalogEntryData,
  WorkflowCoverageData,
  WorkflowCoverageVersionData,
  WorkflowProjectionData,
  WorkflowTypeOptionData,
  WorkflowBindingData,
  PrincipalKindData,
  RoleOptionData,
  WorkflowTransitionRequestData,
  WorkflowTransitionAttemptData,
} from '../types/workflows';

export type RequiredIntakeWorkflowContract =
  | EntityIntakeFormSectionData
  | EntityIntakeSectionSubmittedData
  | WorkflowLineageData
  | WorkflowVersionData
  | WorkflowBlueprintData
  | WorkflowTransitionData
  | WorkflowCatalogData
  | GuardCatalogEntryData
  | WorkflowCoverageData
  | WorkflowCoverageVersionData
  | WorkflowProjectionData
  | WorkflowTypeOptionData
  | WorkflowBindingData
  | PrincipalKindData
  | RoleOptionData
  | WorkflowTransitionRequestData
  | WorkflowTransitionAttemptData;

// Exercise nested edges too: exported empty aliases cannot stand in for the declared contract.
export type RequiredCatalogMembers = WorkflowCatalogData['guards' | 'effects' | 'principals'];
export type RequiredRoleOption = NonNullable<PrincipalKindData['options']>[number];
export type RequiredIntakeReceipt = EntityIntakeSectionSubmittedData['submissionId'];
