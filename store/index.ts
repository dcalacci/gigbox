import { combineReducers } from "redux";
import ClockSlice from '../features/clock/clockSlice'

const rootReducer = combineReducers({
  clock: ClockSlice,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
