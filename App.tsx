import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from 'react-native-fast-toast';

import useCachedResources from './hooks/useCachedResources';
import Constants from 'expo-constants';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Navigation from './navigation';
import { store, persistor } from './store/store';
import { QueryClientProvider, QueryClient } from 'react-query';

const queryClient = new QueryClient();

const { manifest } = Constants;

export default function App() {
    const isLoadingComplete = useCachedResources();

    if (!isLoadingComplete) {
        return null;
    } else {
        return (
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <ToastProvider placement="top" offset={50}>
                        <SafeAreaProvider>
                            <PersistGate loading={null} persistor={persistor}>
                                <Navigation />
                                <StatusBar />
                            </PersistGate>
                        </SafeAreaProvider>
                    </ToastProvider>
                </QueryClientProvider>
            </Provider>
        );
    }
}
