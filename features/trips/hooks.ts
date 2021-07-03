import { useQuery } from "react-query";
import { getClient } from '../../utils'
import { store } from '../../store/store'
import { gql } from 'graphql-request'
import { JobFilter, SortArgs } from '../job/JobList'
import { Job } from '../../types'

import { getFilteredJobs } from '../job/api'

export const useUncategorizedJobs = () =>  {
    const filter: JobFilter = {
        needsEntry: true,
        saved: false,
        sort: SortArgs.START 
    }
    console.log("hook running...")
    return useQuery<{allJobs: { edges: {node: Job}[]}}, Error>(["uncategorizedJobs", filter], 
    getFilteredJobs,
    {
        notifyOnChangeProps: ['data'],
        staleTime: 60,
        keepPreviousData: true,
    })
}


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
    `
    const vars = { ShiftId: shiftId }
    return client.request(query, vars)
}