import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginWithOtp } from '../auth/otpSlice';
import { User } from '../../types';
import { State } from 'react-native-gesture-handler';


export interface OnboardingState {
    dismissedJobListHint: boolean
    dismissedCombineHint: boolean
}

const initialState: OnboardingState = {
    dismissedJobListHint: false,
    dismissedCombineHint: false
}


const onboardingSlice = createSlice({
    name: 'onboarding',
    initialState,
    reducers: {
        dismissJobListHint: (state) => {
            state.dismissedJobListHint = true;
        },
        dismissCombineHint: (state) => {
            state.dismissedJobListHint = true;
        }
    }
})

export const {
    dismissJobListHint,
    dismissCombineHint
} = onboardingSlice.actions;

export default onboardingSlice.reducer;