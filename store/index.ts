import { combineReducers } from "redux";
import ClockSlice from '../features/clock/clockSlice'
import AuthSlice from '../features/auth/authSlice'
import OtpSlice from '../features/auth/otpSlice'

const rootReducer = combineReducers({
  clock: ClockSlice,
  auth: AuthSlice,
  otp: OtpSlice
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
