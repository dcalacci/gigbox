import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';

export const getShiftScreenshots = async (shift_id: String) => {
    const client = getClient(store);
    const query = gql`
        query screenshots($id: ID!) {
            getShiftScreenshots(shiftId: $id) {
                onDeviceUri
                id
                imgFilename
                employer
            }
        }
    `;
    const variables = {
        id: shift_id,
    };
    let data = await client.request(query, variables);
    return data;
};
