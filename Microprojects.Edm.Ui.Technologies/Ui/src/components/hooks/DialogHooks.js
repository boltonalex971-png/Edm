import { 
    Dialog as MuiDialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    Button 
} from "@mui/material";
import React from "react";

export const useDialog = () => {
    const [props, setProps] = React.useState();
    const dialog = props ? <Dialog {...{ close: () => setProps(null), ...props }} /> : null;
    const alert = (p) => setProps({ role: dialogRoles.fault, ...p })
    const confirm = (p) => setProps({ role: dialogRoles.confirm, ...p })
    const warning = (p) => setProps({ role: dialogRoles.warning, ...p })
    return { dialog, alert, warning, confirm }
}

const dialogRoles = Object.freeze({
    confirm: 'Confirm',
    warning: 'Warning',
    fault: 'Error'
});

function Dialog(props) {
    if (!props) return null;
    
    const isConfirm = props.role === dialogRoles.confirm || props.role === dialogRoles.warning;
    
    const handleConfirm = () => {
        props.onConfirm && props.onConfirm();
        props.close();
    };

    return (
        <MuiDialog
            open={true}
            onClose={props.close}
            disableScrollLock
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 600 }}>
                {props.role}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {props.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                {isConfirm ? (
                    <>
                        <Button onClick={props.close} sx={{ textTransform: 'none' }}>Cancel</Button>
                        <Button onClick={handleConfirm} variant="contained" autoFocus sx={{ textTransform: 'none' }}>
                            Confirm
                        </Button>
                    </>
                ) : (
                    <Button onClick={props.close} variant="contained" autoFocus sx={{ textTransform: 'none' }}>
                        OK
                    </Button>
                )}
            </DialogActions>
        </MuiDialog>
    );
}

