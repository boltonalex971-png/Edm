import { configureStore } from "@reduxjs/toolkit";
import userReducer from './slices/userSlice'
import newOperationSlice from "./slices/newOperationSlice";

export default configureStore({
    reducer: {
        user: userReducer,
        newOperation: newOperationSlice
    }
})