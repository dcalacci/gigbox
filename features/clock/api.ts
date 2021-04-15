import { request, gql } from 'graphql-request';
import { Image } from 'react-native';
import axios from 'axios';
import { Asset } from 'expo-media-library';
import { useToast } from 'react-native-fast-toast';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { log, getClient, graphqlUri } from '../../utils';
import { store } from '../../store/store';
import fetch from 'node-fetch';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
// import RNFS from 'react-native-file-system';

//TODO: get userId and JWT as part of authentication headers and include this authentication in the graphql endpoints

export const fetchActiveShift = () => {
    const client = getClient(store);
    const query = gql`
        query {
            getActiveShift {
                id
                active
                startTime
                locations {
                    id
                    geom
                    timestamp
                }
            }
        }
    `;
    return client.request(query);
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

export const addScreenshotToShift = async ({ screenshot, shiftId, jwt }) => {
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
    log.info('Screenshot info:', info);
    const fileBase64 = await FileSystem.readAsStringAsync(info.localUri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    log.info('Screenshot encoded.');

    // const base64 = await FileSystem.readAsStringAsync(screenshot, { encoding: 'base64' });
    // let filename = info.localUri.split('/').pop();
    // // Infer the type of the image
    // let match = /\.(\w+)$/.exec(filename);
    // let type = match ? `image/${match[1]}` : `image/png`;
    return client.request(query, {
        Shift: shiftId,
        File: fileBase64,
        DeviceURI: info.localUri,
        Timestamp: new Date(info.creationTime),
    });
};
