import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
import { store } from '../../store/store';

export const submitConsent = async ({
    interview,
    dataSharing,
    phone,
    email,
    name,
    sigText,
}: {
    interview: boolean;
    dataSharing: boolean;
    phone: string;
    email: string;
    name: string;
    sigText: string;
}) => {
    const client = getClient(store);

    console.log('submitting sig:', sigText);
    console.log(interview, dataSharing, phone, email, name, sigText)

    const query = gql`
        mutation mutation(
            $interview: Boolean!
            $dataSharing: Boolean!
            $signature: String!
            $name: String!
            $phone: String
            $email: String
        ) {
            submitConsent(
                interview: $interview
                dataSharing: $dataSharing
                signature: $signature
                email: $email
                phone: $phone
                name: $name
            ) {
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
        phone: phone,
        email: email,
        name: name,
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
                email
                name
                phone
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
