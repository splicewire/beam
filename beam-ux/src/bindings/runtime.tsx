import { createElement, Fragment, type ReactElement, type ReactNode } from 'react';
import { assertCondition, assertFieldPath, type DataCondition, type ConditionRule } from '../blockdoc/bindings.js';

export type BindingRecord = Record<string, unknown>;
export interface RepeatRecords { records: BindingRecord[]; hasMore: boolean; page: number }
export type BindingPayload = Record<string, RepeatRecords>;

function field(record: BindingRecord | undefined, path: string): unknown {
    assertFieldPath(path);
    let value: unknown = record;
    for (const part of path.split('.')) {
        if (value === null || typeof value !== 'object' || !Object.hasOwn(value, part)) return undefined;
        value = (value as BindingRecord)[part];
    }
    return value;
}

function text(record: BindingRecord | undefined, path: string, fallback: string): string {
    const value = field(record, path);
    return value == null || value === '' || !['string', 'number', 'boolean'].includes(typeof value) ? fallback : String(value);
}

function attribute(record: BindingRecord | undefined, path: string, name: string): unknown {
    if (/^on/i.test(name) || ['dangerouslysetinnerhtml', 'srcdoc'].includes(name.toLowerCase())) return undefined;
    const value = field(record, path);
    if (['href', 'src', 'action', 'formaction', 'poster', 'xlinkhref'].includes(name.toLowerCase())) {
        if (typeof value !== 'string') return undefined;
        try {
            if (!['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value, 'https://binding.invalid').protocol)) return undefined;
        } catch { return undefined; }
    }
    return value;
}

function comparable(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null;
    const date = Date.parse(value);
    return Number.isFinite(date) ? date : null;
}

function matches(rule: ConditionRule, record: BindingRecord | undefined): boolean {
    const actual = field(record, rule.field);
    const empty = actual == null || actual === '' || (Array.isArray(actual) && actual.length === 0);
    switch (rule.operator) {
        case 'is set': return !empty;
        case 'is empty': return empty;
        case 'equals': return actual === rule.value;
        case 'does not equal': return actual !== rule.value;
        case 'contains': return typeof actual === 'string' && typeof rule.value === 'string'
            ? actual.includes(rule.value) : Array.isArray(actual) && actual.includes(rule.value);
        case 'greater than':
        case 'less than': {
            const left = comparable(actual), right = comparable(rule.value);
            if (left === null || right === null || typeof actual !== typeof rule.value) return false;
            return rule.operator === 'greater than' ? left > right : left < right;
        }
    }
}

function when(condition: DataCondition, record: BindingRecord | undefined): boolean {
    assertCondition(condition);
    return condition.all != null ? condition.all.every((rule) => matches(rule, record)) : condition.any!.some((rule) => matches(rule, record));
}

function repeat(payload: RepeatRecords | undefined, render: (record: BindingRecord) => ReactNode, empty: () => ReactNode): ReactElement {
    const records = payload?.records ?? [];
    return createElement(Fragment, null, records.length === 0 ? empty() : records.map((record, index) => createElement(Fragment, { key: index }, render(record))));
}

/** Static artifacts consume this runtime and the request payload; it has no fetch or author identity. */
export const bindingRuntime: { field: typeof field; attribute: typeof attribute; text: typeof text; when: typeof when; repeat: typeof repeat } = { field, attribute, text, when, repeat };
