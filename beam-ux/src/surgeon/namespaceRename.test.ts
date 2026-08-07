import { describe, expect, it } from 'vitest';
import { buildNamespaceLookup, renameFile, renameNamespaceReferences } from './namespaceRename.js';

// A slice of generated.d.ts shaped like the real post-ticket-34 output: app-owned stays flat,
// Splicewire-family classes emit at their native namespace, third-party too.
const GENERATED_DTS = `declare namespace App {
namespace Data {
export type BeamUxEntryBodyData = {
slug: string,
};
}
}
declare namespace Rushing {
namespace AuthVault {
namespace Data {
export type LlmKeySecretData = {
provider: string,
};
}
}
}
declare namespace Splicewire {
namespace Beam {
namespace Accounts {
namespace Data {
namespace Frame {
export type MembershipResourceData = {
id: string,
};
}
}
}
}
namespace Tower {
namespace Data {
export type AgentData = {
id: string,
};
namespace Frame {
export type MembershipResourceData = {
id: string,
};
}
}
}
}
`;

describe('buildNamespaceLookup', () => {
    it('maps a ticket-33-era package-namespaced App path to the new native path', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        expect(lookup['App.Data.Tower.AgentData']).toBe('Splicewire.Tower.Data.AgentData');
    });

    it('maps both twins of a same-short-name collision to their own distinct old and new paths', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        expect(lookup['App.Data.Accounts.Frame.MembershipResourceData']).toBe(
            'Splicewire.Beam.Accounts.Data.Frame.MembershipResourceData',
        );
        expect(lookup['App.Data.Tower.Frame.MembershipResourceData']).toBe(
            'Splicewire.Tower.Data.Frame.MembershipResourceData',
        );
    });

    it('does not map an app-owned class — old path already equals new path', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        expect(lookup['App.Data.BeamUxEntryBodyData']).toBeUndefined();
    });

    it('does not map a third-party class — never remapped by ticket 33 either', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        expect(lookup['Rushing.AuthVault.Data.LlmKeySecretData']).toBeUndefined();
    });
});

describe('renameFile', () => {
    const lookup = buildNamespaceLookup(GENERATED_DTS);

    it('rewrites a ticket-33-shaped reference to the new native path', () => {
        const source = `export type Agent = App.Data.Tower.AgentData;\n`;
        const result = renameFile(source, lookup);
        expect(result).toContain('Splicewire.Tower.Data.AgentData');
        expect(result).not.toContain('App.Data.Tower.AgentData');
    });

    it('disambiguates two same-short-name references to their correct distinct package twin', () => {
        const source = [
            `export type AccountsMembership = App.Data.Accounts.Frame.MembershipResourceData;`,
            `export type TowerMembership = App.Data.Tower.Frame.MembershipResourceData;`,
            '',
        ].join('\n');
        const result = renameFile(source, lookup);
        expect(result).toContain('Splicewire.Beam.Accounts.Data.Frame.MembershipResourceData');
        expect(result).toContain('Splicewire.Tower.Data.Frame.MembershipResourceData');
    });

    it('is a no-op on a file already at the new native path', () => {
        const source = `export type Agent = Splicewire.Tower.Data.AgentData;\n`;
        expect(renameFile(source, lookup)).toBeNull();
    });

    it('is a no-op on a file with no matching references at all', () => {
        const source = `export type Foo = { bar: string };\n`;
        expect(renameFile(source, lookup)).toBeNull();
    });

    it('leaves an unparseable file untouched (returns null, not a throw)', () => {
        expect(renameFile('this is not { valid ts syntax @#$', lookup)).toBeNull();
    });
});

describe('renameNamespaceReferences', () => {
    it('is idempotent — running it twice produces zero edits the second time', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        const files = {
            'a.ts': `export type Agent = App.Data.Tower.AgentData;\n`,
        };

        const firstPass = renameNamespaceReferences(files, lookup);
        expect(firstPass).toHaveLength(1);

        const appliedFiles = { 'a.ts': firstPass[0].new };
        const secondPass = renameNamespaceReferences(appliedFiles, lookup);
        expect(secondPass).toHaveLength(0);
    });

    it('only reports edits for files that actually changed', () => {
        const lookup = buildNamespaceLookup(GENERATED_DTS);
        const files = {
            'changed.ts': `export type Agent = App.Data.Tower.AgentData;\n`,
            'unchanged.ts': `export type Foo = { bar: string };\n`,
        };

        const edits = renameNamespaceReferences(files, lookup);
        expect(edits).toHaveLength(1);
        expect(edits[0].file).toBe('changed.ts');
    });
});
