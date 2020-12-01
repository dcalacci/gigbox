import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';

import { PersistGate } from 'redux-persist/integration/react'
import {store,persistor} from "./store/store"

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
          <PersistGate loading={null} persistor={persistor}>
        <Navigation colorScheme={colorScheme} />
        <StatusBar />
            </PersistGate>
      </SafeAreaProvider>
    );
  }
}
