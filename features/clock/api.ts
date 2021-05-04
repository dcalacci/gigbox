import { gql } from 'graphql-request';
import { log, getClient, graphqlUri } from '../../utils';
import { store } from '../../store/store';
import { LatLng } from 'react-native-maps';
import { LocationObject } from 'expo-location';
import * as Location from 'expo-location';
import { LocationInput, Employers } from '../../types';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export const fetchActiveShift = async () => {
    const client = getClient(store);
    const query = gql`
        query {
            getActiveShift {
                id
                active
                startTime
                roadSnappedMiles
                snappedGeometry
                employers
                jobs {
                    id
                    startTime
                    endTime
                    startLocation
                    mileage
                    estimatedMileage
                    totalPay
                    tip
                    snappedGeometry
                    employer
                }
            }
        }
    `;
    const data = await client.request(query);
    if (data.getActiveShift == null) {
        return {
            active: false,
            id: '',
            roadSnappedMiles: 0,
            startTime: new Date(),
            snappedGeometry: '',
            jobs: []
        };
    } else {
        return data.getActiveShift;
    }
};

export const endShift = (shiftId: string) => {
    const client = getClient(store);
    const query = gql`mutation {
                endShift(shiftId: "${shiftId}") {
                    shift {
                        id
                        endTime
                        active
                    }
    }
            }`;

    return client.request(query);
};

export const createShift = () => {
    const client = getClient(store);

    const query = gql`
        mutation {
            createShift(active: true) {
                shift {
                    id
                    startTime
                    active
                }
            }
        }
    `;
    log.info('Submitted create shift query...');

    return client.request(query);
};

export const setShiftEmployers = ({
    shiftId,
    employers,
}: {
    shiftId: string;
    employers: Employers[];
}) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($shiftId: ID!, $employers: [EmployerNames]!) {
            setShiftEmployers(shiftId: $shiftId, employers: $employers) {
                shift {
                    employers
                }
            }
        }
    `;
    return client.request(query, {
        shiftId,
        employers,
    });
};

export const addScreenshotToShift = async ({
    screenshotLocalUri,
    modificationTime,
    shiftId,
    jobId = undefined,
}: {
    screenshotLocalUri: string | undefined;
    modificationTime: number;
    shiftId: string;
    jobId: string | undefined;
}) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation(
            $Shift: ID!
            $Job: ID
            $File: Upload!
            $DeviceURI: String!
            $Timestamp: DateTime!
        ) {
            addScreenshotToShift(
                shiftId: $Shift
                jobId: $Job
                asset: $File
                deviceUri: $DeviceURI
                timestamp: $Timestamp
            ) {
                data
                screenshot {
                    shiftId
                    onDeviceUri
                    imgFilename
                    timestamp
                    userId
                    employer
                }
            }
        }
    `;

    // const assetSource = Image.resolveAssetSource(screenshot);
    // const info = await MediaLibrary.getAssetInfoAsync(screenshot);
    log.info('Adding screenshot to shift', shiftId, screenshotLocalUri);
    log.info('modification Time: ', modificationTime);
    if (!screenshotLocalUri) {
        return false;
    } else {
        const fileBase64 = await FileSystem.readAsStringAsync(screenshotLocalUri, {
            // encoding: FileSystem.EncodingType.UTF8,
            encoding: FileSystem.EncodingType.Base64,
        });
        log.info('Screenshot encoded.', screenshotLocalUri);
        return client.request(query, {
            Shift: shiftId,
            Job: jobId,
            File: fileBase64,
            DeviceURI: screenshotLocalUri,
            Timestamp: modificationTime ? new Date(modificationTime) : new Date(),
        });
    }
};

export const createJob = async ({ shiftId, employer }: { shiftId: string; employer: string }) => {
    const client = getClient(store);

    const location: LocationObject | null = await Location.getLastKnownPositionAsync({
        maxAge: 5000,
    });

    if (location == null) {
        throw new Error("Couldn't retrieve location!");
    }

    const startLocation: LocationInput = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy,
    };
    console.log('got last known position:', location);

    const variables = {
        shiftId,
        employer,
        startLocation: startLocation,
    };

    const mutation = gql`
        mutation mutation($shiftId: ID!, $startLocation: LocationInput!, $employer: String!) {
            createJob(shiftId: $shiftId, startLocation: $startLocation, employer: $employer) {
                job {
                    id
                    startLocation
                    employer
                    startTime
                }
                ok
            }
        }
    `;
    return await client.request(mutation, variables);
};

export const endJob = async ({ jobId }: { jobId: string }) => {
    const client = getClient(store);

    const mutation = gql`
        mutation mutation($jobId: ID!, $endLocation: LocationInput!) {
            endJob(jobId: $jobId, endLocation: $endLocation) {
                job {
                    id
                    startLocation
                    endLocation
                    employer
                    startTime
                    endTime
                }
                ok
            }
        }
    `;
    const location: LocationObject | null = await Location.getLastKnownPositionAsync({
        maxAge: 5000,
    });

    if (location == null) {
        throw new Error("Couldn't retrieve location!");
    }

    const endLocation: LocationInput = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy,
    };

    const variables = {
        jobId,
        endLocation,
    };
    return await client.request(mutation, variables);
};

export const getLatestJob = () => {
    const client = getClient(store);
    const query = gql`
        query FetchJobs($first: Int) {
            allJobs(first: $first, sort: START_TIME_DESC) {
                edges {
                    node {
                        id
                        startTime
                        endTime
                        screenshots {
                            onDeviceUri
                            id
                            imgFilename
                            employer
                            timestamp
                        }
                    }
                }
            }
        }
    `;
    const sort = 'startTime_asc';
    const variables = {
        first: 1,
    };
    return client.request(query, variables);
};
