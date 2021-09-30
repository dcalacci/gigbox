import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginWithOtp } from '../auth/otpSlice';
import { User } from '../../types';
import { State } from 'react-native-gesture-handler';

export interface OnboardingState {
    dismissedJobListHint: boolean;
    dismissedCombineHint: boolean;
    dismissedClockInHint: boolean;
    dismissedIntroHint: boolean;
    onboardingHintIndex: number;
}

const initialState: OnboardingState = {
    dismissedJobListHint: false,
    dismissedCombineHint: false,
    dismissedClockInHint: false,
    dismissedIntroHint: false,
    onboardingHintIndex: 0,
};

const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        dismissJobListHint: (state) => {
            state.dismissedJobListHint = true;
        },
        dismissCombineHint: (state) => {
            state.dismissedJobListHint = true;
        },
        dismissClockInHint: (state) => {
            state.dismissedClockInHint = true;
        },
        dismissIntroHint: (state) => {
            state.dismissedClockInHint = true;
        },
        incrementHintIndex: (state) => {
            state.onboardingHintIndex = state.onboardingHintIndex ? state.onboardingHintIndex + 1 : 1
        },
    },
});

export const {
    dismissJobListHint,
    dismissCombineHint,
    dismissClockInHint,
    dismissIntroHint,
    incrementHintIndex,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
