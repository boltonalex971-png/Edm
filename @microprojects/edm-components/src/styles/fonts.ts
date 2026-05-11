// v2 font sheet for rsbuild's html.tags; tokens.css can't @import because rslib drops the next rule block.

export const EDM_FONT_HREF =
    'https://fonts.googleapis.com/css2' +
    '?family=Archivo:wght@400;500;600;700;800' +
    '&family=JetBrains+Mono:wght@400;500;600' +
    '&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..0' +
    '&display=swap'

export const edmFontTag = {
    tag: 'link' as const,
    attrs: {
        rel: 'stylesheet',
        href: EDM_FONT_HREF,
    },
}
