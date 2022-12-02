import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

SmartScroll.propTypes = {
    children: PropTypes.node.isRequired,
    offtop: PropTypes.number
}

SmartScrollContent.propTypes = {
    children: PropTypes.node.isRequired
}

export function SmartScroll({ children, offtop }) {
    useEffect(() => {
        return smartScroll(offtop);
    });

    return (
        <div className="smart-scroll-container row" style={{ display: 'flex', margin: 10 }}>
            {children}
        </div>
    );
}

export function SmartScrollContent({ children }) {
    return (
        <div className="smart-scroll-content">
            {children}
        </div>
    );
}

let container, contents;

function smartScroll(marginTop) {

    let viewport = document.documentElement,
        currPos = viewport.scrollTop;
    contents = Array.from(viewport.getElementsByClassName("smart-scroll-content"));
    container = contents[0].closest(".smart-scroll-container");
    if (contents.length === 0) return;

    window.addEventListener("scroll", scrolled);

    function scrolled() {
        const windowScrollHeight = viewport.scrollTop;
        const windowHeight = viewport.clientHeight;

        contents.forEach((element) => {
            // calculate content scroll state
            let state,
                style;
            if (container <= element.clientHeight) {
                // no need to change highest content style
                state = "static";
                style = { position: "static" };
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

            // set state if new one
            if (state && element.getAttribute("state") !== state) {
                for (let st in (style || {})) {
                    element.style[st] = style[st];
                }
                element.setAttribute("state", state);
            }
        });

        currPos = windowScrollHeight;
    }

    return () => {
        window.removeEventListener("scroll", scrolled);
    }

}