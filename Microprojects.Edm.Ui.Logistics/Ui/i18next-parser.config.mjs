// Extracts every t(...) and <Trans /> call into a scratch tree under
// tools/i18n-extracted/. This is NOT the source-of-truth — the source of
// truth lives co-located with each feature folder (see docs/specs/multilang-spec.md).
// The scratch tree is intended for diffing against the in-repo per-folder JSONs:
//
//   npm run i18n:extract                    # writes scratch
//   npm run i18n:coverage                   # warns on EN vs RU gaps
//   diff -r tools/i18n-extracted/en \       # find keys in code but not in source JSONs
//          src/**/<folder>.locales/en.json
//
// Run periodically / in CI as an informational check. Do not gate builds on it
// until the scratch-vs-source-of-truth diff is clean.

export default {
    contextSeparator: '_',
    createOldCatalogs: false,
    defaultNamespace: 'common',
    indentation: 4,
    keepRemoved: false,
    keySeparator: '.',
    namespaceSeparator: ':',
    lexers: {
        ts:  ['JavascriptLexer'],
        tsx: ['JsxLexer'],
        default: ['JavascriptLexer'],
    },
    locales: ['en', 'ru'],
    output: 'tools/i18n-extracted/$LOCALE/$NAMESPACE.json',
    pluralSeparator: '_',
    input: ['src/**/*.{ts,tsx}'],
    sort: true,
    verbose: false,
    failOnWarnings: false,
    failOnUpdate: false,
}
