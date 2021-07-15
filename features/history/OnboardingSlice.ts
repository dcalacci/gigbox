import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginWithOtp } from '../auth/otpSlice';
import { User } from '../../types';
import { State } from 'react-native-gesture-handler';


export interface OnboardingState {
    dismissedJobListHint: boolean
}

const initialState: OnboardingState = {
    dismissedJobListHint: false
}


const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        dismissJobListHint: (state) => {
            state.dismissedJobListHint = true;
        }
    }
})

export const {
    dismissJobListHint
} = onboardingSlice.actions;

export default onboardingSlice.reducer;