
/**
 * 
 * @param startTimestamp A timestamp (number) to calculate elapsed time from.
 * @return {[string]} Hours and minutes since startTimestamp, formatted as "0h 0m"
 */
export const formatElapsedTime = (startTimestamp: number | null): string => {
  const now = new Date();
  if (startTimestamp === null) {
    return "0h 0m";
  } else {
    const startTime = new Date(startTimestamp);
    // strip milliseconds
    let timeDiff = (now.getTime() - startTime.getTime()) / 1000;
    //var timeStr = timeDiff.toTimeString().split(' ')[0];
    const seconds = Math.round(timeDiff % 60);
    timeDiff = Math.floor(timeDiff / 60);
    var minutes = Math.round(timeDiff % 60);
    timeDiff = Math.floor(timeDiff / 60);
    var hours = Math.round(timeDiff % 24);
    const timestr = `${hours}h ${minutes}m`;
    return timestr;
  }
};

import Constants from "expo-constants";

const { manifest } = Constants;

export const uri = manifest.debuggerHost ? `http://${manifest?.debuggerHost?.split(':').shift()}:5000` : 'http://localhost:5000';
console.log(`API URI: ${uri}`)

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
    keyValuePairs.push(`${encodeURIComponent(Object.keys(obj)[i])}=${encodeURIComponent(Object.values(obj)[i])}`);
  }
  return keyValuePairs.join('&');
}

export function fetchWithQueryParams(uri: String, obj: Object, method: string, headers: fetch.Headers|null) {
  const encodedParams = objToQueryString(obj)
  return fetch(`${uri}?${encodedParams}`, {method: method, headers: headers})
}