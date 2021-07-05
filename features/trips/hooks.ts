import { useQuery, useInfiniteQuery } from 'react-query';
import { getClient } from '../../utils';
import { store } from '../../store/store';
import { gql } from 'graphql-request';
import { JobFilter, SortArgs } from '../job/JobList';
import { Job } from '../../types';

import { coreJobQuery, createFilterString, getFilteredJobs } from '../job/api';
import { consoleTransport } from 'react-native-logs';

const N = 5;
export const filter: JobFilter = {
    needsEntry: true,
    saved: false,
    sort: SortArgs.START,
};
const getPaginatedUncategorizedJobs = async ({
    pageParam = null,
}): Promise<{ allJobs: { edges: { node: Job } } }> => {
    console.log('Page params:', pageParam);
    const filterString = createFilterString(filter);
    const query = gql`query AllJobs($after: String, $first: Int) {
            allJobs(filters: ${filterString}, sort: START_TIME_DESC, first: $first, after: $after) {
                ${coreJobQuery}
            }
        }
    `;
    const variables = {
        first: N,
        after: pageParam,
    };
    const client = getClient(store);
    return client.request(query, variables);
};

export const useUncategorizedJobs = ({onSettled}: {onSettled: () => void}) => {
    return useInfiniteQuery<{ allJobs: { edges: { node: Job }[] } }, Error>(
        ['uncategorizedJobs', filter],
        getPaginatedUncategorizedJobs,
        {
            notifyOnChangeProps: ['data'],
            staleTime: 60,
            keepPreviousData: true,
            enabled: true,
            getNextPageParam: (lastPage, pages) => {
                console.log("last page:", lastPage)
                console.log(lastPage)
                return lastPage.allJobs.pageInfo.endCursor;
            },
            select: (d) => {
                return d?.pages.map((a) => a.allJobs.edges).flat()
            },
            onSettled: onSettled
        }
    );
};

export const extractJobsFromShift = (shiftId: string) => {
    const client = getClient(store);
    const query = gql`
        mutation mutation($ShiftId: ID!) {
            extractJobsFromShift(shiftId: $ShiftId) {
                jobs {
                    id
                    startTime
                    endTime
                    startLocation
                    mileage
                    totalPay
                    tip
                    snappedGeometry
                }
            }
        }
    `;
    const vars = { ShiftId: shiftId };
    return client.request(query, vars);
};
