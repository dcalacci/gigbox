import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-fast-toast'

import useCachedResources from './hooks/useCachedResources';
import Navigation from './navigation';
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from "./store/store"

export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <Provider store={store}>
        <ToastProvider placement="top" offset={50}>
          <SafeAreaProvider>
            <PersistGate loading={null} persistor={persistor}>
              <Navigation />
              <StatusBar />
            </PersistGate>
          </SafeAreaProvider>
        </ToastProvider>
      </Provider>
    );
  }
}
