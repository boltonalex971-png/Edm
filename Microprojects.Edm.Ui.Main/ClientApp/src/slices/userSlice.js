import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
    name: 'user',
    initialState: { user: { name: 'Guest', role: 'Guest' } },
    reducers: {
        setUser: (state, action) => {
            return action.payload
        },
        changeRole: (state, action) => {
            state.role = action.payload
        }
    }
})

export const { setUser, changeRole } = userSlice.actions

export default userSlice.reducer