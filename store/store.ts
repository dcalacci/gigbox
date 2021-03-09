import { createStore } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import { ExpoFileSystemStorage } from "./expoFileSystemStorage";

import rootReducer from ".";
const fsStorage = new ExpoFileSystemStorage();

const persistConfig = {
  key: "gigbox",
  storage: fsStorage,
};

// const reduxDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const persistedReducer = persistReducer(persistConfig, rootReducer);
const store = createStore(persistedReducer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

const persistor = persistStore(store);

export { store, persistor };
