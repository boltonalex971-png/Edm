import { createSlice } from '@reduxjs/toolkit'

export const newOperationSlice = createSlice({
    name: 'newOperation',
    initialState: { process: undefined, devices: {}, options: {}, parameters: undefined, profiles: undefined },
    reducers: {
        setDriverOptions: (state, action) => {
            state.options[action.payload.profileId] = action.payload.options
        },
        setParameters: (state, action) => {
            state.parameters = action.payload
        },
        setProcess: (state, action) => {
            state.process = action.payload
        },
        setDevice: (state, action) => {
            state.devices[action.payload.profileId] = action.payload
            //state.devices = { [action.payload.profileId]: action.payload }
        },
        setProfiles: (state, action) => {
            state.profiles = action.payload
        },
        clearProcess: (state) => {
            state.process = undefined
            clearDevices(state)
        },
        clearDevices: (state) => {
            state.devices = {}
        }
    }
})

export const { setDriverOptions, setParameters, setProcess, setDevice, setProfiles, clearProcess, clearDevices } = newOperationSlice.actions

export default newOperationSlice.reducer