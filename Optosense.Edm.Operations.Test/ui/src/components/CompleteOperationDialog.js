import React, { useState } from "react";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";

export function CompleteOperationDialog() {
    const [visible, setVisible] = useState(false);
    const toggleDialog = () => {
        setVisible(!visible);
    };

    return (
        <>
            {visible && (
                <Dialog title={"Please confirm"} onClose={toggleDialog}>
                    <p style={{ margin: "25px", textAlign: "center" }}>Are you sure you want to continue?</p>
                    <DialogActionsBar>
                        <button className="k-button" onClick={toggleDialog}>
                            No
                        </button>
                        <button className="k-button" onClick={toggleDialog}>
                            Yes
                        </button>
                    </DialogActionsBar>
                </Dialog>
            )}
        </>
    );
}
