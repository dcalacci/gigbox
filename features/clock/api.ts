import { request, gql } from 'graphql-request';
import { graphqlUri, getClient } from '../../utils';
import { store } from '../../store/store';

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

    console.log('Ending shift!');
    return client.request(query);
};

export const createShift = () => {
    const client = getClient(store);

    const query = gql`
        mutation {
            createShift(active: true) {
                shift {
                    id
                    endTime
                    active
                }
            }
        }
    `;
    console.log('Creating shift!');

    return client.request(query);
};
