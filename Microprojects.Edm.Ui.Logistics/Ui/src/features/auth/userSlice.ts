import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from "../../store"

interface UserState {
    user: {
        name: string,
        role: string
    }
}

const initialState: UserState = {
    user: {
        name: 'Guest',
        role: 'Guest'
    }
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // setUser: (state: RootState, action: PayloadAction<UserState>) => {
        //     state.user = action.payload
        // }
    }
})

//export const {setUser} = userSlice.actions
export const selectUser = (state: UserState) => state.user 
export default userSlice.reducer