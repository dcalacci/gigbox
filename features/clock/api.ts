import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
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
