import * as Loc from 'expo-location';
import {
    requestForegroundPermissionsAsync,
    requestBackgroundPermissionsAsync,
    getBackgroundPermissionsAsync,
    getForegroundPermissionsAsync,
} from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { grantLocationPermissions, denyLocationPermissions } from './features/auth/authSlice';
import { store } from './store/store';
import * as Permissions from 'expo-permissions';

import { request, gql } from 'graphql-request';
import { log, getClient } from './utils';
import { Alert } from 'react-native';

interface Location {
    point: {
        coordinates: [number, number];
    };
    timestamp: number;
    accuracy: number;
}

export const hasActiveShift = async () => {
    const client = getClient(store);
    const data = await client.request(
        gql`
            query {
                getActiveShift {
                    id
                    active
                }
            }
        `
    );

    // returns null if there's no active shift
    const shift = data.getActiveShift;
    return { active: shift != null && shift.active, id: shift?.id };
};

export const addLocationsToShift = async (shiftId: string, locations: Location[]) => {
    const client = getClient(store);
    const locs = locations.map((l) => {
        return {
            lat: l.point.coordinates[1],
            lng: l.point.coordinates[0],
            timestamp: l.timestamp,
            accuracy: l.accuracy,
        };
    });
    const variables = {
        ShiftId: shiftId,
        Locations: locs,
    };
    log.info('Adding locations to shift:', locs);
    const mutation = gql`
        mutation AddLocations($ShiftId: ID!, $Locations: [LocationInput]!) {
            addLocationsToShift(shiftId: $ShiftId, locations: $Locations) {
                location {
                    geom
                    timestamp
                }
                ok
            }
        }
    `;
    return await client.request(mutation, variables);
};

export const registerMileageTask = () => {
    TaskManager.isTaskRegisteredAsync('gigbox.mileageTracker').then((isRegistered) => {
        if (isRegistered) {
            log.debug('gigbox mileage task already registered.');
        } else {
            log.debug('gigbox mileage task not registered.');
        }
    });
};

export const hasNeededPermissions = async () => {
    const fgPermissionResponse = await getForegroundPermissionsAsync();
    const bgPermissionResponse = await getBackgroundPermissionsAsync();

    return fgPermissionResponse.status === 'granted' && bgPermissionResponse.status === 'granted';
};

export const getAllLocationPermissions = async () => {
    const fgPermissionResponse = await getForegroundPermissionsAsync();
    const bgPermissionResponse = await getBackgroundPermissionsAsync();

    return { fgPermissionResponse, bgPermissionResponse };
};

export const askPermissions = async () => {
    const fgResponse = await requestForegroundPermissionsAsync();
    const bgResponse = await requestBackgroundPermissionsAsync();

    return await hasNeededPermissions();
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
        accuracy: Loc.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 15,
        activityType: Loc.ActivityType.AutomotiveNavigation,
        deferredUpdatesDistance: 30,
        pausesUpdatesAutomatically: true,
    }).then(() => log.info('Location task started.'));
};

/**
 * Stops background location task
 */
export const stopGettingBackgroundLocation = () => {
    log.info('Stopping location updates...');
    Loc.stopLocationUpdatesAsync('gigbox.mileageTracker');
};
