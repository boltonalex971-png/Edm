import {Popover} from "@mui/material";
import {DialogActionsBar} from "@progress/kendo-react-dialogs";
import {Button} from "@progress/kendo-react-buttons";
import React from "react";

export const useDialog = () => {
    const [props, setProps] = React.useState();
    const dialog = Dialog(props && {close: setProps, ...props})
    const alert = (p) => setProps({role: dialogRoles.fault,...p})
    const confirm = (p) => setProps({role: dialogRoles.confirm,...p})
    const warning = (p) => setProps({role: dialogRoles.warning,...p})
    return {dialog, alert, warning, confirm}
}

const dialogRoles = Object.freeze({
    confirm: 'Confirm',
    warning: 'Warning',
    fault: 'Error'
});

function Dialog(props) {
    if (!props) return null;
    const color =
        props.role === dialogRoles.fault ? 'bg-danger text-light' :
            props.role === dialogRoles.warning ? 'bg-warning text-dark' : 'bg-info text-dark'
    return (
        <Popover
            open={true}
            anchorEl={props.target}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            onClose={() => props.close()}
        >
            <p style={{padding: '2rem', textAlign: 'center'}} className={color}>
                {props.message}
            </p>
            <DialogActionsBar layout={'center'}>
                <Button
                    className="k-button"
                    onClick={() => {
                        props.onConfirm && props.onConfirm()
                        props.close()
                    }}
                >
                    <span style={{paddingInline: '2rem'}}>OK</span>
                </Button>
                {props.onConfirm &&
                    <Button className="k-button" onClick={() => props.close()}>
                        <span style={{paddingInline: '2rem'}}>CANCEL</span>
                    </Button>
                }
            </DialogActionsBar>
        </Popover>
    );
}
