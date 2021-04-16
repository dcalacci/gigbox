import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';

export const getShiftGeometry = (shift_id: String) => {
    const client = getClient(store);
    const query = gql`
        query route($id: ID!) {
            getRouteLine(objectId: $id) {
                geometry
                boundingBox {
                    minLat
                    minLng
                    maxLat
                    maxLng
                }
            }
        }
    `;
    const variables = {
        id: shift_id,
    };
    return client.request(query, variables);
};

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
                        locations {
                            geom
                            timestamp
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
    // const query = gql`
    // query {
    //     shifts(first: ${first} skip: ${skip} before: ${before} after: ${after} ) {
    //         id
    //         startTime
    //         endTime
    //         locations {
    //             geom
    //             timestamp
    //         }
    //     }
    //     }
    // `;
    return client.request(query, variables);
};
