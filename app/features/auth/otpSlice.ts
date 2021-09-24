import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { OtpResponse, getOtp, verifyOtp } from './api';

interface OtpState {
    tokenSent: boolean;
    errorMessage: string;
    isLoading: boolean;
    phone: string;
    tokenExpiresIn: number;
}

interface VerifyOtpAction {
    phone: string;
    otp: string;
}

export const requestOtp = createAsyncThunk(
    'auth/otp/requestOtp',
    async (phone: string, thunkApi: any): Promise<OtpResponse> => {
        const data = await getOtp(phone);
        console.log('Get OTP data: ', data);
        if (data.status != 200) {
            return thunkApi.rejectWithValue(data);
        }
        return data;
    }
);

export const loginWithOtp = createAsyncThunk(
    'auth/otp/loginWithOtp',
    async ({ phone, otp }: VerifyOtpAction, thunkApi: any) => {
        const response = await verifyOtp(phone, otp);
        if (response.status != 200) {
            return thunkApi.rejectWithValue(response);
        }
        return response;
    }
);

const initialState: OtpState = {
    tokenSent: false,
    isLoading: false,
    phone: '',
    errorMessage: '',
    tokenExpiresIn: 0,
};

const otpSlice = createSlice({
    name: 'auth/otp',
    initialState: initialState,
    reducers: {
        reset: (state) => initialState,
        clearErrorMessage(state) {
            state.errorMessage = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(requestOtp.fulfilled, (state, action) => {
                console.log('OTP request fulfilled', action.payload);
                state.tokenSent = true;
                state.phone = action.payload.phone;
            })
            .addCase(requestOtp.rejected, (state, action: any) => {
                console.log('Request failed:', action);
                if (action.payload) {
                    // error message from our API
                    state.errorMessage = action.payload.message;
                } else {
                    state.errorMessage =
                        "Couldn't send OTP code. Check your connection and try again.";
                }
            })
            .addCase(loginWithOtp.pending, (state, action) => {
                state.isLoading = true;
            })
            .addCase(loginWithOtp.fulfilled, (state, action) => {
                console.log('OTP verification fulfilled', action.payload);
                return { ...initialState, tokenSent: true };
            })
            .addCase(loginWithOtp.rejected, (state, action: any) => {
                console.log('OTP Verification REJECTED', action);
                state.errorMessage = action.payload.message;
            });
    },
});

export const { reset, clearErrorMessage } = otpSlice.actions;
export default otpSlice.reducer;

