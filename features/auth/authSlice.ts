import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginWithOtp } from './otpSlice';
import { User } from '../../types'

export interface AuthState {
    lastLoggedIn: number | null;
    jwt: string | null;
    userId: string | null;
    authenticated: boolean;
    isLoading: boolean;
    permissions: {
        location: boolean;
        notification: boolean;
    };
    user: User | null
}

const initialState: AuthState = {
    lastLoggedIn: null,
    jwt: null,
    userId: null,
    authenticated: false,
    isLoading: false,
    permissions: {
        location: false,
        notification: false,
    },
    user: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        reset: (state) => initialState,
        setUser: (state, action) =>  {
            state.user = action.payload
        },
        grantLocationPermissions(state) {
            state.permissions.location = true;
        },
        denyLocationPermissions(state) {
            state.permissions.location = false;
        },
        setLoggedIn(state, action) {
            state.authenticated = action.payload.authenticated
            state.userId = action.payload.user_id ? action.payload.user_id : state.userId
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginWithOtp.fulfilled, (state, action: any) => {
                if (action.payload.authenticated) {
                    state.jwt = action.payload.token;
                    state.authenticated = true;
                    state.userId = action.payload.user_id;
                    state.isLoading = false;
                    state.lastLoggedIn = new Date().getTime();
                }
            })
            .addCase(loginWithOtp.pending, (state, action) => {
                state.isLoading = true;
            })
            .addCase(loginWithOtp.rejected, (state, action: any) => {
                console.log('OTP Verification REJECTED', action);
                state.isLoading = false;
            });
    },
});

export const { reset, setUser, grantLocationPermissions, denyLocationPermissions, setLoggedIn} = authSlice.actions;
export default authSlice.reducer;
