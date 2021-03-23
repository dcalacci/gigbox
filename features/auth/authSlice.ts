import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { OtpResponse, VerifyOtpResponse, getOtp, verifyOtp } from './api'

// ACTIONS
enum AuthActionTypes {
    RequestOtp = "auth/requestOtp",
    VerifyOtp = "auth/verifyOtp",
}

interface AuthState {
    lastLoggedIn: number | null;
    jwt: String | null;
    expires: number | null;
    userId: string | null;
    tokenSent: boolean;
}

export const requestOtp = createAsyncThunk(
    "auth/requestOtp",
    async (phone: string, thunkAPI): Promise<OtpResponse> => {
        const data = await getOtp(phone)
        if (data.status != 200) {
            thunkAPI.rejectWithValue(data.message)
        }
        return data;
    }
);

interface VerifyOtpAction {
    phone: string
    otp: string
}
export const loginWithOtp = createAsyncThunk(
    'auth/loginWithotp',
    async ({ phone, otp }: VerifyOtpAction, thunkAPI): Promise<VerifyOtpResponse> => {
        const data = await verifyOtp(phone, otp)
        if (data.status != 200) {
            thunkAPI.rejectWithValue(data.message)
        }

        return data;
    }
)

const initialState: AuthState = {
    lastLoggedIn: null,
    jwt: null,
    expires: null,
    userId: null,
    tokenSent: false
}

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
            .addCase(requestOtp.rejected, (state, action) => {
                console.log("REJECTED", action)
            })
    }
})

export const { reset } = authSlice.actions
export default authSlice.reducer