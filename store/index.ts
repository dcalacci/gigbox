import OnboardingSlice from '../features/history/OnboardingSlice';
import { combineReducers } from 'redux';
import AuthSlice from '../features/auth/authSlice';
import OtpSlice from '../features/auth/otpSlice';

const rootReducer = combineReducers({
    auth: AuthSlice,
    otp: OtpSlice,
    onboarding: OnboardingSlice
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
