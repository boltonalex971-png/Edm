import { createSlice } from '@reduxjs/toolkit'

const initialState = { process: undefined, workbench: undefined, devices: {}, options: {}, parameters: undefined, profiles: undefined }

export const newOperationSlice = createSlice({
    name: 'newOperation',
    initialState,
    reducers: {
        reset: () => initialState,
        setDriverOptions: (state, action) => {
            state.options[action.payload.profileId] = action.payload.options
        },
        setParameters: (state, action) => {
            state.parameters = action.payload
        },
        setProcess: (state, action) => {
            state.process = action.payload
        },
        setWorkbench: (state, action) => {
            state.workbench = action.payload
        },
        setDevice: (state, action) => {
            state.devices[action.payload.profileId] = action.payload
        },
        setProfiles: (state, action) => {
            state.profiles = action.payload
        },
        clearProcess: (state) => {
            state.process = undefined
            state.profiles = undefined
            state.workbench = undefined
            state.devices = {}
        },
        clearDevices: (state) => {
            state.devices = {}
        },
        clearWorkbench: (state) => {
            state.workbench = undefined
        }
    }
})

export default newOperationSlice.reducer

export const {
    reset,
    setDriverOptions,
    setParameters,
    setProcess,
    setWorkbench,
    setDevice,
    setProfiles,
    clearProcess,
    clearDevices,
    clearWorkbench
} = newOperationSlice.actions

