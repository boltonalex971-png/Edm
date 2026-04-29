import { configureStore } from '@reduxjs/toolkit'
import userReducer, { userSlice } from './features/auth/userSlice'

const store = configureStore({
    reducer: {
        [userSlice.reducerPath]: userSlice.reducer,
    },
})

export default store
export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
