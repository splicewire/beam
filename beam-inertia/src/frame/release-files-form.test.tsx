// @vitest-environment jsdom
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {createFormIntentBus, type FormBodySlotProps} from '@schemastud/frame';
import {createReleaseFilesFormResolver, ReleaseFilesForm} from './release-files-form';
vi.mock('@splicewire/beam-ux', () => ({FilesComparisonPanel: ({memberId}: {memberId:string}) => <div>Inspected {memberId}</div>}));
afterEach(cleanup);
it('binds the actual read schema while keeping unrelated write/action forms generic', () => {
 const resolver=createReleaseFilesFormResolver();
 expect(resolver.resolveFormForSchema({$id:'ReleaseFilesData'}).form).toBe(ReleaseFilesForm);
 expect(resolver.resolveFormForSchema({$id:'FileReconcileInputData'}).form).toBeNull();
 expect(resolver.resolveFormForSchema({$id:'ReleaseFilesData','x-widget':'declared-editor'}).form).toBeNull();
});
it('renders historical metadata with the addressed comparison and never registers CRUD Save',()=>{
 const registerSubmit=vi.fn();
 const props: FormBodySlotProps={schema:{$id:'ReleaseFilesData'},formData:{id:'member-a',release:'Historical release',versionId:'historical-v1'},readOnly:true,form:'bare',registerSubmit,onChange:vi.fn(),onSubmit:vi.fn(),intentBus:createFormIntentBus()};
 render(<ReleaseFilesForm {...props}/>);
 expect(registerSubmit).toHaveBeenCalledWith(null);
 expect(screen.getByText('Historical release')).toBeTruthy();
 expect(screen.getByText('historical-v1')).toBeTruthy();
 expect(screen.getByText('Inspected member-a')).toBeTruthy();
 expect(screen.queryByRole('textbox')).toBeNull();
});
