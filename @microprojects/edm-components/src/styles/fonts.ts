// v2 font sheet for rsbuild's html.tags; tokens.css can't @import because rslib drops the next rule block.

// Two URLs because the APIs differ:
//   v1 (legacy `/css`) is used for Archivo + JetBrains Mono with an explicit
//     `subset=...` param. v2's auto-subset detection is unreliable for
//     Cyrillic at heavier weights (e.g. Archivo 800) — the Cyrillic woff2
//     simply isn't served, so the browser falls back to system-ui for
//     Russian text. v1 lets us pin the subsets we actually need.
//   v2 (modern `/css2`) is used for Material Symbols Outlined because it
//     needs the variable-axis `:opsz,wght,FILL,GRAD@…` syntax which v1
//     doesn't accept.
const ARCHIVO_AND_MONO_HREF =
    'https://fonts.googleapis.com/css' +
    '?family=Archivo:400,500,600,700,800' +
    '|JetBrains+Mono:400,500,600' +
    '&subset=latin,latin-ext,cyrillic,cyrillic-ext' +
    '&display=swap'

const MATERIAL_SYMBOLS_HREF =
    'https://fonts.googleapis.com/css2' +
    '?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..0' +
    '&display=swap'

/** Legacy single-URL constant — points at the text fonts only. New consumers
 *  should use `edmFontTags` so Material Symbols loads too. Kept for back-compat. */
export const EDM_FONT_HREF = ARCHIVO_AND_MONO_HREF

export const edmFontTags = [ARCHIVO_AND_MONO_HREF, MATERIAL_SYMBOLS_HREF].map((href) => ({
    tag: 'link' as const,
    attrs: { rel: 'stylesheet', href },
}))

/** Legacy single-tag constant — only loads Archivo + JetBrains Mono. New
 *  consumers should spread `edmFontTags` into rsbuild's `html.tags`. */
export const edmFontTag = edmFontTags[0]
