import { QueryKey, useInfiniteQuery, useMutation } from 'react-query';
import { getClient } from '../../utils';
import { store } from '../../store/store';
import { gql } from 'graphql-request';
import { Employers, Job } from '../../types';

import { coreJobQuery, createFilterString } from './api';
import { JobFilter, SortArgs } from '../../components/FilterPills';
// Getting paginated "trips"
const N = 10;

export const defaultJobFilter: JobFilter = {
    needsEntry: true,
    saved: false,
    sort: SortArgs.START,
};

export const useMergedTripsPreview = () => {
    return useMutation(mergeJobs);
};

// Merges a list of jobs
export const mergeJobs = async ({
    jobIds,
    dryRun,
    totalPay,
    tip,
    employer,
}: {
    jobIds: String[];
    dryRun: boolean;
    totalPay: number | undefined;
    tip: number | undefined;
    employer: Employers | undefined;
}) => {
    const query = gql`
        mutation MergeJobs(
            $JobIds: [ID]!
            $DryRun: Boolean
            $TotalPay: Float
            $Tip: Float
            $Employer: EmployerNames
        ) {
            mergeJobs(
                jobIds: $JobIds
                dryRun: $DryRun
                totalPay: $TotalPay
                tip: $Tip
                employer: $Employer
            ) {
                mergedJob {
                    id
                    startTime
                    endTime
                    startLocation
                    endLocation
                    snappedGeometry
                    totalPay
                    tip
                    mileage
                    employer
                }
                ok
                committed
                message
            }
        }
    `;
    const variables = {
        JobIds: jobIds,
        DryRun: dryRun,
        TotalPay: totalPay,
        Tip: tip,
        Employer: employer,
    };
    const client = getClient(store);
    return client.request(query, variables);
};

export const getPaginatedUncategorizedJobs = async ({
    pageParam = null,
    queryKey
}: {
    pageParam: string | null;
    queryKey: QueryKey;
}): Promise<{ allJobs: { edges: { node: Job }[] }; pageInfo: { endCursor: String } }> => {
    const filter = queryKey[1] as JobFilter
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
