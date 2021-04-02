import * as Loc from 'expo-location';
import { LocationObject } from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { grantLocationPermissions, denyLocationPermissions } from './features/auth/authSlice';
import { store } from './store/store';
import * as Permissions from 'expo-permissions';

import { request, gql } from 'graphql-request';
import { graphqlUri } from './utils';

interface Location {
    lat: number;
    lng: number;
    timestamp: number;
}

export const hasActiveShift = async () => {
    const userId = store.getState().auth.userId;
    const data = await request(
        graphqlUri,
        gql`query {
                getActiveShift(userId: "${userId}") {
                    id
                    active
                }
            }`
    );

    // returns null if there's no active shift
    const shift = data.getActiveShift;
    return { active: shift != null && shift.active, id: shift?.id };
};

export const addLocationsToShift = async (shiftId: string, locations: Location[]) => {
    const locs = locations.map((l) => {
        return {
            lat: l.point.coordinates[1],
            lng: l.point.coordinates[0],
            timestamp: l.timestamp,
        };
    });
    const variables = {
        ShiftId: shiftId,
        Locations: locs,
    };
    const mutation = `mutation AddLocations($ShiftId: ID!, $Locations: [LocationInput]!) {
        addLocationsToShift(shiftId: $ShiftId, locations: $Locations) { shift { id, locations { geom, timestamp }} }}`;
    return await request(graphqlUri, mutation, variables);
};

//TODO: #6 occasionally tasks show up as undefined, or as being not registered on app reload.
// not sure why this is.
export const registerMileageTask = () => {
    TaskManager.isTaskRegisteredAsync('gigbox.mileageTracker').then((isRegistered) => {
        if (isRegistered) {
            console.log('gigbox mileage task already registered.');
        } else {
            TaskManager.defineTask('gigbox.mileageTracker', async ({ data, error }) => {
                if (error) {
                    console.log('error message:', error.message);
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
                    console.log('dispatching save locations, ...', locs);
                    const data = await addLocationsToShift(shiftResponse.id, locs);
                    console.log('dispatch result:', data);
                    // store.dispatch(saveLocations(locs));
                }
            });
        }
    });
};

const askPermissions = async () => {
    const state = store.getState();
    const { status, granted } = await Permissions.askAsync(Permissions.LOCATION);
    if (status === 'granted') {
        store.dispatch(grantLocationPermissions());
    } else {
        store.dispatch(denyLocationPermissions());
    }
};

/**
 * Creates a new background location task using Expo's `startLocationUpdatesAsync`.
 *
 * The task is titled "gigbox.mileageTracker", uses Loc.Accuracy.Balanced, and
 * includes a foreground notification service.
 */
export const startGettingBackgroundLocation = async () => {
    await askPermissions();
    Loc.startLocationUpdatesAsync('gigbox.mileageTracker', {
        accuracy: Loc.Accuracy.Balanced,
        timeInterval: 10000,
        foregroundService: {
            notificationTitle: 'Gigbox is tracking your mileage',
            notificationBody:
                'MIT Gigbox is using your location to track your mileage and work shifts.',
            notificationColor: '#ffffff',
        },
        activityType: Loc.ActivityType.AutomotiveNavigation,
    }).then(() => console.log('Location task registered.'));
};

/**
 * Stops background location task
 */
export const stopGettingBackgroundLocation = () => {
    console.log('Stopping location updates...');
    Loc.stopLocationUpdatesAsync('gigbox.mileageTracker');
};
