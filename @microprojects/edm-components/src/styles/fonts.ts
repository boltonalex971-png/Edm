// EDM v2 type system — Archivo (sans), JetBrains Mono (mono), Material
// Symbols Outlined (icon font). The package's tokens.css references these
// families via `var(--font-sans|--font-mono|--font-icon)` but cannot itself
// `@import url(...)` them: rslib/lightningcss silently drops the rule block
// following an @import, leaving the SPA without the light-theme tokens.
//
// Consumers spread `edmFontTag` into rsbuild's `html.tags` so the link
// lands in the generated index.html alongside the favicon:
//
//   import { defineConfig } from '@rsbuild/core'
//   import { edmFontTag } from '@microprojects/edm-components/styles/fonts'
//
//   export default defineConfig({
//       html: { tags: [edmFontTag] },
//   })

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
