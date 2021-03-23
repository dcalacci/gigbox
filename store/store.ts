import { createStore } from "redux";
import { configureStore, getDefaultMiddleware} from "@reduxjs/toolkit";
// import logger from 'redux-logger'
// import thunk from 'redux-thunk'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import { ExpoFileSystemStorage } from "./expoFileSystemStorage";

import rootReducer from ".";
const fsStorage = new ExpoFileSystemStorage();

const persistConfig = {
  key: "gigbox",
  storage: fsStorage,
  blacklist: ['otp']
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    // ignore persist actions, which serialize functions. @reduxjs/toolkit throws a warning when
    // you serialize non-basic types
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    }
  }),
});

const persistor = persistStore(store,
  );

export { store, persistor };
