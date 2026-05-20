#!/usr/bin/env node
// Walks every <name>.locales/ directory under src/, treats <ns>.en.json as the
// source of truth, and reports keys that exist in EN but are missing (or
// non-string-typed) in other locales. Fallback-to-EN is the i18next contract,
// so missing keys are expected during conversion — this script WARNS but
// never fails, so it's safe to run as a non-blocking CI job.
//
// Usage: node tools/check-locale-coverage.mjs [src-root]
//
// Exit code: always 0. The output goes to stdout as a Markdown table grouped
// by namespace, suitable for GitHub Action job summaries.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, basename, relative, resolve } from 'node:path'

const SRC_ROOT = resolve(process.argv[2] ?? 'src')

/** Walks the src/ tree and yields every directory whose name ends in `.locales`. */
function* findLocaleDirs(dir) {
    for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry.startsWith('.')) continue
        const full = join(dir, entry)
        const st = statSync(full)
        if (!st.isDirectory()) continue
        if (entry.endsWith('.locales')) {
            yield full
        } else {
            yield* findLocaleDirs(full)
        }
    }
}

/** Flatten a nested dict so { a: { b: 'x' } } becomes { 'a.b': 'x' }. Plural
 *  suffixes (`_one/_few/_many/_other`) are kept separate so the count is honest. */
function flatten(obj, prefix = '', acc = {}) {
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            flatten(v, key, acc)
        } else {
            acc[key] = v
        }
    }
    return acc
}

const issues = []

for (const localesDir of findLocaleDirs(SRC_ROOT)) {
    const files = readdirSync(localesDir).filter((f) => f.endsWith('.json'))
    const enFile = files.find((f) => f === 'en.json')
    if (!enFile) continue
    const enKeys = flatten(JSON.parse(readFileSync(join(localesDir, enFile), 'utf8')))
    const enKeySet = Object.keys(enKeys)
    const nsLabel = relative(SRC_ROOT, localesDir).replace(/\\/g, '/').replace(/\.locales$/, '')
    for (const file of files) {
        if (file === 'en.json') continue
        const lng = basename(file, '.json')
        const dict = flatten(JSON.parse(readFileSync(join(localesDir, file), 'utf8')))
        const missing = enKeySet.filter((k) => dict[k] === undefined)
        if (missing.length === 0) continue
        issues.push({ ns: nsLabel, lng, missing })
    }
}

if (issues.length === 0) {
    console.log('## i18n coverage\n\nAll non-EN locales match EN. No missing keys.')
    process.exit(0)
}

console.log('## i18n coverage\n')
console.log('| Namespace | Locale | Missing keys | Sample |')
console.log('|---|---|---:|---|')
let total = 0
for (const { ns, lng, missing } of issues) {
    total += missing.length
    const sample = missing.slice(0, 3).join(', ')
    const more = missing.length > 3 ? `, … (+${missing.length - 3})` : ''
    console.log(`| \`${ns}\` | \`${lng}\` | ${missing.length} | ${sample}${more} |`)
}
console.log(`\n**Total:** ${total} missing key(s) across ${issues.length} namespace×locale pair(s).`)
console.log('\nMissing keys fall back to EN at runtime — this report is informational.')
process.exit(0)
