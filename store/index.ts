import { combineReducers } from 'redux';
import AuthSlice from '../features/auth/authSlice';
import OtpSlice from '../features/auth/otpSlice';

const rootReducer = combineReducers({
    auth: AuthSlice,
    otp: OtpSlice,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
