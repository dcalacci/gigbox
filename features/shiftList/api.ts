import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';

export const getShifts = (first: Number, after: String) => {
    const client = getClient(store);
    const query = gql`
        query FetchShifts($first: Int, $after: String) {
            allShifts(first: $first, after: $after, sort: START_TIME_DESC) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                        startTime
                        endTime
                        roadSnappedMiles
                        snappedGeometry
                        jobs {
                            edges {
                                node {
                                    id
                                    startTime
                                    endTime
                                    startLocation
                                    endLocation
                                    mileage
                                    snappedGeometry
                                    estimatedMileage
                                    totalPay
                                    tip
                                    employer
                                    shiftId
                                    screenshots {
                                        id
                                        jobId
                                        onDeviceUri
                                        timestamp
                                        imgFilename
                                        employer
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;
    const sort = 'startTime_asc';
    const variables = {
        first,
        after,
    };
    return client.request(query, variables);
};
