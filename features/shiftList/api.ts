import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';

export const getShifts = (first: Number, after: String) => {
    const client = getClient(store);
    const query = gql`
        query FetchShifts($first: Int, $after: String) {
            allShifts(first: $first, after: $after) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                        startTime
                        endTime
                        locations {
                            geom
                            timestamp
                        }
                    }
                }
            }
        }
    `;
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
