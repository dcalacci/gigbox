import { combineReducers } from "redux";
import localStorage from "redux-persist/lib/storage";
import hardSet from "redux-persist/lib/stateReconciler/hardSet";
import { ClockReducer } from './clock/reducers'

const rootReducer = combineReducers({
  clock: ClockReducer
});

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer;
