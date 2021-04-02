import { request, gql } from 'graphql-request';
import { graphqlUri } from '../../utils';
import { store } from '../../store/store';

//TODO: our user ID changes after login for some reason, perhaps from redux-persist.
// not sure why or what's going on.

//TODO: use exported types for output of this
export const fetchActiveShift = () => {
    const userId = store.getState().auth.userId;
    return request(
        graphqlUri,
        gql`query {
                getActiveShift(userId: "${userId}") {
                    id
                    active
                    startTime
                    locations {
                    id
                    geom
                    timestamp
                    }
                }
            }`
    );
};

export const endShift = (shiftId: string) => {
    const userId = store.getState().auth.userId;
    const jwt = store.getState().auth.jwt;

    console.log('Ending shift!');
    return request(
        graphqlUri,
        gql`mutation {
                endShift(shiftId: "${shiftId}") {
                    shift {
                        id
                        endTime
                        active
                    }
                }
            }`
    );
};

export const createShift = () => {
    const userId = store.getState().auth.userId;
    const jwt = store.getState().auth.jwt;

    console.log('Creating shift!');
    return request(
        graphqlUri,
        gql`mutation {
                createShift(active: true, userId: "${userId}") {
                    shift {
                        id
                        endTime
                        active
                    }
                }
            }`
    );
};
