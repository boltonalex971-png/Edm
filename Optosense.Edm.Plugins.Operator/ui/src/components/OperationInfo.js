import React from "react";
import { Monitor } from "./Monitor";

export const OperationInfo = (props) => {
    return (
        <div style={{ width: "100%" }}>
            <h1>Operator Workbench</h1>
            <p>
                Please follow the instructions appearing on the screen
            </p>
            <Monitor {...props} />
        </div >
    );
};
