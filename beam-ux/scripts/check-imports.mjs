#!/usr/bin/env node
/** Import-boundary gate: inspect TypeScript syntax, not comments or generated code strings. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const violations = [];
function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) yield* walk(path);
        else if (/\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path)) yield path;
    }
}
function violationFor(module) {
    if (module.startsWith('@/')) return "app-local '@/…' import";
    if (module === 'sonner') return 'direct toast lib (feedback is injected, not imported)';
    if (module === 'axios') return 'transport lib (the client is injected, not imported)';
    if (module === 'ziggy-js') return 'named-route resolution has no place in a portable component';
    if (module.startsWith('@inertiajs/')) return 'Inertia coupling';
}
function sanctionedHead(file, node, module) {
    // ADR-0213 permits the page-map's head manager, never router/Link/usePage.
    const inPages = relative(join(SRC, 'pages'), file);
    if (inPages.startsWith('..') || module !== '@inertiajs/react' || !ts.isImportDeclaration(node)) return false;
    const clause = node.importClause;
    return !clause?.name && clause?.namedBindings && ts.isNamedImports(clause.namedBindings)
        && clause.namedBindings.elements.length > 0
        && clause.namedBindings.elements.every((binding) => (binding.propertyName ?? binding.name).text === 'Head');
}
for (const file of walk(SRC)) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const diagnostic of source.parseDiagnostics) {
        violations.push(`  ${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
    function visit(node) {
        let specifier;
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
        else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) specifier = node.argument.literal;
        else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) specifier = node.moduleReference.expression;
        else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
            || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) specifier = node.arguments[0];
        if (specifier && ts.isStringLiteralLike(specifier)) {
            const why = violationFor(specifier.text);
            if (why && !sanctionedHead(file, node, specifier.text)) {
                const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
                violations.push(`  ${file}:${line} — ${why}\n    ${node.getText(source)}`);
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(source);
}
if (violations.length) {
    console.error('✗ import-boundary check FAILED — @splicewire/beam-ux must stay host-agnostic:\n');
    console.error(violations.join('\n'));
    process.exitCode = 1;
} else console.log('✓ import-boundary check passed — no forbidden imports in src/.');
