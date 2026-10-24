import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilesComparisonPanel } from './FilesComparisonPanel';
import type { FileInspection } from './files';
import type { UxBuilderClient } from './types';
const base: FileInspection = {
    memberId:'member',entryId:'theme',state:'differs',message:'One canonical color changed; all namespaces are retained.',
    workingHeadVersion:'working-v3',publishedVersion:'published-v2',fileExists:true,fileSha256:'local-sha256',fingerprint:'placement-fingerprint',
    path:'resources/beam/theme/default.css',publishedSource:':root {\n  --theme-site-accent: #334455;\n}',localSource:':root {\n  --theme-site-accent: #abcdef;\n}',
    canTake:true,canRestore:false,sourceTruncated:false,
};
function client(state: string, mdx = false): UxBuilderClient {
    let current = {...base,state,...(mdx ? {format:'mdx',path:'help/page/intro.mdx',publishedSource:'---\ntitle: Help\nnavOrder: 2\n---\n\n# Published help\n',localSource:'---\ntitle: Help\nnavOrder: 2\n---\n\n# Edited help\n'} : {})};
    if(state === 'missing') current = {...current,fileExists:false,fileSha256:null,localSource:null,canTake:false,canRestore:true,message:'The local published file is missing.'};
    if(state === 'invalid') current = {...current,canTake:false,localSource:'body { arbitrary: css; }',message:'Only the exact canonical complete Theme format is supported.'};
    return {
        loadBody:async () => {throw Error('Outside this story');},saveBody:async () => {throw Error('Outside this story');},
        inspectReleaseFile:async () => ({...current}),
        takeReleaseFile:async () => {
            if(state === 'conflict') throw Error('The published pin changed. Nothing changed. Reload comparison.');
            current = {...current,workingHeadVersion:'imported-v4'};
            return {status:'drafted',message:'Draft saved. Publish separately through ordinary review.',entryId:'theme',headVersion:'imported-v4',publishedVersion:'published-v2'};
        },
        restoreMissingReleaseFile:async () => {
            current = {...current,state:'unchanged',fileExists:true,fileSha256:'restored-sha256',localSource:current.publishedSource,canRestore:false,message:'The file matches the current published version.'};
            return {status:'restored',message:'Missing published file restored. Draft, history and Git unchanged.',entryId:'theme',headVersion:'working-v3',publishedVersion:'published-v2'};
        },
    };
}
const meta = {title:'BeamUx/FilesComparisonPanel',component:FilesComparisonPanel,parameters:{layout:'padded'}} satisfies Meta<typeof FilesComparisonPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Differs: Story = {args:{memberId:'member',client:client('differs'),editorHref:() => '#host-theme'}};
export const Missing: Story = {args:{memberId:'member',client:client('missing')}};
export const Invalid: Story = {args:{memberId:'member',client:client('invalid')}};
export const Conflict: Story = {args:{memberId:'member',client:client('conflict')}};

export const MissingMdx: Story = {args:{memberId:'member',client:client('missing',true)}};
export const MdxRestoreConflict: Story = {args:{memberId:'member',client:{...client('missing',true),restoreMissingReleaseFile:async () => {throw Error('The file appeared. Nothing was overwritten. Reload comparison.');}}}};
