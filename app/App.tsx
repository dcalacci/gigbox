import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Constants from 'expo-constants';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import Navigation from './navigation';
import { store, persistor } from './store/store';
import { QueryClientProvider, QueryClient } from 'react-query';
import * as TaskManager from 'expo-task-manager';
import { LocationObject } from 'expo-location';
;
import { log } from './utils';
import { hasActiveShift, addLocationsToShift } from './tasks';
import { EnsureLoggedIn } from './features/EnsureLoggedIn';
import { RootSiblingParent } from 'react-native-root-siblings';
const queryClient = new QueryClient();

const { manifest } = Constants;

TaskManager.defineTask('gigbox.mileageTracker', async ({ data, error }) => {
    if (error) {
        log.error('problem defining mileage tracker task:', error.message);
        return;
    }
    const shiftResponse = await hasActiveShift();
    const locations = data.locations;
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
        return addLocationsToShift(shiftResponse.id, locs);
        //TODO: collect errors in adding locations, or save them to a cache
    }
});

export default function App() {
    return (
        <>
            <StatusBar style="dark" />
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <RootSiblingParent>
                        <SafeAreaProvider>
                            <EnsureLoggedIn>
                                <PersistGate loading={null} persistor={persistor}>
                                    <Navigation />
                                    <StatusBar />
                                </PersistGate>
                            </EnsureLoggedIn>
                        </SafeAreaProvider>
                    </RootSiblingParent>
                </QueryClientProvider>
            </Provider>
        </>
    );
}
