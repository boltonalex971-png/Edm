import type React from 'react';
import { useEffect } from 'react';
import './SmartScroll.css';

export type SmartScrollProps = {
    children: React.ReactNode,
    offtop: number
}

export type SmartScrollContentProps = {
    children: React.ReactNode
}

export function SmartScroll({ children, offtop } : SmartScrollProps) {
    useEffect(() => {
        return smartScroll(offtop)
    });

    return (
        <div className="smart-scroll-container" style={{ display: 'flex' }}>
            {children}
        </div>
    )
}

export function SmartScrollContent({ children } : SmartScrollContentProps) {
    return (
        <div className="smart-scroll-content">
            {children}
        </div>
    )
}

let container: Element
let contents: Array<HTMLElement>

function smartScroll(marginTop : number) {

    const viewport = document.documentElement
    let currPos = viewport.scrollTop
    contents = Array.from(viewport.getElementsByClassName("smart-scroll-content")) as Array<HTMLElement>
    container = contents[0].closest(".smart-scroll-container") as Element
    if (contents.length === 0) return

    window.addEventListener("scroll", scrolled)

    function scrolled() {
        const windowScrollHeight = viewport.scrollTop
        const windowHeight = viewport.clientHeight

        for (const element of contents) {
            // calculate content scroll state
            let state: 'static' | 'small' | 'down' | 'up'
            let style: { position: string, top?: string }
            if (container.clientHeight <= element.clientHeight) {
                // no need to change the highest content style
                state = "static"
                style = { position: "static" }
            } else if (windowHeight > element.clientHeight) {
                state = "small"
                style = { position: "sticky", top: `${marginTop}px` }
            } else {
                if (currPos < windowScrollHeight) { // down 
                    state = "down"
                    style = { position: "sticky", top: `-${element.clientHeight - windowHeight + marginTop}px` }
                } else { // up or stay
                    state = "up"
                    style = { position: "sticky", top: `${marginTop}px` }
                }
            }

            // set state if new one
            if (state && element.getAttribute("state") !== state) {
                element.setAttribute("state", state)
                element.style.position = style.position
                if (style.top) {
                    element.style.top = style.top
                }
            }
        }

        currPos = windowScrollHeight;
    }

    return () => {
        window.removeEventListener("scroll", scrolled)
    }

}