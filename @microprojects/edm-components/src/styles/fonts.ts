// Font sheet for rsbuild's html.tags; tokens.css can't @import because rslib drops the next rule block.

// Two URLs because the APIs differ:
//   v1 (legacy `/css`) is used for Onest + JetBrains Mono with an explicit
//     `subset=...` param so every weight ships its Cyrillic glyph file.
//     Onest was designed bilingually (Latin + Cyrillic stroke harmony) and
//     replaced Archivo here — Archivo on Google Fonts has no Cyrillic
//     subset at any weight, so Russian text was falling through to system-ui.
//   v2 (modern `/css2`) is used for Material Symbols Outlined because it
//     needs the variable-axis `:opsz,wght,FILL,GRAD@…` syntax which v1
//     doesn't accept.
const ONEST_AND_MONO_HREF =
    'https://fonts.googleapis.com/css' +
    '?family=Onest:400,500,600,700,800' +
    '|JetBrains+Mono:400,500,600' +
    '&subset=latin,latin-ext,cyrillic,cyrillic-ext' +
    '&display=swap'

const MATERIAL_SYMBOLS_HREF =
    'https://fonts.googleapis.com/css2' +
    '?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..0' +
    '&display=swap'

/** Legacy single-URL constant — points at the text fonts only. New consumers
 *  should use `edmFontTags` so Material Symbols loads too. Kept for back-compat. */
export const EDM_FONT_HREF = ONEST_AND_MONO_HREF

export const edmFontTags = [ONEST_AND_MONO_HREF, MATERIAL_SYMBOLS_HREF].map((href) => ({
    tag: 'link' as const,
    attrs: { rel: 'stylesheet', href },
}))

/** Legacy single-tag constant — only loads Onest + JetBrains Mono. New
 *  consumers should spread `edmFontTags` into rsbuild's `html.tags`. */
export const edmFontTag = edmFontTags[0]
