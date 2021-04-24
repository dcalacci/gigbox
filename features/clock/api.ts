import { gql } from 'graphql-request';
import { log, getClient, graphqlUri } from '../../utils';
import { store } from '../../store/store';
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

export const addScreenshotToShift = async ({
    screenshot,
    shiftId,
}: {
    screenshot: MediaLibrary.Asset;
    shiftId: string;
}) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($Shift: ID!, $File: Upload!, $DeviceURI: String!, $Timestamp: DateTime!) {
            addScreenshotToShift(
                shiftId: $Shift
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
    const info = await MediaLibrary.getAssetInfoAsync(screenshot);
    log.info('Adding screenshot to shift', shiftId);
    if (!info.localUri) {
        return false;
    } else {
        const fileBase64 = await FileSystem.readAsStringAsync(info.localUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        log.info('Screenshot encoded.', info);
        return client.request(query, {
            Shift: shiftId,
            File: fileBase64,
            DeviceURI: info.localUri,
            Timestamp: new Date(info.modificationTime),
        });
    }
};
