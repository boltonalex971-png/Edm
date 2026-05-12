import {useEffect, useState} from 'react';

/** Returns the current bottom-edge Y of the tallest `[data-sticky-header="true"]`
 *  element plus `padding`. Use as `offsetTop` for SmartScroll so sticky content
 *  doesn't end up hidden behind the SubRootPage chrome (which squeezes between
 *  72→36 px on scroll). Recomputes on scroll and on header resize. */
export function useStickyHeaderOffset(padding = 10): number {
    const [offset, setOffset] = useState(padding);

    useEffect(() => {
        const updateOffset = () => {
            const headers = document.querySelectorAll('[data-sticky-header="true"]');
            let maxBottom = 0;
            headers.forEach((h) => {
                const rect = h.getBoundingClientRect();
                maxBottom = Math.max(maxBottom, rect.bottom);
            });
            setOffset(maxBottom + padding);
        };

        const observer = new ResizeObserver(updateOffset);
        const headers = document.querySelectorAll('[data-sticky-header="true"]');
        headers.forEach((h) => observer.observe(h));

        updateOffset();
        window.addEventListener('scroll', updateOffset, {passive: true});

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', updateOffset);
        };
    }, [padding]);

    return offset;
}
