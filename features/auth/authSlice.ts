import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { OtpResponse, VerifyOtpResponse, getOtp, verifyOtp } from './api'

// ACTIONS
enum AuthActionTypes {
    RequestOtp = "auth/requestOtp",
    VerifyOtp = "auth/verifyOtp",
}

interface OtpErrors {
    status: string,
    message: string
}

interface AuthState {
    lastLoggedIn: number | null;
    jwt: string | null;
    expires: number | null;
    userId: string | null;
    tokenSent: boolean;
    errorMessage: string;
    authenticated: boolean
}

export const requestOtp = createAsyncThunk(
    "auth/requestOtp",
    async (phone: string, thunkApi: any): Promise<OtpResponse> => {
        const data = await getOtp(phone)
            if (data.status != 200) {
                return thunkApi.rejectWithValue(data)
            }
            return data;
        }
    );

interface VerifyOtpAction {
    phone: string
    otp: string
}

export const loginWithOtp = createAsyncThunk(
    "auth/loginWithOtp",
    async({phone, otp }: VerifyOtpAction, thunkApi: any) => {
        const response = await verifyOtp(phone, otp)
        if (response.status != 200) {
            return thunkApi.rejectWithValue(response)
        }
        return response
    }
)
const initialState: AuthState = {
    lastLoggedIn: null,
    jwt: null,
    expires: null,
    userId: null,
    tokenSent: false,
    errorMessage: "",
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
            .addCase(requestOtp.fulfilled, (state, action) => {
                console.log("OTP request fulfilled", action.payload)
                state.tokenSent = true
            })
            .addCase(requestOtp.rejected, (state, action: any) => {
                console.log("REJECTED", action)
            })
            .addCase(loginWithOtp.fulfilled, (state, action) => {
                console.log("OTP verification fulfilled", action.payload)
                state.jwt = action.payload.token
                state.authenticated = true
                state.userId = action.payload.user_id
            })
            .addCase(loginWithOtp.rejected, (state, action: any) => {
                console.log("OTP Verification REJECTED", action)
                state.errorMessage = action.payload.message
            })
    }
})

export const { reset } = authSlice.actions
export default authSlice.reducer