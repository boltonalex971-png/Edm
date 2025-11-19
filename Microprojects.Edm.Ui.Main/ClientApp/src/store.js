import { configureStore } from "@reduxjs/toolkit";
import userReducer from './slices/userSlice'
import newOperationReducer from "./slices/newOperationSlice";

export default configureStore({
    reducer: {
        user: userReducer,
        newOperation: newOperationReducer
    }
})