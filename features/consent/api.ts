import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
import { store } from '../../store/store';

export const submitConsent = async ({
    interview,
    dataSharing,
    sigText,
}: {
    interview: boolean;
    dataSharing: boolean;
    sigText: string;
}) => {
    const client = getClient(store);

    console.log('submitting sig:', sigText);

    const query = gql`
        mutation mutation($interview: Boolean!, $dataSharing: Boolean!, $signature: String!) {
            submitConsent(interview: $interview, dataSharing: $dataSharing, signature: $signature) {
                user {
                    id
                    consent {
                        interview
                        dataSharing
                        signatureFilename
                        signatureEncoded
                    }
                }
            }
        }
    `;
    return client.request(query, {
        interview: interview,
        signature: sigText,
        dataSharing: dataSharing,
    });
};

export const getUserInfo = () => {
    const client = getClient(store);
    const query = gql`
        query {
            getUserInfo {
                id
                dateCreated
                consent {
                    consented
                    interview
                    dataSharing
                }
            }
        }
    `;
    return client.request(query);
};
