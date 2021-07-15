import { Employers } from '@/types';
import { gql } from 'graphql-request';
import { store } from '../../store/store';
import { getClient } from '../../utils';

export const createJob = async ({
    employer,
    totalPay,
    tip,
    startTime,
    endTime,
    mileage
}: {
    employer: Employers;
    totalPay: number;
    tip: number;
    startTime: Date;
    endTime: Date;
    mileage: number;
}) => {
    const client = getClient(store);

    const variables = {
        employer,
        totalPay,
        tip,
        startTime,
        endTime,
        mileage
    };

    const mutation = gql`
        mutation mutation(
            $employer: EmployerNames,
            $totalPay: Float,
            $tip: Float,
            $startTime: DateTime,
            $endTime: DateTime
            $mileage: Float,
        ) {
            createJob(
                employer: $employer,
                totalPay: $totalPay,
                tip: $tip,
                startTime: $startTime,
                endTime: $endTime,
                mileage: $mileage
            ) {
                job {
                    id
                    employer
                    startTime
                    endTime
                    tip
                    totalPay
                }
                ok
            }
        }
    `;
    return await client.request(mutation, variables);
};
