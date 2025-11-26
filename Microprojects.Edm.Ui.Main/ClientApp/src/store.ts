import { configureStore } from "@reduxjs/toolkit"
import userReducer from './slices/userSlice'
import newOperationReducer from "./slices/newOperationSlice"

export const store = configureStore({
    reducer: {
        user: userReducer,
        newOperation: newOperationReducer
    }
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
