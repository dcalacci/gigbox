import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginWithOtp } from './otpSlice';
import { User } from '../../types';
import { State } from 'react-native-gesture-handler';

export interface AuthState {
    lastLoggedIn: number | null;
    onboarded: boolean;
    jwt: string | null;
    userId: string | null;
    authenticated: boolean;
    isLoading: boolean;
    permissions: {
        location: boolean;
        notification: boolean;
    };
    user: User | null;
}

const initialState: AuthState = {
    onboarded: false,
    lastLoggedIn: null,
    jwt: null,
    userId: null,
    authenticated: false,
    isLoading: false,
    permissions: {
        location: false,
        notification: false,
    },
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState: initialState,
    reducers: {
        reset: (state) => initialState,
        setOnboarded: (state, action) => {
            state.onboarded = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        grantLocationPermissions(state) {
            state.permissions.location = true;
        },
        denyLocationPermissions(state) {
            state.permissions.location = false;
        },
        setLoggedIn(state, action) {
            console.log('Setting authenticated:', action.payload);
            state.authenticated =
                action.payload.authenticated != null
                    ? action.payload.authenticated
                    : state.authenticated;

            state.user = action.payload.user ? action.payload.user : state.user;
            state.userId = action.payload.user_id ? action.payload.user_id : state.userId;
        },
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

export const {
    reset,
    setOnboarded,
    setUser,
    grantLocationPermissions,
    denyLocationPermissions,
    setLoggedIn,
} = authSlice.actions;
export default authSlice.reducer;
