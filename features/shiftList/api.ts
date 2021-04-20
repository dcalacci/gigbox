import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';

//TODO: parse out geometry here, instead of in component.
export const getShiftGeometry = async (shift_id: String) => {
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
    let data = await client.request(query, variables);
    console.log('query data:', data);
    return data;
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
