import React, { useState } from "react";
import { ButtonGroup, Button } from "@progress/kendo-react-buttons";
import { Bootstrap } from "react-bootstrap-icons";
import { CompleteOperationDialog } from "./CompleteOperationDialog";

export const OperationInfo = () => {
    const [count, setCount] = useState(0);
    const complete = () => {
        alert("You are about to close the window");
    };
    return (
        <div style={{ width: "100%", textAlign: "center" }}>
            <h1>Test Operation</h1>
            <p className="bg-warning">
                Clicked <strong>{count}</strong> times
            </p>
            <p>You can perform the following actions:</p>
            <ButtonGroup>
                <Button onClick={() => setCount(count + 1)}>Increase count</Button>
                <Button onClick={() => setCount(count > 0 ? count - 1 : 0)}>Decrease count</Button>
                <Button onClick={() => setCount(0)}>Reset count</Button>
            </ButtonGroup>
            <p>After you finish press the button below to complete operation</p>
            <Button primary={true} onClick={complete}>
                <Bootstrap />
                &nbsp;Complete
            </Button>
            <CompleteOperationDialog />
        </div>
    );
};
