import { gql } from 'graphql-request';
import { log, getClient, graphqlUri } from '../../utils';
import { store } from '../../store/store';
import { LocationObject } from 'expo-location';
import * as Location from 'expo-location';
import { LocationInput, Employers } from '../../types';
import * as FileSystem from 'expo-file-system';
import { useQuery } from 'react-query';
import moment from 'moment';

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
                    edges {
                        node {
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
            jobs: [],
        };
    } else {
        return data.getActiveShift;
    }
};

export const useNumTrackedShifts = () => {
    return useQuery(
        ['trackedShifts'],
        () => {
            const client = getClient(store);
            const todayString = moment().format();
            const query = gql`query {
            allShifts(filters: {startTimeGte: "${todayString}"}) {
                edges {
                    node { 
                        id
                    }
                }
            }
        }
        `;
            return client.request(query);
        },
        {
            select: (d) => d.allShifts.edges.length,
        }
    );
};

export const updateShiftEndTime = ({ shiftId, endTime }: { shiftId: string; endTime: Date }) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($shiftId: ID!, $endTime: DateTime!) {
            updateShiftEndTime(shiftId: $shiftId, endTime: $endTime) {
                shift {
                    id
                    endTime
                    active
                    startTime
                }
            }
        }
    `;
    return client.request(query, { shiftId, endTime });
};

export const updateShiftStartTime = ({
    shiftId,
    startTime,
}: {
    shiftId: string;
    startTime: Date;
}) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($shiftId: ID!, $startTime: DateTime!) {
            updateShiftStartTime(shiftId: $shiftId, startTime: $startTime) {
                shift {
                    id
                    endTime
                    active
                    startTime
                }
            }
        }
    `;
    return client.request(query, { shiftId, startTime });
};

export const endShift = (shiftId: string) => {
    const client = getClient(store);
    const query = gql`mutation {
                endShift(shiftId: "${shiftId}") {
                    shift {
                        id
                        endTime
                        active
                        startTime
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
    objectId,
}: {
    screenshotLocalUri: string | undefined;
    modificationTime: number;
    objectId: string;
}) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation(
            $ObjectId: ID!
            $File: Upload!
            $DeviceURI: String!
            $Timestamp: DateTime!
        ) {
            addScreenshotToShift(
                objectId: $ObjectId
                asset: $File
                deviceUri: $DeviceURI
                timestamp: $Timestamp
            ) {
                data
                screenshot {
                    id
                    jobId
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
    log.info('Adding screenshot to shift', objectId, screenshotLocalUri);
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
            ObjectId: objectId,
            File: fileBase64,
            DeviceURI: screenshotLocalUri,
            Timestamp: modificationTime ? new Date(modificationTime) : new Date(),
        });
    }
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
