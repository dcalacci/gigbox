import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';
import { useQuery, UseQueryResult } from 'react-query';
import { JobFilterList, JobFilter, SortArgs } from './JobList';
import { Job } from '@/types';
import moment from 'moment';

export const deleteImage = ({ id }: { id: string }) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($id: ID!) {
            deleteImage(id: $id) {
                ok
                message
            }
        }
    `;
    return client.request(query, { id });
};

export const updateJobValue = ({
    jobId,
    mutationKey,
    key,
    value,
}: {
    jobId: string;
    mutationKey: string;
    key: string;
    value: string;
}) => {
    const client = getClient(store);
    const query = gql`mutation 
    mutation($jobId: ID!, $value: Float!) {
        ${mutationKey}(jobId: $jobId, value: $value) {
            job {
                ${key}
            }
        }
    }
    `;
    return client.request(query, {
        jobId,
        value,
    });
};

export const getFilteredJobs = ({ queryKey }) => {
    const filters = queryKey[1];
    const client = getClient(store);
    const createFilterString = (filters: JobFilter): string => {
        let or_filters = [];
        let and_filters = [`{mileageIsNull: false}, {endTimeIsNull: false}`];

        if (filters.needsEntry) {
            or_filters.push(`{totalPayIsNull: true}`);
            or_filters.push(`{tipIsNull: true}`);
        }

        if (filters.saved) {
            and_filters.push(`{totalPayIsNull: false}`);
            and_filters.push(`{tipIsNull: false}`);
        }

        if (filters.minMileage) or_filters.push(`{mileageGte: ${filters.minMileage}}`);

        if (filters.startDate && filters.endDate) {
            and_filters.push(`{startTimeGte: "${filters.startDate?.format()}"}`);
            and_filters.push(`{endTimeLte: "${filters.endDate?.format()}"}`);
        }

        const orFilterString = or_filters.join(', ');
        const andFilterString = and_filters.join(', ');
        return `{and: [{or: [${orFilterString}]}, ${andFilterString},]}`;
    };
    const coreQuery = `
       edges {
                node {
                    id
                    startTime
                    endTime
                    startLocation
                    endLocation
                    mileage
                    estimatedMileage
                    totalPay
                    tip
                    snappedGeometry
                    screenshots {
                        id
                        jobId
                        onDeviceUri
                        timestamp
                        imgFilename
                        employer
                    }
                    employer
                }
            }
        `;

    let query;
    if (filters) {
        const filterString = createFilterString(filters);
        console.log('filter string:', filterString);

        query = gql`query {
                allJobs(filters: ${filterString}, sort: START_TIME_DESC) {
                ${coreQuery}
         }}`;
    } else {
        query = gql`query {
                    allJobs {
                        ${coreQuery}
                    }
                }`;
    }

    return client.request(query);
};
