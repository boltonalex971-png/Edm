import {
    Dialog as MuiDialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Box,
} from "@mui/material";
import React from "react";

// HANDOFF · v2 forms.html 04d.8 · two dialog flavors.
//   • default (confirm) — neutral question, primary accent commit
//   • destructive (warning) — red commit, named action verb
// Sized sm (380 px), title top-left, body in ink-2, actions bottom-right.
// Errors live in Toast (states/Toast.tsx), not here.

export const useDialog = () => {
    const [props, setProps] = React.useState();
    const close = () => setProps(null);
    const dialog = props ? <Dialog {...props} close={close} /> : null;

    const confirm = (p) => setProps({ destructive: false, ...p });
    const warning = (p) => setProps({ destructive: true, ...p });

    return { dialog, confirm, warning };
};

function Dialog({ destructive, title, message, actionLabel, onConfirm, close }) {
    const handleConfirm = () => {
        onConfirm && onConfirm();
        close();
    };

    const resolvedTitle = title || (destructive ? 'Confirm action' : 'Are you sure?');
    const resolvedAction = actionLabel || (destructive ? 'Confirm' : 'OK');

    return (
        <MuiDialog
            open={true}
            onClose={close}
            disableScrollLock
            PaperProps={{ sx: { width: 380, maxWidth: '90vw' } }}
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
        >
            <DialogTitle id="dialog-title" sx={{ color: destructive ? 'var(--sig-fault-deep)' : 'var(--ink-1)' }}>
                {resolvedTitle}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <DialogContentText id="dialog-description" sx={{ color: 'var(--ink-2)' }}>
                    <Box component="span">{message}</Box>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={close}>Cancel</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color={destructive ? 'error' : 'primary'}
                    autoFocus
                >
                    {resolvedAction}
                </Button>
            </DialogActions>
        </MuiDialog>
    );
}
