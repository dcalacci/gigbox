import moment, { Moment } from 'moment';
import Constants from 'expo-constants';
import { GraphQLClient } from 'graphql-request';
/**
 *
 * @param startTimestamp A timestamp (number) to calculate elapsed time from.
 * @return {[string]} Hours and minutes since startTimestamp, formatted as "0h 0m"
 */
export const formatElapsedTime = (startTimestamp: number | Date | null | Moment): string => {
    if (startTimestamp === null) {
        return '0h 0m 0s';
    } else {
        const st = moment.utc(startTimestamp);
        const hdiff = moment().diff(st, 'hours');
        const mdiff = moment().diff(st, 'minutes') - hdiff * 60;
        const sdiff = moment().diff(st, 'seconds') - moment().diff(st, 'minutes') * 60;
        if (mdiff >= 1) {
            return `${hdiff}h ${mdiff}m`;
        } else {
            return `${hdiff}h ${mdiff}m ${sdiff}s`;
        }
    }
};

const { manifest } = Constants;

const getApiUrl = () => {
    if (!Constants.manifest.extra) {
        return process.env.DEV_API_URL;
    }
    const rc = Constants.manifest.releaseChannel;
    if (rc === 'production') {
        return manifest.extra.prodApiUrl;
    } else {
        return manifest.extra.devApiUrl;
    }
};

export const uri = getApiUrl();
export const graphqlUri = `${uri}/graphql`;
console.log(`API URI: ${uri}`);

export function getClient(store): GraphQLClient {
    let client = new GraphQLClient(graphqlUri);
    client.setHeader('authorization', store.getState().auth.jwt);
    return client;
}

/**
 * A shim function to encode URL search parameters, because the URLSearchParams
 * functionality in node-fetch doesn't work on React Native.
 * see https://stackoverflow.com/questions/37230555/get-with-query-string-with-fetch-in-react-native
 * @param obj Object to translate into URL parameters
 * @returns A URL-encoded string with given params
 */
function objToQueryString(obj: Object) {
    const keyValuePairs = [];
    for (let i = 0; i < Object.keys(obj).length; i += 1) {
        keyValuePairs.push(
            `${encodeURIComponent(Object.keys(obj)[i])}=${encodeURIComponent(
                Object.values(obj)[i]
            )}`
        );
    }
    return keyValuePairs.join('&');
}

export function fetchWithQueryParams(
    uri: String,
    obj: Object,
    method: string,
    headers: fetch.Headers | null
) {
    const encodedParams = objToQueryString(obj);
    return fetch(`${uri}?${encodedParams}`, { method: method, headers: headers });
}

import { logger, consoleTransport } from 'react-native-logs';
const logConfig = {
    severity: 'debug',
    transport: consoleTransport,
    transportOptions: {
        color: 'ansi', // custom option that color consoleTransport logs
    },
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    async: true,
    dateFormat: 'time',
    printLevel: true,
    printDate: true,
    enabled: true,
};

export var log = logger.createLogger();
