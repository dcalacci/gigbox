import { gql } from 'graphql-request';
import { getClient } from '../../utils';
import { store } from '../../store/store';


export const updateJobValue = (
    {jobId, mutationKey, key, value}: 
    {jobId: string, mutationKey: string, key: string, value: string}) => {
    const client = getClient(store)
    const query = gql`mutation 
    mutation($jobId: ID!, $value: Float!) {
        ${mutationKey}(jobId: $jobId, value: $value) {
            job {
                ${key}
            }
        }
    }
    `
    return client.request(query,
        {
            jobId,
            value
        })
}

export const updateJobTip = (jobId: string, value: number) => {
    return updateJobValue(
        jobId=jobId, "setJobTip", "tip", value
    )

}

export const updateJobTotalPay = (jobId: string, value: number) => {
    return updateJobValue(
        jobId=jobId, "setJobTotalPay", "totalPay", value
    )
}