import {Box, Typography} from '@mui/material';
import {useEffect, useState} from 'react';
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
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(changelogUrl, {
            credentials: 'include',
            signal: controller.signal,
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
    }, [changelogUrl]);

    return (
        <Box className="markdown" sx={{maxWidth: 860, margin: '24px auto', padding: '0 16px'}}>
            {error && (
                <Typography color="error">
                    Failed to load changelog: {error}
                </Typography>
            )}
            {!error && text == null && <Typography>Loading…</Typography>}
            {text != null && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            )}
        </Box>
    );
}
