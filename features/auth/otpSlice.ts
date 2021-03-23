import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { OtpResponse, getOtp, verifyOtp } from './api'


interface OtpState {
    tokenSent: boolean
    errorMessage: string
    tokenExpiresIn: number
}

interface OtpError {
    status: number
    message: string
}

interface VerifyOtpAction {
    phone: string
    otp: string
}

export const requestOtp = createAsyncThunk(
    "auth/otp/requestOtp",
    async (phone: string, thunkApi: any): Promise<OtpResponse> => {
        const data = await getOtp(phone)
        if (data.status != 200) {
            return thunkApi.rejectWithValue(data)
        }
        return data;
    }
);

export const loginWithOtp = createAsyncThunk(
    "auth/otp/loginWithOtp",
    async ({ phone, otp }: VerifyOtpAction, thunkApi: any) => {
        const response = await verifyOtp(phone, otp)
        if (response.status != 200) {
            return thunkApi.rejectWithValue(response)
        }
        return response
    }
)

const initialState: OtpState = {
    tokenSent: false,
    errorMessage: "",
    tokenExpiresIn: 0

}

const otpSlice = createSlice({
    name: 'auth/otp',
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
                state.errorMessage = action.payload.message
            })
            .addCase(loginWithOtp.fulfilled, (state, action) => {
                console.log("OTP verification fulfilled", action.payload)
                return initialState
            })
            .addCase(loginWithOtp.rejected, (state, action: any) => {
                console.log("OTP Verification REJECTED", action)
                state.errorMessage = action.payload.message
            })
    }
})

export const { reset } = otpSlice.actions
export default otpSlice.reducer