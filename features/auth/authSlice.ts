import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginWithOtp } from "./otpSlice"

interface AuthState {
    lastLoggedIn: number | null;
    jwt: string | null;
    userId: string | null;
    authenticated: boolean
}

const initialState: AuthState = {
    lastLoggedIn: null,
    jwt: null,
    userId: null,
    authenticated: false
}

//TODO: Split up OTP from general authentication state

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        reset: state => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginWithOtp.fulfilled, (state, action: any) => {
                if (action.payload.authenticated) {
                    state.jwt = action.payload.token
                    state.authenticated = true
                    state.userId = action.payload.user_id
                    state.lastLoggedIn = new Date().getTime()
                }
            })
            .addCase(loginWithOtp.rejected, (state, action: any) => {
                console.log("OTP Verification REJECTED", action)
            })
    }
})

export const { reset } = authSlice.actions
export default authSlice.reducer