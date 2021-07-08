import { request, gql } from 'graphql-request';
import { log, getClient } from '../../utils';
import { store } from '../../store/store';
import { Employers } from '../../types';

export const updateInterview = async ({ interview }: { interview: boolean }) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($interview: Boolean!) {
            updateInterviewConsent(interview: $interview) {
                user {
                    consent {
                        interview
                    }
                }
            }
        }
    `;
    return client.request(query, { interview: interview });
};

export const updateDataSharing = async ({ dataSharing }: { dataSharing: boolean }) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($dataSharing: Boolean!) {
            updateDataSharingConsent(dataSharing: $dataSharing) {
                user {
                    consent {
                        dataSharing
                    }
                }
            }
        }
    `;
    return client.request(query, { dataSharing: dataSharing });
};

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
    console.log(interview, dataSharing, phone, email, name, sigText);

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
                        consented
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
                employers
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

export const unenrollAndDeleteMutation = async () => {
    const client = getClient(store);
    const query = gql`
        mutation {
            unenrollAndDelete {
                ok
            }
        }
    `;
    return client.request(query);
};

export const submitUserEmployers = ({ employers }: { employers: Employers[] }) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($employers: [EmployerNames]!) {
            submitIntroSurvey(employers: $employers) {
                user {
                    employers
                }
            }
        }
    `;
    return client.request(query, { employers });
};
