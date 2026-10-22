/** Projections of the PHP FileInspection/Input/Result Data contracts. */
export interface FileInspection {
    memberId: string; entryId: string; state: string; message: string;
    workingHeadVersion: string | null; publishedVersion: string | null;
    fileExists: boolean; fileSha256: string | null; fingerprint: string | null;
    path: string | null; publishedSource: string | null; localSource: string | null;
    canTake: boolean; canRestore: boolean; sourceTruncated: boolean;
}
export interface FileReconcileInput {
    expectedHeadVersion: string; expectedPublishedVersion: string;
    expectedFileExists: boolean; expectedFileSha256: string | null;
    fingerprint: string; confirmed: boolean;
}
export interface FileReconcileResult {
    status: string; message: string; entryId: string;
    headVersion: string | null; publishedVersion: string | null;
}
