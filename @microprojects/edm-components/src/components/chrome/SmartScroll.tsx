import {DetailedHTMLProps, HTMLAttributes, useEffect, useRef} from 'react';
import './SmartScroll.css';

interface ISmartScrollProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    offsetTop: number
}

interface ISmartScrollContentProps  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>{
}

export function SmartScroll({ className, offsetTop, ...props } : ISmartScrollProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        return smartScroll(ref.current, offsetTop);
    }, [offsetTop])

    return (
        <div className={`smart-scroll-container ${className || ''}`} ref={ref} {...props} >
        </div>
    );
}

export function SmartScrollContent({ className, ...props }: ISmartScrollContentProps) {
    return (
        <div className={`smart-scroll-content ${className || ''}`} {...props} >
        </div>
    );
}


type ScrollState = "static" | "small" | "down" | "up";

interface StyleProps {
    position: string;
    top: string;
}

export function smartScroll(container: HTMLElement, marginTop: number) {
    const viewport = document.documentElement;
    let currPos = viewport.scrollTop;
    let rafId: number | null = null;
    let resizeTimeout: number | null = null;
    const contents = Array.from(container.getElementsByClassName("smart-scroll-content")) as HTMLElement[];

    if (contents.length === 0) {
        console.warn('No .smart-scroll-content elements found inside .smart-scroll-container');
        return () => {};
    }

    function updateScrollPositions() {
        const windowScrollHeight = viewport.scrollTop;
        const windowHeight = viewport.clientHeight;

        for (const element of contents) {
            // calculate content scroll state
            let state: ScrollState;
            let style: StyleProps;

            if (container.clientHeight <= element.clientHeight) {
                // no need to change the highest content style
                state = "static";
                style = { position: "static", top: "0px" };
            } else if (windowHeight > element.clientHeight) {
                state = "small";
                style = { position: "sticky", top: `${marginTop}px` };
            } else {
                if (currPos < windowScrollHeight) { // down
                    state = "down";
                    style = { position: "sticky", top: `-${element.clientHeight - windowHeight + marginTop}px` };
                } else { // up or stay
                    state = "up";
                    style = { position: "sticky", top: `${marginTop}px` };
                }
            }

            // set state if a new one, including marginTop to handle dynamic header changes
            const stateKey = `${state}_${marginTop}`;
            if (element.getAttribute("data-scroll-state") !== stateKey) {
                element.style.position = style.position;
                element.style.top = style.top;
                element.setAttribute("data-scroll-state", stateKey);
            }
        }

        currPos = windowScrollHeight;
    }

    function scrolled() {
        // Cancel any pending animation frame
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }

        // Use requestAnimationFrame for better performance
        rafId = requestAnimationFrame(updateScrollPositions);
    }

    // ResizeObserver with minimal debouncing to handle dynamic content height changes
    const resizeObserver = new ResizeObserver(() => {
        if (resizeTimeout !== null) {
            clearTimeout(resizeTimeout);
        }
        resizeTimeout = window.setTimeout(() => {
            updateScrollPositions();
        }, 16); // 1 frame at 60fps
    });

    // Observe container and all content elements
    resizeObserver.observe(container);
    contents.forEach(element => resizeObserver.observe(element));

    window.addEventListener("scroll", scrolled, { passive: true });

    // Initial calculation
    updateScrollPositions();

    // Cleanup function
    return () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }
        if (resizeTimeout !== null) {
            clearTimeout(resizeTimeout);
        }
        window.removeEventListener("scroll", scrolled);
        resizeObserver.disconnect();

        // Reset styles on cleanup to ensure fresh start on re-initialization
        contents.forEach(element => {
            element.style.position = "";
            element.style.top = "";
            element.removeAttribute("data-scroll-state");
        });
    }
}
