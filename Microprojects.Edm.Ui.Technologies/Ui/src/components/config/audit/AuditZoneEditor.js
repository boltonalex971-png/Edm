import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    TextField, 
    Button, 
    Autocomplete,
    Box,
    Typography
} from '@mui/material';

ZoneEditor.propTypes = {
    data: PropTypes.object,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onClose: PropTypes.func
}

export function ZoneEditor(props) {
    const [fields, setFields] = useState(props.data);
    
    const handleSave = (e) => {
        e.preventDefault();
        props.onSave(fields);
    };

    return (
        <Dialog open={true} onClose={props.onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: '16px' }}>Zone</DialogTitle>
            <DialogContent>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <TextField
                        label="Zone #"
                        value={fields.no || ''}
                        onChange={(e) => setFields({ ...fields, no: e.target.value })}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Active When"
                        value={fields.activeWhen || ''}
                        onChange={(e) => setFields({ ...fields, activeWhen: e.target.value })}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Offset (min)"
                        type="number"
                        value={fields.offset || 0}
                        onChange={(e) => setFields({ ...fields, offset: parseFloat(e.target.value) })}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Duration (min)"
                        type="number"
                        value={fields.duration || 0}
                        onChange={(e) => setFields({ ...fields, duration: parseFloat(e.target.value) })}
                        size="small"
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
                {fields.id !== 0 && (
                    <Button 
                        color="error" 
                        onClick={() => props.onDelete(fields)}
                        sx={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={props.onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    sx={{ textTransform: 'none', borderRadius: '4px' }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CriterionEditor.propTypes = {
    data: PropTypes.object,
    functions: PropTypes.array,
    params: PropTypes.array,
    onSave: PropTypes.func,
    onDelete: PropTypes.func,
    onClose: PropTypes.func
}

export function CriterionEditor(props) {
    const [fields, setFields] = useState(props.data);
    const selectedFunc = props.functions.filter(f => f.name === fields.function)[0];

    const handleSave = (e) => {
        e.preventDefault();
        props.onSave(fields);
    };

    return (
        <Dialog open={true} onClose={props.onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: '16px' }}>Criterion</DialogTitle>
            <DialogContent>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Autocomplete
                        options={props.params || []}
                        value={fields.param || null}
                        onChange={(event, newValue) => setFields({ ...fields, param: newValue })}
                        renderInput={(params) => <TextField {...params} label="Parameter" size="small" />}
                        fullWidth
                    />
                    <Autocomplete
                        options={props.functions.map(f => f.name) || []}
                        value={fields.function || null}
                        onChange={(event, newValue) => setFields({ ...fields, function: newValue })}
                        renderInput={(params) => <TextField {...params} label="Function" size="small" />}
                        fullWidth
                    />
                    
                    {selectedFunc && selectedFunc.args && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                                Arguments
                            </Typography>
                            {selectedFunc.args[0] && (
                                <TextField
                                    autoFocus
                                    label={`${selectedFunc.args[0].name} (${selectedFunc.args[0].type})`}
                                    value={fields.arg1 || ''}
                                    onChange={(e) => setFields({ ...fields, arg1: e.target.value })}
                                    size="small"
                                    fullWidth
                                />
                            )}
                            {selectedFunc.args[1] && (
                                <TextField
                                    label={`${selectedFunc.args[1].name} (${selectedFunc.args[1].type})`}
                                    value={fields.arg2 || ''}
                                    onChange={(e) => setFields({ ...fields, arg2: e.target.value })}
                                    size="small"
                                    fullWidth
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
                {fields.id !== 0 && (
                    <Button 
                        color="error" 
                        onClick={() => props.onDelete(fields)}
                        sx={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={props.onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    sx={{ textTransform: 'none', borderRadius: '4px' }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}


