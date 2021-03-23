import { combineReducers } from "redux";
import ClockSlice from '../features/clock/clockSlice'
import AuthSlice from '../features/auth/authSlice'

const rootReducer = combineReducers({
  clock: ClockSlice,
  auth: AuthSlice
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
