import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    Typography, 
    Box 
} from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import React, { useState } from "react";
import { Countdown } from "@edm/components/operation/Countdown.tsx";

interface IOperatorActionProps {
    step: {
        parameters: string
        order: number
        description: string
        responseTime: number
    },
    onSubmit: (values: any) => void
}

export const OperatorAction = ({ step, onSubmit }: IOperatorActionProps) => {
    const [current] = useState<any>({ 
        params: step.parameters ? JSON.parse(step.parameters) : [], 
        ...step 
    });
    const [values, setValues] = useState<any>({});

    const handleChange = (name: string, value: string) => {
        setValues((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSubmit({ values });
    };

    return (
        <Dialog open={true} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'center' }}>
                <Countdown start={current.responseTime} />
            </DialogTitle>
            <DialogContent>
                <Box sx={{ py: 1 }}>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        {current.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {current.params && current.params.map((p: string) => (
                            <TextField
                                key={p}
                                fullWidth
                                label={p}
                                type="number"
                                variant="outlined"
                                size="small"
                                value={values[p] || ''}
                                onChange={(e) => handleChange(p, e.target.value)}
                            />
                        ))}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={handleSubmit}
                    fullWidth
                    sx={{ textTransform: 'none', py: 1 }}
                >
                    Completed
                </Button>
            </DialogActions>
        </Dialog>
    );
}
