import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

export interface UserState {
    name: string
    role: string
    roles?: string[]
    divisions?: string[]
    groups?: string[]
}

const initialState: UserState = { name: 'Guest', role: 'Guest' }

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserState | null>) => {
            if (action.payload) {
                return { ...state, ...action.payload }
            }
            return initialState
        },
        changeRole: (state, action: PayloadAction<string>) => {
            state.role = action.payload
        },
    },
})

export const { setUser, changeRole } = userSlice.actions

export default userSlice.reducer
