import { createSlice } from '@reduxjs/toolkit'

export interface UserState {
    name: string,
    role: 'Guest' | 'Operator' | 'Technologist' | 'Admin',
    divisions: string[],
}

const initialState: UserState = { name: 'Guest', role: 'Guest', divisions: [] }

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            return { ...state, ...action.payload }
        },
        changeRole: (state, action) => {
            state.role = action.payload
        }
    }
})

export const { setUser, changeRole } = userSlice.actions

export default userSlice.reducer