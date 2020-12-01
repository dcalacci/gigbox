import { combineReducers } from "redux";
import localStorage from "redux-persist/lib/storage";
import hardSet from "redux-persist/lib/stateReconciler/hardSet";
import { persistStore, persistReducer } from "redux-persist";

function consentReducer(state: object, action: any) {
  if (typeof state === "undefined" || state === {}) {
    return {
      currentScreen: 0,
      consentGiven: false,
    };
  }

  switch (action.type) {
    case "NEXT_SCREEN":
      return {
        ...state,
        currentScreen: state.currentScreen + 1,
      };
    case "PREVIOUS_SCREEN":
      return {
        ...state,
        currentScreen: Math.max(state.currentScreen - 1, 0),
      };
    case "CONSENT_FINISHED":
      return {
        ...state,
        consentGiven: true,
      };
    case "CURRENT_SCREEN_CHANGE":
      return {
        ...state,
        currentScreen: action.position,
      };
    case "RESET_CONSENT":
      return {
        ...state,
        consentGiven: false,
        currentScreen: 0,
      };
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  consent: consentReducer,
});

export default rootReducer;
