import {Box, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import * as ReactMarkdownNs from 'react-markdown';
import * as remarkGfmNs from 'remark-gfm';

// `react-markdown`/`remark-gfm` are ESM with a real `default` export, but
// when this file is precompiled to ESM and re-bundled by a consumer rspack
// some interop paths resolve `import X from "pkg"` to the module namespace
// object instead of the default — triggering React #130 ("element type:
// object"). Going through the namespace + falling back keeps both shapes
// working without a bundler-side interop flag.
const ReactMarkdown: any = (ReactMarkdownNs as any).default ?? ReactMarkdownNs;
const remarkGfm: any = (remarkGfmNs as any).default ?? remarkGfmNs;

interface ChangelogProps {
    /** URL returning the changelog as plain markdown text. */
    changelogUrl: string;
}

export function Changelog({changelogUrl}: ChangelogProps) {
    const {t, i18n} = useTranslation('edm-chrome');
    const lng = i18n.language;
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setText(null);
        setError(null);
        const controller = new AbortController();
        // Stamp Accept-Language explicitly — the consuming SPA's axios
        // interceptor doesn't apply to raw fetch(), so the server would
        // otherwise fall back to its default culture and serve the English
        // changelog regardless of the active SPA locale.
        fetch(changelogUrl, {
            credentials: 'include',
            signal: controller.signal,
            headers: {'Accept-Language': lng},
        })
            .then(async (r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            })
            .then(setText)
            .catch((e: any) => {
                if (e.name !== 'AbortError') setError(e.message);
            });
        return () => controller.abort();
    }, [changelogUrl, lng]);

    return (
        <Box className="markdown" sx={{maxWidth: 860, margin: '24px auto', padding: '0 16px'}}>
            {error && (
                <Typography color="error">
                    {t('changelog.loadFailed', 'Failed to load changelog: {{error}}', {error})}
                </Typography>
            )}
            {!error && text == null && <Typography>{t('changelog.loading', 'Loading…')}</Typography>}
            {text != null && (
                // CHANGES.md / .ru.md carry hidden `<!-- cite: PR ... -->`
                // dedupe markers per the update-changes policy; react-markdown
                // doesn't recognise inline HTML by default and escapes them as
                // visible text, so strip before rendering.
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text.replace(/<!--[\s\S]*?-->/g, '')}
                </ReactMarkdown>
            )}
        </Box>
    );
}
