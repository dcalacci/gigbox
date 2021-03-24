import { combineReducers } from "redux";
import ClockSlice from '../features/clock/clockSlice'
import AuthSlice from '../features/auth/authSlice'
import OtpSlice from '../features/auth/otpSlice'

const rootReducer = combineReducers({
  auth: AuthSlice,
  otp: OtpSlice,
  clock: ClockSlice,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
