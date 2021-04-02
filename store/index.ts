import { combineReducers } from 'redux';
import AuthSlice from '../features/auth/authSlice';
import OtpSlice from '../features/auth/otpSlice';
import ShiftListSlice from '../features/shiftList/shiftListSlice';

const rootReducer = combineReducers({
    auth: AuthSlice,
    otp: OtpSlice,
    shiftList: ShiftListSlice,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
