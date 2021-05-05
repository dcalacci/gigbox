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
import * as TaskManager from 'expo-task-manager'
import { LocationObject } from 'expo-task-manager'
import { hasActiveShift, addLocationsToShift, } from './tasks';
import { log } from './utils'

const queryClient = new QueryClient();

const { manifest } = Constants;

TaskManager.defineTask('gigbox.mileageTracker', async ({ data, error }) => {
    if (error) {
        log.error('problem defining mileage tracker task:', error.message);
        return;
    }
    const shiftResponse = await hasActiveShift();
    const locations = data.locations;
    //TODO: We no longer need to transform these into our own objects.
    // make this simpler and just pass native Expo LocationObjects
    if (shiftResponse.active) {
        let locs = locations.map((location: LocationObject) => {
            let obj = {
                point: {
                    coordinates: [location.coords.longitude, location.coords.latitude],
                },
                timestamp: location.timestamp,
                accuracy: location.coords.accuracy,
            };
            return obj;
        }) as Location[];
        //TODO: reduce the amount of data coming back from server to make response time better
        // i.e. get only latest location point, or just an 'ok'
        return addLocationsToShift(shiftResponse.id, locs)
        //TODO: collect errors in adding locations, or save them to a cache
    }
});

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
